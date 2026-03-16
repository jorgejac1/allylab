import { MapPin } from 'lucide-react';
import type { SelectedLines } from './types';

interface EditorControlsProps {
  manualMode: boolean;
  showDiffPreview: boolean;
  selectedLines: SelectedLines | null;
  onManualModeChange: (value: boolean) => void;
  onShowDiffPreviewChange: (value: boolean) => void;
}

export function EditorControls({
  manualMode,
  showDiffPreview,
  selectedLines,
  onManualModeChange,
  onShowDiffPreviewChange,
}: EditorControlsProps) {
  return (
    <div className="flex gap-4 items-center flex-wrap">
      <label className="text-xs text-slate-500 flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={manualMode}
          onChange={e => onManualModeChange(e.target.checked)}
        />
        Manual selection mode
      </label>

      <label className="text-xs text-slate-500 flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={showDiffPreview}
          onChange={e => onShowDiffPreviewChange(e.target.checked)}
        />
        Show diff preview
      </label>

      {selectedLines && (
        <span className="text-xs text-slate-600 bg-slate-100 py-1 px-2 rounded inline-flex items-center gap-1">
          <MapPin size={12} aria-hidden="true" /> Lines {selectedLines.start}-{selectedLines.end}
        </span>
      )}
    </div>
  );
}
