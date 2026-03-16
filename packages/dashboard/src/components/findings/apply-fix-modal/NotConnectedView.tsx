import { Link2 } from 'lucide-react';
import { Button, Modal } from '../../ui';

interface NotConnectedViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotConnectedView({ isOpen, onClose }: NotConnectedViewProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply Fix">
      <div className="text-center p-5">
        <div className="mb-4 flex justify-center text-slate-400">
          <Link2 size={48} aria-hidden="true" />
        </div>
        <h3 className="m-0 mb-2 text-base">GitHub Not Connected</h3>
        <p className="text-slate-500 text-sm mb-4">
          Connect your GitHub account in Settings to use this feature.
        </p>
        <Button onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}
