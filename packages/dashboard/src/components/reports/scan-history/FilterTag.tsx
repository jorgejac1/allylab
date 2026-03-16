import { memo } from 'react';

interface FilterTagProps {
  label: string;
  onRemove: () => void;
}

export const FilterTag = memo(function FilterTag({ label, onRemove }: FilterTagProps) {
  return (
    <span className="inline-flex items-center gap-1.5 py-1 px-2 bg-sky-100 text-sky-700 rounded text-xs font-medium">
      {label}
      <button
        onClick={e => {
          e.stopPropagation();
          onRemove();
        }}
        className="flex items-center justify-center w-4 h-4 bg-transparent border-none cursor-pointer p-0 text-sky-700 text-sm leading-none"
      >
        &times;
      </button>
    </span>
  );
});
