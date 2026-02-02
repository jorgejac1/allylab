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
    <div style={{
      display: 'flex',
      gap: 12,
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 12,
      borderTop: '1px solid #e2e8f0',
    }}>
      <Button variant="secondary" onClick={onBack}>
        ← Back
      </Button>

      <div style={{ flex: 1, textAlign: 'center' }}>
        {withPathCount > 0 && (
          <span style={{ fontSize: 11, color: '#64748b' }}>
            {withPathCount} of {totalCount} ready
            {highConfidenceCount > 0 && ` (${highConfidenceCount} high confidence)`}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
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
            <><Rocket size={14} aria-hidden="true" style={{ marginRight: 4 }} /> Create PR ({withPathCount})</>
          )}
        </Button>
      </div>
    </div>
  );
}
