import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function SectionHeader({ title, subtitle, icon, actions }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4">
      <div className="flex items-center gap-2.5">
        {icon && <span className="text-xl/[normal]">{icon}</span>}
        <div>
          <h3 className="text-base/[normal] font-semibold m-0 text-slate-900">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[13px] text-slate-500 m-0 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
