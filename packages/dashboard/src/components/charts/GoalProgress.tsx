import { Card } from "../ui";
import { Target, Check } from 'lucide-react';

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
      <div className="flex justify-between items-center mb-3">
        <h4 className="m-0 text-sm font-semibold inline-flex items-center gap-1.5">
          <Target size={16} /> Goal Progress
        </h4>
        {goalReached ? (
          <span className="flex items-center gap-1.5 py-1 px-3 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
            <Check size={14} />
            Goal Reached!
          </span>
        ) : (
          <span className="text-xs text-slate-500">
            {pointsToGoal} points to goal
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative h-6 bg-slate-100 rounded-xl overflow-hidden">
        {/* Filled Progress */}
        <div
          className="absolute left-0 top-0 h-full rounded-xl transition-[width] duration-500 ease-out"
          style={{
            width: `${progressPercent}%`,
            background: goalReached
              ? "linear-gradient(90deg, #10b981, #34d399)"
              : "linear-gradient(90deg, #3b82f6, #60a5fa)",
          }}
        />

        {/* Milestone Markers */}
        {showMilestones && milestones.map((milestone) => {
          const position = (milestone / goalScore) * 100;
          const reached = currentScore >= milestone;
          return (
            <div
              key={milestone}
              className="absolute top-0 h-full w-0.5 -translate-x-px"
              style={{
                left: `${position}%`,
                background: reached ? "rgba(255,255,255,0.5)" : "#cbd5e1",
              }}
            />
          );
        })}

        {/* Score Label */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 text-xs font-bold"
          style={{
            left: `${Math.min(progressPercent, 95)}%`,
            top: "50%",
            color: progressPercent > 15 ? "#fff" : "#475569",
            textShadow: progressPercent > 15 ? "0 1px 2px rgba(0,0,0,0.2)" : "none",
          }}
        >
          {currentScore}
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
        <div className="flex gap-6">
          <div>
            <span className="text-xs text-slate-500">Current</span>
            <div className="text-lg font-bold text-slate-900">
              {currentScore}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500">Goal</span>
            <div className="text-lg font-bold text-amber-500">
              {goalScore}
            </div>
          </div>
          {previousScore !== undefined && (
            <div>
              <span className="text-xs text-slate-500">Last Scan</span>
              <div
                className={`text-lg font-bold ${
                  currentScore >= previousScore ? 'text-emerald-500' : 'text-red-500'
                }`}
              >
                {currentScore > previousScore && "+"}
                {currentScore - previousScore}
              </div>
            </div>
          )}
        </div>

        {/* Estimated Scans */}
        {!goalReached && estimatedScans && estimatedScans > 0 && estimatedScans < 100 && (
          <div className="text-right">
            <span className="text-xs text-slate-500">Est. scans to goal</span>
            <div className="text-lg font-bold text-indigo-500">
              ~{estimatedScans}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
