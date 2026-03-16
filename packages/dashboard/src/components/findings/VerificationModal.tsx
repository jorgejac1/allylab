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
        <div className="text-center p-10">
          <div className="mb-4 flex justify-center"><Search size={32} /></div>
          <p className="text-slate-500 text-sm">
            Re-scanning page to verify fixes...
          </p>
        </div>
      )}

      {error && (
        <div className="text-center p-10">
          <div className="mb-4 flex justify-center"><XCircle size={48} className="text-red-600" /></div>
          <h3 className="m-0 mb-2 text-base text-red-600">
            Verification Failed
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            {error}
          </p>
          <Button onClick={onClose}>Close</Button>
        </div>
      )}

      {result && !isLoading && !error && (
        <div className="p-5">
          {result.allFixed ? (
            <div className="text-center mb-6">
              <div className="mb-4 flex justify-center"><PartyPopper size={64} className="text-green-600" /></div>
              <h3 className="m-0 mb-2 text-lg text-green-600">
                All Fixes Verified!
              </h3>
              <p className="text-slate-500 text-sm">
                All {result.findingsVerified.length} issues have been successfully fixed.
              </p>
            </div>
          ) : (
            <div className="text-center mb-6">
              <div className="mb-4 flex justify-center"><AlertTriangle size={48} className="text-amber-500" /></div>
              <h3 className="m-0 mb-2 text-lg text-amber-500">
                Some Issues Still Present
              </h3>
              <p className="text-slate-500 text-sm">
                {result.findingsVerified.filter(f => f.stillPresent).length} of{' '}
                {result.findingsVerified.length} issues are still present.
              </p>
            </div>
          )}

          {/* Results Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-500">Rule</th>
                  <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-500 w-[100px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.findingsVerified.map((finding, index) => (
                  <tr key={index} className="border-t border-slate-200">
                    <td className="py-2.5 px-3 text-[13px]">
                      <code className="text-xs">{finding.ruleId}</code>
                    </td>
                    <td className="py-2.5 px-3 text-[13px]">
                      {finding.stillPresent ? (
                        <span className="text-red-600 font-medium inline-flex items-center gap-1">
                          <X size={12} /> Still Present
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium inline-flex items-center gap-1">
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
          <div className="p-3 bg-slate-50 rounded-lg text-[13px] text-slate-500">
            <div>New Score: <strong>{result.scanScore}/100</strong></div>
            <div>Scanned: {new Date(result.scanTimestamp).toLocaleString()}</div>
          </div>

          <div className="flex justify-center mt-6">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
