import { Rocket } from 'lucide-react';
import { Button, Spinner } from '../../../ui';
import type { FormActionsProps } from './types';

export function FormActions({
  isLoading,
  withPathCount,
  totalCount,
  highConfidenceCount,
  onBack,
  onCancel,
  onSubmit
}: FormActionsProps) {
  return (
    <div className="flex gap-3 justify-between items-center mt-2 pt-3 border-t border-slate-200">
      <Button variant="secondary" onClick={onBack}>
        ← Back
      </Button>

      <div className="flex-1 text-center">
        {withPathCount > 0 && (
          <span className="text-[11px] text-slate-500">
            {withPathCount} of {totalCount} ready
            {highConfidenceCount > 0 && ` (${highConfidenceCount} high confidence)`}
          </span>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onSubmit}
          disabled={isLoading || withPathCount === 0}
        >
          {isLoading ? (
            <>
              <Spinner size={14} /> Creating...
            </>
          ) : (
            <><Rocket size={14} aria-hidden="true" className="mr-1" /> Create PR ({withPathCount})</>
          )}
        </Button>
      </div>
    </div>
  );
}
