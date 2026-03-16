import { X } from 'lucide-react';
import type { FilterPreset } from '../../../types/filterPreset';

interface PresetPillProps {
  preset: FilterPreset;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
}

const colorMap: Record<string, { bg: string; text: string; activeBg: string; activeText: string }> = {
  blue: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    text: 'text-blue-700',
    activeBg: 'bg-blue-600 text-white border-blue-600',
    activeText: 'text-white',
  },
  emerald: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    text: 'text-emerald-700',
    activeBg: 'bg-emerald-600 text-white border-emerald-600',
    activeText: 'text-white',
  },
  purple: {
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    text: 'text-purple-700',
    activeBg: 'bg-purple-600 text-white border-purple-600',
    activeText: 'text-white',
  },
  amber: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    text: 'text-amber-700',
    activeBg: 'bg-amber-600 text-white border-amber-600',
    activeText: 'text-white',
  },
  rose: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    text: 'text-rose-700',
    activeBg: 'bg-rose-600 text-white border-rose-600',
    activeText: 'text-white',
  },
  red: {
    bg: 'bg-red-50 text-red-700 border-red-200',
    text: 'text-red-700',
    activeBg: 'bg-red-600 text-white border-red-600',
    activeText: 'text-white',
  },
  slate: {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    text: 'text-slate-700',
    activeBg: 'bg-blue-600 text-white border-blue-600',
    activeText: 'text-white',
  },
};

function getColorClasses(color: string | undefined, isActive: boolean) {
  const palette = colorMap[color || 'slate'] || colorMap.slate;
  return isActive ? palette.activeBg : palette.bg;
}

export function PresetPill({ preset, isActive, onClick, onDelete }: PresetPillProps) {
  const colorClasses = getColorClasses(preset.color, isActive);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all ${colorClasses}`}
    >
      <span>{preset.name}</span>
      {onDelete && !preset.id.startsWith('builtin_') && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              e.preventDefault();
              onDelete();
            }
          }}
          className={`inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/10 ${isActive ? 'text-white/80 hover:text-white' : 'text-current opacity-50 hover:opacity-100'}`}
        >
          <X size={10} />
        </span>
      )}
    </button>
  );
}
