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
    <div className="flex flex-col items-center gap-3 p-4 min-w-[120px]">
      <div
        className="leading-none"
        style={{
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
        className="text-xl font-bold"
        style={{
          color: isImproved ? '#10b981' : isDeclined ? '#ef4444' : '#64748b',
        }}
      >
        {scoreChange > 0 ? '+' : ''}
        {scoreChange}
      </div>
      <div className="text-xs text-slate-500">
        ({scorePercent > 0 ? '+' : ''}
        {scorePercent.toFixed(1)}%)
      </div>
      <div
        className="text-xs"
        style={{
          color:
            issueChange < 0
              ? '#10b981'
              : issueChange > 0
                ? '#ef4444'
                : '#64748b',
        }}
      >
        {issueChange < 0 ? '\u2193' : issueChange > 0 ? '\u2191' : ''}{' '}
        {Math.abs(issueChange).toFixed(1)} issues
      </div>
    </div>
  );
}
