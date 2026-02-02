import type { FindingSource } from '../../types';
import { Search, ClipboardList } from 'lucide-react';

export type SourceFilterValue = 'all' | FindingSource;

interface SourceFilterProps {
  value: SourceFilterValue;
  onChange: (value: SourceFilterValue) => void;
  counts: {
    axeCore: number;
    customRule: number;
    total: number;
  };
}

export function SourceFilter({ value, onChange, counts }: SourceFilterProps) {
  if (counts.customRule === 0 && counts.axeCore === counts.total) {
    // No custom rules in results, don't show filter
    return null;
  }

  return (
    <div 
      style={{ 
        display: 'flex', 
        gap: 4, 
        background: '#f1f5f9', 
        borderRadius: 6, 
        padding: 2 
      }}
    >
      <SourceButton
        active={value === 'all'}
        onClick={() => onChange('all')}
        label={`All (${counts.total})`}
      />
      <SourceButton
        active={value === 'axe-core'}
        onClick={() => onChange('axe-core')}
        label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Search size={10} /> axe-core ({counts.axeCore})</span>}
        color="#6366f1"
      />
      <SourceButton
        active={value === 'custom-rule'}
        onClick={() => onChange('custom-rule')}
        label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><ClipboardList size={10} /> Custom ({counts.customRule})</span>}
        color="#0891b2"
      />
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
      style={{
        padding: '4px 10px',
        borderRadius: 4,
        border: 'none',
        background: active ? (color || '#2563eb') : 'transparent',
        color: active ? '#fff' : '#64748b',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}