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
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold m-0 inline-flex items-center gap-2">
          <Calendar size={20} /> Period Comparison
        </h3>
        <Button variant="secondary" size="sm" onClick={onClose} className="inline-flex items-center gap-1">
          <X size={14} /> Close
        </Button>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-6 p-4 bg-slate-50 rounded-lg items-center flex-wrap">
        <span className="text-sm font-medium mr-2">
          Compare:
        </span>
        <div className="flex gap-1">
          {(["week", "month", "quarter"] as PresetPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPreset(p);
                setComparisonData(null);
              }}
              className={`py-1.5 px-3 rounded-md border-none text-sm font-medium cursor-pointer transition-all ${
                preset === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-100'
              }`}
            >
              {p === "week" && "Week vs Week"}
              {p === "month" && "Month vs Month"}
              {p === "quarter" && "Quarter vs Quarter"}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <Button onClick={handleCompare} disabled={isLoading} className="inline-flex items-center gap-1.5">
          {isLoading ? <><Loader2 size={14} className="animate-spin" /> Loading...</> : <><BarChart3 size={14} /> Compare Periods</>}
        </Button>
      </div>

      {/* Date Range Preview */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mb-6 items-center">
        <DateRangeCard
          label="Previous Period"
          range={formatDateRange(dateRanges.period1Start, dateRanges.period1End)}
          color="#64748b"
        />
        <span className="text-2xl text-slate-300">&rarr;</span>
        <DateRangeCard
          label="Current Period"
          range={formatDateRange(dateRanges.period2Start, dateRanges.period2End)}
          color="#2563eb"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-900 text-sm mb-6">
          <span className="inline-flex items-center gap-1.5"><AlertTriangle size={16} /> {error}</span>
        </div>
      )}

      {/* Comparison Results */}
      {comparisonData && (
        <div className="flex flex-col gap-6">
          {/* Score Comparison */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-center">
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
          <div className="p-5 bg-slate-50 rounded-xl">
            <h4 className="text-sm font-semibold mt-0 mb-4">
              Severity Changes
            </h4>
            <div className="grid grid-cols-4 gap-4">
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
        <div className="py-12 px-12 text-center text-slate-500">
          <div className="mb-4 flex justify-center"><BarChart3 size={48} /></div>
          <div className="text-base font-medium mb-2">
            Compare Performance Over Time
          </div>
          <div className="text-sm">
            Select a time period and click "Compare Periods" to see how your
            accessibility scores have changed.
          </div>
        </div>
      )}
    </Card>
  );
}
