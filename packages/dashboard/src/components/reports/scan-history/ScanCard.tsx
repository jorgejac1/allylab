import { Card, Button } from '../../ui';
import { ScoreCircle, Sparkline } from '../../charts';
import { SeverityPill } from './SeverityPill';
import type { SavedScan } from '../../../types';
import type { RegressionInfo } from '../../../hooks/useScans';

interface ScanCardProps {
  scan: SavedScan;
  isSelected?: boolean;
  isCompareSelected?: boolean;
  compareMode?: boolean;
  scoreTrend: number[];
  regression?: RegressionInfo;
  onSelect: () => void;
  onCompareToggle?: () => void;
  onDelete?: () => void;
}

export function ScanCard({
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
      onCompareToggle();
    } else {
      onSelect();
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
            onChange={() => onCompareToggle?.()}
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
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {new URL(scan.url).hostname}
            </span>
            <span style={{ fontWeight: 400, color: '#64748b' }}>
              {new URL(scan.url).pathname}
            </span>
            {/* Regression Badge */}
            {regression && (
              <span
                title={`Score dropped ${regression.scoreDrop} points from ${regression.previousScore} to ${regression.currentScore}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: '#fef3c7',
                  color: '#92400e',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                🔻 -{regression.scoreDrop}
              </span>
            )}
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
        {onDelete && !compareMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={e => {
              e.stopPropagation();
              onDelete();
            }}
            style={{ color: '#ef4444' }}
          >
            🗑️
          </Button>
        )}
      </div>
    </Card>
  );
}