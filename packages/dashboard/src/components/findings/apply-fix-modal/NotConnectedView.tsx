import { Link2 } from 'lucide-react';
import { Button, Modal } from '../../ui';

interface NotConnectedViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotConnectedView({ isOpen, onClose }: NotConnectedViewProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply Fix">
      <div style={{ textAlign: 'center', padding: 20 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center', color: '#94a3b8' }}>
          <Link2 size={48} aria-hidden="true" />
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>GitHub Not Connected</h3>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
          Connect your GitHub account in Settings to use this feature.
        </p>
        <Button onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}
