import { Card } from "../ui";

interface GoalProgressProps {
  currentScore: number;
  goalScore: number;
  previousScore?: number;
  showMilestones?: boolean;
}

export function GoalProgress({
  currentScore,
  goalScore,
  previousScore,
  showMilestones = true,
}: GoalProgressProps) {
  const progressPercent = Math.min((currentScore / goalScore) * 100, 100);
  const pointsToGoal = Math.max(goalScore - currentScore, 0);
  const goalReached = currentScore >= goalScore;
  
  // Calculate estimated scans to reach goal based on recent progress
  const recentProgress = previousScore ? currentScore - previousScore : 0;
  const estimatedScans = recentProgress > 0 
    ? Math.ceil(pointsToGoal / recentProgress) 
    : null;

  // Milestone markers
  const milestones = [25, 50, 75, 90, 100].filter(m => m <= goalScore);

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
          🎯 Goal Progress
        </h4>
        {goalReached ? (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              background: "#dcfce7",
              color: "#166534",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <span>✓</span>
            Goal Reached!
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#64748b" }}>
            {pointsToGoal} points to goal
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div
        style={{
          position: "relative",
          height: 24,
          background: "#f1f5f9",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* Filled Progress */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${progressPercent}%`,
            background: goalReached
              ? "linear-gradient(90deg, #10b981, #34d399)"
              : "linear-gradient(90deg, #3b82f6, #60a5fa)",
            borderRadius: 12,
            transition: "width 0.5s ease-out",
          }}
        />

        {/* Milestone Markers */}
        {showMilestones && milestones.map((milestone) => {
          const position = (milestone / goalScore) * 100;
          const reached = currentScore >= milestone;
          return (
            <div
              key={milestone}
              style={{
                position: "absolute",
                left: `${position}%`,
                top: 0,
                height: "100%",
                width: 2,
                background: reached ? "rgba(255,255,255,0.5)" : "#cbd5e1",
                transform: "translateX(-1px)",
              }}
            />
          );
        })}

        {/* Score Label */}
        <div
          style={{
            position: "absolute",
            left: `${Math.min(progressPercent, 95)}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: 11,
            fontWeight: 700,
            color: progressPercent > 15 ? "#fff" : "#475569",
            textShadow: progressPercent > 15 ? "0 1px 2px rgba(0,0,0,0.2)" : "none",
          }}
        >
          {currentScore}
        </div>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", gap: 24 }}>
          <div>
            <span style={{ fontSize: 11, color: "#64748b" }}>Current</span>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
              {currentScore}
            </div>
          </div>
          <div>
            <span style={{ fontSize: 11, color: "#64748b" }}>Goal</span>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#f59e0b" }}>
              {goalScore}
            </div>
          </div>
          {previousScore !== undefined && (
            <div>
              <span style={{ fontSize: 11, color: "#64748b" }}>Last Scan</span>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: currentScore >= previousScore ? "#10b981" : "#ef4444",
                }}
              >
                {currentScore > previousScore && "+"}
                {currentScore - previousScore}
              </div>
            </div>
          )}
        </div>

        {/* Estimated Scans */}
        {!goalReached && estimatedScans && estimatedScans > 0 && estimatedScans < 100 && (
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 11, color: "#64748b" }}>Est. scans to goal</span>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#6366f1" }}>
              ~{estimatedScans}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}