import { useState } from "react";
import { Modal, Button, Tabs } from "../ui";
import { useLocalStorage, useJiraExport } from "../../hooks";
import type { Finding, JiraConfig, JiraFieldMapping } from "../../types";
import { DEFAULT_JIRA_CONFIG, DEFAULT_FIELD_MAPPING } from "../../types/jira";

interface JiraExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  findings: Finding[];
  pageUrl: string;
}

type TabId = "preview" | "result";

export function JiraExportModal({
  isOpen,
  onClose,
  findings,
  pageUrl,
}: JiraExportModalProps) {
  const [config] = useLocalStorage<JiraConfig>(
    "allylab_jira_config",
    DEFAULT_JIRA_CONFIG
  );
  const [mapping] = useLocalStorage<JiraFieldMapping>(
    "allylab_jira_mapping",
    DEFAULT_FIELD_MAPPING
  );
  const [activeTab, setActiveTab] = useState<TabId>("preview");
  const [selectedFindings, setSelectedFindings] = useState<Set<string>>(
    new Set(findings.map((f) => f.id))
  );

  const { isExporting, bulkProgress, exportBulk, previewPayload, reset } =
    useJiraExport({
      config,
      mapping,
    });

  const handleToggleFinding = (id: string) => {
    const next = new Set(selectedFindings);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedFindings(next);
  };

  const handleSelectAll = () => {
    setSelectedFindings(new Set(findings.map((f) => f.id)));
  };

  const handleSelectNone = () => {
    setSelectedFindings(new Set());
  };

  const handleExport = async () => {
    const toExport = findings.filter((f) => selectedFindings.has(f.id));
    await exportBulk(toExport, pageUrl);
    setActiveTab("result");
  };

  const handleClose = () => {
    reset();
    setActiveTab("preview");
    onClose();
  };

  if (!config.enabled) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="JIRA Export">
        <div style={{ padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
            JIRA Integration Not Configured
          </h3>
          <p style={{ color: "#64748b", marginBottom: 16 }}>
            Configure your JIRA settings first in Settings → JIRA Integration
          </p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </Modal>
    );
  }

  // Preview payload for first selected finding
  const firstSelected = findings.find((f) => selectedFindings.has(f.id));
  const previewData = firstSelected
    ? previewPayload(firstSelected, pageUrl)
    : null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Export to JIRA">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Tabs
          tabs={[
            { id: "preview", label: "👁️ Select & Preview" },
            {
              id: "result",
              label: "📊 Results",
              count: bulkProgress?.completed,
            },
          ]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
        />

        {activeTab === "preview" && (
          <>
            {/* Selection Controls */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 14, color: "#64748b" }}>
                {selectedFindings.size} of {findings.length} issues selected
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="secondary" size="sm" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSelectNone}
                >
                  Select None
                </Button>
              </div>
            </div>

            {/* Findings List */}
            <div
              style={{
                maxHeight: 200,
                overflow: "auto",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
              }}
            >
              {findings.map((finding) => (
                <label
                  key={finding.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderBottom: "1px solid #f1f5f9",
                    cursor: "pointer",
                    background: selectedFindings.has(finding.id)
                      ? "#f0f9ff"
                      : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedFindings.has(finding.id)}
                    onChange={() => handleToggleFinding(finding.id)}
                  />
                  <span
                    style={{
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      background: getSeverityBg(finding.impact),
                      color: getSeverityColor(finding.impact),
                    }}
                  >
                    {finding.impact}
                  </span>
                  <span style={{ flex: 1, fontSize: 13 }}>
                    {finding.ruleTitle}
                  </span>
                </label>
              ))}
            </div>

            {/* Preview JSON */}
            {previewData && (
              <div>
                <h4
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    margin: "0 0 8px",
                    color: "#64748b",
                  }}
                >
                  Preview (first selected issue)
                </h4>
                <div
                  style={{
                    background: "#1e293b",
                    color: "#e2e8f0",
                    padding: 12,
                    borderRadius: 8,
                    fontFamily: "monospace",
                    fontSize: 11,
                    maxHeight: 200,
                    overflow: "auto",
                  }}
                >
                  <pre style={{ margin: 0 }}>
                    {JSON.stringify(previewData, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Export Button */}
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
            >
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={selectedFindings.size === 0 || isExporting}
              >
                {isExporting
                  ? `⏳ Exporting ${bulkProgress?.completed || 0}/${
                      selectedFindings.size
                    }...`
                  : `📤 Export ${selectedFindings.size} Issue${
                      selectedFindings.size !== 1 ? "s" : ""
                    }`}
              </Button>
            </div>
          </>
        )}

        {activeTab === "result" && bulkProgress && (
          <ExportResults progress={bulkProgress} />
        )}
      </div>
    </Modal>
  );
}

function ExportResults({
  progress,
}: {
  progress: import("../../types").BulkExportProgress;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}
      >
        <StatCard label="Total" value={progress.total} color="#64748b" />
        <StatCard
          label="Successful"
          value={progress.successful}
          color="#10b981"
        />
        <StatCard label="Failed" value={progress.failed} color="#ef4444" />
      </div>

      {/* Progress Bar */}
      <div
        style={{
          height: 8,
          background: "#f1f5f9",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(progress.completed / progress.total) * 100}%`,
            background: progress.failed > 0 ? "#f59e0b" : "#10b981",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* Results List */}
      <div
        style={{
          maxHeight: 300,
          overflow: "auto",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
        }}
      >
        {progress.results.map((result, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderBottom: "1px solid #f1f5f9",
              background: result.success ? "#f0fdf4" : "#fef2f2",
            }}
          >
            <span>{result.success ? "✅" : "❌"}</span>
            <span style={{ flex: 1, fontSize: 13 }}>
              {result.request.fields.summary.substring(0, 60)}...
            </span>
            {result.issueKey && (
              <span style={{ fontSize: 12, fontWeight: 600, color: "#2563eb" }}>
                {result.issueKey}
              </span>
            )}
            {result.error && (
              <span style={{ fontSize: 12, color: "#ef4444" }}>
                {result.error}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        padding: 16,
        background: "#f8fafc",
        borderRadius: 8,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
    </div>
  );
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: "#dc2626",
    serious: "#ea580c",
    moderate: "#ca8a04",
    minor: "#2563eb",
  };
  return colors[severity] || "#6b7280";
}

function getSeverityBg(severity: string): string {
  const colors: Record<string, string> = {
    critical: "#fef2f2",
    serious: "#fff7ed",
    moderate: "#fefce8",
    minor: "#eff6ff",
  };
  return colors[severity] || "#f3f4f6";
}
