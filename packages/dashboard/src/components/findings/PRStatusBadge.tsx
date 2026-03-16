import { memo } from 'react';
import type { PRTrackingInfo } from '../../types/github';
import { Check, X, GitMerge } from 'lucide-react';

interface PRStatusBadgeProps {
  pr: PRTrackingInfo;
  onVerify?: () => void;
  isVerifying?: boolean;
}

export const PRStatusBadge = memo(function PRStatusBadge({ pr, onVerify, isVerifying }: PRStatusBadgeProps) {
  const getStatusStyle = () => {
    if (pr.verificationStatus === 'verified') {
      return { background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' };
    }
    if (pr.verificationStatus === 'failed') {
      return { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };
    }
    if (pr.status === 'merged') {
      return { background: '#f3e8ff', color: '#9333ea', border: '1px solid #e9d5ff' };
    }
    if (pr.status === 'closed') {
      return { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' };
    }
    // Open
    return { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' };
  };

  const getStatusText = () => {
    if (pr.verificationStatus === 'verified') return <><Check size={12} className="mr-1" /> Verified</>;
    if (pr.verificationStatus === 'failed') return <><X size={12} className="mr-1" /> Still Present</>;
    if (pr.status === 'merged') return <><GitMerge size={12} className="mr-1" /> Merged</>;
    if (pr.status === 'closed') return 'Closed';
    return 'Open';
  };

  const showVerifyButton = pr.status === 'merged' && !pr.verificationStatus;

  return (
    <div className="flex items-center gap-2">
      <a
        href={pr.prUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 py-1 px-2 rounded text-xs font-medium no-underline"
        style={getStatusStyle()}
      >
        PR #{pr.prNumber} • {getStatusText()}
      </a>

      {showVerifyButton && onVerify && (
        <button
          onClick={onVerify}
          disabled={isVerifying}
          className="py-1 px-2 bg-slate-900 text-white border-none rounded text-xs font-medium"
          style={{
            cursor: isVerifying ? 'wait' : 'pointer',
            opacity: isVerifying ? 0.7 : 1,
          }}
        >
          {isVerifying ? 'Verifying...' : 'Verify Fix'}
        </button>
      )}
    </div>
  );
});
