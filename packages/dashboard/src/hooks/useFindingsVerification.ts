import { useState, useCallback } from 'react';
import { usePRTracking } from './usePRTracking';
import type { VerificationResult } from '../types/github';

export interface FindingsVerificationResult {
  verificationModalOpen: boolean;
  verificationResult: VerificationResult | null;
  isVerifying: boolean;
  verifyingPRId: string | null;
  verificationError: string | null;
  getPRsForFinding: ReturnType<typeof usePRTracking>['getPRsForFinding'];
  verifyFix: (prId: string) => Promise<void>;
  closeVerificationModal: () => void;
}

export function useFindingsVerification(): FindingsVerificationResult {
  const { getPRsForFinding, verifyFixes } = usePRTracking();

  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyingPRId, setVerifyingPRId] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const verifyFix = useCallback(async (prId: string) => {
    setVerifyingPRId(prId);
    setIsVerifying(true);
    setVerificationError(null);
    setVerificationModalOpen(true);

    const result = await verifyFixes(prId);

    if (result) {
      setVerificationResult(result);
    } else {
      setVerificationError('Failed to verify fixes');
    }

    setIsVerifying(false);
    setVerifyingPRId(null);
  }, [verifyFixes]);

  const closeVerificationModal = useCallback(() => {
    setVerificationModalOpen(false);
    setVerificationResult(null);
    setVerificationError(null);
  }, []);

  return {
    verificationModalOpen,
    verificationResult,
    isVerifying,
    verifyingPRId,
    verificationError,
    getPRsForFinding,
    verifyFix,
    closeVerificationModal,
  };
}
