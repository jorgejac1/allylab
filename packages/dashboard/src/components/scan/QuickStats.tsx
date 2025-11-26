import { Card, SeverityBadge } from '../ui';
import { ScoreCircle } from '../charts';
import type { ScanResult } from '../../types';

interface QuickStatsProps {
  result: ScanResult;
}

export function QuickStats({ result }: QuickStatsProps) {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {/* Score */}
      <Card style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 200px' }}>
        <ScoreCircle score={result.score} size={80} />
        <div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Accessibility Score</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{result.score}/100</div>
        </div>
      </Card>

      {/* Total Issues */}
      <Card style={{ flex: '1 1 150px' }}>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Total Issues</div>
        <div style={{ fontSize: 36, fontWeight: 700 }}>{result.totalIssues}</div>
      </Card>

      {/* Severity Breakdown */}
      <Card style={{ flex: '2 1 300px' }}>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>By Severity</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <SeverityBadge severity="critical" count={result.critical} />
          <SeverityBadge severity="serious" count={result.serious} />
          <SeverityBadge severity="moderate" count={result.moderate} />
          <SeverityBadge severity="minor" count={result.minor} />
        </div>
      </Card>

      {/* Scan Duration */}
      <Card style={{ flex: '1 1 120px' }}>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Scan Time</div>
        <div style={{ fontSize: 28, fontWeight: 700 }}>
          {(result.scanDuration / 1000).toFixed(1)}s
        </div>
      </Card>
    </div>
  );
}