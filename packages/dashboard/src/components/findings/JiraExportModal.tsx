import { useState } from "react";
import { Modal, Button, Tabs } from "../ui";
import { useLocalStorage, useJiraExport } from "../../hooks";
import type { Finding, JiraConfig, JiraFieldMapping } from "../../types";
import { DEFAULT_JIRA_CONFIG, DEFAULT_FIELD_MAPPING } from "../../types/jira";
import { Link2, Eye, BarChart3, Upload, Loader2, CheckCircle, XCircle } from "lucide-react";

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
        <div className="p-6 text-center">
          <div className="mb-4 flex justify-center text-slate-400"><Link2 size={48} /></div>
          <h3 className="text-lg font-semibold m-0 mb-2">
            JIRA Integration Not Configured
          </h3>
          <p className="text-slate-500 mb-4">
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
      <div className="flex flex-col gap-4">
        <Tabs
          tabs={[
            { id: "preview", label: <span className="flex items-center gap-1.5"><Eye size={14} />Select & Preview</span> },
            {
              id: "result",
              label: <span className="flex items-center gap-1.5"><BarChart3 size={14} />Results</span>,
              count: bulkProgress?.completed,
            },
          ]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
        />

        {activeTab === "preview" && (
          <>
            {/* Selection Controls */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">
                {selectedFindings.size} of {findings.length} issues selected
              </span>
              <div className="flex gap-2">
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
            <div className="max-h-[200px] overflow-auto border border-slate-200 rounded-lg">
              {findings.map((finding) => (
                <label
                  key={finding.id}
                  className="flex items-center gap-3 py-2.5 px-3 border-b border-slate-50 cursor-pointer"
                  style={{
                    background: selectedFindings.has(finding.id)
                      ? '#f0f9ff'
                      : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedFindings.has(finding.id)}
                    onChange={() => handleToggleFinding(finding.id)}
                  />
                  <span
                    className="py-0.5 px-1.5 rounded text-[10px] font-semibold uppercase"
                    style={{
                      background: getSeverityBg(finding.impact),
                      color: getSeverityColor(finding.impact),
                    }}
                  >
                    {finding.impact}
                  </span>
                  <span className="flex-1 text-[13px]">
                    {finding.ruleTitle}
                  </span>
                </label>
              ))}
            </div>

            {/* Preview JSON */}
            {previewData && (
              <div>
                <h4 className="text-[13px] font-semibold m-0 mb-2 text-slate-500">
                  Preview (first selected issue)
                </h4>
                <div className="bg-slate-800 text-slate-200 p-3 rounded-lg font-mono text-[11px] max-h-[200px] overflow-auto">
                  <pre className="m-0">
                    {JSON.stringify(previewData, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Export Button */}
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={selectedFindings.size === 0 || isExporting}
              >
                {isExporting
                  ? <><Loader2 size={14} className="mr-1.5" style={{ animation: "spin 1s linear infinite" }} />Exporting {bulkProgress?.completed || 0}/{selectedFindings.size}...</>
                  : <><Upload size={14} className="mr-1.5" />Export {selectedFindings.size} Issue{selectedFindings.size !== 1 ? "s" : ""}</>}
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
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total" value={progress.total} color="#64748b" />
        <StatCard
          label="Successful"
          value={progress.successful}
          color="#10b981"
        />
        <StatCard label="Failed" value={progress.failed} color="#ef4444" />
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-100 rounded overflow-hidden">
        <div
          className="h-full transition-[width] duration-300 ease-out"
          style={{
            width: `${(progress.completed / progress.total) * 100}%`,
            background: progress.failed > 0 ? '#f59e0b' : '#10b981',
          }}
        />
      </div>

      {/* Results List */}
      <div className="max-h-[300px] overflow-auto border border-slate-200 rounded-lg">
        {progress.results.map((result, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-3 py-2.5 px-3 border-b border-slate-50 ${
              result.success ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            <span className={`flex items-center ${result.success ? 'text-emerald-500' : 'text-red-500'}`}>
              {result.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
            </span>
            <span className="flex-1 text-[13px]">
              {result.request.fields.summary.substring(0, 60)}...
            </span>
            {result.issueKey && (
              <span className="text-xs font-semibold text-blue-600">
                {result.issueKey}
              </span>
            )}
            {result.error && (
              <span className="text-xs text-red-500">
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
    <div className="p-4 bg-slate-50 rounded-lg text-center">
      <div className="text-[28px] font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
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
