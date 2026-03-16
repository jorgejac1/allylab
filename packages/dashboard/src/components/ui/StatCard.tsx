import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  color?: string;
}

export function StatCard({
  label,
  value,
  prefix = '',
  suffix = '',
  color,
}: StatCardProps) {
  return (
    <Card>
      <div className="text-xs/[normal] text-slate-500 mb-1">
        {label}
      </div>
      <div className="text-[28px] font-bold" style={{ color: color || '#0f172a' }}>
        {prefix}
        {value}
        <span className="text-sm/[normal] font-normal text-slate-500">
          {suffix}
        </span>
      </div>
    </Card>
  );
}
