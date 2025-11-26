import { useState, useMemo } from 'react';
import { Card, Button, EmptyState, Select } from '../ui';
import { ScoreCircle, Sparkline } from '../charts';
import type { SavedScan } from '../../types';
import { SEVERITY_COLORS } from '../../utils/constants';

interface ScanHistoryProps {
  scans: SavedScan[];
  onSelectScan: (scan: SavedScan) => void;
  onDeleteScan?: (scanId: string) => void;
  onCompare?: (scan1: SavedScan, scan2: SavedScan) => void;
  selectedScanId?: string;
}

type SortOption = 'newest' | 'oldest' | 'score-high' | 'score-low' | 'issues-high' | 'issues-low';

export function ScanHistory({
  scans,
  onSelectScan,
  onDeleteScan,
  onCompare,
  selectedScanId,
}: ScanHistoryProps) {
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterUrl, setFilterUrl] = useState<string>('all');
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<SavedScan[]>([]);

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
  }, [scans, filterUrl, sortBy]);

  // Get score trend for sparkline
  const getScoreTrend = (url: string): number[] => {
    return scans
      .filter(s => new URL(s.url).hostname === new URL(url).hostname)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-10)
      .map(s => s.score);
  };

  const handleCompareToggle = (scan: SavedScan) => {
    if (compareSelection.find(s => s.id === scan.id)) {
      setCompareSelection(compareSelection.filter(s => s.id !== scan.id));
    } else if (compareSelection.length < 2) {
      setCompareSelection([...compareSelection, scan]);
    }
  };

  const handleCompareSubmit = () => {
    if (compareSelection.length === 2 && onCompare) {
      onCompare(compareSelection[0], compareSelection[1]);
      setCompareMode(false);
      setCompareSelection([]);
    }
  };

  if (scans.length === 0) {
    return (
      <EmptyState
        icon="📊"
        title="No Scan History"
        description="Run your first accessibility scan to start tracking your progress."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* URL Filter */}
          <Select
            value={filterUrl}
            onChange={e => setFilterUrl(e.target.value)}
            options={[
              { value: 'all', label: 'All Sites' },
              ...uniqueUrls.map(url => ({ value: url, label: url })),
            ]}
            style={{ minWidth: 180 }}
          />

          {/* Sort */}
          <Select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            options={[
              { value: 'newest', label: 'Newest First' },
              { value: 'oldest', label: 'Oldest First' },
              { value: 'score-high', label: 'Highest Score' },
              { value: 'score-low', label: 'Lowest Score' },
              { value: 'issues-high', label: 'Most Issues' },
              { value: 'issues-low', label: 'Fewest Issues' },
            ]}
            style={{ minWidth: 150 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {onCompare && (
            <>
              {compareMode ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setCompareMode(false);
                      setCompareSelection([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCompareSubmit}
                    disabled={compareSelection.length !== 2}
                  >
                    Compare ({compareSelection.length}/2)
                  </Button>
                </>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setCompareMode(true)}>
                  📊 Compare Scans
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Scan List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredScans.map(scan => {
          const isSelected = selectedScanId === scan.id;
          const isCompareSelected = compareSelection.find(s => s.id === scan.id);
          const scoreTrend = getScoreTrend(scan.url);

          return (
            <Card
              key={scan.id}
              padding="none"
              style={{
                cursor: 'pointer',
                border: isSelected
                  ? '2px solid #2563eb'
                  : isCompareSelected
                  ? '2px solid #10b981'
                  : '1px solid #e2e8f0',
                transition: 'all 0.2s',
              }}
              onClick={() => (compareMode ? handleCompareToggle(scan) : onSelectScan(scan))}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 16,
                }}
              >
                {/* Compare Checkbox */}
                {compareMode && (
                  <input
                    type="checkbox"
                    checked={!!isCompareSelected}
                    onChange={() => handleCompareToggle(scan)}
                    onClick={e => e.stopPropagation()}
                    style={{ width: 18, height: 18 }}
                  />
                )}

                {/* Score */}
                <ScoreCircle score={scan.score} size={56} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {new URL(scan.url).hostname}
                    <span style={{ fontWeight: 400, color: '#64748b', marginLeft: 8 }}>
                      {new URL(scan.url).pathname}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {new Date(scan.timestamp).toLocaleString()}
                  </div>
                </div>

                {/* Trend Sparkline */}
                {scoreTrend.length > 1 && (
                  <div style={{ width: 80 }}>
                    <Sparkline data={scoreTrend} color="auto" height={30} />
                  </div>
                )}

                {/* Severity Counts */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <SeverityPill severity="critical" count={scan.critical} />
                  <SeverityPill severity="serious" count={scan.serious} />
                  <SeverityPill severity="moderate" count={scan.moderate} />
                  <SeverityPill severity="minor" count={scan.minor} />
                </div>

                {/* Delete */}
                {onDeleteScan && !compareMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      onDeleteScan(scan.id);
                    }}
                    style={{ color: '#ef4444' }}
                  >
                    🗑️
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Results Count */}
      <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>
        Showing {filteredScans.length} of {scans.length} scans
      </div>
    </div>
  );
}

function SeverityPill({ severity, count }: { severity: string; count: number }) {
  if (count === 0) return null;

  const color = SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderRadius: 6,
        background: `${color}15`,
        minWidth: 40,
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
        }}
      />
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{count}</span>
    </div>
  );
}