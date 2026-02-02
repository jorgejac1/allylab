import { Card } from '../ui';
import { ScoreCircle } from '../charts';
import type { SavedScan } from '../../types';
import { SEVERITY_COLORS } from '../../utils/constants';
import { CheckCircle } from 'lucide-react';

interface ScanResultsCompactProps {
  scan: SavedScan;
  onClick?: () => void;
  selected?: boolean;
}

export function ScanResultsCompact({ scan, onClick, selected = false }: ScanResultsCompactProps) {
  return (
    <Card
      style={{
        cursor: onClick ? 'pointer' : 'default',
        border: selected ? '2px solid #2563eb' : '1px solid #e2e8f0',
        transition: 'all 0.2s',
      }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {new Date(scan.timestamp).toLocaleString()}
          </div>
        </div>

        {/* Severity Counts */}
        <div style={{ display: 'flex', gap: 8 }}>
          {scan.critical > 0 && (
            <SeverityCount severity="critical" count={scan.critical} />
          )}
          {scan.serious > 0 && (
            <SeverityCount severity="serious" count={scan.serious} />
          )}
          {scan.moderate > 0 && (
            <SeverityCount severity="moderate" count={scan.moderate} />
          )}
          {scan.minor > 0 && (
            <SeverityCount severity="minor" count={scan.minor} />
          )}
          {scan.totalIssues === 0 && (
            <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={14} /> No issues
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function SeverityCount({ severity, count }: { severity: string; count: number }) {
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
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
        }}
      />
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{count}</span>
    </div>
  );
}