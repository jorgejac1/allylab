import type { ReactNode } from 'react';

interface SectionProps {
  title: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Section({ title, subtitle, action, children, className }: SectionProps) {
  return (
    <div className={`mb-5 ${className || ''}`}>
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex items-center gap-2">
          <h4 className="text-xs/[normal] font-semibold text-slate-500 m-0 uppercase tracking-wide flex items-center">
            {title}
          </h4>
          {subtitle && (
            <span className="text-[11px] text-slate-400 italic">
              {subtitle}
            </span>
          )}
        </div>
        {action}
      </div>
      <div className="flex gap-2 flex-wrap">{children}</div>
    </div>
  );
}
