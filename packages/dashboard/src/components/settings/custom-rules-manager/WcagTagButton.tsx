import type { WcagTagButtonProps } from './types';

export function WcagTagButton({ tag, isSelected, onClick }: WcagTagButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className="py-1 px-2.5 text-xs rounded border cursor-pointer"
      style={{
        borderColor: isSelected ? '#3b82f6' : '#e2e8f0',
        background: isSelected ? '#eff6ff' : '#fff',
        color: isSelected ? '#3b82f6' : '#64748b',
      }}
    >
      {tag}
    </button>
  );
}
