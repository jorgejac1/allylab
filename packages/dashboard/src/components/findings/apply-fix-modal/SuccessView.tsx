import { PartyPopper, Rocket } from 'lucide-react';
import { Button, Modal } from '../../ui';
import type { PRResult } from './types';

interface SuccessViewProps {
  isOpen: boolean;
  onClose: () => void;
  prResult: PRResult;
}

export function SuccessView({ isOpen, onClose, prResult }: SuccessViewProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PartyPopper size={20} aria-hidden="true" />
          Pull Request Created!
        </span>
      }
      size="lg"
    >
      <div style={{ textAlign: 'center', padding: 20 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center', color: '#3b82f6' }}>
          <Rocket size={64} aria-hidden="true" />
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>PR #{prResult.prNumber} Created!</h3>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
          Your accessibility fix has been submitted for review.
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
    </Modal>
  );
}
