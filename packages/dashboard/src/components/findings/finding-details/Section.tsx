import type { SectionProps } from './types';

export function Section({ title, subtitle, action, children }: SectionProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {title}
          </span>
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
