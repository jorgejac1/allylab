import { useState, useCallback, useMemo, lazy, Suspense } from "react";
import { Card, Pagination } from "../ui";
import { Check, Search } from 'lucide-react';
import { PRStatusBadge } from "./PRStatusBadge";
import { MRStatusBadge } from "./MRStatusBadge";
import { VerificationModal } from "./VerificationModal";

const BatchPRModal = lazy(() => import("./BatchPRModal").then(m => ({ default: m.BatchPRModal })));
import { FindingsFilterBar, type FalsePositiveFilter } from "./FindingsFilterBar";
import { FindingsSelectionBar } from "./FindingsSelectionBar";
import { FindingsRow } from "./FindingsRow";
import { JiraExportModal } from "./JiraExportModal";
import { PresetBar } from "./filter-presets/PresetBar";
import {
  useFindingsFilters,
  useFindingsSelection,
  useFindingsPagination,
  useFindingsJira,
  useFindingsVerification,
  useFilterPresets,
  useGitLabMR,
} from "../../hooks";
import type { TrackedFinding, Severity, IssueStatus } from "../../types";
import type { SourceFilterValue } from "./SourceFilter";
import { markAsFalsePositive, unmarkFalsePositive } from "../../utils/falsePositives";
import { getMRForFinding } from "../../utils/gitlabTracking";

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
  const presets = useFilterPresets();
  const gitlabMR = useGitLabMR();

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

  const handleApplyPreset = useCallback((id: string) => {
    const preset = presets.applyPreset(id);
    if (preset) {
      filters.setSeverityFilter(preset.filters.severityFilter);
      filters.setStatusFilter(preset.filters.statusFilter);
      filters.setSourceFilter(preset.filters.sourceFilter);
      filters.setFpFilter(preset.filters.fpFilter);
      pagination.setCurrentPage(1);
    }
  }, [presets, filters, pagination]);

  const handleSavePreset = useCallback((name: string, color?: string) => {
    presets.saveCurrentAsPreset(name, color);
  }, [presets]);

  // Render PR/MR Status cell for a finding
  const renderPRStatusCell = useCallback((findingId: string) => {
    const findingPRs = verification.getPRsForFinding(findingId);
    const mrTracking = getMRForFinding(findingId);

    if (findingPRs.length === 0 && !mrTracking) {
      return <span className="text-slate-400 text-xs">—</span>;
    }

    return (
      <div className="flex flex-col gap-1">
        {findingPRs.map((pr) => (
          <PRStatusBadge
            key={pr.id}
            pr={pr}
            onVerify={() => verification.verifyFix(pr.id)}
            isVerifying={verification.verifyingPRId === pr.id}
          />
        ))}
        {mrTracking && (
          <MRStatusBadge
            mrUrl={mrTracking.mrUrl}
            status={mrTracking.status}
            verificationStatus={mrTracking.verificationStatus}
            onVerify={() => gitlabMR.verifyFixes(mrTracking.id)}
            isVerifying={gitlabMR.verifyingMRId === mrTracking.id}
          />
        )}
      </div>
    );
  }, [verification, gitlabMR]);

  return (
    <>
      <Card padding="none">
        <PresetBar
          presets={presets.presets}
          activePresetId={presets.activePreset?.id ?? null}
          onApply={handleApplyPreset}
          onDelete={presets.deletePreset}
          onSave={handleSavePreset}
        />

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
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200">
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-10">
                  <input
                    type="checkbox"
                    checked={
                      pagination.paginatedFindings.length > 0 &&
                      pagination.paginatedFindings.every((f) => selection.isSelected(f.id))
                    }
                    onChange={handleSelectAllPage}
                    className="cursor-pointer w-4 h-4"
                  />
                </th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-[100px]">Severity</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-[100px]">Status</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Issue</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-20">Source</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-[100px]">WCAG</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-[110px]">JIRA</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-[150px]">PR Status</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-[150px]">Actions</th>
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
          <div className="p-12 text-center text-slate-500">
            <div className="mb-2 flex justify-center">
              {filters.fpFilter === "false-positive" ? <Check size={32} /> : <Search size={32} />}
            </div>
            <div className="text-sm font-medium">
              {filters.fpFilter === "false-positive"
                ? "No false positives marked"
                : "No findings match the current filters"}
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.paginatedFindings.length > 0 && (
          <div className="py-3 px-4 border-t border-slate-100">
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

      {batchPRModalOpen && (
        <Suspense fallback={null}>
          <BatchPRModal
            isOpen={batchPRModalOpen}
            onClose={() => setBatchPRModalOpen(false)}
            findings={selection.selectedFindings.length > 0 ? selection.selectedFindings : []}
            scanUrl={pageUrl}
            scanStandard={scanStandard}
            scanViewport={scanViewport}
          />
        </Suspense>
      )}

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
