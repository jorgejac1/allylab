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
    <div style={{
      display: 'flex',
      gap: 16,
      alignItems: 'center',
      flexWrap: 'wrap',
    }}>
      <label style={{
        fontSize: 12,
        color: '#64748b',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
      }}>
        <input
          type="checkbox"
          checked={manualMode}
          onChange={e => onManualModeChange(e.target.checked)}
        />
        Manual selection mode
      </label>

      <label style={{
        fontSize: 12,
        color: '#64748b',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
      }}>
        <input
          type="checkbox"
          checked={showDiffPreview}
          onChange={e => onShowDiffPreviewChange(e.target.checked)}
        />
        Show diff preview
      </label>

      {selectedLines && (
        <span style={{
          fontSize: 12,
          color: '#475569',
          background: '#f1f5f9',
          padding: '4px 8px',
          borderRadius: 4,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <MapPin size={12} aria-hidden="true" /> Lines {selectedLines.start}-{selectedLines.end}
        </span>
      )}
    </div>
  );
}
