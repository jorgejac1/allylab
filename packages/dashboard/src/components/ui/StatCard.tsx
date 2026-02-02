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
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || '#0f172a' }}>
        {prefix}
        {value}
        <span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>
          {suffix}
        </span>
      </div>
    </Card>
  );
}
