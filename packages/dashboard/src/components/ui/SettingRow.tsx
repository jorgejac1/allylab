import type { ReactNode } from 'react';

interface SettingRowProps {
  label: string;
  description?: string;
  children: ReactNode;
}

export function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-slate-100">
      <div>
        <span className="text-sm/[normal] font-medium">{label}</span>
        {description && (
          <p className="text-xs/[normal] text-slate-500 mt-1 mb-0">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
