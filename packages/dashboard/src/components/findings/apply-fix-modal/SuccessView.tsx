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
        <span className="flex items-center gap-2">
          <PartyPopper size={20} aria-hidden="true" />
          Pull Request Created!
        </span>
      }
      size="lg"
    >
      <div className="text-center p-5">
        <div className="mb-4 flex justify-center text-blue-500">
          <Rocket size={64} aria-hidden="true" />
        </div>
        <h3 className="m-0 mb-2 text-lg">PR #{prResult.prNumber} Created!</h3>
        <p className="text-slate-500 text-sm mb-6">
          Your accessibility fix has been submitted for review.
        </p>

        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <a
            href={prResult.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 py-2.5 px-5 bg-slate-900 text-white rounded-lg no-underline text-sm font-medium"
          >
            View on GitHub →
          </a>
        </div>
      </div>
    </Modal>
  );
}
