import { useState, useMemo } from "react";
import { Card, Pagination } from "../ui";
import { usePRTracking } from "../../hooks";
import { PRStatusBadge } from "./PRStatusBadge";
import { VerificationModal } from "./VerificationModal";
import type { VerificationResult } from "../../types/github";
import { BatchPRModal } from "./BatchPRModal";
import { FindingsFilterBar, FalsePositiveFilter } from "./FindingsFilterBar";
import { FindingsSelectionBar } from "./FindingsSelectionBar";
import { FindingsRow } from "./FindingsRow";
import { JiraExportModal } from "./JiraExportModal";
import { useLocalStorage } from "../../hooks";
import type { TrackedFinding, Severity, IssueStatus } from "../../types";
import {
  markAsFalsePositive,
  unmarkFalsePositive,
  applyFalsePositiveStatus,
} from "../../utils/falsePositives";

interface FindingsTableProps {
  findings: TrackedFinding[];
  pageUrl: string;
  scanStandard?: string;
  scanViewport?: string;
  onViewDetails: (finding: TrackedFinding) => void;
  onFalsePositiveChange?: () => void;
}

type JiraLinks = Record<string, string>;

export function FindingsTable({
  findings,
  pageUrl,
  scanStandard,
  scanViewport,
  onViewDetails,
  onFalsePositiveChange,
}: FindingsTableProps) {
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "all">("all");
  const [fpFilter, setFpFilter] = useState<FalsePositiveFilter>("active");
  const [fpVersion, setFpVersion] = useState(0);

  // PR Fix Verification
  const { getPRsForFinding, verifyFixes } = usePRTracking();
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyingPRId, setVerifyingPRId] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(
    null
  );

  const handleVerifyFix = async (prId: string) => {
    setVerifyingPRId(prId);
    setIsVerifying(true);
    setVerificationError(null);
    setVerificationModalOpen(true);

    const result = await verifyFixes(prId);

    if (result) {
      setVerificationResult(result);
    } else {
      setVerificationError("Failed to verify fixes");
    }

    setIsVerifying(false);
    setVerifyingPRId(null);
  };

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // JIRA
  const [jiraModalOpen, setJiraModalOpen] = useState(false);
  const [jiraLinks, setJiraLinks] = useLocalStorage<JiraLinks>(
    "allylab_jira_links",
    {}
  );
  const [linkingFindingId, setLinkingFindingId] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState("");

  // PR Batch
  const [batchPRModalOpen, setBatchPRModalOpen] = useState(false);

  // Apply false positive status
  const findingsWithFpStatus = useMemo(() => {
    void fpVersion;
    return applyFalsePositiveStatus(findings);
  }, [findings, fpVersion]);

  // Filter findings
  const filtered = useMemo(() => {
    return findingsWithFpStatus.filter((f) => {
      if (fpFilter === "active" && f.falsePositive) return false;
      if (fpFilter === "false-positive" && !f.falsePositive) return false;
      if (severityFilter !== "all" && f.impact !== severityFilter) return false;
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      return true;
    });
  }, [findingsWithFpStatus, severityFilter, statusFilter, fpFilter]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Counts
  const activeFindings = findingsWithFpStatus.filter((f) => !f.falsePositive);
  const fpCount = findingsWithFpStatus.filter((f) => f.falsePositive).length;
  const linkedCount = filtered.filter((f) => jiraLinks[f.id]).length;

  const severityCounts: Record<Severity, number> = useMemo(
    () => ({
      critical: activeFindings.filter((f) => f.impact === "critical").length,
      serious: activeFindings.filter((f) => f.impact === "serious").length,
      moderate: activeFindings.filter((f) => f.impact === "moderate").length,
      minor: activeFindings.filter((f) => f.impact === "minor").length,
    }),
    [activeFindings]
  );

  const statusCounts: Record<IssueStatus, number> = useMemo(
    () => ({
      new: activeFindings.filter((f) => f.status === "new").length,
      recurring: activeFindings.filter((f) => f.status === "recurring").length,
      fixed: activeFindings.filter((f) => f.status === "fixed").length,
    }),
    [activeFindings]
  );

  // Handlers
  const handleToggleFalsePositive = (finding: TrackedFinding) => {
    if (finding.falsePositive) {
      unmarkFalsePositive(finding.fingerprint);
    } else {
      markAsFalsePositive(finding.fingerprint, finding.ruleId);
    }
    setFpVersion((v) => v + 1);
    onFalsePositiveChange?.();
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAllPage = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((f) => f.id)));
    }
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(new Set(filtered.map((f) => f.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleOpenJiraExport = () => {
    if (selectedIds.size === 0) {
      setSelectedIds(new Set(filtered.map((f) => f.id)));
    }
    setJiraModalOpen(true);
  };

  const handleSaveJiraLink = (findingId: string) => {
    if (linkInput.trim()) {
      setJiraLinks((prev) => ({
        ...prev,
        [findingId]: linkInput.trim().toUpperCase(),
      }));
    }
    setLinkingFindingId(null);
    setLinkInput("");
  };

  const handleRemoveJiraLink = (findingId: string) => {
    setJiraLinks((prev) => {
      const next = { ...prev };
      delete next[findingId];
      return next;
    });
  };

  const selectedFindings = filtered.filter((f) => selectedIds.has(f.id));

  // Render PR Status cell for a finding
  const renderPRStatusCell = (findingId: string) => {
    const findingPRs = getPRsForFinding(findingId);

    if (findingPRs.length === 0) {
      return <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>;
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {findingPRs.map((pr) => (
          <PRStatusBadge
            key={pr.id}
            pr={pr}
            onVerify={() => handleVerifyFix(pr.id)}
            isVerifying={verifyingPRId === pr.id}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Card padding="none">
        <FindingsFilterBar
          activeCount={activeFindings.length}
          fpCount={fpCount}
          totalCount={findingsWithFpStatus.length}
          severityCounts={severityCounts}
          statusCounts={statusCounts}
          linkedCount={linkedCount}
          selectedCount={selectedIds.size}
          fpFilter={fpFilter}
          severityFilter={severityFilter}
          statusFilter={statusFilter}
          findings={filtered}
          scanUrl={pageUrl}
          scanDate={new Date().toISOString()}
          onFpFilterChange={setFpFilter}
          onSeverityFilterChange={setSeverityFilter}
          onStatusFilterChange={setStatusFilter}
          onExportToJira={handleOpenJiraExport}
        />

        <FindingsSelectionBar
          selectedCount={selectedIds.size}
          totalFilteredCount={filtered.length}
          onSelectAll={handleSelectAllFiltered}
          onClearSelection={handleClearSelection}
          onCreatePR={() => setBatchPRModalOpen(true)}
          onExportJira={handleOpenJiraExport}
        />

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderBottom: "2px solid #e2e8f0",
                }}
              >
                <th style={{ ...thStyle, width: 40 }}>
                  <input
                    type="checkbox"
                    checked={
                      paginated.length > 0 &&
                      selectedIds.size === paginated.length
                    }
                    onChange={handleSelectAllPage}
                    style={{ cursor: "pointer", width: 16, height: 16 }}
                  />
                </th>
                <th style={{ ...thStyle, width: 100 }}>Severity</th>
                <th style={{ ...thStyle, width: 100 }}>Status</th>
                <th style={thStyle}>Issue</th>
                <th style={{ ...thStyle, width: 100 }}>WCAG</th>
                <th style={{ ...thStyle, width: 110 }}>JIRA</th>
                <th style={{ ...thStyle, width: 150 }}>PR Status</th>
                <th style={{ ...thStyle, width: 150 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((finding) => (
                <FindingsRow
                  key={finding.id}
                  finding={finding}
                  isSelected={selectedIds.has(finding.id)}
                  jiraIssueKey={jiraLinks[finding.id]}
                  isLinkingJira={linkingFindingId === finding.id}
                  jiraLinkInput={linkInput}
                  onToggleSelect={() => handleToggleSelect(finding.id)}
                  onToggleFalsePositive={() =>
                    handleToggleFalsePositive(finding)
                  }
                  onViewDetails={() => onViewDetails(finding)}
                  onJiraLinkInputChange={setLinkInput}
                  onStartJiraLink={() => {
                    setLinkingFindingId(finding.id);
                    setLinkInput("");
                  }}
                  onSaveJiraLink={() => handleSaveJiraLink(finding.id)}
                  onCancelJiraLink={() => setLinkingFindingId(null)}
                  onRemoveJiraLink={() => handleRemoveJiraLink(finding.id)}
                  renderPRStatus={() => renderPRStatusCell(finding.id)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {paginated.length === 0 && (
          <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>
              {fpFilter === "false-positive" ? "✓" : "🔍"}
            </div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {fpFilter === "false-positive"
                ? "No false positives marked"
                : "No findings match the current filters"}
            </div>
          </div>
        )}

        {/* Pagination */}
        {paginated.length > 0 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9" }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages || 1}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </Card>

      <JiraExportModal
        isOpen={jiraModalOpen}
        onClose={() => {
          setJiraModalOpen(false);
          setSelectedIds(new Set());
        }}
        findings={selectedFindings.length > 0 ? selectedFindings : filtered}
        pageUrl={pageUrl}
      />

      <BatchPRModal
        isOpen={batchPRModalOpen}
        onClose={() => {
          setBatchPRModalOpen(false);
        }}
        findings={selectedFindings.length > 0 ? selectedFindings : []}
        scanUrl={pageUrl}
        scanStandard={scanStandard}
        scanViewport={scanViewport}
      />

      {/* Fix Verification Modal */}
      <VerificationModal
        isOpen={verificationModalOpen}
        onClose={() => {
          setVerificationModalOpen(false);
          setVerificationResult(null);
          setVerificationError(null);
        }}
        result={verificationResult}
        isLoading={isVerifying}
        error={verificationError}
      />
    </>
  );
}

const thStyle: React.CSSProperties = {
  padding: "12px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 600,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};
