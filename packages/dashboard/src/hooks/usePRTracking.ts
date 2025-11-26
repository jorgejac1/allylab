import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { getApiBase } from '../utils/api';
import type { PRTrackingInfo, PRStatus, VerificationResult, PRResult } from '../types/github';

interface TrackPROptions {
  scanUrl: string;
  scanStandard?: string;
  scanViewport?: string;
}

export function usePRTracking() {
  const [trackedPRs, setTrackedPRs] = useLocalStorage<PRTrackingInfo[]>('allylab_tracked_prs', []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track a new PR
  const trackPR = useCallback((
    prResult: PRResult,
    owner: string,
    repo: string,
    findingIds: string[],
    options: TrackPROptions
  ) => {
    if (!prResult.success || !prResult.prNumber || !prResult.prUrl || !prResult.branchName) {
      console.error('[usePRTracking] Invalid PR result');
      return;
    }

    const newTracking: PRTrackingInfo = {
      id: `pr_${prResult.prNumber}_${Date.now()}`,
      prNumber: prResult.prNumber,
      prUrl: prResult.prUrl,
      owner,
      repo,
      branchName: prResult.branchName,
      findingIds,
      createdAt: new Date().toISOString(),
      status: 'open',
      scanUrl: options.scanUrl,
      scanStandard: options.scanStandard,
      scanViewport: options.scanViewport,
    };

    setTrackedPRs(prev => [...prev, newTracking]);
    console.log(`[usePRTracking] Tracking PR #${prResult.prNumber}`);
  }, [setTrackedPRs]);

  // Get PR status from GitHub
  const checkPRStatus = useCallback(async (owner: string, repo: string, prNumber: number): Promise<PRStatus | null> => {
    try {
      const response = await fetch(`${getApiBase()}/github/repos/${owner}/${repo}/pulls/${prNumber}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get PR status');
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[usePRTracking] Failed to check PR status:', message);
      return null;
    }
  }, []);

  // Refresh status for all tracked PRs
  const refreshAllStatuses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const updates: PRTrackingInfo[] = await Promise.all(
        trackedPRs.map(async (pr) => {
          const status = await checkPRStatus(pr.owner, pr.repo, pr.prNumber);
          
          if (status) {
            return {
              ...pr,
              status: status.merged ? 'merged' : status.state === 'closed' ? 'closed' : 'open',
              mergedAt: status.merged_at || undefined,
            };
          }
          return pr;
        })
      );

      setTrackedPRs(updates);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[usePRTracking] Failed to refresh statuses:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [trackedPRs, checkPRStatus, setTrackedPRs]);

  // Verify fixes for a PR - uses stored scan settings
  const verifyFixes = useCallback(async (
    prId: string
  ): Promise<VerificationResult | null> => {
    const pr = trackedPRs.find(p => p.id === prId);
    if (!pr) {
      console.error('[usePRTracking] PR not found:', prId);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getApiBase()}/github/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: pr.scanUrl,
          findingIds: pr.findingIds,
          prNumber: pr.prNumber,
          owner: pr.owner,
          repo: pr.repo,
          standard: pr.scanStandard,
          viewport: pr.scanViewport,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Verification failed');
      }

      // Update tracking with verification result
      setTrackedPRs(prev => prev.map(p => {
        if (p.id === prId) {
          return {
            ...p,
            verificationStatus: result.allFixed ? 'verified' : 'failed',
            verifiedAt: new Date().toISOString(),
          };
        }
        return p;
      }));

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[usePRTracking] Verification failed:', message);
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [trackedPRs, setTrackedPRs]);

  // Get PRs for specific finding
  const getPRsForFinding = useCallback((findingId: string): PRTrackingInfo[] => {
    return trackedPRs.filter(pr => pr.findingIds.includes(findingId));
  }, [trackedPRs]);

  // Remove a tracked PR
  const removePR = useCallback((prId: string) => {
    setTrackedPRs(prev => prev.filter(p => p.id !== prId));
  }, [setTrackedPRs]);

  // Clear all tracked PRs
  const clearAll = useCallback(() => {
    setTrackedPRs([]);
  }, [setTrackedPRs]);

  return {
    trackedPRs,
    isLoading,
    error,
    trackPR,
    checkPRStatus,
    refreshAllStatuses,
    verifyFixes,
    getPRsForFinding,
    removePR,
    clearAll,
  };
}