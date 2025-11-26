import { useState, useEffect, useCallback } from 'react';
import { getApiBase } from '../utils/api';
import type { GitHubConnection, GitHubRepo, GitHubBranch, PRResult } from '../types/github';

export function useGitHub() {
  const [connection, setConnection] = useState<GitHubConnection>({ connected: false });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${getApiBase()}/github/status`);
      const data = await response.json();
      setConnection(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useGitHub] Failed to check connection:', message);
      setError('Failed to check GitHub connection');
      setConnection({ connected: false });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connect = async (token: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${getApiBase()}/github/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        await checkConnection();
        return true;
      } else {
        const data = await response.json();
        const errorMessage = data.error || 'Failed to connect';
        console.error('[useGitHub] Connection failed:', errorMessage);
        setError(errorMessage);
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      console.error('[useGitHub] Failed to connect:', message);
      setError('Failed to connect to GitHub');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async (): Promise<void> => {
    try {
      setError(null);
      await fetch(`${getApiBase()}/github/disconnect`, { method: 'POST' });
      setConnection({ connected: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useGitHub] Failed to disconnect:', message);
      setError('Failed to disconnect');
    }
  };

  const getRepos = async (): Promise<GitHubRepo[]> => {
    try {
      const response = await fetch(`${getApiBase()}/github/repos`);
      if (response.ok) {
        return await response.json();
      }
      console.error('[useGitHub] Failed to fetch repos:', response.status);
      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      console.error('[useGitHub] Failed to fetch repos:', message);
      return [];
    }
  };

  const getBranches = async (owner: string, repo: string): Promise<GitHubBranch[]> => {
    try {
      const response = await fetch(`${getApiBase()}/github/repos/${owner}/${repo}/branches`);
      if (response.ok) {
        return await response.json();
      }
      console.error('[useGitHub] Failed to fetch branches:', response.status);
      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      console.error('[useGitHub] Failed to fetch branches:', message);
      return [];
    }
  };

  const createPR = async (
    owner: string,
    repo: string,
    baseBranch: string,
    fixes: {
      filePath: string;
      originalContent: string;
      fixedContent: string;
      findingId: string;
      ruleTitle: string;
    }[],
    title?: string,
    description?: string
  ): Promise<PRResult> => {
    try {
      const response = await fetch(`${getApiBase()}/github/pr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, baseBranch, fixes, title, description }),
      });

      const result = await response.json();
      
      if (!result.success) {
        console.error('[useGitHub] PR creation failed:', result.error);
      }
      
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      console.error('[useGitHub] Failed to create PR:', message);
      return { success: false, error: 'Failed to create PR' };
    }
  };

  return {
    connection,
    isLoading,
    error,
    connect,
    disconnect,
    checkConnection,
    getRepos,
    getBranches,
    createPR,
  };
}