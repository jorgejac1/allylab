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

interface ScanResultsProps {
  scan: SavedScan;
  trackingStats?: TrackingStatsType;
  onGenerateFix?: (finding: TrackedFinding) => Promise<void>;
  onRescan?: () => void;
}

type TabId = "findings" | "patterns" | "impact" | "rules";

export function ScanResults({
  scan,
  trackingStats,
  onGenerateFix,
  onRescan,
}: ScanResultsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("findings");
  const [selectedFinding, setSelectedFinding] = useState<TrackedFinding | null>(
    null
  );
  const [isGeneratingFix, setIsGeneratingFix] = useState(false);
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
    const filename = `allylab-${new URL(scan.url).hostname}-${Date.now()}.csv`;
    // Export only active findings (exclude false positives)
    exportToCSV(activeFindings, filename);
  };

  const handleExportJSON = () => {
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

  const handleGenerateFix = async (finding: TrackedFinding) => {
    if (!onGenerateFix) return;
    setIsGeneratingFix(true);
    try {
      await onGenerateFix(finding);
    } finally {
      setIsGeneratingFix(false);
    }
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
      style={{ display: "flex", flexDirection: "column", gap: 24 }}
      key={fpRefreshKey}
    >
      {/* Header with Score */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <ScoreCircle score={scan.score} size={80} showGrade />
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 4px" }}>
              Scan Results
            </h2>
            <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
              <a
                href={scan.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#2563eb" }}
              >
                {scan.url}
              </a>
              {" · "}
              {new Date(scan.timestamp).toLocaleString()}
              {fpCount > 0 && (
                <span style={{ marginLeft: 8, color: "#94a3b8" }}>
                  · {fpCount} false positive{fpCount !== 1 ? "s" : ""} hidden
                </span>
              )}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            📤 Export CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportJSON}>
            📤 Export JSON
          </Button>
          {onRescan && (
            <Button size="sm" onClick={onRescan}>
              🔄 Rescan
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
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
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
                icon="🎉"
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
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              Rules Summary
            </div>
            {rulesArray.length === 0 ? (
              <EmptyState
                icon="✅"
                title="All Rules Passed"
                description="No accessibility violations were detected."
              />
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
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
        onGenerateFix={onGenerateFix ? handleGenerateFix : undefined}
        isGeneratingFix={isGeneratingFix}
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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: 16,
        background: "#f8fafc",
        borderRadius: 8,
        border: "1px solid #e2e8f0",
      }}
    >
      {/* Count */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 8,
          background: colors.bg,
          color: colors.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {rule.count}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{rule.ruleTitle}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              background: colors.bg,
              color: colors.text,
              textTransform: "uppercase",
            }}
          >
            {rule.impact}
          </span>
          {rule.wcagTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 11,
                background: "#eff6ff",
                color: "#2563eb",
              }}
            >
              {tag}
            </span>
          ))}
          {rule.wcagTags.length > 3 && (
            <span style={{ fontSize: 11, color: "#64748b" }}>
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
        style={{
          padding: "6px 12px",
          borderRadius: 6,
          fontSize: 12,
          color: "#2563eb",
          textDecoration: "none",
          background: "#eff6ff",
          flexShrink: 0,
        }}
      >
        Learn More →
      </a>
    </div>
  );
}
