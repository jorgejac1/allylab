import { createContext, useContext, useMemo, useCallback, type ReactNode } from 'react';
import {
  useFindingsFilters,
  useFindingsSelection,
  useFindingsPagination,
  useFindingsJira,
  useFindingsVerification,
} from '../hooks';
import type { FindingsFiltersResult, FalsePositiveFilter } from '../hooks/useFindingsFilters';
import type { FindingsSelectionResult } from '../hooks/useFindingsSelection';
import type { FindingsPaginationResult } from '../hooks/useFindingsPagination';
import type { FindingsJiraResult } from '../hooks/useFindingsJira';
import type { FindingsVerificationResult } from '../hooks/useFindingsVerification';
import type { TrackedFinding, Severity, IssueStatus } from '../types';
import type { SourceFilterValue } from '../components/findings/SourceFilter';
import { markAsFalsePositive, unmarkFalsePositive } from '../utils/falsePositives';

interface FindingsContextValue {
  // Raw hook results
  filters: FindingsFiltersResult;
  selection: FindingsSelectionResult;
  pagination: FindingsPaginationResult;
  jira: FindingsJiraResult;
  verification: FindingsVerificationResult;

  // Scan context
  scanUrl: string;
  scanStandard?: string;
  scanViewport?: string;

  // Computed values
  linkedCount: number;

  // Actions
  toggleFalsePositive: (finding: TrackedFinding) => void;
  handleFpFilterChange: (filter: FalsePositiveFilter) => void;
  handleSeverityFilterChange: (severity: Severity | 'all') => void;
  handleStatusFilterChange: (status: IssueStatus | 'all') => void;
  handleSourceFilterChange: (source: SourceFilterValue) => void;
  handleSelectAllPage: () => void;
  selectAllFiltered: () => void;
}

const FindingsContext = createContext<FindingsContextValue | null>(null);

interface FindingsProviderProps {
  children: ReactNode;
  findings: TrackedFinding[];
  scanUrl: string;
  scanStandard?: string;
  scanViewport?: string;
  onFalsePositiveChange?: () => void;
}

export function FindingsProvider({
  children,
  findings,
  scanUrl,
  scanStandard,
  scanViewport,
  onFalsePositiveChange,
}: FindingsProviderProps) {
  // Initialize hooks
  const filters = useFindingsFilters(findings);
  const selection = useFindingsSelection(filters.filteredFindings);
  const pagination = useFindingsPagination(filters.filteredFindings);
  const jira = useFindingsJira();
  const verification = useFindingsVerification();

  // Computed values
  const linkedCount = useMemo(
    () => jira.getLinkedCount(filters.filteredFindings.map((f) => f.id)),
    [jira, filters.filteredFindings]
  );

  // Actions
  const toggleFalsePositive = useCallback((finding: TrackedFinding) => {
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

  const handleSeverityFilterChange = useCallback((severity: Severity | 'all') => {
    filters.setSeverityFilter(severity);
    pagination.setCurrentPage(1);
  }, [filters, pagination]);

  const handleStatusFilterChange = useCallback((status: IssueStatus | 'all') => {
    filters.setStatusFilter(status);
    pagination.setCurrentPage(1);
  }, [filters, pagination]);

  const handleSourceFilterChange = useCallback((source: SourceFilterValue) => {
    filters.setSourceFilter(source);
    pagination.setCurrentPage(1);
  }, [filters, pagination]);

  const handleSelectAllPage = useCallback(() => {
    selection.selectAllPage(pagination.paginatedFindings);
  }, [selection, pagination.paginatedFindings]);

  const selectAllFiltered = useCallback(() => {
    selection.selectAllFiltered(filters.filteredFindings);
  }, [selection, filters.filteredFindings]);

  const value = useMemo<FindingsContextValue>(() => ({
    filters,
    selection,
    pagination,
    jira,
    verification,
    scanUrl,
    scanStandard,
    scanViewport,
    linkedCount,
    toggleFalsePositive,
    handleFpFilterChange,
    handleSeverityFilterChange,
    handleStatusFilterChange,
    handleSourceFilterChange,
    handleSelectAllPage,
    selectAllFiltered,
  }), [
    filters,
    selection,
    pagination,
    jira,
    verification,
    scanUrl,
    scanStandard,
    scanViewport,
    linkedCount,
    toggleFalsePositive,
    handleFpFilterChange,
    handleSeverityFilterChange,
    handleStatusFilterChange,
    handleSourceFilterChange,
    handleSelectAllPage,
    selectAllFiltered,
  ]);

  return (
    <FindingsContext.Provider value={value}>
      {children}
    </FindingsContext.Provider>
  );
}

/**
 * Hook to access the findings context.
 * Must be used within a FindingsProvider.
 *
 * @example
 * ```tsx
 * function FindingItem({ findingId }: { findingId: string }) {
 *   const { selection, jira } = useFindings();
 *
 *   return (
 *     <div>
 *       <input
 *         type="checkbox"
 *         checked={selection.isSelected(findingId)}
 *         onChange={() => selection.toggleSelect(findingId)}
 *       />
 *       <span>{jira.getJiraLink(findingId)}</span>
 *     </div>
 *   );
 * }
 * ```
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useFindings(): FindingsContextValue {
  const context = useContext(FindingsContext);
  if (!context) {
    throw new Error('useFindings must be used within a FindingsProvider');
  }
  return context;
}

/**
 * Hook to access only the selection state from findings context.
 * Useful for components that only need selection functionality.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useFindingsSelectionContext() {
  const { selection } = useFindings();
  return selection;
}

/**
 * Hook to access only the filters state from findings context.
 * Useful for components that only need filter functionality.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useFindingsFiltersContext() {
  const { filters, handleFpFilterChange, handleSeverityFilterChange, handleStatusFilterChange, handleSourceFilterChange } = useFindings();
  return { ...filters, handleFpFilterChange, handleSeverityFilterChange, handleStatusFilterChange, handleSourceFilterChange };
}

/**
 * Hook to access only the pagination state from findings context.
 * Useful for components that only need pagination functionality.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useFindingsPaginationContext() {
  const { pagination } = useFindings();
  return pagination;
}

/**
 * Hook to access only the jira state from findings context.
 * Useful for components that only need jira functionality.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useFindingsJiraContext() {
  const { jira, linkedCount } = useFindings();
  return { ...jira, linkedCount };
}

/**
 * Hook to access only the verification state from findings context.
 * Useful for components that only need verification functionality.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useFindingsVerificationContext() {
  const { verification } = useFindings();
  return verification;
}
