import { ScoreCircle } from '../../charts';

interface PeriodCardProps {
  label: string;
  score: number;
  issues: number;
  scanCount: number;
  highlight?: boolean;
}

export function PeriodCard({
  label,
  score,
  issues,
  scanCount,
  highlight,
}: PeriodCardProps) {
  return (
    <div
      style={{
        padding: 20,
        background: highlight ? '#eff6ff' : '#f8fafc',
        border: highlight ? '2px solid #3b82f6' : '1px solid #e2e8f0',
        borderRadius: 12,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: '#64748b',
          marginBottom: 12,
          fontWeight: 600,
        }}
      >
        {label.toUpperCase()}
      </div>
      <div
        style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}
      >
        <ScoreCircle score={score} size={80} />
      </div>
      <div style={{ fontSize: 13, color: '#64748b' }}>
        Avg {issues.toFixed(1)} issues
      </div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
        {scanCount} scan{scanCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
