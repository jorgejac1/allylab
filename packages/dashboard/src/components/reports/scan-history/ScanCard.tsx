import { memo } from 'react';
import { Card, Button } from '../../ui';
import { ScoreCircle, Sparkline } from '../../charts';
import { SeverityPill } from './SeverityPill';
import type { SavedScan } from '../../../types';
import type { RegressionInfo } from '../../../hooks/useScans';
import { TrendingDown, Trash2 } from 'lucide-react';

interface ScanCardProps {
  scan: SavedScan;
  isSelected?: boolean;
  isCompareSelected?: boolean;
  compareMode?: boolean;
  scoreTrend: number[];
  regression?: RegressionInfo;
  onSelect: (scan: SavedScan) => void;
  onCompareToggle?: (scan: SavedScan) => void;
  onDelete?: (scanId: string) => void;
}

export const ScanCard = memo(function ScanCard({
  scan,
  isSelected,
  isCompareSelected,
  compareMode,
  scoreTrend,
  regression,
  onSelect,
  onCompareToggle,
  onDelete,
}: ScanCardProps) {
  const handleClick = () => {
    if (compareMode && onCompareToggle) {
      onCompareToggle(scan);
    } else {
      onSelect(scan);
    }
  };

  return (
    <Card
      padding="none"
      style={{
        cursor: 'pointer',
        border: isSelected
          ? '2px solid #2563eb'
          : isCompareSelected
          ? '2px solid #10b981'
          : regression
          ? '2px solid #f59e0b'
          : '1px solid #e2e8f0',
        transition: 'all 0.2s',
      }}
      onClick={handleClick}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Compare Checkbox */}
        {compareMode && (
          <input
            type="checkbox"
            checked={!!isCompareSelected}
            onChange={() => onCompareToggle?.(scan)}
            onClick={e => e.stopPropagation()}
            className="w-[18px] h-[18px]"
          />
        )}

        {/* Score */}
        <ScoreCircle score={scan.score} size={56} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
              {new URL(scan.url).hostname}
            </span>
            <span className="font-normal text-slate-500">
              {new URL(scan.url).pathname}
            </span>
            {/* Regression Badge */}
            {regression && (
              <span
                title={`Score dropped ${regression.scoreDrop} points from ${regression.previousScore} to ${regression.currentScore}`}
                className="inline-flex items-center gap-1 py-0.5 px-2 rounded bg-amber-100 text-amber-800 text-xs font-semibold"
              >
                <TrendingDown size={12} />-{regression.scoreDrop}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500">
            {new Date(scan.timestamp).toLocaleString()}
          </div>
        </div>

        {/* Trend Sparkline */}
        {scoreTrend.length > 1 && (
          <div className="w-20">
            <Sparkline data={scoreTrend} color="auto" height={30} />
          </div>
        )}

        {/* Severity Counts */}
        <div className="flex gap-2">
          <SeverityPill severity="critical" count={scan.critical} />
          <SeverityPill severity="serious" count={scan.serious} />
          <SeverityPill severity="moderate" count={scan.moderate} />
          <SeverityPill severity="minor" count={scan.minor} />
        </div>

        {/* Delete */}
        {onDelete && !compareMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={e => {
              e.stopPropagation();
              onDelete(scan.id);
            }}
            className="text-red-500"
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>
    </Card>
  );
});
