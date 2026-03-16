import { useState, useCallback } from "react";
import { Card, Button, Tabs, EmptyState } from "../ui";
import { ScoreCircle, SeverityBar } from "../charts";
import { QuickStats } from "./QuickStats";
import { ImpactAnalysis } from "./ImpactAnalysis";
import {
  FindingsTable,
  IssuePatterns,
  TrackingStats,
  FindingDetailsDrawer,
} from "../findings";
import type {
  SavedScan,
  TrackedFinding,
  TrackingStats as TrackingStatsType,
} from "../../types";
import { exportToCSV, exportToJSON } from "../../utils/export";
import { applyFalsePositiveStatus } from "../../utils/falsePositives";
import { Upload, RefreshCw, PartyPopper, CheckCircle } from "lucide-react";

interface ScanResultsProps {
  scan: SavedScan;
  trackingStats?: TrackingStatsType;
  onRescan?: () => void;
}

type TabId = "findings" | "patterns" | "impact" | "rules";

export function ScanResults({
  scan,
  trackingStats,
  onRescan,
}: ScanResultsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("findings");
  const [selectedFinding, setSelectedFinding] = useState<TrackedFinding | null>(
    null
  );
  const [fpRefreshKey, setFpRefreshKey] = useState(0);

  // Apply false positive status to findings
  const rawFindings = scan.trackedFindings || [];
  const findings = applyFalsePositiveStatus(rawFindings);

  // Filter out false positives for counts and exports
  const activeFindings = findings.filter((f) => !f.falsePositive);
  const fpCount = findings.filter((f) => f.falsePositive).length;

  const tabs = [
    { id: "findings", label: "Findings", count: activeFindings.length },
    { id: "patterns", label: "Patterns", count: undefined },
    { id: "impact", label: "Impact Analysis", count: undefined },
    { id: "rules", label: "Rules Summary", count: undefined },
  ];

  const handleExportCSV = () => {
    // eslint-disable-next-line react-hooks/purity -- Date.now() is called at click time, not during render
    const filename = `allylab-${new URL(scan.url).hostname}-${Date.now()}.csv`;
    // Export only active findings (exclude false positives)
    exportToCSV(activeFindings, filename);
  };

  const handleExportJSON = () => {
    // eslint-disable-next-line react-hooks/purity -- Date.now() is called at click time, not during render
    const filename = `allylab-${new URL(scan.url).hostname}-${Date.now()}.json`;
    // Export scan but with false positives filtered
    const exportScan = {
      ...scan,
      trackedFindings: activeFindings,
      totalIssues: activeFindings.length,
      falsePositivesExcluded: fpCount,
    };
    exportToJSON(exportScan, filename);
  };

  const handleViewDetails = (finding: TrackedFinding) => {
    setSelectedFinding(finding);
  };

  const handleFalsePositiveChange = useCallback(() => {
    setFpRefreshKey((k) => k + 1);
    setSelectedFinding(null);
  }, []);

  // Group findings by rule for Rules Summary (only active findings)
  const rulesSummary = activeFindings.reduce((acc, f) => {
    if (!acc[f.ruleId]) {
      acc[f.ruleId] = {
        ruleId: f.ruleId,
        ruleTitle: f.ruleTitle,
        impact: f.impact,
        count: 0,
        wcagTags: f.wcagTags,
        helpUrl: f.helpUrl,
      };
    }
    acc[f.ruleId].count++;
    return acc;
  }, {} as Record<string, { ruleId: string; ruleTitle: string; impact: string; count: number; wcagTags: string[]; helpUrl: string }>);

  const rulesArray = Object.values(rulesSummary).sort(
    (a, b) => b.count - a.count
  );

  // Recalculate stats excluding false positives
  const adjustedStats = trackingStats
    ? {
        ...trackingStats,
        total: trackingStats.total - fpCount,
      }
    : undefined;

  return (
    <div
      className="flex flex-col gap-6"
      key={fpRefreshKey}
    >
      {/* Header with Score */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="flex items-center gap-5">
          <ScoreCircle score={scan.score} size={80} showGrade />
          <div>
            <h2 className="text-xl font-semibold m-0 mb-1">
              Scan Results
            </h2>
            <p className="text-sm text-slate-500 m-0">
              <a
                href={scan.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600"
              >
                {scan.url}
              </a>
              {" · "}
              {new Date(scan.timestamp).toLocaleString()}
              {fpCount > 0 && (
                <span className="ml-2 text-slate-400">
                  · {fpCount} false positive{fpCount !== 1 ? "s" : ""} hidden
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            <Upload size={14} className="mr-1.5" />Export CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportJSON}>
            <Upload size={14} className="mr-1.5" />Export JSON
          </Button>
          {onRescan && (
            <Button size="sm" onClick={onRescan}>
              <RefreshCw size={14} className="mr-1.5" />Rescan
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStats result={scan} />

      {/* Tracking Stats */}
      {adjustedStats && <TrackingStats stats={adjustedStats} />}

      {/* Severity Bar */}
      <Card>
        <div className="text-sm font-semibold mb-3">
          Issues by Severity
        </div>
        <SeverityBar
          critical={scan.critical}
          serious={scan.serious}
          moderate={scan.moderate}
          minor={scan.minor}
        />
      </Card>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Tab Content */}
      <div>
        {activeTab === "findings" && (
          <>
            {findings.length === 0 ? (
              <EmptyState
                icon={<PartyPopper size={32} />}
                title="No Issues Found"
                description="Great job! This page passed all accessibility checks."
              />
            ) : (
              <FindingsTable
                findings={findings}
                pageUrl={scan.url}
                onViewDetails={handleViewDetails}
                onFalsePositiveChange={handleFalsePositiveChange}
              />
            )}
          </>
        )}

        {activeTab === "patterns" && (
          <IssuePatterns findings={activeFindings} />
        )}

        {activeTab === "impact" && <ImpactAnalysis result={scan} />}

        {activeTab === "rules" && (
          <Card>
            <div className="text-base font-semibold mb-4">
              Rules Summary
            </div>
            {rulesArray.length === 0 ? (
              <EmptyState
                icon={<CheckCircle size={32} />}
                title="All Rules Passed"
                description="No accessibility violations were detected."
              />
            ) : (
              <div className="flex flex-col gap-3">
                {rulesArray.map((rule) => (
                  <RuleSummaryRow key={rule.ruleId} rule={rule} />
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Finding Details Drawer */}
      <FindingDetailsDrawer
        isOpen={selectedFinding !== null}
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
        onFalsePositiveChange={handleFalsePositiveChange}
      />
    </div>
  );
}

// ==============================================
// Rule Summary Row
// ==============================================

interface RuleSummaryRowProps {
  rule: {
    ruleId: string;
    ruleTitle: string;
    impact: string;
    count: number;
    wcagTags: string[];
    helpUrl: string;
  };
}

function RuleSummaryRow({ rule }: RuleSummaryRowProps) {
  const impactColors: Record<string, { bg: string; text: string }> = {
    critical: { bg: "#fef2f2", text: "#dc2626" },
    serious: { bg: "#fff7ed", text: "#ea580c" },
    moderate: { bg: "#fefce8", text: "#ca8a04" },
    minor: { bg: "#f0fdf4", text: "#65a30d" },
  };

  const colors = impactColors[rule.impact] || impactColors.minor;

  return (
    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
      {/* Count */}
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold shrink-0"
        style={{
          background: colors.bg,
          color: colors.text,
        }}
      >
        {rule.count}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold mb-1">{rule.ruleTitle}</div>
        <div className="flex gap-2 flex-wrap">
          <span
            className="py-0.5 px-2 rounded text-xs font-semibold uppercase"
            style={{
              background: colors.bg,
              color: colors.text,
            }}
          >
            {rule.impact}
          </span>
          {rule.wcagTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="py-0.5 px-2 rounded text-xs text-blue-600 bg-blue-50"
            >
              {tag}
            </span>
          ))}
          {rule.wcagTags.length > 3 && (
            <span className="text-xs text-slate-500">
              +{rule.wcagTags.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Learn More */}
      <a
        href={rule.helpUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="py-1.5 px-3 rounded-md text-xs text-blue-600 no-underline shrink-0 bg-blue-50"
      >
        Learn More →
      </a>
    </div>
  );
}
