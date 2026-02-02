import { config } from '../config/env.js';
import { githubLogger } from '../utils/logger.js';
import type {
  GitHubRepo,
  GitHubConnection,
  CreatePRRequest,
  PRResult,
  PRStatus
} from '../types/github.js';

// ============================================
// Cache Configuration
// ============================================

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class ApiCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private ttl: number;

  constructor(ttlMs: number = CACHE_TTL) {
    this.ttl = ttlMs;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Caches for different data types
const userCache = new ApiCache<{ login: string; avatar_url: string; name: string }>();
const reposCache = new ApiCache<GitHubRepo[]>();
const branchesCache = new ApiCache<{ name: string; sha: string }[]>();
const treeCache = new ApiCache<RepoFile[]>();

// In-memory storage for GitHub tokens (replace with DB later)
const githubTokens = new Map<string, string>();

interface GitHubErrorResponse {
  message?: string;
}

async function githubFetch<T>(
  endpoint: string, 
  token: string, 
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${config.githubApiUrl}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'AllyLab/1.0',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText })) as GitHubErrorResponse;
    throw new Error(errorData.message || `GitHub API error: ${response.status}`);
  }

  const data = await response.json() as T;
  return data;
}

// ============================================
// Token Management
// ============================================

export function setGitHubToken(userId: string, token: string): void {
  githubTokens.set(userId, token);
  // Invalidate user-specific caches when token changes
  userCache.invalidatePattern(userId);
  reposCache.invalidatePattern(userId);
  githubLogger.info({ msg: 'Token stored', userId });
}

export function getGitHubToken(userId: string): string | undefined {
  return githubTokens.get(userId);
}

export function removeGitHubToken(userId: string): void {
  githubTokens.delete(userId);
  // Clear caches for this user
  userCache.invalidatePattern(userId);
  reposCache.invalidatePattern(userId);
  githubLogger.info({ msg: 'Token removed', userId });
}

/**
 * Clear all GitHub API caches
 */
export function clearGitHubCache(): void {
  userCache.clear();
  reposCache.clear();
  branchesCache.clear();
  treeCache.clear();
  githubLogger.info({ msg: 'GitHub cache cleared' });
}

/**
 * Get GitHub cache stats
 */
export function getGitHubCacheStats(): Record<string, number> {
  return {
    users: userCache.size(),
    repos: reposCache.size(),
    branches: branchesCache.size(),
    trees: treeCache.size(),
  };
}

// ============================================
// Connection & User
// ============================================

export async function getConnection(userId: string): Promise<GitHubConnection> {
  const token = githubTokens.get(userId);

  if (!token) {
    return { connected: false };
  }

  const userCacheKey = `user:${userId}`;
  const reposCacheKey = `repos:${userId}`;

  try {
    // Check cache for user data
    let user = userCache.get(userCacheKey);
    if (!user) {
      user = await githubFetch<{
        login: string;
        avatar_url: string;
        name: string;
      }>('/user', token);
      userCache.set(userCacheKey, user);
    }

    // Check cache for repos
    let repos = reposCache.get(reposCacheKey);
    if (!repos) {
      repos = await githubFetch<GitHubRepo[]>(
        '/user/repos?per_page=100&sort=updated',
        token
      );
      reposCache.set(reposCacheKey, repos);
    }

    return {
      connected: true,
      user: {
        login: user.login,
        avatar_url: user.avatar_url,
        name: user.name,
      },
      repos,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    githubLogger.error({ msg: 'Connection check failed', userId, error: message });
    return { connected: false };
  }
}

// ============================================
// Repository Operations
// ============================================

export async function getRepos(token: string): Promise<GitHubRepo[]> {
  // Note: Can't cache easily without userId context
  return githubFetch<GitHubRepo[]>('/user/repos?per_page=100&sort=updated', token);
}

export async function getRepoBranches(
  token: string,
  owner: string,
  repo: string
): Promise<{ name: string; sha: string }[]> {
  const cacheKey = `branches:${owner}/${repo}`;

  // Check cache
  const cached = branchesCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const branches = await githubFetch<{ name: string; commit: { sha: string } }[]>(
    `/repos/${owner}/${repo}/branches`,
    token
  );
  const result = branches.map(b => ({ name: b.name, sha: b.commit.sha }));

  // Cache the result
  branchesCache.set(cacheKey, result);

  return result;
}

export async function getFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string,
  branch?: string
): Promise<{ content: string; sha: string } | null> {
  try {
    const endpoint = `/repos/${owner}/${repo}/contents/${path}${branch ? `?ref=${branch}` : ''}`;
    const file = await githubFetch<{
      content: string;
      sha: string;
      encoding: string;
    }>(endpoint, token);

    const content = Buffer.from(file.content, 'base64').toString('utf-8');
    return { content, sha: file.sha };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    githubLogger.error({ msg: 'Failed to get file content', owner, repo, path, error: message });
    return null;
  }
}

