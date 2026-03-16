import { memo, type ReactNode } from 'react';
import { Sparkline } from '../charts';

interface KPICardProps {
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
  trend?: number[];
  icon?: ReactNode;
}

export const KPICard = memo(function KPICard({
  label,
  value,
  subValue,
  color,
  trend,
  icon
}: KPICardProps) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <span className="text-sm/[normal] text-gray-500 font-medium flex items-center">
          {icon && <span className="mr-1.5 flex items-center">{icon}</span>}
          {label}
        </span>
        {trend && trend.length >= 2 && (
          <Sparkline data={trend} width={60} height={24} color="auto" />
        )}
      </div>
      <div
        className="text-[32px] font-bold leading-none"
        style={{ color: color || '#111827' }}
      >
        {value}
      </div>
      {subValue && (
        <span className="text-xs text-gray-400">{subValue}</span>
      )}
    </div>
  );
});
