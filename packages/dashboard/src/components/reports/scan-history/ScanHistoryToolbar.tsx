import { Button, Select } from '../../ui';
import { DateRangePicker } from './DateRangePicker';
import { FilterTag } from './FilterTag';
import { formatDateRangeLabel } from '../../../utils/dateRange';
import type { DateRange, DateRangeOption, SortOption } from '../../../types';
import { BarChart3 } from 'lucide-react';

interface ScanHistoryToolbarProps {
  // URL filter
  filterUrl: string;
  onFilterUrlChange: (url: string) => void;
  uniqueUrls: string[];

  // Sort
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;

  // Date range
  dateRangeOption: DateRangeOption;
  onDateRangeOptionChange: (option: DateRangeOption) => void;
  customDateRange: DateRange;
  onCustomDateChange: (field: 'start' | 'end', value: string) => void;
  showCustomPicker: boolean;

  // Compare mode
  compareMode: boolean;
  compareSelectionCount: number;
  onCompareModeToggle: () => void;
  onCompareSubmit: () => void;
  onCompareCancel: () => void;
  canCompare: boolean;

  // Clear all
  onClearAll: () => void;
}

export function ScanHistoryToolbar({
  filterUrl,
  onFilterUrlChange,
  uniqueUrls,
  sortBy,
  onSortChange,
  dateRangeOption,
  onDateRangeOptionChange,
  customDateRange,
  onCustomDateChange,
  showCustomPicker,
  compareMode,
  compareSelectionCount,
  onCompareModeToggle,
  onCompareSubmit,
  onCompareCancel,
  canCompare,
  onClearAll,
}: ScanHistoryToolbarProps) {
  const hasActiveFilters = filterUrl !== 'all' || dateRangeOption !== 'all';

  return (
    <div className="flex flex-col gap-3">
      {/* First Row: Filters */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex gap-3 items-center flex-wrap">
          {/* URL Filter */}
          <Select
            value={filterUrl}
            onChange={e => onFilterUrlChange(e.target.value)}
            options={[
              { value: 'all', label: 'All Sites' },
              ...uniqueUrls.map(url => ({ value: url, label: url })),
            ]}
            className="min-w-[180px]"
          />

          {/* Sort */}
          <Select
            value={sortBy}
            onChange={e => onSortChange(e.target.value as SortOption)}
            options={[
              { value: 'newest', label: 'Newest First' },
              { value: 'oldest', label: 'Oldest First' },
              { value: 'score-high', label: 'Highest Score' },
              { value: 'score-low', label: 'Lowest Score' },
              { value: 'issues-high', label: 'Most Issues' },
              { value: 'issues-low', label: 'Fewest Issues' },
            ]}
            className="min-w-[150px]"
          />

          {/* Date Range Filter */}
          <Select
            value={dateRangeOption}
            onChange={e => onDateRangeOptionChange(e.target.value as DateRangeOption)}
            options={[
              { value: 'all', label: 'All Time' },
              { value: '7days', label: 'Last 7 Days' },
              { value: '30days', label: 'Last 30 Days' },
              { value: '90days', label: 'Last 90 Days' },
              { value: 'custom', label: 'Custom Range' },
            ]}
            className="min-w-[160px]"
          />
        </div>

        {/* Compare Buttons */}
        <div className="flex gap-2">
          {canCompare && (
            <>
              {compareMode ? (
                <>
                  <Button variant="secondary" size="sm" onClick={onCompareCancel}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={onCompareSubmit}
                    disabled={compareSelectionCount !== 2}
                  >
                    Compare ({compareSelectionCount}/2)
                  </Button>
                </>
              ) : (
                <Button variant="secondary" size="sm" onClick={onCompareModeToggle} className="inline-flex items-center gap-1.5">
                  <BarChart3 size={14} /> Compare Scans
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {showCustomPicker && (
        <DateRangePicker
          dateRange={customDateRange}
          onDateChange={onCustomDateChange}
          onClear={onClearAll}
        />
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">Active filters:</span>
          {filterUrl !== 'all' && (
            <FilterTag
              label={`Site: ${filterUrl}`}
              onRemove={() => onFilterUrlChange('all')}
            />
          )}
          {dateRangeOption !== 'all' && (
            <FilterTag
              label={formatDateRangeLabel(dateRangeOption, customDateRange)}
              onRemove={() => onDateRangeOptionChange('all')}
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs text-slate-500"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
