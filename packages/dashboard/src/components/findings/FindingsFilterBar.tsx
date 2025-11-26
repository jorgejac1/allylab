import { Button } from '../ui';
import { FilterButton, PillButton, Divider } from './FilterButton';
import { ExportDropdown } from './ExportDropdown';
import type { Severity, IssueStatus, TrackedFinding } from '../../types';

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
  
  // Export data
  findings: TrackedFinding[];
  scanUrl: string;
  scanDate: string;
  
  // Handlers
  onFpFilterChange: (filter: FalsePositiveFilter) => void;
  onSeverityFilterChange: (severity: Severity | 'all') => void;
  onStatusFilterChange: (status: IssueStatus | 'all') => void;
  onExportToJira: () => void;
}

const STATUS_CONFIG: { status: IssueStatus; icon: string; color: string }[] = [
  { status: 'new', icon: '🆕', color: '#1d4ed8' },
  { status: 'recurring', icon: '🔄', color: '#b45309' },
  { status: 'fixed', icon: '✅', color: '#15803d' },
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
  findings,
  scanUrl,
  scanDate,
  onFpFilterChange,
  onSeverityFilterChange,
  onStatusFilterChange,
  onExportToJira,
}: FindingsFilterBarProps) {
  return (
    <div style={{ 
      padding: 16, 
      borderBottom: '1px solid #e2e8f0', 
      display: 'flex', 
      gap: 8, 
      flexWrap: 'wrap', 
      alignItems: 'center' 
    }}>
      <span style={{ fontSize: 14, fontWeight: 600, marginRight: 8 }}>FINDINGS</span>
      
      {/* False Positive Filter */}
      <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 6, padding: 2 }}>
        <FilterButton
          active={fpFilter === 'active'}
          onClick={() => onFpFilterChange('active')}
          label={`Active (${activeCount})`}
        />
        <FilterButton
          active={fpFilter === 'false-positive'}
          onClick={() => onFpFilterChange('false-positive')}
          label={`🚫 False Positives (${fpCount})`}
        />
        <FilterButton
          active={fpFilter === 'all'}
          onClick={() => onFpFilterChange('all')}
          label={`All (${totalCount})`}
        />
      </div>

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
          label={`${icon} ${statusCounts[status]} ${status.charAt(0).toUpperCase() + status.slice(1)}`}
        />
      ))}

      <div style={{ flex: 1 }} />

      {/* JIRA Linked Count */}
      {linkedCount > 0 && (
        <span style={{ fontSize: 12, color: '#64748b', marginRight: 8 }}>
          🔗 {linkedCount} linked to JIRA
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
      >
        📤 Export to JIRA {selectedCount > 0 && `(${selectedCount})`}
      </Button>
    </div>
  );
}