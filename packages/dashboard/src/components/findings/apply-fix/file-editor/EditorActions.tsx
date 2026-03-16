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
    <div className="flex gap-3 justify-end items-center pt-2 border-t border-slate-200">
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
            <RefreshCw size={14} className="mr-1" style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
            Creating PR...
          </>
        ) : (
          <>
            <Rocket size={14} className="mr-1" aria-hidden="true" />
            Create PR
          </>
        )}
      </Button>
    </div>
  );
}

function KeyboardHints() {
  return (
    <span className="text-[10px] text-slate-400 mr-auto">
      <kbd className="bg-slate-100 px-1 py-px rounded-sm border border-slate-200">Enter</kbd> Create PR
      {' · '}
      <kbd className="bg-slate-100 px-1 py-px rounded-sm border border-slate-200">Esc</kbd> Back
    </span>
  );
}
