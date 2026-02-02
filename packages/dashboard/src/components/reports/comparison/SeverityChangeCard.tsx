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
    <div
      style={{
        padding: 12,
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
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
        <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span style={{ fontSize: 11, color: '#94a3b8' }}>
          {before.toFixed(1)} → {after.toFixed(1)}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
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
