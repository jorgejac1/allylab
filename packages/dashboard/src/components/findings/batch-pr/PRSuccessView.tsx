import { Button } from '../../ui';
import type { BatchPRResult } from '../../../types/batch-pr';
import { PartyPopper } from 'lucide-react';

interface PRSuccessViewProps {
  result: BatchPRResult;
  fixCount: number;
  onClose: () => void;
  platform?: 'github' | 'gitlab';
}

export function PRSuccessView({ result, fixCount, onClose, platform = 'github' }: PRSuccessViewProps) {
  const isGitLab = platform === 'gitlab';
  const prOrMr = isGitLab ? 'Merge Request' : 'Pull Request';
  const prOrMrShort = isGitLab ? 'MR' : 'PR';
  const viewLabel = isGitLab ? 'View on GitLab' : 'View on GitHub';

  return (
    <div className="text-center p-5">
      <div className="mb-4 flex justify-center"><PartyPopper size={64} className="text-green-600" /></div>
      <h3 className="m-0 mb-2 text-lg">{prOrMr} Created!</h3>
      <p className="text-slate-500 text-sm mb-6">
        {prOrMrShort} #{result.prNumber} with {fixCount} accessibility fixes has been created.
      </p>

      <div className="flex gap-3 justify-center">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <a
          href={result.prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 py-2.5 px-5 bg-slate-900 text-white rounded-lg no-underline text-sm font-medium"
        >
          {viewLabel} →
        </a>
      </div>
    </div>
  );
}
