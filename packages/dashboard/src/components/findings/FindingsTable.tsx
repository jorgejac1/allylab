import { useState, useCallback, useMemo } from "react";
import { Card, Pagination } from "../ui";
import { Check, Search } from 'lucide-react';
import { PRStatusBadge } from "./PRStatusBadge";
import { VerificationModal } from "./VerificationModal";
import { BatchPRModal } from "./BatchPRModal";
import { FindingsFilterBar, type FalsePositiveFilter } from "./FindingsFilterBar";
import { FindingsSelectionBar } from "./FindingsSelectionBar";
import { FindingsRow } from "./FindingsRow";
import { JiraExportModal } from "./JiraExportModal";
import {
  useFindingsFilters,
  useFindingsSelection,
  useFindingsPagination,
  useFindingsJira,
  useFindingsVerification,
} from "../../hooks";
import type { TrackedFinding, Severity, IssueStatus } from "../../types";
import type { SourceFilterValue } from "./SourceFilter";
import { markAsFalsePositive, unmarkFalsePositive } from "../../utils/falsePositives";

interface FindingsTableProps {
  findings: TrackedFinding[];
  pageUrl: string;
  scanStandard?: string;
  scanViewport?: string;
  onViewDetails: (finding: TrackedFinding) => void;
  onFalsePositiveChange?: () => void;
}

