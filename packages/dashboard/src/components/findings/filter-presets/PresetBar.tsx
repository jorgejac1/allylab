import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import type { FilterPreset } from '../../../types/filterPreset';
import { PresetPill } from './PresetPill';
import { SavePresetModal } from './SavePresetModal';

interface PresetBarProps {
  presets: FilterPreset[];
  activePresetId: string | null;
  onApply: (id: string) => void;
  onDelete: (id: string) => void;
  onSave: (name: string, color?: string) => void;
}

export function PresetBar({ presets, activePresetId, onApply, onDelete, onSave }: PresetBarProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 flex-wrap bg-slate-50/50">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-1">
          Presets
        </span>

        {presets.map((preset) => (
          <PresetPill
            key={preset.id}
            preset={preset}
            isActive={preset.id === activePresetId}
            onClick={() => onApply(preset.id)}
            onDelete={preset.id.startsWith('builtin_') ? undefined : () => onDelete(preset.id)}
          />
        ))}

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-dashed border-slate-300 text-slate-500 bg-transparent cursor-pointer transition-all hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50"
        >
          <Bookmark size={12} />
          <span>Save current filters</span>
        </button>
      </div>

      <SavePresetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={onSave}
      />
    </>
  );
}
