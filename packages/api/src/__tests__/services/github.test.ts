import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setGitHubToken,
  getGitHubToken,
  removeGitHubToken,
  getConnection,
  getRepos,
  getRepoBranches,
  getFileContent,
  createPullRequest,
  setSourceMappings,
  getSourceMapping,
  getPRStatus,
} from '../../services/github';

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('services/github', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    removeGitHubToken('test-user');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('token management', () => {
    describe('setGitHubToken', () => {
      it('stores token for user', () => {
        setGitHubToken('test-user', 'ghp_test_token');

        const token = getGitHubToken('test-user');
        expect(token).toBe('ghp_test_token');
      });
    });

    describe('getGitHubToken', () => {
      it('returns token when it exists', () => {
        setGitHubToken('test-user', 'ghp_test_token');

        const token = getGitHubToken('test-user');
        expect(token).toBe('ghp_test_token');
      });

      it('returns undefined when token does not exist', () => {
        const token = getGitHubToken('unknown-user');
        expect(token).toBeUndefined();
      });
    });

    describe('removeGitHubToken', () => {
      it('removes stored token', () => {
        setGitHubToken('test-user', 'ghp_test_token');
        removeGitHubToken('test-user');

        const token = getGitHubToken('test-user');
        expect(token).toBeUndefined();
      });
    });
  });

  describe('getConnection', () => {
    it('returns connected false when no token', async () => {
      const connection = await getConnection('unknown-user');

      expect(connection.connected).toBe(false);
    });

    it('returns connected true with user info when valid token', async () => {
      setGitHubToken('test-user', 'ghp_valid_token');

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              login: 'testuser',
              avatar_url: 'https://github.com/avatar.png',
              name: 'Test User',
            }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 1, name: 'repo1', full_name: 'testuser/repo1' },
            ]),
        } as unknown as Response);

      const connection = await getConnection('test-user');

      expect(connection.connected).toBe(true);
      expect(connection.user?.login).toBe('testuser');
      expect(connection.repos).toHaveLength(1);
    });

    it('returns connected false on API error', async () => {
      setGitHubToken('test-user', 'ghp_invalid_token');

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Bad credentials' }),
      } as unknown as Response);

      const connection = await getConnection('test-user');

      expect(connection.connected).toBe(false);
    });

    it('handles non-Error thrown value in getConnection', async () => {
      setGitHubToken('test-user', 'ghp_token');
      mockFetch.mockRejectedValue('network-down');

      const connection = await getConnection('test-user');

      expect(connection.connected).toBe(false);
    });

    it('handles non-Error thrown value in getFileContent', async () => {
      mockFetch.mockRejectedValue('random-failure');

      const file = await getFileContent('ghp_token', 'owner', 'repo', 'src/index.js');

      expect(file).toBeNull();
    });
  });

  describe('getRepos', () => {
    it('returns list of repositories', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 1, name: 'repo1', full_name: 'user/repo1' },
            { id: 2, name: 'repo2', full_name: 'user/repo2' },
          ]),
      } as unknown as Response);

      const repos = await getRepos('ghp_token');

      expect(repos).toHaveLength(2);
      expect(repos[0].name).toBe('repo1');
    });

    it('calls GitHub API with correct headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      } as unknown as Response);

      await getRepos('ghp_token');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/user/repos'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer ghp_token',
            Accept: 'application/vnd.github.v3+json',
          }),
        })
      );
    });

    it('throws using statusText when error JSON parsing fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('invalid json')),
      } as unknown as Response);

      await expect(getRepos('ghp_token')).rejects.toThrow('Internal Server Error');
    });

    it('throws generic GitHub API error when no message or statusText is available', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 502,
        statusText: '',
        json: () => Promise.reject(new Error('invalid json')),
      } as unknown as Response);

      await expect(getRepos('ghp_token')).rejects.toThrow('GitHub API error: 502');
    });
  });

  describe('getRepoBranches', () => {
    it('returns list of branches', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            { name: 'main', commit: { sha: 'abc123' } },
            { name: 'develop', commit: { sha: 'def456' } },
          ]),
      } as unknown as Response);

      const branches = await getRepoBranches('ghp_token', 'owner', 'repo');

      expect(branches).toHaveLength(2);
      expect(branches[0]).toEqual({ name: 'main', sha: 'abc123' });
    });
  });

  describe('getFileContent', () => {
    it('returns file content and sha', async () => {
      const content = Buffer.from('console.log("hello")').toString('base64');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            content,
            sha: 'file_sha_123',
            encoding: 'base64',
          }),
      } as unknown as Response);

      const file = await getFileContent('ghp_token', 'owner', 'repo', 'src/index.js');

      expect(file?.content).toBe('console.log("hello")');
      expect(file?.sha).toBe('file_sha_123');
    });

    it('includes branch in request when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            content: Buffer.from('test').toString('base64'),
            sha: 'sha123',
            encoding: 'base64',
          }),
      } as unknown as Response);

      await getFileContent('ghp_token', 'owner', 'repo', 'file.txt', 'feature-branch');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('?ref=feature-branch'),
        expect.anything()
      );
    });

    it('returns null on error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Not Found' }),
      } as unknown as Response);

      const file = await getFileContent('ghp_token', 'owner', 'repo', 'missing.txt');

      expect(file).toBeNull();
    });
  });

  describe('createPullRequest', () => {
    beforeEach(() => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              commit: { sha: 'base_sha_123' },
            }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              ref: 'refs/heads/allylab/a11y-fixes-123',
            }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              content: Buffer.from('<img>').toString('base64'),
              sha: 'file_sha_123',
              encoding: 'base64',
            }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              content: { sha: 'new_file_sha' },
            }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              number: 42,
              html_url: 'https://github.com/owner/repo/pull/42',
            }),
        } as unknown as Response);
    });

    it('creates PR with fixes', async () => {
      const result = await createPullRequest('ghp_token', {
        owner: 'owner',
        repo: 'repo',
        baseBranch: 'main',
        fixes: [
          {
            findingId: 'finding-1',
            ruleTitle: 'Image alt text',
            filePath: 'src/index.html',
            originalContent: '<img>',
            fixedContent: '<img alt="description">',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.prNumber).toBe(42);
      expect(result.prUrl).toBe('https://github.com/owner/repo/pull/42');
      expect(result.branchName).toMatch(/^allylab\/a11y-fixes-/);
    });

    it('uses custom title when provided', async () => {
      await createPullRequest('ghp_token', {
        owner: 'owner',
        repo: 'repo',
        baseBranch: 'main',
        fixes: [
          {
            findingId: 'finding-1',
            ruleTitle: 'Image alt text',
            filePath: 'src/index.html',
            originalContent: '<img>',
            fixedContent: '<img alt="description">',
          },
        ],
        title: 'Custom PR Title',
      });

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const body = JSON.parse((lastCall[1] as RequestInit).body as string);
      expect(body.title).toBe('Custom PR Title');
    });

    it('returns error on failure', async () => {
      mockFetch.mockReset();
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ message: 'Forbidden' }),
      } as unknown as Response);

      const result = await createPullRequest('ghp_token', {
        owner: 'owner',
        repo: 'repo',
        baseBranch: 'main',
        fixes: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('skips fix when file content is missing', async () => {
      mockFetch.mockReset();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ commit: { sha: 'base_sha_123' } }),
      } as unknown as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ ref: 'refs/heads/allylab/a11y-fixes-xyz' }),
      } as unknown as Response);

      // Simulate file not found
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Not Found' }),
      } as unknown as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            number: 77,
            html_url: 'https://github.com/owner/repo/pull/77',
          }),
      } as unknown as Response);

      const result = await createPullRequest('ghp_token', {
        owner: 'owner',
        repo: 'repo',
        baseBranch: 'main',
        fixes: [
          {
            findingId: 'missing-file',
            ruleTitle: 'Missing file test',
            filePath: 'src/ghost.html',
            originalContent: '',
            fixedContent: '',
          },
        ],
      });

      // PR should still succeed, just skip the missing file
      expect(result.success).toBe(true);
    });

    it('adds plural s in PR title when multiple fixes exist', async () => {
      mockFetch.mockReset();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ commit: { sha: 'base_sha' } }),
      } as unknown as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ ref: 'refs/heads/allylab/a11y-fixes-test' }),
      } as unknown as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: Buffer.from('one').toString('base64'),
            sha: 'sha-one',
            encoding: 'base64',
          }),
      } as unknown as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ content: { sha: 'new-sha1' } }),
      } as unknown as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: Buffer.from('two').toString('base64'),
            sha: 'sha-two',
            encoding: 'base64',
          }),
      } as unknown as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ content: { sha: 'new-sha2' } }),
      } as unknown as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            number: 88,
            html_url: 'https://github.com/owner/repo/pull/88',
          }),
      } as unknown as Response);

      await createPullRequest('ghp_token', {
        owner: 'owner',
        repo: 'repo',
        baseBranch: 'main',
        fixes: [
          {
            findingId: '1',
            ruleTitle: 'Alt text',
            filePath: 'a.html',
            originalContent: '',
            fixedContent: '',
          },
          {
            findingId: '2',
            ruleTitle: 'Button name',
            filePath: 'b.html',
            originalContent: '',
            fixedContent: '',
          },
        ],
      });

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const body = JSON.parse((lastCall[1] as RequestInit).body as string);

      expect(body.title).toContain('2 issues');
    });

    it('handles non-Error thrown value in PR creation', async () => {
      mockFetch.mockReset();
      mockFetch.mockRejectedValue('something-bad');

      const result = await createPullRequest('ghp_token', {
        owner: 'owner',
        repo: 'repo',
        baseBranch: 'main',
        fixes: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('source mappings', () => {
    describe('setSourceMappings', () => {
      it('stores mappings for repo', () => {
        setSourceMappings('owner/repo', [
          { selector: '#header', filePath: 'src/Header.tsx' },
        ]);

        const mapping = getSourceMapping('owner/repo', '#header');
        expect(mapping?.filePath).toBe('src/Header.tsx');
      });
    });

    describe('getSourceMapping', () => {
      it('returns mapping when it exists', () => {
        setSourceMappings('owner/repo', [
          { selector: '#header', filePath: 'src/Header.tsx', lineNumber: 10 },
        ]);

        const mapping = getSourceMapping('owner/repo', '#header');

        expect(mapping).toEqual({
          selector: '#header',
          filePath: 'src/Header.tsx',
          lineNumber: 10,
        });
      });

      it('returns undefined when repo has no mappings', () => {
        const mapping = getSourceMapping('unknown/repo', '#header');
        expect(mapping).toBeUndefined();
      });

      it('returns undefined when selector not found', () => {
        setSourceMappings('owner/repo', [
          { selector: '#header', filePath: 'src/Header.tsx' },
        ]);

        const mapping = getSourceMapping('owner/repo', '#footer');
        expect(mapping).toBeUndefined();
      });
    });
  });

  describe('getPRStatus', () => {
    it('returns PR status when it exists', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            number: 42,
            state: 'open',
            merged: false,
            merged_at: null,
            html_url: 'https://github.com/owner/repo/pull/42',
            title: 'Fix accessibility issues',
            head: { ref: 'allylab/a11y-fixes' },
            base: { ref: 'main' },
          }),
      } as unknown as Response);

      const status = await getPRStatus('ghp_token', 'owner', 'repo', 42);

      expect(status).toMatchObject({
        number: 42,
        state: 'open',
        merged: false,
        title: 'Fix accessibility issues',
      });
    });

    it('returns merged status', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            number: 42,
            state: 'closed',
            merged: true,
            merged_at: '2024-01-15T12:00:00Z',
            html_url: 'https://github.com/owner/repo/pull/42',
            title: 'Fix accessibility issues',
            head: { ref: 'allylab/a11y-fixes' },
            base: { ref: 'main' },
          }),
      } as unknown as Response);

      const status = await getPRStatus('ghp_token', 'owner', 'repo', 42);

      expect(status?.merged).toBe(true);
      expect(status?.merged_at).toBe('2024-01-15T12:00:00Z');
    });

    it('returns null on error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Not Found' }),
      } as unknown as Response);

      const status = await getPRStatus('ghp_token', 'owner', 'repo', 999);

      expect(status).toBeNull();
    });

    it('handles non-Error thrown value in getPRStatus', async () => {
      mockFetch.mockRejectedValue('pr-status-fail');

      const status = await getPRStatus('ghp_token', 'owner', 'repo', 42);

      expect(status).toBeNull();
    });
  });
});
