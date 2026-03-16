import { useState, useMemo, useCallback } from 'react';
import { Card, Button, EmptyState } from '../ui';
import { ScanCard, ScanHistoryToolbar } from './scan-history';
import { getDateRangeBounds, formatDateRangeLabel } from '../../utils/dateRange';
import type { SavedScan, DateRange, DateRangeOption, SortOption } from '../../types';
import type { RegressionInfo } from '../../hooks/useScans';
import { BarChart3, Search } from 'lucide-react';

interface ScanHistoryProps {
  scans: SavedScan[];
  onSelectScan: (scan: SavedScan) => void;
  onDeleteScan?: (scanId: string) => void;
  onCompare?: (scan1: SavedScan, scan2: SavedScan) => void;
  selectedScanId?: string;
  hasRegression?: (scanId: string) => RegressionInfo | undefined;
}

export function ScanHistory({
  scans,
  onSelectScan,
  onDeleteScan,
  onCompare,
  selectedScanId,
  hasRegression,
}: ScanHistoryProps) {
  // Filter state
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterUrl, setFilterUrl] = useState<string>('all');

  // Compare state
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<SavedScan[]>([]);

  // Date range state
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    start: null,
    end: null,
  });
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Get unique URLs for filter
  const uniqueUrls = useMemo(() => {
    const urls = [...new Set(scans.map(s => new URL(s.url).hostname))];
    return urls.sort();
  }, [scans]);

  // Filter and sort scans
  const filteredScans = useMemo(() => {
    let result = [...scans];

    // Filter by URL
    if (filterUrl !== 'all') {
      result = result.filter(s => new URL(s.url).hostname === filterUrl);
    }

    // Filter by date range
    const dateRange = getDateRangeBounds(dateRangeOption, customDateRange);
    if (dateRange.start || dateRange.end) {
      result = result.filter(scan => {
        const scanDate = new Date(scan.timestamp);
        if (dateRange.start && scanDate < dateRange.start) return false;
        if (dateRange.end && scanDate > dateRange.end) return false;
        return true;
      });
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        break;
      case 'score-high':
        result.sort((a, b) => b.score - a.score);
        break;
      case 'score-low':
        result.sort((a, b) => a.score - b.score);
        break;
      case 'issues-high':
        result.sort((a, b) => b.totalIssues - a.totalIssues);
        break;
      case 'issues-low':
        result.sort((a, b) => a.totalIssues - b.totalIssues);
        break;
    }

    return result;
  }, [scans, filterUrl, sortBy, dateRangeOption, customDateRange]);

  // Get score trend for sparkline
  const getScoreTrend = (url: string): number[] => {
    return scans
      .filter(s => new URL(s.url).hostname === new URL(url).hostname)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-10)
      .map(s => s.score);
  };

  // Compare handlers - memoized for stable references
  const handleCompareToggle = useCallback((scan: SavedScan) => {
    setCompareSelection(prev => {
      if (prev.find(s => s.id === scan.id)) {
        return prev.filter(s => s.id !== scan.id);
      } else if (prev.length < 2) {
        return [...prev, scan];
      }
      return prev;
    });
  }, []);

  const handleCompareSubmit = useCallback(() => {
    if (compareSelection.length === 2 && onCompare) {
      onCompare(compareSelection[0], compareSelection[1]);
      setCompareMode(false);
      setCompareSelection([]);
    }
  }, [compareSelection, onCompare]);

  const handleCompareCancel = useCallback(() => {
    setCompareMode(false);
    setCompareSelection([]);
  }, []);

  // Date range handlers - memoized for stable references
  const handleDateRangeOptionChange = useCallback((option: DateRangeOption) => {
    setDateRangeOption(option);
    setShowCustomPicker(option === 'custom');
  }, []);

  const handleCustomDateChange = useCallback((field: 'start' | 'end', value: string) => {
    const date = value ? new Date(value) : null;
    if (field === 'start' && date) {
      date.setHours(0, 0, 0, 0);
    }
    if (field === 'end' && date) {
      date.setHours(23, 59, 59, 999);
    }
    setCustomDateRange(prev => ({
      ...prev,
      [field]: date,
    }));
  }, []);

  const handleClearAll = useCallback(() => {
    setFilterUrl('all');
    setDateRangeOption('all');
    setShowCustomPicker(false);
    setCustomDateRange({ start: null, end: null });
  }, []);

  // Empty state
  if (scans.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 size={32} />}
        title="No Scan History"
        description="Run your first accessibility scan to start tracking your progress."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <ScanHistoryToolbar
        filterUrl={filterUrl}
        onFilterUrlChange={setFilterUrl}
        uniqueUrls={uniqueUrls}
        sortBy={sortBy}
        onSortChange={setSortBy}
        dateRangeOption={dateRangeOption}
        onDateRangeOptionChange={handleDateRangeOptionChange}
        customDateRange={customDateRange}
        onCustomDateChange={handleCustomDateChange}
        showCustomPicker={showCustomPicker}
        compareMode={compareMode}
        compareSelectionCount={compareSelection.length}
        onCompareModeToggle={() => setCompareMode(true)}
        onCompareSubmit={handleCompareSubmit}
        onCompareCancel={handleCompareCancel}
        canCompare={!!onCompare}
        onClearAll={handleClearAll}
      />

      {/* Scan List */}
      <div className="flex flex-col gap-3">
        {filteredScans.length === 0 ? (
          <Card>
            <div className="text-center py-10 px-10 text-slate-500">
              <div className="mb-2 flex justify-center"><Search size={32} /></div>
              <p className="m-0">No scans match your filters</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearAll}
                className="mt-3"
              >
                Clear Filters
              </Button>
            </div>
          </Card>
        ) : (
          filteredScans.map(scan => (
            <ScanCard
              key={scan.id}
              scan={scan}
              isSelected={selectedScanId === scan.id}
              isCompareSelected={!!compareSelection.find(s => s.id === scan.id)}
              compareMode={compareMode}
              scoreTrend={getScoreTrend(scan.url)}
              regression={hasRegression?.(scan.id)}
              onSelect={onSelectScan}
              onCompareToggle={handleCompareToggle}
              onDelete={onDeleteScan}
            />
          ))
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-slate-500 text-center">
        Showing {filteredScans.length} of {scans.length} scans
        {dateRangeOption !== 'all' && (
          <span className="ml-2">
            &bull; {formatDateRangeLabel(dateRangeOption, customDateRange)}
          </span>
        )}
      </div>
    </div>
  );
}
