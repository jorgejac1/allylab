/**
 * useGitLab Hook Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGitLab } from '../../hooks/useGitLab';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useGitLab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkConnection', () => {
    it('fetches connection status on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          connected: true,
          provider: 'gitlab',
          instanceUrl: 'https://gitlab.com',
          user: { id: 1, username: 'testuser', name: 'Test User' },
          projects: [],
        }),
      });

      const { result } = renderHook(() => useGitLab());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.connection.connected).toBe(true);
      expect(result.current.connection.user?.username).toBe('testuser');
    });

    it('handles connection check failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useGitLab());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.connection.connected).toBe(false);
      expect(result.current.error).toBe('Failed to check GitLab connection');
    });
  });

  describe('connect', () => {
    it('connects with token and instance URL', async () => {
      // Initial connection check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ connected: false }),
      });

      const { result } = renderHook(() => useGitLab());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Connect call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          connected: true,
          provider: 'gitlab',
          instanceUrl: 'https://gitlab.mycompany.com',
          user: { id: 1, username: 'testuser' },
          projects: [],
        }),
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.connect('glpat-token', 'https://gitlab.mycompany.com');
      });

      expect(success!).toBe(true);
      expect(result.current.connection.connected).toBe(true);
      expect(result.current.connection.instanceUrl).toBe('https://gitlab.mycompany.com');
    });

    it('uses default instance URL if not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ connected: false }),
      });

      const { result } = renderHook(() => useGitLab());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          connected: true,
          instanceUrl: 'https://gitlab.com',
        }),
      });

      await act(async () => {
        await result.current.connect('glpat-token');
      });

      // Check that the default URL was used
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('https://gitlab.com'),
        })
      );
    });

    it('handles connection failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ connected: false }),
      });

      const { result } = renderHook(() => useGitLab());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid token' }),
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.connect('invalid-token');
      });

      expect(success!).toBe(false);
      expect(result.current.error).toBe('Invalid token');
    });
  });

  describe('disconnect', () => {
    it('disconnects and clears connection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          connected: true,
          user: { id: 1, username: 'testuser' },
        }),
      });

      const { result } = renderHook(() => useGitLab());

      await waitFor(() => {
        expect(result.current.connection.connected).toBe(true);
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ connected: false }),
      });

      await act(async () => {
        await result.current.disconnect();
      });

      expect(result.current.connection.connected).toBe(false);
    });
  });

  describe('getProjects', () => {
    it('fetches projects list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ connected: true }),
      });

      const { result } = renderHook(() => useGitLab());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, name: 'project-1', path_with_namespace: 'user/project-1' },
          { id: 2, name: 'project-2', path_with_namespace: 'user/project-2' },
        ],
      });

      let projects;
      await act(async () => {
        projects = await result.current.getProjects();
      });

      expect(projects).toHaveLength(2);
      expect(projects[0].name).toBe('project-1');
    });
  });

  describe('getBranches', () => {
    it('fetches branches for a project', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ connected: true }),
      });

      const { result } = renderHook(() => useGitLab());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { name: 'main', default: true },
          { name: 'develop', default: false },
        ],
      });

      let branches;
      await act(async () => {
        branches = await result.current.getBranches('user/project');
      });

      expect(branches).toHaveLength(2);
      expect(branches[0].name).toBe('main');
    });

    it('encodes project path in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ connected: true }),
      });

      const { result } = renderHook(() => useGitLab());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await act(async () => {
        await result.current.getBranches('user/my-project');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('user/my-project'))
      );
    });
  });

  describe('createMR', () => {
    it('creates a merge request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          connected: true,
          instanceUrl: 'https://gitlab.com',
        }),
      });

      const { result } = renderHook(() => useGitLab());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'mr-1',
          iid: 42,
          web_url: 'https://gitlab.com/user/project/-/merge_requests/42',
        }),
      });

      let mrResult;
      await act(async () => {
        mrResult = await result.current.createMR(
          'user/project',
          'main',
          [
            {
              filePath: 'src/index.html',
              originalContent: '<html>',
              fixedContent: '<html lang="en">',
              findingId: 'finding-1',
              ruleTitle: 'html-lang-valid',
            },
          ],
          'Fix: Add lang attribute'
        );
      });

      expect(mrResult.success).toBe(true);
      expect(mrResult.mr.iid).toBe(42);
    });

    it('handles MR creation failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ connected: true }),
      });

      const { result } = renderHook(() => useGitLab());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Permission denied' }),
      });

      let mrResult;
      await act(async () => {
        mrResult = await result.current.createMR(
          'user/project',
          'main',
          [{ filePath: 'src/index.html', originalContent: '', fixedContent: '', findingId: '', ruleTitle: '' }]
        );
      });

      expect(mrResult.success).toBe(false);
      expect(mrResult.error).toBe('Permission denied');
    });
  });

  describe('getFileContent', () => {
    it('fetches file content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ connected: true }),
      });

      const { result } = renderHook(() => useGitLab());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: '<html lang="en"></html>' }),
      });

      let content;
      await act(async () => {
        content = await result.current.getFileContent('user/project', 'src/index.html');
      });

      expect(content).toBe('<html lang="en"></html>');
    });

    it('returns null on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ connected: true }),
      });

      const { result } = renderHook(() => useGitLab());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'File not found' }),
      });

      let content;
      await act(async () => {
        content = await result.current.getFileContent('user/project', 'nonexistent.html');
      });

      expect(content).toBeNull();
    });
  });
});
