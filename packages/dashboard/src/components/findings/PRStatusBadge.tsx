import type { PRTrackingInfo } from '../../types/github';

interface PRStatusBadgeProps {
  pr: PRTrackingInfo;
  onVerify?: () => void;
  isVerifying?: boolean;
}

export function PRStatusBadge({ pr, onVerify, isVerifying }: PRStatusBadgeProps) {
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
    if (pr.verificationStatus === 'verified') return '✓ Verified';
    if (pr.verificationStatus === 'failed') return '✗ Still Present';
    if (pr.status === 'merged') return '🔀 Merged';
    if (pr.status === 'closed') return 'Closed';
    return 'Open';
  };

  const showVerifyButton = pr.status === 'merged' && !pr.verificationStatus;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <a
        href={pr.prUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 500,
          textDecoration: 'none',
          ...getStatusStyle(),
        }}
      >
        PR #{pr.prNumber} • {getStatusText()}
      </a>
      
      {showVerifyButton && onVerify && (
        <button
          onClick={onVerify}
          disabled={isVerifying}
          style={{
            padding: '4px 8px',
            background: '#0f172a',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 500,
            cursor: isVerifying ? 'wait' : 'pointer',
            opacity: isVerifying ? 0.7 : 1,
          }}
        >
          {isVerifying ? 'Verifying...' : 'Verify Fix'}
        </button>
      )}
    </div>
  );
}