import { Button, Modal } from '../ui';
import type { VerificationResult } from '../../types/github';
import { Search, XCircle, PartyPopper, AlertTriangle, X, Check } from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: VerificationResult | null;
  isLoading: boolean;
  error: string | null;
}

export function VerificationModal({
  isOpen,
  onClose,
  result,
  isLoading,
  error,
}: VerificationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fix Verification" size="md">
      {isLoading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><Search size={32} /></div>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Re-scanning page to verify fixes...
          </p>
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><XCircle size={48} style={{ color: '#dc2626' }} /></div>
          <h3 style={{ margin: '0 0 8px', fontSize: 16, color: '#dc2626' }}>
            Verification Failed
          </h3>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
            {error}
          </p>
          <Button onClick={onClose}>Close</Button>
        </div>
      )}

      {result && !isLoading && !error && (
        <div style={{ padding: 20 }}>
          {result.allFixed ? (
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><PartyPopper size={64} style={{ color: '#16a34a' }} /></div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#16a34a' }}>
                All Fixes Verified!
              </h3>
              <p style={{ color: '#64748b', fontSize: 14 }}>
                All {result.findingsVerified.length} issues have been successfully fixed.
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><AlertTriangle size={48} style={{ color: '#f59e0b' }} /></div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#f59e0b' }}>
                Some Issues Still Present
              </h3>
              <p style={{ color: '#64748b', fontSize: 14 }}>
                {result.findingsVerified.filter(f => f.stillPresent).length} of{' '}
                {result.findingsVerified.length} issues are still present.
              </p>
            </div>
          )}

          {/* Results Table */}
          <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            overflow: 'hidden',
            marginBottom: 16,
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={thStyle}>Rule</th>
                  <th style={{ ...thStyle, width: 100 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {result.findingsVerified.map((finding, index) => (
                  <tr key={index} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={tdStyle}>
                      <code style={{ fontSize: 12 }}>{finding.ruleId}</code>
                    </td>
                    <td style={tdStyle}>
                      {finding.stillPresent ? (
                        <span style={{ color: '#dc2626', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <X size={12} /> Still Present
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Check size={12} /> Fixed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Scan Info */}
          <div style={{
            padding: 12,
            background: '#f8fafc',
            borderRadius: 8,
            fontSize: 13,
            color: '#64748b',
          }}>
            <div>New Score: <strong>{result.scanScore}/100</strong></div>
            <div>Scanned: {new Date(result.scanTimestamp).toLocaleString()}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 600,
  color: '#64748b',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 13,
};