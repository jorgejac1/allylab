import type { FindingSource } from '../../types';
import { Search, ClipboardList, Tv } from 'lucide-react';

export type SourceFilterValue = 'all' | FindingSource;

interface SourceFilterProps {
  value: SourceFilterValue;
  onChange: (value: SourceFilterValue) => void;
  counts: {
    axeCore: number;
    customRule: number;
    tvRule: number;
    total: number;
  };
}

export function SourceFilter({ value, onChange, counts }: SourceFilterProps) {
  if (counts.customRule === 0 && counts.tvRule === 0 && counts.axeCore === counts.total) {
    // No custom rules or TV rules in results, don't show filter
    return null;
  }

  return (
    <div className="flex gap-1 bg-slate-100 rounded-md p-0.5">
      <SourceButton
        active={value === 'all'}
        onClick={() => onChange('all')}
        label={`All (${counts.total})`}
      />
      <SourceButton
        active={value === 'axe-core'}
        onClick={() => onChange('axe-core')}
        label={<span className="inline-flex items-center gap-1"><Search size={10} /> axe-core ({counts.axeCore})</span>}
        color="#6366f1"
      />
      <SourceButton
        active={value === 'custom-rule'}
        onClick={() => onChange('custom-rule')}
        label={<span className="inline-flex items-center gap-1"><ClipboardList size={10} /> Custom ({counts.customRule})</span>}
        color="#0891b2"
      />
      {counts.tvRule > 0 && (
        <SourceButton
          active={value === 'tv-rule'}
          onClick={() => onChange('tv-rule')}
          label={<span className="inline-flex items-center gap-1"><Tv size={10} /> TV Rules ({counts.tvRule})</span>}
          color="#7c3aed"
        />
      )}
    </div>
  );
}

function SourceButton({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-1 px-2.5 rounded border-none text-xs font-medium cursor-pointer transition-all duration-150 ${
        active ? 'text-white' : 'bg-transparent text-slate-500'
      }`}
      style={active ? { background: color || '#2563eb' } : undefined}
    >
      {label}
    </button>
  );
}
