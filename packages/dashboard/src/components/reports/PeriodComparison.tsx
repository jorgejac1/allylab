import { useState, useMemo } from "react";
import { Card, Button } from "../ui";
import { ScoreCircle } from "../charts";
import { getApiBase } from "../../utils/api";
import type { SavedScan } from "../../types";
import { SEVERITY_COLORS } from "../../utils/constants";

interface PeriodComparisonProps {
  scans: SavedScan[];
  onClose: () => void;
  initialPreset?: PresetPeriod; // For testing purposes
}

interface PeriodStats {
  avgScore: number;
  minScore: number;
  maxScore: number;
  avgIssues: number;
  avgCritical: number;
  avgSerious: number;
  avgModerate: number;
  avgMinor: number;
  totalIssuesFixed: number;
  scoreImprovement: number;
}

interface ComparisonData {
  comparison: {
    score: {
      period1: number;
      period2: number;
      change: number;
      changePercent: number;
    };
    issues: {
      period1: number;
      period2: number;
      change: number;
      changePercent: number;
    };
    critical: { period1: number; period2: number; change: number };
    serious: { period1: number; period2: number; change: number };
    scanCount: { period1: number; period2: number };
  };
  period1: { start: string; end: string; stats: PeriodStats };
  period2: { start: string; end: string; stats: PeriodStats };
}

type PresetPeriod = "week" | "month" | "quarter" | "custom";

