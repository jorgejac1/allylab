/**
 * GitHub Pull Request API
 *
 * Creates pull requests with accessibility fixes.
 */

import { NextRequest, NextResponse } from 'next/server';

interface CreatePRRequest {
  repo: string;
  title: string;
  body: string;
  branch: string;
  baseBranch?: string;
  files: Array<{
    path: string;
    content: string;
  }>;
}

// Track created PRs for demo
let prCounter = 1;

export async function POST(request: NextRequest) {
  try {
    const body: CreatePRRequest = await request.json();
    const { repo, title, files, branch, baseBranch = 'main' } = body;

    if (!repo) {
      return NextResponse.json({ error: 'Repository is required' }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: 'PR title is required' }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'At least one file is required' }, { status: 400 });
    }

    // In production:
    // 1. Get user's GitHub token from session
    // 2. Create a new branch from baseBranch
    // 3. Commit files to the new branch
    // 4. Create pull request

    // For demo, simulate PR creation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const prNumber = prCounter++;

    const result = {
      id: `pr-${Date.now()}`,
      number: prNumber,
      url: `https://github.com/${repo}/pull/${prNumber}`,
      html_url: `https://github.com/${repo}/pull/${prNumber}`,
      title,
      state: 'open',
      head: {
        ref: branch,
        sha: generateMockSha(),
      },
      base: {
        ref: baseBranch,
        sha: generateMockSha(),
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: {
        login: 'demo-user',
        avatar_url: 'https://avatars.githubusercontent.com/u/12345?v=4',
      },
      files_changed: files.length,
      additions: files.reduce((sum, f) => sum + f.content.split('\n').length, 0),
      deletions: Math.floor(Math.random() * 10),
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create PR' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repo = searchParams.get('repo');
  const prNumber = searchParams.get('number');

  if (!repo || !prNumber) {
    return NextResponse.json(
      { error: 'Repository and PR number are required' },
      { status: 400 }
    );
  }

  // In production: fetch PR status from GitHub API

  // For demo, return mock PR status
  const statuses = ['open', 'merged', 'closed'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

  return NextResponse.json({
    number: parseInt(prNumber),
    url: `https://github.com/${repo}/pull/${prNumber}`,
    state: randomStatus,
    merged: randomStatus === 'merged',
    mergeable: randomStatus === 'open',
    checks: {
      total: 3,
      passed: randomStatus === 'merged' ? 3 : Math.floor(Math.random() * 4),
      failed: randomStatus === 'open' ? 0 : Math.floor(Math.random() * 2),
      pending: randomStatus === 'open' ? 1 : 0,
    },
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updated_at: new Date().toISOString(),
  });
}

function generateMockSha(): string {
  return Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}
