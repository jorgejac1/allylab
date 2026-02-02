import { useState, useMemo, useCallback } from 'react';
import type { TrackedFinding, Severity, IssueStatus, FindingSource } from '../types';
import type { SourceFilterValue } from '../components/findings/SourceFilter';
import { applyFalsePositiveStatus } from '../utils/falsePositives';

export type FalsePositiveFilter = 'all' | 'active' | 'false-positive';

export interface FindingsFiltersState {
  severityFilter: Severity | 'all';
  statusFilter: IssueStatus | 'all';
  sourceFilter: SourceFilterValue;
  fpFilter: FalsePositiveFilter;
}

export interface FindingsFiltersActions {
  setSeverityFilter: (filter: Severity | 'all') => void;
  setStatusFilter: (filter: IssueStatus | 'all') => void;
  setSourceFilter: (filter: SourceFilterValue) => void;
  setFpFilter: (filter: FalsePositiveFilter) => void;
  resetFilters: () => void;
}

export interface FindingsFiltersResult extends FindingsFiltersState, FindingsFiltersActions {
  findingsWithFpStatus: TrackedFinding[];
  filteredFindings: TrackedFinding[];
  activeFindings: TrackedFinding[];
  fpCount: number;
  severityCounts: Record<Severity, number>;
  statusCounts: Record<IssueStatus, number>;
  sourceCounts: { axeCore: number; customRule: number; total: number };
  triggerFpRefresh: () => void;
}

export function useFindingsFilters(findings: TrackedFinding[]): FindingsFiltersResult {
  // Filter state
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilterValue>('all');
  const [fpFilter, setFpFilter] = useState<FalsePositiveFilter>('active');
  const [fpVersion, setFpVersion] = useState(0);

  // Apply false positive status
  const findingsWithFpStatus = useMemo(() => {
    void fpVersion; // Dependency to trigger refresh
    return applyFalsePositiveStatus(findings);
  }, [findings, fpVersion]);

  // Calculate source counts
  const sourceCounts = useMemo(() => {
    const axeCore = findingsWithFpStatus.filter(f => !f.source || f.source === 'axe-core').length;
    const customRule = findingsWithFpStatus.filter(f => f.source === 'custom-rule').length;
    return { axeCore, customRule, total: findingsWithFpStatus.length };
  }, [findingsWithFpStatus]);

  // Filter findings
  const filteredFindings = useMemo(() => {
    return findingsWithFpStatus.filter((f) => {
      // False positive filter
      if (fpFilter === 'active' && f.falsePositive) return false;
      if (fpFilter === 'false-positive' && !f.falsePositive) return false;

      // Source filter
      if (sourceFilter !== 'all') {
        const findingSource: FindingSource = f.source || 'axe-core';
        if (findingSource !== sourceFilter) return false;
      }

      // Severity filter
      if (severityFilter !== 'all' && f.impact !== severityFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && f.status !== statusFilter) return false;

      return true;
    });
  }, [findingsWithFpStatus, severityFilter, statusFilter, sourceFilter, fpFilter]);

  // Derived counts
  const activeFindings = useMemo(
    () => findingsWithFpStatus.filter((f) => !f.falsePositive),
    [findingsWithFpStatus]
  );

  const fpCount = useMemo(
    () => findingsWithFpStatus.filter((f) => f.falsePositive).length,
    [findingsWithFpStatus]
  );

  const severityCounts = useMemo<Record<Severity, number>>(() => ({
    critical: activeFindings.filter((f) => f.impact === 'critical').length,
    serious: activeFindings.filter((f) => f.impact === 'serious').length,
    moderate: activeFindings.filter((f) => f.impact === 'moderate').length,
    minor: activeFindings.filter((f) => f.impact === 'minor').length,
  }), [activeFindings]);

  const statusCounts = useMemo<Record<IssueStatus, number>>(() => ({
    new: activeFindings.filter((f) => f.status === 'new').length,
    recurring: activeFindings.filter((f) => f.status === 'recurring').length,
    fixed: activeFindings.filter((f) => f.status === 'fixed').length,
  }), [activeFindings]);

  // Actions
  const triggerFpRefresh = useCallback(() => {
    setFpVersion((v) => v + 1);
  }, []);

  const resetFilters = useCallback(() => {
    setSeverityFilter('all');
    setStatusFilter('all');
    setSourceFilter('all');
    setFpFilter('active');
  }, []);

  return {
    // State
    severityFilter,
    statusFilter,
    sourceFilter,
    fpFilter,
    // Actions
    setSeverityFilter,
    setStatusFilter,
    setSourceFilter,
    setFpFilter,
    resetFilters,
    triggerFpRefresh,
    // Derived data
    findingsWithFpStatus,
    filteredFindings,
    activeFindings,
    fpCount,
    severityCounts,
    statusCounts,
    sourceCounts,
  };
}