export function PeriodComparison({ scans, onClose, initialPreset = "month" }: PeriodComparisonProps) {
  const [preset, setPreset] = useState<PresetPeriod>(initialPreset);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate date ranges based on preset
  const dateRanges = useMemo(() => {
    const now = new Date();
    let period1Start: Date,
      period1End: Date,
      period2Start: Date,
      period2End: Date;

    switch (preset) {
      case "week":
        period2End = now;
        period2Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        period1End = new Date(period2Start.getTime() - 1);
        period1Start = new Date(period1End.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        period2End = now;
        period2Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        period1End = new Date(period2Start.getTime() - 1);
        period1Start = new Date(
          period1End.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        break;
      case "quarter":
        period2End = now;
        period2Start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        period1End = new Date(period2Start.getTime() - 1);
        period1Start = new Date(
          period1End.getTime() - 90 * 24 * 60 * 60 * 1000
        );
        break;
      default:
        period2End = now;
        period2Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        period1End = new Date(period2Start.getTime() - 1);
        period1Start = new Date(
          period1End.getTime() - 30 * 24 * 60 * 60 * 1000
        );
    }

    return {
      period1Start: period1Start.toISOString(),
      period1End: period1End.toISOString(),
      period2Start: period2Start.toISOString(),
      period2End: period2End.toISOString(),
    };
  }, [preset]);

  const handleCompare = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getApiBase()}/trends/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scans: scans.map((s) => ({
            id: s.id,
            url: s.url,
            timestamp: s.timestamp,
            score: s.score,
            totalIssues: s.totalIssues,
            critical: s.critical,
            serious: s.serious,
            moderate: s.moderate,
            minor: s.minor,
          })),
          ...dateRanges,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch comparison data");
      }

      const data = await response.json();
      if (data.success) {
        setComparisonData(data.data);
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to compare periods"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };
    return `${startDate.toLocaleDateString(
      "en-US",
      options
    )} - ${endDate.toLocaleDateString("en-US", options)}`;
  };

  return (
    <Card>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
          📅 Period Comparison
        </h3>
        <Button variant="secondary" size="sm" onClick={onClose}>
          ✕ Close
        </Button>
      </div>

      {/* Period Selector */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          padding: 16,
          background: "#f8fafc",
          borderRadius: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500, marginRight: 8 }}>
          Compare:
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {(["week", "month", "quarter"] as PresetPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPreset(p);
                setComparisonData(null);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                background: preset === p ? "#2563eb" : "#fff",
                color: preset === p ? "#fff" : "#64748b",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {p === "week" && "Week vs Week"}
              {p === "month" && "Month vs Month"}
              {p === "quarter" && "Quarter vs Quarter"}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <Button onClick={handleCompare} disabled={isLoading}>
          {isLoading ? "⏳ Loading..." : "📊 Compare Periods"}
        </Button>
      </div>

      {/* Date Range Preview */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 16,
          marginBottom: 24,
          alignItems: "center",
        }}
      >
        <DateRangeCard
          label="Previous Period"
          range={formatDateRange(
            dateRanges.period1Start,
            dateRanges.period1End
          )}
          color="#64748b"
        />
        <span style={{ fontSize: 24, color: "#cbd5e1" }}>→</span>
        <DateRangeCard
          label="Current Period"
          range={formatDateRange(
            dateRanges.period2Start,
            dateRanges.period2End
          )}
          color="#2563eb"
        />
      </div>

      {/* Error State */}
      {error && (
        <div
          style={{
            padding: 16,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            color: "#991b1b",
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Comparison Results */}
      {comparisonData && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Score Comparison */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: 24,
              alignItems: "center",
            }}
          >
            <PeriodCard
              label="Previous"
              score={comparisonData.comparison.score.period1}
              issues={comparisonData.comparison.issues.period1}
              scanCount={comparisonData.comparison.scanCount.period1}
            />

            <ChangeIndicator
              scoreChange={comparisonData.comparison.score.change}
              issueChange={comparisonData.comparison.issues.change}
              scorePercent={comparisonData.comparison.score.changePercent}
            />

            <PeriodCard
              label="Current"
              score={comparisonData.comparison.score.period2}
              issues={comparisonData.comparison.issues.period2}
              scanCount={comparisonData.comparison.scanCount.period2}
              highlight
            />
          </div>

          {/* Severity Breakdown */}
          <div
            style={{
              padding: 20,
              background: "#f8fafc",
              borderRadius: 12,
            }}
          >
            <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px" }}>
              Severity Changes
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 16,
              }}
            >
              <SeverityChangeCard
                label="Critical"
                before={comparisonData.comparison.critical.period1}
                after={comparisonData.comparison.critical.period2}
                color={SEVERITY_COLORS.critical}
              />
              <SeverityChangeCard
                label="Serious"
                before={comparisonData.comparison.serious.period1}
                after={comparisonData.comparison.serious.period2}
                color={SEVERITY_COLORS.serious}
              />
              <SeverityChangeCard
                label="Moderate"
                before={comparisonData.period1.stats.avgModerate}
                after={comparisonData.period2.stats.avgModerate}
                color={SEVERITY_COLORS.moderate}
              />
              <SeverityChangeCard
                label="Minor"
                before={comparisonData.period1.stats.avgMinor}
                after={comparisonData.period2.stats.avgMinor}
                color={SEVERITY_COLORS.minor}
              />
            </div>
          </div>

          {/* Summary */}
          <SummaryBanner comparison={comparisonData.comparison} />
        </div>
      )}

      {/* Empty State */}
      {!comparisonData && !isLoading && !error && (
        <div
          style={{
            padding: 48,
            textAlign: "center",
            color: "#64748b",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
            Compare Performance Over Time
          </div>
          <div style={{ fontSize: 14 }}>
            Select a time period and click "Compare Periods" to see how your
            accessibility scores have changed.
          </div>
        </div>
      )}
    </Card>
  );
}

// ==============================================
// Sub-components
// ==============================================

function DateRangeCard({
  label,
  range,
  color,
}: {
  label: string;
  range: string;
  color: string;
}) {
  return (
    <div
      style={{
        padding: 16,
        background: "#fff",
        border: `2px solid ${color}20`,
        borderRadius: 8,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#64748b",
          marginBottom: 4,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color }}>{range}</div>
    </div>
  );
}

