/**
 * GitLab Merge Request API
 *
 * Creates merge requests with accessibility fixes.
 */

import { NextRequest, NextResponse } from 'next/server';

interface CreateMRRequest {
  project: string; // path_with_namespace like "demo-user/my-website"
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch?: string;
  files: Array<{
    path: string;
    content: string;
  }>;
  instanceUrl?: string;
}

// Track created MRs for demo
let mrCounter = 1;

export async function POST(request: NextRequest) {
  try {
    const body: CreateMRRequest = await request.json();
    const {
      project,
      title,
      files,
      sourceBranch,
      targetBranch = 'main',
      description,
      instanceUrl = 'https://gitlab.com',
    } = body;

    if (!project) {
      return NextResponse.json({ error: 'Project is required' }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: 'MR title is required' }, { status: 400 });
    }

    if (!sourceBranch) {
      return NextResponse.json({ error: 'Source branch is required' }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'At least one file is required' }, { status: 400 });
    }

    // In production:
    // 1. Get user's GitLab token from session
    // 2. Create a new branch from targetBranch
    // 3. Commit files to the new branch using commits API
    // 4. Create merge request

    // For demo, simulate MR creation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mrIid = mrCounter++;

    const result = {
      id: `mr-${Date.now()}`,
      iid: mrIid,
      project_id: 12345,
      title,
      description: description || '',
      state: 'opened',
      web_url: `${instanceUrl}/${project}/-/merge_requests/${mrIid}`,
      source_branch: sourceBranch,
      target_branch: targetBranch,
      author: {
        id: 12345,
        username: 'demo-user',
        name: 'Demo User',
        avatar_url: 'https://secure.gravatar.com/avatar/demo?s=80&d=identicon',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      merge_status: 'can_be_merged',
      has_conflicts: false,
      changes_count: files.length.toString(),
      diff_refs: {
        base_sha: generateMockSha(),
        head_sha: generateMockSha(),
        start_sha: generateMockSha(),
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create MR' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const project = searchParams.get('project');
  const mrIid = searchParams.get('iid');
  const instanceUrl = searchParams.get('instanceUrl') || 'https://gitlab.com';

  if (!project || !mrIid) {
    return NextResponse.json(
      { error: 'Project and MR IID are required' },
      { status: 400 }
    );
  }

  // In production: fetch MR status from GitLab API
  // GET /api/v4/projects/:id/merge_requests/:iid

  // For demo, return mock MR status
  const states = ['opened', 'merged', 'closed'];
  const randomState = states[Math.floor(Math.random() * states.length)];

  return NextResponse.json({
    iid: parseInt(mrIid),
    project_id: 12345,
    web_url: `${instanceUrl}/${project}/-/merge_requests/${mrIid}`,
    state: randomState,
    merged_at: randomState === 'merged' ? new Date().toISOString() : null,
    merge_status: randomState === 'opened' ? 'can_be_merged' : 'cannot_be_merged',
    has_conflicts: false,
    pipeline: {
      id: 123456,
      status: randomState === 'merged' ? 'success' : 'running',
      web_url: `${instanceUrl}/${project}/-/pipelines/123456`,
    },
    approvals_required: 1,
    approvals_left: randomState === 'merged' ? 0 : 1,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  });
}

function generateMockSha(): string {
  return Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}
