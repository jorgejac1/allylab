/**
 * useGitLab Hook
 *
 * Manages GitLab connection state and provides methods for interacting
 * with GitLab API. Supports both GitLab.com and self-hosted instances.
 */

import { useState, useEffect, useCallback } from 'react';
import { getApiBase } from '../utils/api';
import type {
  GitLabConnection,
  GitLabProject,
  GitLabBranch,
  GitLabMRResult,
  GitLabFile,
  GitLabCodeSearchResult,
} from '../types/gitlab';

export function useGitLab() {
  const [connection, setConnection] = useState<GitLabConnection>({ connected: false });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${getApiBase()}/gitlab/connection`);
      const data = await response.json();
      setConnection(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useGitLab] Failed to check connection:', message);
      setError('Failed to check GitLab connection');
      setConnection({ connected: false });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connect = useCallback(async (token: string, instanceUrl = 'https://gitlab.com'): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${getApiBase()}/gitlab/connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, instanceUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        setConnection(data);
        return true;
      } else {
        const data = await response.json();
        const errorMessage = data.error || 'Failed to connect';
        console.error('[useGitLab] Connection failed:', errorMessage);
        setError(errorMessage);
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      console.error('[useGitLab] Failed to connect:', message);
      setError('Failed to connect to GitLab');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await fetch(`${getApiBase()}/gitlab/connection`, { method: 'DELETE' });
      setConnection({ connected: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useGitLab] Failed to disconnect:', message);
      setError('Failed to disconnect');
    }
  }, []);

  const getProjects = useCallback(async (): Promise<GitLabProject[]> => {
    try {
      const response = await fetch(`${getApiBase()}/gitlab/projects`);
      if (response.ok) {
        return await response.json();
      }
      console.error('[useGitLab] Failed to fetch projects:', response.status);
      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      console.error('[useGitLab] Failed to fetch projects:', message);
      return [];
    }
  }, []);

  const getBranches = useCallback(async (projectPath: string): Promise<GitLabBranch[]> => {
    try {
      const encodedPath = encodeURIComponent(projectPath);
      const response = await fetch(`${getApiBase()}/gitlab/projects/${encodedPath}/branches`);
      if (response.ok) {
        return await response.json();
      }
      console.error('[useGitLab] Failed to fetch branches:', response.status);
      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      console.error('[useGitLab] Failed to fetch branches:', message);
      return [];
    }
  }, []);

  const searchCode = useCallback(async (
    projectPath: string,
    query: string
  ): Promise<GitLabCodeSearchResult[]> => {
    const encodedPath = encodeURIComponent(projectPath);
    const response = await fetch(
      `${getApiBase()}/gitlab/projects/${encodedPath}/search?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Search failed');
    }

    return response.json();
  }, []);

  const getProjectTree = useCallback(async (
    projectPath: string,
    branch?: string
  ): Promise<GitLabFile[]> => {
    const encodedPath = encodeURIComponent(projectPath);
    const url = `${getApiBase()}/gitlab/projects/${encodedPath}/tree${branch ? `?ref=${branch}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch files');
    }

    return response.json();
  }, []);

  const getFileContent = useCallback(async (
    projectPath: string,
    filePath: string,
    branch?: string
  ): Promise<string | null> => {
    try {
      const encodedProjectPath = encodeURIComponent(projectPath);
      const url = `${getApiBase()}/gitlab/projects/${encodedProjectPath}/file?path=${encodeURIComponent(filePath)}${branch ? `&ref=${branch}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.error('[useGitLab] Failed to fetch file:', response.status);
        return null;
      }

      const data = await response.json();
      return data.content || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      console.error('[useGitLab] Failed to fetch file content:', message);
      return null;
    }
  }, []);

  const createMR = useCallback(async (
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
    try {
      const response = await fetch(`${getApiBase()}/gitlab/mr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: projectPath,
          targetBranch,
          sourceBranch: customBranchName || `allylab/a11y-fixes-${Date.now()}`,
          files: fixes.map(fix => ({
            path: fix.filePath,
            content: fix.fixedContent,
          })),
          title: title || 'Accessibility fixes from AllyLab',
          description: description || `This MR contains automated accessibility fixes.\n\n## Changes\n${fixes.map(f => `- ${f.ruleTitle}`).join('\n')}`,
          instanceUrl: connection.instanceUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('[useGitLab] MR creation failed:', result.error);
        return { success: false, error: result.error };
      }

      return { success: true, mr: result };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      console.error('[useGitLab] Failed to create MR:', message);
      return { success: false, error: 'Failed to create MR' };
    }
  }, [connection.instanceUrl]);

  return {
    connection,
    isLoading,
    error,
    connect,
    disconnect,
    checkConnection,
    getProjects,
    getBranches,
    searchCode,
    getProjectTree,
    getFileContent,
    createMR,
  };
}
