import { Button } from '../../ui';
import type { BatchPRResult } from '../../../types/batch-pr';

interface PRSuccessViewProps {
  result: BatchPRResult;
  fixCount: number;
  onClose: () => void;
}

export function PRSuccessView({ result, fixCount, onClose }: PRSuccessViewProps) {
  return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Pull Request Created!</h3>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
        PR #{result.prNumber} with {fixCount} accessibility fixes has been created.
      </p>
      
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <a
          href={result.prUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: '#0f172a',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          View on GitHub →
        </a>
      </div>
    </div>
  );
}