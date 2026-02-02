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
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: 20,
      border: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start' 
      }}>
        <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
          {icon && <span style={{ marginRight: 6, display: 'flex', alignItems: 'center' }}>{icon}</span>}
          {label}
        </span>
        {trend && trend.length >= 2 && (
          <Sparkline data={trend} width={60} height={24} color="auto" />
        )}
      </div>
      <div style={{ 
        fontSize: 32, 
        fontWeight: 700, 
        color: color || '#111827',
        lineHeight: 1 
      }}>
        {value}
      </div>
      {subValue && (
        <span style={{ fontSize: 12, color: '#9ca3af' }}>{subValue}</span>
      )}
    </div>
  );
});