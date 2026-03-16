import type { ReactNode } from 'react';

interface ProgressRowProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  color: string;
}

export function ProgressRow({ label, value, icon, color }: ProgressRowProps) {
  return (
    <div className="flex justify-between items-center px-4 py-3 bg-slate-50 rounded-lg">
      <span className="flex items-center gap-2" style={{ color }}>
        <span className="flex items-center">{icon}</span>
        <span className="text-sm/[normal] text-slate-800">{label}</span>
      </span>
      <span className="text-xl/[normal] font-bold" style={{ color }}>{value}</span>
    </div>
  );
}
