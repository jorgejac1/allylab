import { Button } from '../../../ui';
import { RefreshCw, Rocket } from 'lucide-react';
import type { SelectedLines } from './types';

interface EditorActionsProps {
  selectedLines: SelectedLines | null;
  isCreatingPR: boolean;
  onBack: () => void;
  onCreatePR: () => void;
}

export function EditorActions({
  selectedLines,
  isCreatingPR,
  onBack,
  onCreatePR,
}: EditorActionsProps) {
  return (
    <div style={{
      display: 'flex',
      gap: 12,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingTop: 8,
      borderTop: '1px solid #e2e8f0',
    }}>
      <KeyboardHints />
      <Button variant="secondary" onClick={onBack}>
        ← Back
      </Button>
      <Button
        variant="primary"
        onClick={onCreatePR}
        disabled={!selectedLines || isCreatingPR}
      >
        {isCreatingPR ? (
          <>
            <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite', marginRight: 4 }} aria-hidden="true" />
            Creating PR...
          </>
        ) : (
          <>
            <Rocket size={14} style={{ marginRight: 4 }} aria-hidden="true" />
            Create PR
          </>
        )}
      </Button>
    </div>
  );
}

function KeyboardHints() {
  const kbdStyle = {
    background: '#f1f5f9',
    padding: '1px 4px',
    borderRadius: 2,
    border: '1px solid #e2e8f0',
  };

  return (
    <span style={{ fontSize: 10, color: '#94a3b8', marginRight: 'auto' }}>
      <kbd style={kbdStyle}>Enter</kbd> Create PR
      {' · '}
      <kbd style={kbdStyle}>Esc</kbd> Back
    </span>
  );
}
