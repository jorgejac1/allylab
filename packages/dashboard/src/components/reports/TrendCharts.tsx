import { useMemo } from "react";
import { Card } from "../ui";
import { TrendLine, DonutChart } from "../charts";
import type { SavedScan, TrendDataPoint } from "../../types";
import { SEVERITY_COLORS } from "../../utils/constants";

interface TrendChartsProps {
  scans: SavedScan[];
  url?: string; // Filter to specific URL
}

export function TrendCharts({ scans, url }: TrendChartsProps) {
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

  // Generate trend data
  // Generate trend data
  const trendData: TrendDataPoint[] = useMemo(() => {
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

    return {
      currentScore: latest.score,
      avgScore,
      scoreImprovement: latest.score - first.score,
      totalScans: filteredScans.length,
      totalIssuesFixed,
      latestIssues: {
        critical: latest.critical,
        serious: latest.serious,
        moderate: latest.moderate,
        minor: latest.minor,
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
        {trendData.length >= 2 ? (
          <TrendLine data={trendData} width={800} height={250} />
        ) : (
          <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
            Need at least 2 scans to show trends.
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
