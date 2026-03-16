/**
 * useGitLabMR Hook
 *
 * Wraps useGitLab() and adds MR tracking via gitlabTracking utilities.
 * Provides a unified interface for GitLab operations with automatic
 * tracking of created Merge Requests.
 */

import { useState, useCallback } from 'react';
import { useGitLab } from './useGitLab';
import { getApiBase } from '../utils/api';
import { trackMR, getTrackedMRs, getMRForFinding as getMRForFindingUtil, updateMRVerification } from '../utils/gitlabTracking';
import type {
  GitLabConnection,
  GitLabProject,
  GitLabBranch,
  GitLabMRResult,
  GitLabFile,
  GitLabCodeSearchResult,
  GitLabMRTracking,
} from '../types/gitlab';

export interface GitLabVerificationResult {
  success: boolean;
  findingsVerified: {
    findingId: string;
    ruleId: string;
    stillPresent: boolean;
  }[];
  allFixed: boolean;
  scanScore: number;
  scanTimestamp: string;
  mrIid?: number;
  projectPath?: string;
  error?: string;
}

export interface UseGitLabMRResult {
  // Pass-through from useGitLab
  connection: GitLabConnection;
  isLoading: boolean;
  error: string | null;
  connect: (token: string, instanceUrl?: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  getProjects: () => Promise<GitLabProject[]>;
  getBranches: (projectPath: string) => Promise<GitLabBranch[]>;
  searchCode: (projectPath: string, query: string) => Promise<GitLabCodeSearchResult[]>;
  getProjectTree: (projectPath: string, branch?: string) => Promise<GitLabFile[]>;
  getFileContent: (projectPath: string, filePath: string, branch?: string) => Promise<string | null>;

  // MR creation with tracking
  createTrackedMR: (
    projectPath: string,
    targetBranch: string,
    fixes: {
      filePath: string;
      originalContent: string;
      fixedContent: string;
      findingId: string;
      ruleTitle: string;
    }[],
    title?: string,
    description?: string,
    customBranchName?: string
  ) => Promise<GitLabMRResult>;

  // Tracking
  trackedMRs: GitLabMRTracking[];
  getMRForFinding: (findingId: string) => GitLabMRTracking | undefined;
  refreshTracking: () => void;

  // Verification
  verifyFixes: (mrTrackingId: string) => Promise<GitLabVerificationResult | null>;
  checkMRStatus: (projectPath: string, mrIid: number) => Promise<string | null>;
  refreshAllStatuses: () => Promise<void>;
  isVerifying: boolean;
  verifyingMRId: string | null;
}

export function useGitLabMR(): UseGitLabMRResult {
  const gitlab = useGitLab();
  const [trackedMRs, setTrackedMRs] = useState<GitLabMRTracking[]>(() => getTrackedMRs());

  const refreshTracking = useCallback(() => {
    setTrackedMRs(getTrackedMRs());
  }, []);

  const getMRForFinding = useCallback((findingId: string): GitLabMRTracking | undefined => {
    return getMRForFindingUtil(findingId);
  }, []);

  const createTrackedMR = useCallback(async (
    projectPath: string,
    targetBranch: string,
    fixes: {
      filePath: string;
      originalContent: string;
      fixedContent: string;
      findingId: string;
      ruleTitle: string;
    }[],
    title?: string,
    description?: string,
    customBranchName?: string
  ): Promise<GitLabMRResult> => {
    const result = await gitlab.createMR(
      projectPath,
      targetBranch,
      fixes,
      title,
      description,
      customBranchName
    );

    if (result.success && result.mr) {
      const findingIds = fixes.map((f) => f.findingId);

      trackMR({
        findingIds,
        projectPath,
        mrIid: result.mr.iid,
        mrUrl: result.mr.web_url,
        sourceBranch: result.mr.source_branch,
        targetBranch: result.mr.target_branch,
        status: result.mr.state,
        createdAt: result.mr.created_at,
      });

      refreshTracking();
    }

    return result;
  }, [gitlab, refreshTracking]);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyingMRId, setVerifyingMRId] = useState<string | null>(null);

  const verifyFixes = useCallback(async (mrTrackingId: string): Promise<GitLabVerificationResult | null> => {
    const mr = trackedMRs.find(m => m.id === mrTrackingId);
    if (!mr) return null;

    setIsVerifying(true);
    setVerifyingMRId(mrTrackingId);

    try {
      const response = await fetch(`${getApiBase()}/gitlab/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: mr.scanUrl || '',
          findingIds: mr.findingIds,
          mrIid: mr.mrIid,
          projectPath: mr.projectPath,
          standard: mr.scanStandard,
          viewport: mr.scanViewport,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const status = result.allFixed ? 'verified' : 'failed';
        updateMRVerification(mrTrackingId, status, new Date().toISOString());
        refreshTracking();
      }

      return result;
    } catch (err) {
      console.error('[useGitLabMR] Verification failed:', err);
      return null;
    } finally {
      setIsVerifying(false);
      setVerifyingMRId(null);
    }
  }, [trackedMRs, refreshTracking]);

  const checkMRStatus = useCallback(async (projectPath: string, mrIid: number): Promise<string | null> => {
    try {
      const encodedPath = encodeURIComponent(projectPath);
      const response = await fetch(`${getApiBase()}/gitlab/projects/${encodedPath}/mr/${mrIid}`);
      if (response.ok) {
        const data = await response.json();
        return data.state || null;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const refreshAllStatuses = useCallback(async () => {
    const mrs = getTrackedMRs();
    for (const mr of mrs) {
      const state = await checkMRStatus(mr.projectPath, mr.mrIid);
      if (state && state !== mr.status) {
        const updated = mrs.map(m =>
          m.id === mr.id ? { ...m, status: state as 'opened' | 'merged' | 'closed' } : m
        );
        localStorage.setItem('allylab_tracked_mrs_gitlab', JSON.stringify(updated));
      }
    }
    refreshTracking();
  }, [checkMRStatus, refreshTracking]);

  return {
    // Pass-through
    connection: gitlab.connection,
    isLoading: gitlab.isLoading,
    error: gitlab.error,
    connect: gitlab.connect,
    disconnect: gitlab.disconnect,
    getProjects: gitlab.getProjects,
    getBranches: gitlab.getBranches,
    searchCode: gitlab.searchCode,
    getProjectTree: gitlab.getProjectTree,
    getFileContent: gitlab.getFileContent,

    // MR with tracking
    createTrackedMR,

    // Tracking
    trackedMRs,
    getMRForFinding,
    refreshTracking,

    // Verification
    verifyFixes,
    checkMRStatus,
    refreshAllStatuses,
    isVerifying,
    verifyingMRId,
  };
}
