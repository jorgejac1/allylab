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

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('services/github', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    
    // Clear tokens
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
          json: () => Promise.resolve({
            login: 'testuser',
            avatar_url: 'https://github.com/avatar.png',
            name: 'Test User',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, name: 'repo1', full_name: 'testuser/repo1' },
          ]),
        });

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
        json: () => Promise.resolve({ message: 'Bad credentials' }),
      });

      const connection = await getConnection('test-user');

      expect(connection.connected).toBe(false);
    });
  });

  describe('getRepos', () => {
    it('returns list of repositories', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([
          { id: 1, name: 'repo1', full_name: 'user/repo1' },
          { id: 2, name: 'repo2', full_name: 'user/repo2' },
        ]),
      });

      const repos = await getRepos('ghp_token');

      expect(repos).toHaveLength(2);
      expect(repos[0].name).toBe('repo1');
    });

    it('calls GitHub API with correct headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await getRepos('ghp_token');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/user/repos'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer ghp_token',
            'Accept': 'application/vnd.github.v3+json',
          }),
        })
      );
    });
  });

  describe('getRepoBranches', () => {
    it('returns list of branches', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([
          { name: 'main', commit: { sha: 'abc123' } },
          { name: 'develop', commit: { sha: 'def456' } },
        ]),
      });

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
        json: () => Promise.resolve({
          content,
          sha: 'file_sha_123',
          encoding: 'base64',
        }),
      });

      const file = await getFileContent('ghp_token', 'owner', 'repo', 'src/index.js');

      expect(file?.content).toBe('console.log("hello")');
      expect(file?.sha).toBe('file_sha_123');
    });

    it('includes branch in request when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          content: Buffer.from('test').toString('base64'),
          sha: 'sha123',
          encoding: 'base64',
        }),
      });

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
        json: () => Promise.resolve({ message: 'Not Found' }),
      });

      const file = await getFileContent('ghp_token', 'owner', 'repo', 'missing.txt');

      expect(file).toBeNull();
    });
  });

  describe('createPullRequest', () => {
    beforeEach(() => {
      // Setup mock responses for PR creation flow
      mockFetch
        // Get base branch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            commit: { sha: 'base_sha_123' },
          }),
        })
        // Create branch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ref: 'refs/heads/allylab/a11y-fixes-123',
          }),
        })
        // Get file content
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            content: Buffer.from('<img>').toString('base64'),
            sha: 'file_sha_123',
            encoding: 'base64',
          }),
        })
        // Update file
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            content: { sha: 'new_file_sha' },
          }),
        })
        // Create PR
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            number: 42,
            html_url: 'https://github.com/owner/repo/pull/42',
          }),
        });
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

      // Last call should be creating the PR
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const body = JSON.parse(lastCall[1].body);
      expect(body.title).toBe('Custom PR Title');
    });

    it('returns error on failure', async () => {
      mockFetch.mockReset();
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ message: 'Forbidden' }),
      });

      const result = await createPullRequest('ghp_token', {
        owner: 'owner',
        repo: 'repo',
        baseBranch: 'main',
        fixes: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
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
        json: () => Promise.resolve({
          number: 42,
          state: 'open',
          merged: false,
          merged_at: null,
          html_url: 'https://github.com/owner/repo/pull/42',
          title: 'Fix accessibility issues',
          head: { ref: 'allylab/a11y-fixes' },
          base: { ref: 'main' },
        }),
      });

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
        json: () => Promise.resolve({
          number: 42,
          state: 'closed',
          merged: true,
          merged_at: '2024-01-15T12:00:00Z',
          html_url: 'https://github.com/owner/repo/pull/42',
          title: 'Fix accessibility issues',
          head: { ref: 'allylab/a11y-fixes' },
          base: { ref: 'main' },
        }),
      });

      const status = await getPRStatus('ghp_token', 'owner', 'repo', 42);

      expect(status?.merged).toBe(true);
      expect(status?.merged_at).toBe('2024-01-15T12:00:00Z');
    });

    it('returns null on error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not Found' }),
      });

      const status = await getPRStatus('ghp_token', 'owner', 'repo', 999);

      expect(status).toBeNull();
    });
  });
});