import { config } from '../config/env.js';
import type { 
  GitHubRepo, 
  GitHubConnection, 
  CreatePRRequest, 
  PRResult 
} from '../types/github.js';

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
  console.log(`[GitHub] Token stored for user: ${userId}`);
}

export function getGitHubToken(userId: string): string | undefined {
  return githubTokens.get(userId);
}

export function removeGitHubToken(userId: string): void {
  githubTokens.delete(userId);
  console.log(`[GitHub] Token removed for user: ${userId}`);
}

// ============================================
// Connection & User
// ============================================

export async function getConnection(userId: string): Promise<GitHubConnection> {
  const token = githubTokens.get(userId);
  
  if (!token) {
    return { connected: false };
  }

  try {
    const user = await githubFetch<{
      login: string;
      avatar_url: string;
      name: string;
    }>('/user', token);

    const reposResponse = await githubFetch<GitHubRepo[]>(
      '/user/repos?per_page=100&sort=updated',
      token
    );

    return {
      connected: true,
      user: {
        login: user.login,
        avatar_url: user.avatar_url,
        name: user.name,
      },
      repos: reposResponse,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GitHub] Connection check failed:', message);
    return { connected: false };
  }
}

// ============================================
// Repository Operations
// ============================================

export async function getRepos(token: string): Promise<GitHubRepo[]> {
  return githubFetch<GitHubRepo[]>('/user/repos?per_page=100&sort=updated', token);
}

export async function getRepoBranches(
  token: string, 
  owner: string, 
  repo: string
): Promise<{ name: string; sha: string }[]> {
  const branches = await githubFetch<{ name: string; commit: { sha: string } }[]>(
    `/repos/${owner}/${repo}/branches`,
    token
  );
  return branches.map(b => ({ name: b.name, sha: b.commit.sha }));
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
    console.error('[GitHub] Failed to get file content:', message);
    return null;
  }
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
    // 1. Get the base branch's latest commit SHA
    const baseBranchData = await githubFetch<{ commit: { sha: string } }>(
      `/repos/${owner}/${repo}/branches/${baseBranch}`,
      token
    );
    const baseSha = baseBranchData.commit.sha;

    // 2. Create a new branch name
    const timestamp = Date.now();
    const branchName = `allylab/a11y-fixes-${timestamp}`;

    // 3. Create the new branch
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

    console.log(`[GitHub] Created branch: ${branchName}`);

    // 4. Commit each fix
    for (const fix of fixes) {
      // Get current file to get its SHA (needed for update)
      const currentFile = await getFileContent(token, owner, repo, fix.filePath, branchName);
      
      if (!currentFile) {
        console.warn(`[GitHub] File not found: ${fix.filePath}, skipping...`);
        continue;
      }

      // Update file with fix
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

      console.log(`[GitHub] Updated file: ${fix.filePath}`);
    }

    // 5. Create the Pull Request
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

    console.log(`[GitHub] Created PR #${pr.number}: ${pr.html_url}`);

    return {
      success: true,
      prNumber: pr.number,
      prUrl: pr.html_url,
      branchName,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GitHub] PR creation failed:', message);
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
// Source Mapping (simplified)
// ============================================

export interface SourceMapping {
  selector: string;
  filePath: string;
  lineNumber?: number;
}

// In-memory source mappings (configured per repo)
const sourceMappings = new Map<string, SourceMapping[]>();

export function setSourceMappings(repoFullName: string, mappings: SourceMapping[]): void {
  sourceMappings.set(repoFullName, mappings);
}

export function getSourceMapping(repoFullName: string, selector: string): SourceMapping | undefined {
  const mappings = sourceMappings.get(repoFullName);
  if (!mappings) return undefined;
  
  return mappings.find(m => m.selector === selector);
}