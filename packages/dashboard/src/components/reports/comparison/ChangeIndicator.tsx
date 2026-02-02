import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ChangeIndicatorProps {
  scoreChange: number;
  issueChange: number;
  scorePercent: number;
}

export function ChangeIndicator({
  scoreChange,
  issueChange,
  scorePercent,
}: ChangeIndicatorProps) {
  const isImproved = scoreChange > 0;
  const isDeclined = scoreChange < 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        minWidth: 120,
      }}
    >
      <div
        style={{
          lineHeight: 1,
          color: isImproved ? '#10b981' : isDeclined ? '#ef4444' : '#64748b',
        }}
      >
        {isImproved ? (
          <TrendingUp size={32} />
        ) : isDeclined ? (
          <TrendingDown size={32} />
        ) : (
          <Minus size={32} />
        )}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: isImproved ? '#10b981' : isDeclined ? '#ef4444' : '#64748b',
        }}
      >
        {scoreChange > 0 ? '+' : ''}
        {scoreChange}
      </div>
      <div style={{ fontSize: 11, color: '#64748b' }}>
        ({scorePercent > 0 ? '+' : ''}
        {scorePercent.toFixed(1)}%)
      </div>
      <div
        style={{
          fontSize: 12,
          color:
            issueChange < 0
              ? '#10b981'
              : issueChange > 0
                ? '#ef4444'
                : '#64748b',
        }}
      >
        {issueChange < 0 ? '↓' : issueChange > 0 ? '↑' : ''}{' '}
        {Math.abs(issueChange).toFixed(1)} issues
      </div>
    </div>
  );
}
