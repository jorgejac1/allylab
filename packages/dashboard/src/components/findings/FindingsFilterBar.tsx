import { Button } from '../ui';
import { FilterButton, PillButton, Divider } from './FilterButton';
import { ExportDropdown } from './ExportDropdown';
import { SourceFilter, SourceFilterValue } from './SourceFilter';
import type { Severity, IssueStatus, TrackedFinding } from '../../types';
import type { ReactNode } from 'react';
import { BadgePlus, RefreshCw, CheckCircle, Link, Upload } from 'lucide-react';

export type FalsePositiveFilter = 'all' | 'active' | 'false-positive';

interface FindingsFilterBarProps {
  // Counts
  activeCount: number;
  fpCount: number;
  totalCount: number;
  severityCounts: Record<Severity, number>;
  statusCounts: Record<IssueStatus, number>;
  linkedCount: number;
  selectedCount: number;

  // Filter state
  fpFilter: FalsePositiveFilter;
  severityFilter: Severity | 'all';
  statusFilter: IssueStatus | 'all';
  sourceFilter?: SourceFilterValue;

  // Source counts
  sourceCounts?: {
    axeCore: number;
    customRule: number;
    tvRule: number;
    total: number;
  };

  // Export data
  findings: TrackedFinding[];
  scanUrl: string;
  scanDate: string;

  // Handlers
  onFpFilterChange: (filter: FalsePositiveFilter) => void;
  onSeverityFilterChange: (severity: Severity | 'all') => void;
  onStatusFilterChange: (status: IssueStatus | 'all') => void;
  onSourceFilterChange?: (source: SourceFilterValue) => void;
  onExportToJira: () => void;
}

const STATUS_CONFIG: { status: IssueStatus; icon: ReactNode; color: string }[] = [
  { status: 'new', icon: <BadgePlus size={12} />, color: '#1d4ed8' },
  { status: 'recurring', icon: <RefreshCw size={12} />, color: '#b45309' },
  { status: 'fixed', icon: <CheckCircle size={12} />, color: '#15803d' },
];

export function FindingsFilterBar({
  activeCount,
  fpCount,
  totalCount,
  severityCounts,
  statusCounts,
  linkedCount,
  selectedCount,
  fpFilter,
  severityFilter,
  statusFilter,
  sourceFilter = 'all',
  sourceCounts,
  findings,
  scanUrl,
  scanDate,
  onFpFilterChange,
  onSeverityFilterChange,
  onStatusFilterChange,
  onSourceFilterChange,
  onExportToJira,
}: FindingsFilterBarProps) {
  return (
    <div className="p-4 border-b border-slate-200 flex gap-2 flex-wrap items-center">
      <span className="text-sm font-semibold mr-2">FINDINGS</span>

      {/* False Positive Filter */}
      <div className="flex gap-1 bg-slate-100 rounded-md p-0.5">
        <FilterButton
          active={fpFilter === 'active'}
          onClick={() => onFpFilterChange('active')}
          label={`Active (${activeCount})`}
        />
        <FilterButton
          active={fpFilter === 'false-positive'}
          onClick={() => onFpFilterChange('false-positive')}
          label={`False Positives (${fpCount})`}
        />
        <FilterButton
          active={fpFilter === 'all'}
          onClick={() => onFpFilterChange('all')}
          label={`All (${totalCount})`}
        />
      </div>

      {/* Source Filter - Only show if custom rules exist */}
      {sourceCounts && onSourceFilterChange && (
        <>
          <Divider />
          <SourceFilter
            value={sourceFilter}
            onChange={onSourceFilterChange}
            counts={sourceCounts}
          />
        </>
      )}

      <Divider />

      {/* Severity Filters */}
      {(['critical', 'serious', 'moderate', 'minor'] as Severity[]).map(sev => (
        <PillButton
          key={sev}
          active={severityFilter === sev}
          onClick={() => onSeverityFilterChange(severityFilter === sev ? 'all' : sev)}
          label={`${severityCounts[sev]} ${sev.charAt(0).toUpperCase() + sev.slice(1)}`}
        />
      ))}

      <Divider />

      {/* Status Filters */}
      {STATUS_CONFIG.map(({ status, icon, color }) => (
        <PillButton
          key={status}
          active={statusFilter === status}
          activeColor={color}
          onClick={() => onStatusFilterChange(statusFilter === status ? 'all' : status)}
          label={<span className="inline-flex items-center gap-1">{icon} {statusCounts[status]} {status.charAt(0).toUpperCase() + status.slice(1)}</span>}
        />
      ))}

      <div className="flex-1" />

      {/* JIRA Linked Count */}
      {linkedCount > 0 && (
        <span className="text-xs text-slate-500 mr-2 inline-flex items-center gap-1">
          <Link size={12} /> {linkedCount} linked to JIRA
        </span>
      )}

      {/* Export Dropdown */}
      <ExportDropdown
        findings={findings}
        scanUrl={scanUrl}
        scanDate={scanDate}
      />

      {/* Export to JIRA Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={onExportToJira}
        className="inline-flex items-center gap-1.5"
      >
        <Upload size={12} /> Export to JIRA {selectedCount > 0 && `(${selectedCount})`}
      </Button>
    </div>
  );
}