function PeriodCard({
  label,
  score,
  issues,
  scanCount,
  highlight,
}: {
  label: string;
  score: number;
  issues: number;
  scanCount: number;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        padding: 20,
        background: highlight ? "#eff6ff" : "#f8fafc",
        border: highlight ? "2px solid #3b82f6" : "1px solid #e2e8f0",
        borderRadius: 12,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#64748b",
          marginBottom: 12,
          fontWeight: 600,
        }}
      >
        {label.toUpperCase()}
      </div>
      <div
        style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}
      >
        <ScoreCircle score={score} size={80} />
      </div>
      <div style={{ fontSize: 13, color: "#64748b" }}>
        Avg {issues.toFixed(1)} issues
      </div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
        {scanCount} scan{scanCount !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

function ChangeIndicator({
  scoreChange,
  issueChange,
  scorePercent,
}: {
  scoreChange: number;
  issueChange: number;
  scorePercent: number;
}) {
  const isImproved = scoreChange > 0;
  const isDeclined = scoreChange < 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: 16,
        minWidth: 120,
      }}
    >
      <div
        style={{
          fontSize: 32,
          lineHeight: 1,
        }}
      >
        {isImproved ? "📈" : isDeclined ? "📉" : "➖"}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: isImproved ? "#10b981" : isDeclined ? "#ef4444" : "#64748b",
        }}
      >
        {scoreChange > 0 ? "+" : ""}
        {scoreChange}
      </div>
      <div style={{ fontSize: 11, color: "#64748b" }}>
        ({scorePercent > 0 ? "+" : ""}
        {scorePercent.toFixed(1)}%)
      </div>
      <div
        style={{
          fontSize: 12,
          color:
            issueChange < 0
              ? "#10b981"
              : issueChange > 0
              ? "#ef4444"
              : "#64748b",
        }}
      >
        {issueChange < 0 ? "↓" : issueChange > 0 ? "↑" : ""}{" "}
        {Math.abs(issueChange).toFixed(1)} issues
      </div>
    </div>
  );
}

function SeverityChangeCard({
  label,
  before,
  after,
  color,
}: {
  label: string;
  before: number;
  after: number;
  color: string;
}) {
  const change = after - before;
  const isReduced = change < 0;
  const isIncreased = change > 0;

  return (
    <div
      style={{
        padding: 12,
        background: "#fff",
        borderRadius: 8,
        border: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
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
        <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span style={{ fontSize: 11, color: "#94a3b8" }}>
          {before.toFixed(1)} → {after.toFixed(1)}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: isReduced ? "#10b981" : isIncreased ? "#ef4444" : "#64748b",
          }}
        >
          {change > 0 ? "+" : ""}
          {change.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

function SummaryBanner({
  comparison,
}: {
  comparison: ComparisonData["comparison"];
}) {
  const improved = comparison.score.change > 0;
  const declined = comparison.score.change < 0;

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 8,
        background: improved ? "#f0fdf4" : declined ? "#fef2f2" : "#f8fafc",
        border: `1px solid ${
          improved ? "#bbf7d0" : declined ? "#fecaca" : "#e2e8f0"
        }`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 14,
          fontWeight: 500,
          color: improved ? "#166534" : declined ? "#991b1b" : "#64748b",
        }}
      >
        <span style={{ fontSize: 24 }}>
          {improved ? "🎉" : declined ? "⚠️" : "➖"}
        </span>
        <span>
          {improved
            ? `Great progress! Score improved by ${
                comparison.score.change
              } points (${comparison.score.changePercent.toFixed(
                1
              )}%) compared to the previous period.`
            : declined
            ? `Score decreased by ${Math.abs(
                comparison.score.change
              )} points (${Math.abs(comparison.score.changePercent).toFixed(
                1
              )}%) compared to the previous period.`
            : "Score remained stable between the two periods."}
        </span>
      </div>
    </div>
  );
}
