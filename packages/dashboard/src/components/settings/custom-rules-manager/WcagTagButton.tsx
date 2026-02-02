import type { WcagTagButtonProps } from './types';

export function WcagTagButton({ tag, isSelected, onClick }: WcagTagButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      style={{
        padding: '4px 10px',
        fontSize: 12,
        borderRadius: 4,
        border: '1px solid',
        borderColor: isSelected ? '#3b82f6' : '#e2e8f0',
        background: isSelected ? '#eff6ff' : '#fff',
        color: isSelected ? '#3b82f6' : '#64748b',
        cursor: 'pointer',
      }}
    >
      {tag}
    </button>
  );
}
