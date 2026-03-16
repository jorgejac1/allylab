import type { Severity, IssueStatus } from './index';

export type FalsePositiveFilter = 'all' | 'active' | 'false-positive';
export type SourceFilterValue = 'all' | 'axe-core' | 'custom-rule';

export interface FilterPreset {
  id: string;
  name: string;
  color?: string;
  filters: {
    severityFilter: Severity | 'all';
    statusFilter: IssueStatus | 'all';
    sourceFilter: SourceFilterValue;
    fpFilter: FalsePositiveFilter;
  };
  isDefault?: boolean;
  createdAt: string;
  lastUsedAt?: string;
}
