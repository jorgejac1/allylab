import { useMemo, useState } from "react";
import { Card, Button } from "../ui";
import { TrendLine, DonutChart, IssueTrendChart } from "../charts";
import type { SavedScan, TrendDataPoint, IssueTrendDataPoint } from "../../types";
import type { RegressionInfo } from "../../hooks/useScans";
import { SEVERITY_COLORS } from "../../utils/constants";

interface TrendChartsProps {
  scans: SavedScan[];
  url?: string; // Filter to specific URL
  recentRegressions?: RegressionInfo[];
}

type ChartType = 'area' | 'line';

export function TrendCharts({ scans, url, recentRegressions = [] }: TrendChartsProps) {
  const [issueChartType, setIssueChartType] = useState<ChartType>('area');

  // Filter scans by URL if provided
  const filteredScans = useMemo(() => {
    let result = [...scans];
    if (url) {
      result = result.filter(
        (s) => new URL(s.url).hostname === new URL(url).hostname
      );
    }
    return result.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [scans, url]);

  // Generate score trend data
  const scoreTrendData: TrendDataPoint[] = useMemo(() => {
    return filteredScans.slice(-20).map((scan) => ({
      date: new Date(scan.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      fullDate: scan.timestamp,
      score: scan.score,
      issues: scan.totalIssues,
      critical: scan.critical,
      serious: scan.serious,
      moderate: scan.moderate,
      minor: scan.minor,
    }));
  }, [filteredScans]);

  // Generate issue trend data
  const issueTrendData: IssueTrendDataPoint[] = useMemo(() => {
    return filteredScans.slice(-20).map((scan) => ({
      date: new Date(scan.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      fullDate: scan.timestamp,
      critical: scan.critical,
      serious: scan.serious,
      moderate: scan.moderate,
      minor: scan.minor,
      total: scan.totalIssues,
    }));
  }, [filteredScans]);

  // Calculate aggregate stats
  const aggregateStats = useMemo(() => {
    if (filteredScans.length === 0) return null;

    const latest = filteredScans[filteredScans.length - 1];
    const first = filteredScans[0];

    const avgScore = Math.round(
      filteredScans.reduce((sum, s) => sum + s.score, 0) / filteredScans.length
    );

    const totalIssuesFixed =
      first.totalIssues - latest.totalIssues > 0
        ? first.totalIssues - latest.totalIssues
        : 0;

    // Calculate issue changes
    const criticalChange = latest.critical - first.critical;
    const seriousChange = latest.serious - first.serious;
    const moderateChange = latest.moderate - first.moderate;
    const minorChange = latest.minor - first.minor;

    return {
      currentScore: latest.score,
      avgScore,
      scoreImprovement: latest.score - first.score,
      totalScans: filteredScans.length,
      totalIssuesFixed,
      issueChange: latest.totalIssues - first.totalIssues,
      latestIssues: {
        critical: latest.critical,
        serious: latest.serious,
        moderate: latest.moderate,
        minor: latest.minor,
      },
      issueChanges: {
        critical: criticalChange,
        serious: seriousChange,
        moderate: moderateChange,
        minor: minorChange,
      },
    };
  }, [filteredScans]);

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
      {/* Regression Alert Banner */}
      {recentRegressions.length > 0 && (
        <RegressionAlertBanner regressions={recentRegressions} />
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

      {/* Score Trend */}
      <Card>
        <h4 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>
          📈 Score Trend
        </h4>
        {scoreTrendData.length >= 2 ? (
          <TrendLine data={scoreTrendData} width={800} height={250} />
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
          <h4 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            🐛 Issue Trend
          </h4>
          <div style={{ display: "flex", gap: 4 }}>
            <Button
              variant={issueChartType === 'area' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setIssueChartType('area')}
              style={{ padding: '4px 12px', fontSize: 12 }}
            >
              Stacked
            </Button>
            <Button
              variant={issueChartType === 'line' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setIssueChartType('line')}
              style={{ padding: '4px 12px', fontSize: 12 }}
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
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>Net change:</span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: aggregateStats.issueChange <= 0 ? "#10b981" : "#ef4444",
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
          <h4 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>
            🎯 Current Issue Distribution
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
          <h4 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>
            📊 Progress Summary
          </h4>
          {aggregateStats && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <ProgressRow
                label="Issues Fixed"
                value={aggregateStats.totalIssuesFixed}
                icon="✅"
                color="#10b981"
              />
              <ProgressRow
                label="Critical Issues"
                value={aggregateStats.latestIssues.critical}
                icon="🔴"
                color={SEVERITY_COLORS.critical}
              />
              <ProgressRow
                label="Serious Issues"
                value={aggregateStats.latestIssues.serious}
                icon="🟠"
                color={SEVERITY_COLORS.serious}
              />
              <ProgressRow
                label="Moderate Issues"
                value={aggregateStats.latestIssues.moderate}
                icon="🟡"
                color={SEVERITY_COLORS.moderate}
              />
              <ProgressRow
                label="Minor Issues"
                value={aggregateStats.latestIssues.minor}
                icon="🟢"
                color={SEVERITY_COLORS.minor}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ==============================================
// Issue Change Badge Component
// ==============================================

function IssueChangeBadge({
  label,
  change,
  color,
}: {
  label: string;
  change: number;
  color: string;
}) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 6,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
        }}
      />
      <span style={{ fontSize: 12, color: "#64748b" }}>{label}</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: isNegative ? "#10b981" : isPositive ? "#ef4444" : "#64748b",
        }}
      >
        {change > 0 ? "+" : ""}
        {change}
      </span>
      {isNegative && <span style={{ fontSize: 10 }}>✓</span>}
      {isPositive && <span style={{ fontSize: 10 }}>↑</span>}
    </div>
  );
}

// ==============================================
// Regression Alert Banner Component
// ==============================================

function RegressionAlertBanner({ regressions }: { regressions: RegressionInfo[] }) {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <Card
      style={{
        background: "#fef3c7",
        border: "1px solid #f59e0b",
        padding: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 24 }}>⚠️</span>
        <div style={{ flex: 1 }}>
          <h4
            style={{
              margin: "0 0 8px",
              fontSize: 14,
              fontWeight: 600,
              color: "#92400e",
            }}
          >
            Score Regression Detected
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {regressions.slice(0, 3).map((regression) => (
              <div
                key={regression.scanId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "#78350f",
                }}
              >
                <span style={{ fontWeight: 500 }}>{regression.url}</span>
                <span>dropped</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: "#dc2626",
                  }}
                >
                  {regression.scoreDrop} points
                </span>
                <span style={{ color: "#92400e" }}>
                  ({regression.previousScore} → {regression.currentScore})
                </span>
                <span style={{ color: "#a16207", fontSize: 12 }}>
                  • {formatDate(regression.timestamp)}
                </span>
              </div>
            ))}
            {regressions.length > 3 && (
              <div style={{ fontSize: 12, color: "#a16207" }}>
                +{regressions.length - 3} more regressions
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function StatCard({
  label,
  value,
  prefix = "",
  suffix = "",
  color,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  color?: string;
}) {
  return (
    <Card>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || "#0f172a" }}>
        {prefix}
        {value}
        <span style={{ fontSize: 14, fontWeight: 400, color: "#64748b" }}>
          {suffix}
        </span>
      </div>
    </Card>
  );
}

function ProgressRow({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        background: "#f8fafc",
        borderRadius: 8,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span>{icon}</span>
        <span style={{ fontSize: 14 }}>{label}</span>
      </span>
      <span style={{ fontSize: 20, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}