export function FindingsTable({
  findings,
  pageUrl,
  scanStandard,
  scanViewport,
  onViewDetails,
  onFalsePositiveChange,
}: FindingsTableProps) {
  // State management via custom hooks
  const filters = useFindingsFilters(findings);
  const selection = useFindingsSelection(filters.filteredFindings);
  const pagination = useFindingsPagination(filters.filteredFindings);
  const jira = useFindingsJira();
  const verification = useFindingsVerification();

  // Modal state
  const [jiraModalOpen, setJiraModalOpen] = useState(false);
  const [batchPRModalOpen, setBatchPRModalOpen] = useState(false);

  // Linked count for filtered findings - memoized to prevent recalculation
  const linkedCount = useMemo(
    () => jira.getLinkedCount(filters.filteredFindings.map((f) => f.id)),
    [jira, filters.filteredFindings]
  );

  // Handlers
  const handleToggleFalsePositive = useCallback((finding: TrackedFinding) => {
    if (finding.falsePositive) {
      unmarkFalsePositive(finding.fingerprint);
    } else {
      markAsFalsePositive(finding.fingerprint, finding.ruleId);
    }
    filters.triggerFpRefresh();
    onFalsePositiveChange?.();
  }, [filters, onFalsePositiveChange]);

  const handleFpFilterChange = useCallback((filter: FalsePositiveFilter) => {
    filters.setFpFilter(filter);
    pagination.setCurrentPage(1);
  }, [filters, pagination]);

  const handleSeverityFilterChange = useCallback((severity: Severity | "all") => {
    filters.setSeverityFilter(severity);
    pagination.setCurrentPage(1);
  }, [filters, pagination]);

  const handleStatusFilterChange = useCallback((status: IssueStatus | "all") => {
    filters.setStatusFilter(status);
    pagination.setCurrentPage(1);
  }, [filters, pagination]);

  const handleSourceFilterChange = useCallback((source: SourceFilterValue) => {
    filters.setSourceFilter(source);
    pagination.setCurrentPage(1);
  }, [filters, pagination]);

  const handleOpenJiraExport = useCallback(() => {
    if (selection.selectedIds.size === 0) {
      selection.selectAllFiltered(filters.filteredFindings);
    }
    setJiraModalOpen(true);
  }, [selection, filters.filteredFindings]);

  const handleOpenBatchPR = useCallback(() => {
    setBatchPRModalOpen(true);
  }, []);

  const handleSelectAllPage = useCallback(() => {
    selection.selectAllPage(pagination.paginatedFindings);
  }, [selection, pagination.paginatedFindings]);

  // Render PR Status cell for a finding
  const renderPRStatusCell = useCallback((findingId: string) => {
    const findingPRs = verification.getPRsForFinding(findingId);

    if (findingPRs.length === 0) {
      return <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>;
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {findingPRs.map((pr) => (
          <PRStatusBadge
            key={pr.id}
            pr={pr}
            onVerify={() => verification.verifyFix(pr.id)}
            isVerifying={verification.verifyingPRId === pr.id}
          />
        ))}
      </div>
    );
  }, [verification]);

  return (
    <>
      <Card padding="none">
        <FindingsFilterBar
          activeCount={filters.activeFindings.length}
          fpCount={filters.fpCount}
          totalCount={filters.findingsWithFpStatus.length}
          severityCounts={filters.severityCounts}
          statusCounts={filters.statusCounts}
          linkedCount={linkedCount}
          selectedCount={selection.selectedIds.size}
          fpFilter={filters.fpFilter}
          severityFilter={filters.severityFilter}
          statusFilter={filters.statusFilter}
          sourceFilter={filters.sourceFilter}
          sourceCounts={filters.sourceCounts}
          findings={filters.filteredFindings}
          scanUrl={pageUrl}
          scanDate={new Date().toISOString()}
          onFpFilterChange={handleFpFilterChange}
          onSeverityFilterChange={handleSeverityFilterChange}
          onStatusFilterChange={handleStatusFilterChange}
          onSourceFilterChange={handleSourceFilterChange}
          onExportToJira={handleOpenJiraExport}
        />

        <FindingsSelectionBar
          selectedCount={selection.selectedIds.size}
          totalFilteredCount={filters.filteredFindings.length}
          onSelectAll={() => selection.selectAllFiltered(filters.filteredFindings)}
          onClearSelection={selection.clearSelection}
          onCreatePR={handleOpenBatchPR}
          onExportJira={handleOpenJiraExport}
        />

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ ...thStyle, width: 40 }}>
                  <input
                    type="checkbox"
                    checked={
                      pagination.paginatedFindings.length > 0 &&
                      pagination.paginatedFindings.every((f) => selection.isSelected(f.id))
                    }
                    onChange={handleSelectAllPage}
                    style={{ cursor: "pointer", width: 16, height: 16 }}
                  />
                </th>
                <th style={{ ...thStyle, width: 100 }}>Severity</th>
                <th style={{ ...thStyle, width: 100 }}>Status</th>
                <th style={thStyle}>Issue</th>
                <th style={{ ...thStyle, width: 80 }}>Source</th>
                <th style={{ ...thStyle, width: 100 }}>WCAG</th>
                <th style={{ ...thStyle, width: 110 }}>JIRA</th>
                <th style={{ ...thStyle, width: 150 }}>PR Status</th>
                <th style={{ ...thStyle, width: 150 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedFindings.map((finding) => (
                <FindingsRow
                  key={finding.id}
                  finding={finding}
                  isSelected={selection.isSelected(finding.id)}
                  jiraIssueKey={jira.getJiraLink(finding.id)}
                  isLinkingJira={jira.linkingFindingId === finding.id}
                  jiraLinkInput={jira.linkInput}
                  onToggleSelect={selection.toggleSelect}
                  onToggleFalsePositive={handleToggleFalsePositive}
                  onViewDetails={onViewDetails}
                  onJiraLinkInputChange={jira.setLinkInput}
                  onStartJiraLink={jira.startLinking}
                  onSaveJiraLink={jira.saveLink}
                  onCancelJiraLink={jira.cancelLinking}
                  onRemoveJiraLink={jira.removeLink}
                  renderPRStatus={renderPRStatusCell}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {pagination.paginatedFindings.length === 0 && (
          <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
              {filters.fpFilter === "false-positive" ? <Check size={32} /> : <Search size={32} />}
            </div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {filters.fpFilter === "false-positive"
                ? "No false positives marked"
                : "No findings match the current filters"}
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.paginatedFindings.length > 0 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9" }}>
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setCurrentPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        )}
      </Card>

      <JiraExportModal
        isOpen={jiraModalOpen}
        onClose={() => {
          setJiraModalOpen(false);
          selection.clearSelection();
        }}
        findings={selection.selectedFindings.length > 0 ? selection.selectedFindings : filters.filteredFindings}
        pageUrl={pageUrl}
      />

      <BatchPRModal
        isOpen={batchPRModalOpen}
        onClose={() => setBatchPRModalOpen(false)}
        findings={selection.selectedFindings.length > 0 ? selection.selectedFindings : []}
        scanUrl={pageUrl}
        scanStandard={scanStandard}
        scanViewport={scanViewport}
      />

      {/* Fix Verification Modal */}
      <VerificationModal
        isOpen={verification.verificationModalOpen}
        onClose={verification.closeVerificationModal}
        result={verification.verificationResult}
        isLoading={verification.isVerifying}
        error={verification.verificationError}
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
