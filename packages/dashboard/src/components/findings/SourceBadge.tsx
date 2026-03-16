import { memo } from 'react';
import type { FindingSource } from '../../types';
import { ClipboardList, Search, Tv } from 'lucide-react';

interface SourceBadgeProps {
  source?: FindingSource;
}

export const SourceBadge = memo(function SourceBadge({ source }: SourceBadgeProps) {
  const isCustom = source === 'custom-rule';
  const isTVRule = source === 'tv-rule';

  const className = isTVRule
    ? 'bg-purple-50 text-purple-700 border border-purple-200'
    : isCustom
      ? 'bg-sky-100 text-sky-700 border border-sky-200'
      : 'bg-slate-100 text-slate-500 border border-slate-200';

  const icon = isTVRule
    ? <Tv size={10} />
    : isCustom
      ? <ClipboardList size={10} />
      : <Search size={10} />;

  const label = isTVRule ? 'TV Rule' : isCustom ? 'Custom' : 'axe-core';

  return (
    <span
      className={`inline-flex items-center gap-1 py-0.5 px-1.5 rounded text-[10px] font-medium ${className}`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
});
