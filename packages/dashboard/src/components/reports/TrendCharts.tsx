import { useState } from "react";
import { Card, Button, StatCard, ProgressRow } from "../ui";
import { TrendLine, DonutChart, IssueTrendChart, GoalProgress, IssueChangeBadge } from "../charts";
import { RegressionAlertBanner } from "../alerts";
import { TrendsPDFButton } from "./TrendsPDFButton";
import { useReportSettings, useTrendData } from "../../hooks";
import type { SavedScan } from "../../types";
import type { RegressionInfo } from "../../hooks/useScans";
import { SEVERITY_COLORS } from "../../utils/constants";
import { BarChart3, TrendingUp, Bug, Target, CheckCircle, Circle } from "lucide-react";

interface TrendChartsProps {
  scans: SavedScan[];
  url?: string;
  recentRegressions?: RegressionInfo[];
}

type ChartType = "area" | "line";

export function TrendCharts({
  scans,
  url,
  recentRegressions = [],
}: TrendChartsProps) {
  const [issueChartType, setIssueChartType] = useState<ChartType>("area");

  const { settings } = useReportSettings();
  const { scoreGoal, pdfExport } = settings;

  // Use extracted hook for trend data calculations
  const { filteredScans, scoreTrendData, issueTrendData, aggregateStats } = useTrendData(scans, url);

  if (filteredScans.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
          No scan data available for trends.
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header with Export Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <BarChart3 size={20} />Accessibility Trends
        </h3>
        <TrendsPDFButton
          scans={filteredScans}
          settings={pdfExport}
          scoreGoal={scoreGoal.scoreGoal}
        />
      </div>

      {/* Regression Alert Banner */}
      {recentRegressions.length > 0 && (
        <RegressionAlertBanner regressions={recentRegressions} />
      )}

      {/* Goal Progress Bar */}
      {scoreGoal.showGoalProgress && aggregateStats && (
        <GoalProgress
          currentScore={aggregateStats.currentScore}
          goalScore={scoreGoal.scoreGoal}
          previousScore={
            filteredScans.length >= 2
              ? filteredScans[filteredScans.length - 2].score
              : undefined
          }
        />
      )}

      {/* Stats Row */}
      {aggregateStats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          <StatCard
            label="Current Score"
            value={aggregateStats.currentScore}
            suffix="/100"
            color={aggregateStats.currentScore >= 70 ? "#10b981" : "#f59e0b"}
          />
          <StatCard
            label="Average Score"
            value={aggregateStats.avgScore}
            suffix="/100"
          />
          <StatCard
            label="Score Improvement"
            value={aggregateStats.scoreImprovement}
            prefix={aggregateStats.scoreImprovement >= 0 ? "+" : ""}
            color={aggregateStats.scoreImprovement >= 0 ? "#10b981" : "#ef4444"}
          />
          <StatCard label="Total Scans" value={aggregateStats.totalScans} />
        </div>
      )}

      {/* Score Trend with Goal Line */}
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h4 style={{ fontSize: 16, fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={18} />Score Trend
          </h4>
          {scoreGoal.showScoreGoal && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "#64748b",
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 2,
                  background: "#f59e0b",
                  borderTop: "2px dashed #f59e0b",
                }}
              />
              <span>Goal: {scoreGoal.scoreGoal}</span>
            </div>
          )}
        </div>
        {scoreTrendData.length >= 2 ? (
          <TrendLine
            data={scoreTrendData}
            width={800}
            height={250}
            goalScore={scoreGoal.showScoreGoal ? scoreGoal.scoreGoal : undefined}
          />
        ) : (
          <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
            Need at least 2 scans to show trends.
          </div>
        )}
      </Card>

      {/* Issue Trend */}
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h4 style={{ fontSize: 16, fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Bug size={18} />Issue Trend
          </h4>
          <div style={{ display: "flex", gap: 4 }}>
            <Button
              variant={issueChartType === "area" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setIssueChartType("area")}
              style={{ padding: "4px 12px", fontSize: 12 }}
            >
              Stacked
            </Button>
            <Button
              variant={issueChartType === "line" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setIssueChartType("line")}
              style={{ padding: "4px 12px", fontSize: 12 }}
            >
              Lines
            </Button>
          </div>
        </div>
        <IssueTrendChart
          data={issueTrendData}
          height={250}
          chartType={issueChartType}
        />
        {/* Issue Change Summary */}
        {aggregateStats && filteredScans.length >= 2 && (
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid #e2e8f0",
              flexWrap: "wrap",
            }}
          >
            <IssueChangeBadge
              label="Critical"
              change={aggregateStats.issueChanges.critical}
              color={SEVERITY_COLORS.critical}
            />
            <IssueChangeBadge
              label="Serious"
              change={aggregateStats.issueChanges.serious}
              color={SEVERITY_COLORS.serious}
            />
            <IssueChangeBadge
              label="Moderate"
              change={aggregateStats.issueChanges.moderate}
              color={SEVERITY_COLORS.moderate}
            />
            <IssueChangeBadge
              label="Minor"
              change={aggregateStats.issueChanges.minor}
              color={SEVERITY_COLORS.minor}
            />
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 12, color: "#64748b" }}>Net change:</span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color:
                    aggregateStats.issueChange <= 0 ? "#10b981" : "#ef4444",
                }}
              >
                {aggregateStats.issueChange > 0 ? "+" : ""}
                {aggregateStats.issueChange} issues
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Issue Distribution & Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Donut Chart */}
        <Card>
          <h4 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <Target size={18} />Current Issue Distribution
          </h4>
          {aggregateStats && (
            <DonutChart
              data={[
                {
                  label: "Critical",
                  value: aggregateStats.latestIssues.critical,
                  color: SEVERITY_COLORS.critical,
                },
                {
                  label: "Serious",
                  value: aggregateStats.latestIssues.serious,
                  color: SEVERITY_COLORS.serious,
                },
                {
                  label: "Moderate",
                  value: aggregateStats.latestIssues.moderate,
                  color: SEVERITY_COLORS.moderate,
                },
                {
                  label: "Minor",
                  value: aggregateStats.latestIssues.minor,
                  color: SEVERITY_COLORS.minor,
                },
              ]}
              size={200}
            />
          )}
        </Card>

        {/* Progress Over Time */}
        <Card>
          <h4 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart3 size={18} />Progress Summary
          </h4>
          {aggregateStats && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <ProgressRow
                label="Issues Fixed"
                value={aggregateStats.totalIssuesFixed}
                icon={<CheckCircle size={16} />}
                color="#10b981"
              />
              <ProgressRow
                label="Critical Issues"
                value={aggregateStats.latestIssues.critical}
                icon={<Circle size={16} fill={SEVERITY_COLORS.critical} />}
                color={SEVERITY_COLORS.critical}
              />
              <ProgressRow
                label="Serious Issues"
                value={aggregateStats.latestIssues.serious}
                icon={<Circle size={16} fill={SEVERITY_COLORS.serious} />}
                color={SEVERITY_COLORS.serious}
              />
              <ProgressRow
                label="Moderate Issues"
                value={aggregateStats.latestIssues.moderate}
                icon={<Circle size={16} fill={SEVERITY_COLORS.moderate} />}
                color={SEVERITY_COLORS.moderate}
              />
              <ProgressRow
                label="Minor Issues"
                value={aggregateStats.latestIssues.minor}
                icon={<Circle size={16} fill={SEVERITY_COLORS.minor} />}
                color={SEVERITY_COLORS.minor}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