// ============================================
// Code Search
// ============================================

export interface CodeSearchResult {
  path: string;
  repository: string;
  url: string;
  htmlUrl: string;
  matchedLines: Array<{
    lineNumber: number;
    content: string;
  }>;
}

export async function searchCode(
  token: string,
  owner: string,
  repo: string,
  query: string
): Promise<CodeSearchResult[]> {
  const searchQuery = encodeURIComponent(`${query} repo:${owner}/${repo}`);
  
  const response = await fetch(
    `https://api.github.com/search/code?q=${searchQuery}&per_page=10`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3.text-match+json',
        'User-Agent': 'AllyLab/1.0',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    githubLogger.error({ msg: 'Code search failed', status: response.status, error: errorText });
    throw new Error(`GitHub code search failed: ${response.status}`);
  }

  interface GitHubCodeSearchItem {
    path: string;
    repository: { full_name: string };
    url: string;
    html_url: string;
    text_matches?: Array<{
      fragment: string;
      matches: Array<{ indices: [number, number] }>;
    }>;
  }

  interface GitHubCodeSearchResponse {
    total_count: number;
    incomplete_results: boolean;
    items: GitHubCodeSearchItem[];
  }

  const data = await response.json() as GitHubCodeSearchResponse;

  return data.items.map((item) => ({
    path: item.path,
    repository: item.repository.full_name,
    url: item.url,
    htmlUrl: item.html_url,
    matchedLines: (item.text_matches || []).map((match) => ({
      lineNumber: 0,
      content: match.fragment.substring(0, 100) + (match.fragment.length > 100 ? '...' : ''),
    })),
  }));
}

// ============================================
// Repository File Tree
// ============================================

export interface RepoFile {
  path: string;
  type: 'file' | 'dir';
  size?: number;
}

export async function getRepoTree(
  token: string,
  owner: string,
  repo: string,
  branch: string = 'main'
): Promise<RepoFile[]> {
  const cacheKey = `tree:${owner}/${repo}:${branch}`;

  // Check cache
  const cached = treeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AllyLab/1.0',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    githubLogger.error({ msg: 'Tree fetch failed', owner, repo, branch, status: response.status, error: errorText });
    throw new Error(`GitHub tree fetch failed: ${response.status}`);
  }

  interface GitHubTreeItem {
    path: string;
    type: 'blob' | 'tree';
    size?: number;
  }

  interface GitHubTreeResponse {
    sha: string;
    tree: GitHubTreeItem[];
    truncated: boolean;
  }

  const data = await response.json() as GitHubTreeResponse;

  const result = data.tree
    .filter(item =>
      item.type === 'blob' &&
      item.path.match(/\.(tsx?|jsx?|vue|svelte)$/) &&
      !item.path.includes('node_modules') &&
      !item.path.includes('.test.') &&
      !item.path.includes('.spec.') &&
      !item.path.includes('dist/') &&
      !item.path.includes('.d.ts')
    )
    .map(item => ({
      path: item.path,
      type: 'file' as const,
      size: item.size,
    }));

  // Cache the result
  treeCache.set(cacheKey, result);

  return result;
}

// ============================================
// PR Creation
// ============================================

