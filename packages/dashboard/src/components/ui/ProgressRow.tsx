import type { ReactNode } from 'react';

interface ProgressRowProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  color: string;
}

export function ProgressRow({ label, value, icon, color }: ProgressRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        background: '#f8fafc',
        borderRadius: 8,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, color }}>
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={{ fontSize: 14, color: '#1e293b' }}>{label}</span>
      </span>
      <span style={{ fontSize: 20, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}
