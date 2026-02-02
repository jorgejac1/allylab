import { Button } from '../../ui';
import type { PRResult } from './useCreatePRForm';
import { PartyPopper } from 'lucide-react';

interface PRSuccessStepProps {
  prResult: PRResult;
  onClose: () => void;
}

export function PRSuccessStep({ prResult, onClose }: PRSuccessStepProps) {
  return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><PartyPopper size={64} style={{ color: '#16a34a' }} /></div>
      <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Pull Request Created!</h3>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
        PR #{prResult.prNumber} has been created successfully.
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <a
          href={prResult.prUrl}
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
