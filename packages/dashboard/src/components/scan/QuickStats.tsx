import { Card, SeverityBadge } from '../ui';
import { ScoreCircle } from '../charts';
import type { ScanResult } from '../../types';

interface QuickStatsProps {
  result: ScanResult;
}

export function QuickStats({ result }: QuickStatsProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {/* Score */}
      <Card className="flex items-center gap-4" style={{ flex: '1 1 200px' }}>
        <ScoreCircle score={result.score} size={80} />
        <div>
          <div className="text-xs text-slate-500 mb-1">Accessibility Score</div>
          <div className="font-bold" style={{ fontSize: 28 }}>{result.score}/100</div>
        </div>
      </Card>

      {/* Total Issues */}
      <Card style={{ flex: '1 1 150px' }}>
        <div className="text-xs text-slate-500 mb-1">Total Issues</div>
        <div className="font-bold" style={{ fontSize: 36 }}>{result.totalIssues}</div>
      </Card>

      {/* Severity Breakdown */}
      <Card style={{ flex: '2 1 300px' }}>
        <div className="text-xs text-slate-500 mb-3">By Severity</div>
        <div className="flex gap-3 flex-wrap">
          <SeverityBadge severity="critical" count={result.critical} />
          <SeverityBadge severity="serious" count={result.serious} />
          <SeverityBadge severity="moderate" count={result.moderate} />
          <SeverityBadge severity="minor" count={result.minor} />
        </div>
      </Card>

      {/* Scan Duration */}
      <Card style={{ flex: '1 1 120px' }}>
        <div className="text-xs text-slate-500 mb-1">Scan Time</div>
        <div className="font-bold" style={{ fontSize: 28 }}>
          {(result.scanDuration / 1000).toFixed(1)}s
        </div>
      </Card>
    </div>
  );
}