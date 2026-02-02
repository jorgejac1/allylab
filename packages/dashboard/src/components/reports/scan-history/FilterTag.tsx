import { memo } from 'react';

interface FilterTagProps {
  label: string;
  onRemove: () => void;
}

export const FilterTag = memo(function FilterTag({ label, onRemove }: FilterTagProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        background: '#e0f2fe',
        color: '#0369a1',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {label}
      <button
        onClick={e => {
          e.stopPropagation();
          onRemove();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 16,
          height: 16,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          color: '#0369a1',
          fontSize: 14,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </span>
  );
});