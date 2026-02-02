import { Check, ArrowUp } from 'lucide-react';

interface IssueChangeBadgeProps {
  label: string;
  change: number;
  color: string;
}

export function IssueChangeBadge({ label, change, color }: IssueChangeBadgeProps) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 6,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
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
      <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: isNegative ? '#10b981' : isPositive ? '#ef4444' : '#64748b',
        }}
      >
        {change > 0 ? '+' : ''}
        {change}
      </span>
      {isNegative && <Check size={10} />}
      {isPositive && <ArrowUp size={10} />}
    </div>
  );
}
