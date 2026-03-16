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
      className={`transition-all duration-200 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      style={{
        border: selected ? '2px solid #2563eb' : '1px solid #e2e8f0',
      }}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* Score */}
        <ScoreCircle score={scan.score} size={56} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
            {new URL(scan.url).hostname}
          </div>
          <div className="text-xs text-slate-500">
            {new Date(scan.timestamp).toLocaleString()}
          </div>
        </div>

        {/* Severity Counts */}
        <div className="flex gap-2">
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
            <span className="text-xs text-emerald-500 font-semibold inline-flex items-center gap-1">
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
      className="flex items-center gap-1 py-1 px-2 rounded-md"
      style={{ background: `${color}15` }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: color }}
      />
      <span className="text-xs font-semibold" style={{ color }}>{count}</span>
    </div>
  );
}