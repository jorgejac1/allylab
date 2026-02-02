import { useState } from "react";
import { Card, Button } from "../ui";
import { getApiBase } from "../../utils/api";
import { useDateRanges, formatDateRange } from "../../hooks";
import type { PresetPeriod } from "../../hooks";
import type { SavedScan } from "../../types";
import { SEVERITY_COLORS } from "../../utils/constants";
import { Calendar, X, Loader2, BarChart3, AlertTriangle } from "lucide-react";
import {
  DateRangeCard,
  PeriodCard,
  ChangeIndicator,
  SeverityChangeCard,
  SummaryBanner,
} from "./comparison";

interface PeriodComparisonProps {
  scans: SavedScan[];
  onClose: () => void;
  initialPreset?: PresetPeriod;
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

export function PeriodComparison({ scans, onClose, initialPreset = "month" }: PeriodComparisonProps) {
  const [preset, setPreset] = useState<PresetPeriod>(initialPreset);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateRanges = useDateRanges(preset);

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
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={20} /> Period Comparison
        </h3>
        <Button variant="secondary" size="sm" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <X size={14} /> Close
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

        <Button onClick={handleCompare} disabled={isLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {isLoading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading...</> : <><BarChart3 size={14} /> Compare Periods</>}
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
          range={formatDateRange(dateRanges.period1Start, dateRanges.period1End)}
          color="#64748b"
        />
        <span style={{ fontSize: 24, color: "#cbd5e1" }}>→</span>
        <DateRangeCard
          label="Current Period"
          range={formatDateRange(dateRanges.period2Start, dateRanges.period2End)}
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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={16} /> {error}</span>
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
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><BarChart3 size={48} /></div>
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
