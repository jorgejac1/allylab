/**
 * GitLab Connection API
 *
 * Manages GitLab Personal Access Token connections for the authenticated user.
 * Supports both GitLab.com and self-hosted GitLab instances.
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock GitLab connection data
const MOCK_CONNECTION = {
  connected: true,
  provider: 'gitlab' as const,
  instanceUrl: 'https://gitlab.com',
  user: {
    id: 12345,
    username: 'demo-user',
    name: 'Demo User',
    avatar_url: 'https://secure.gravatar.com/avatar/demo?s=80&d=identicon',
    web_url: 'https://gitlab.com/demo-user',
  },
  projects: [
    { id: 1, name: 'my-website', path_with_namespace: 'demo-user/my-website', visibility: 'public' },
    { id: 2, name: 'react-app', path_with_namespace: 'demo-user/react-app', visibility: 'public' },
    { id: 3, name: 'internal-dashboard', path_with_namespace: 'demo-user/internal-dashboard', visibility: 'private' },
  ],
};

export async function GET() {
  // In production, check OAuth token from session/cookie
  // For demo, return mock connection
  return NextResponse.json(MOCK_CONNECTION);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, instanceUrl = 'https://gitlab.com' } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Validate instance URL
    try {
      new URL(instanceUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid GitLab instance URL' }, { status: 400 });
    }

    // In production:
    // 1. Validate token with GitLab API: GET /api/v4/user
    // 2. Store encrypted token in database
    // 3. Return user info

    // For demo, simulate connection
    await new Promise(resolve => setTimeout(resolve, 500));

    // Validate token format (basic check for GitLab tokens)
    // GitLab tokens can be:
    // - Personal access tokens: glpat-xxxx
    // - Project access tokens: glpat-xxxx
    // - Group access tokens: glpat-xxxx
    // - Legacy tokens (20 char alphanumeric)
    const isValidFormat = token.startsWith('glpat-') || /^[a-zA-Z0-9_-]{20,}$/.test(token);

    if (!isValidFormat) {
      return NextResponse.json(
        { error: 'Invalid token format. GitLab tokens should start with glpat- or be a valid legacy token.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      connected: true,
      provider: 'gitlab',
      instanceUrl,
      user: {
        id: 12345,
        username: 'demo-user',
        name: 'Demo User',
        avatar_url: 'https://secure.gravatar.com/avatar/demo?s=80&d=identicon',
        web_url: `${instanceUrl}/demo-user`,
      },
      projects: [
        { id: 1, name: 'my-website', path_with_namespace: 'demo-user/my-website', visibility: 'public' },
        { id: 2, name: 'react-app', path_with_namespace: 'demo-user/react-app', visibility: 'public' },
        { id: 3, name: 'internal-dashboard', path_with_namespace: 'demo-user/internal-dashboard', visibility: 'private' },
      ],
    });
  } catch {
    return NextResponse.json({ error: 'Failed to connect' }, { status: 500 });
  }
}

export async function DELETE() {
  // In production:
  // 1. Revoke token if possible
  // 2. Remove token from database

  // For demo, simulate disconnection
  await new Promise(resolve => setTimeout(resolve, 300));

  return NextResponse.json({ connected: false });
}
