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
    <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-md bg-slate-50 border border-slate-200">
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: color }}
      />
      <span className="text-xs text-slate-500">{label}</span>
      <span
        className={`text-xs font-semibold ${
          isNegative ? 'text-emerald-500' : isPositive ? 'text-red-500' : 'text-slate-500'
        }`}
      >
        {change > 0 ? '+' : ''}
        {change}
      </span>
      {isNegative && <Check size={10} />}
      {isPositive && <ArrowUp size={10} />}
    </div>
  );
}