export async function createPullRequest(
  token: string,
  request: CreatePRRequest
): Promise<PRResult> {
  const { owner, repo, baseBranch, fixes, title, description } = request;

  try {
    const baseBranchData = await githubFetch<{ commit: { sha: string } }>(
      `/repos/${owner}/${repo}/branches/${baseBranch}`,
      token
    );
    const baseSha = baseBranchData.commit.sha;

    const timestamp = Date.now();
    const branchName = `allylab/a11y-fixes-${timestamp}`;

    await githubFetch<{ ref: string }>(
      `/repos/${owner}/${repo}/git/refs`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        }),
      }
    );

    githubLogger.info({ msg: 'Created branch', owner, repo, branch: branchName });

    for (const fix of fixes) {
      const currentFile = await getFileContent(token, owner, repo, fix.filePath, branchName);

      if (!currentFile) {
        githubLogger.warn({ msg: 'File not found, skipping', filePath: fix.filePath });
        continue;
      }

      await githubFetch<{ content: { sha: string } }>(
        `/repos/${owner}/${repo}/contents/${fix.filePath}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            message: `fix(a11y): ${fix.ruleTitle}\n\nFinding ID: ${fix.findingId}\nGenerated by AllyLab`,
            content: Buffer.from(fix.fixedContent).toString('base64'),
            sha: currentFile.sha,
            branch: branchName,
          }),
        }
      );

      githubLogger.info({ msg: 'Updated file', filePath: fix.filePath });
    }

    const prTitle = title || `[AllyLab] Accessibility fixes (${fixes.length} issue${fixes.length > 1 ? 's' : ''})`;
    const prBody = description || generatePRDescription(fixes);

    const pr = await githubFetch<{ number: number; html_url: string }>(
      `/repos/${owner}/${repo}/pulls`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({
          title: prTitle,
          body: prBody,
          head: branchName,
          base: baseBranch,
        }),
      }
    );

    // Invalidate caches for this repo since we made changes
    branchesCache.invalidatePattern(`${owner}/${repo}`);
    treeCache.invalidatePattern(`${owner}/${repo}`);

    githubLogger.info({ msg: 'Created PR', owner, repo, prNumber: pr.number, prUrl: pr.html_url });

    return {
      success: true,
      prNumber: pr.number,
      prUrl: pr.html_url,
      branchName,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    githubLogger.error({ msg: 'PR creation failed', owner, repo, error: message });
    return {
      success: false,
      error: message,
    };
  }
}

function generatePRDescription(
  fixes: CreatePRRequest['fixes']
): string {
  const issuesList = fixes
    .map(f => `- **${f.ruleTitle}** in \`${f.filePath}\``)
    .join('\n');

  return `## 🔧 Accessibility Fixes

This PR was automatically generated by [AllyLab](https://github.com/your-org/allylab) to fix accessibility issues.

### Issues Fixed
${issuesList}

### Review Checklist
- [ ] Verify fixes render correctly
- [ ] Test with screen reader
- [ ] Check keyboard navigation
- [ ] Run accessibility scan to confirm

---
*Generated by AllyLab • Powered by Claude AI*`;
}

// ============================================
// Source Mapping
// ============================================

export interface SourceMapping {
  selector: string;
  filePath: string;
  lineNumber?: number;
}

const sourceMappings = new Map<string, SourceMapping[]>();

export function setSourceMappings(repoFullName: string, mappings: SourceMapping[]): void {
  sourceMappings.set(repoFullName, mappings);
}

export function getSourceMapping(repoFullName: string, selector: string): SourceMapping | undefined {
  const mappings = sourceMappings.get(repoFullName);
  if (!mappings) return undefined;
  
  return mappings.find(m => m.selector === selector);
}

// ============================================
// PR Status & Verification
// ============================================

export async function getPRStatus(
  token: string,
  owner: string,
  repo: string,
  prNumber: number
): Promise<PRStatus | null> {
  try {
    const pr = await githubFetch<{
      number: number;
      state: 'open' | 'closed';
      merged: boolean;
      merged_at: string | null;
      html_url: string;
      title: string;
      head: { ref: string };
      base: { ref: string };
    }>(`/repos/${owner}/${repo}/pulls/${prNumber}`, token);

    return {
      number: pr.number,
      state: pr.state,
      merged: pr.merged,
      merged_at: pr.merged_at,
      html_url: pr.html_url,
      title: pr.title,
      head: { ref: pr.head.ref },
      base: { ref: pr.base.ref },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    githubLogger.error({ msg: 'Failed to get PR status', owner, repo, prNumber, error: message });
    return null;
  }
}