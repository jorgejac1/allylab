/**
 * MRStatusBadge
 *
 * Displays the status of a GitLab Merge Request as a colored badge
 * that links to the MR URL. Mirrors the pattern of PRStatusBadge.
 * Supports verification status display and a verify button for merged MRs.
 */

import { memo } from 'react';
import { GitMerge, Check, X } from 'lucide-react';

interface MRStatusBadgeProps {
  mrUrl: string;
  status: 'opened' | 'merged' | 'closed';
  verificationStatus?: 'verified' | 'failed';
  onVerify?: () => void;
  isVerifying?: boolean;
}

export const MRStatusBadge = memo(function MRStatusBadge({
  mrUrl,
  status,
  verificationStatus,
  onVerify,
  isVerifying,
}: MRStatusBadgeProps) {
  const getStatusClasses = () => {
    if (verificationStatus === 'verified') {
      return 'bg-green-50 text-green-600 border border-green-200';
    }
    if (verificationStatus === 'failed') {
      return 'bg-red-50 text-red-600 border border-red-200';
    }
    switch (status) {
      case 'opened':
        return 'bg-blue-50 text-blue-600 border border-blue-200';
      case 'merged':
        return 'bg-green-50 text-green-600 border border-green-200';
      case 'closed':
        return 'bg-slate-100 text-slate-500 border border-slate-200';
    }
  };

  const getStatusText = () => {
    if (verificationStatus === 'verified') {
      return (
        <>
          <Check size={12} className="mr-1" />
          Verified
        </>
      );
    }
    if (verificationStatus === 'failed') {
      return (
        <>
          <X size={12} className="mr-1" />
          Still Present
        </>
      );
    }
    switch (status) {
      case 'opened':
        return 'MR Open';
      case 'merged':
        return (
          <>
            <GitMerge size={12} className="mr-1" />
            MR Merged
          </>
        );
      case 'closed':
        return 'MR Closed';
    }
  };

  const showVerifyButton = status === 'merged' && !verificationStatus;

  return (
    <div className="flex items-center gap-2">
      <a
        href={mrUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 py-1 px-2 rounded text-xs font-medium no-underline ${getStatusClasses()}`}
      >
        {getStatusText()}
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
