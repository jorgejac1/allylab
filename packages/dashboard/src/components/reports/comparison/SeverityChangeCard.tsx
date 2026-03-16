interface SeverityChangeCardProps {
  label: string;
  before: number;
  after: number;
  color: string;
}

export function SeverityChangeCard({
  label,
  before,
  after,
  color,
}: SeverityChangeCardProps) {
  const change = after - before;
  const isReduced = change < 0;
  const isIncreased = change > 0;

  return (
    <div className="p-3 bg-white rounded-lg border border-slate-200">
      <div className="flex items-center gap-1.5 mb-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: color }}
        />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-slate-400">
          {before.toFixed(1)} &rarr; {after.toFixed(1)}
        </span>
        <span
          className="text-sm font-semibold"
          style={{
            color: isReduced ? '#10b981' : isIncreased ? '#ef4444' : '#64748b',
          }}
        >
          {change > 0 ? '+' : ''}
          {change.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
