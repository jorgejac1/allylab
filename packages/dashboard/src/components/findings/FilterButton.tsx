import { memo, type ReactNode } from 'react';

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  label: ReactNode;
}

export const FilterButton = memo(function FilterButton({ active, onClick, label }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`py-1 px-2.5 rounded border-none text-xs font-medium cursor-pointer ${
        active
          ? 'bg-white text-slate-900 shadow-sm'
          : 'bg-transparent text-slate-500'
      }`}
    >
      {label}
    </button>
  );
});

interface PillButtonProps {
  active: boolean;
  activeColor?: string;
  onClick: () => void;
  label: ReactNode;
}

export const PillButton = memo(function PillButton({
  active,
  activeColor = '#2563eb',
  onClick,
  label
}: PillButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`py-1 px-3 rounded-full text-xs cursor-pointer flex items-center gap-1 ${
        active ? 'border-none text-white' : 'border border-slate-200 text-slate-500'
      }`}
      style={active ? { background: activeColor } : { background: '#fff' }}
    >
      {label}
    </button>
  );
});

export const Divider = memo(function Divider() {
  return <div className="w-px h-5 bg-slate-200 mx-1" />;
});
