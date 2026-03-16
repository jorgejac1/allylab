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
        <div className="text-center py-10 px-10 text-slate-500">
          No scan data available for trends.
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Export Button */}
      <div className="flex justify-between items-center">
        <h3 className="m-0 text-lg font-semibold flex items-center gap-2">
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
        <div className="grid grid-cols-4 gap-4">
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
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-base font-semibold m-0 flex items-center gap-2">
            <TrendingUp size={18} />Score Trend
          </h4>
          {scoreGoal.showScoreGoal && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span
                className="w-4 h-0.5 bg-amber-500 border-t-2 border-dashed border-amber-500"
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
          <div className="text-center py-10 px-10 text-slate-500">
            Need at least 2 scans to show trends.
          </div>
        )}
      </Card>

      {/* Issue Trend */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-base font-semibold m-0 flex items-center gap-2">
            <Bug size={18} />Issue Trend
          </h4>
          <div className="flex gap-1">
            <Button
              variant={issueChartType === "area" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setIssueChartType("area")}
              className="py-1 px-3 text-xs"
            >
              Stacked
            </Button>
            <Button
              variant={issueChartType === "line" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setIssueChartType("line")}
              className="py-1 px-3 text-xs"
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
          <div className="flex gap-4 mt-4 pt-4 border-t border-slate-200 flex-wrap">
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
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-slate-500">Net change:</span>
              <span
                className="text-sm font-semibold"
                style={{
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <Card>
          <h4 className="text-base font-semibold mt-0 mb-4 flex items-center gap-2">
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
          <h4 className="text-base font-semibold mt-0 mb-4 flex items-center gap-2">
            <BarChart3 size={18} />Progress Summary
          </h4>
          {aggregateStats && (
            <div className="flex flex-col gap-4">
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
