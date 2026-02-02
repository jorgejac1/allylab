/**
 * GitHub Connection API
 *
 * Manages GitHub OAuth connections for the authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock GitHub connection data
const MOCK_CONNECTION = {
  connected: true,
  user: {
    login: 'demo-user',
    avatar_url: 'https://avatars.githubusercontent.com/u/12345?v=4',
    name: 'Demo User',
  },
  repos: [
    { id: 1, name: 'my-website', full_name: 'demo-user/my-website', private: false },
    { id: 2, name: 'react-app', full_name: 'demo-user/react-app', private: false },
    { id: 3, name: 'vue-dashboard', full_name: 'demo-user/vue-dashboard', private: true },
  ],
};

export async function GET() {
  // In production, check OAuth token from session/cookie
  // For demo, return mock connection
  return NextResponse.json(MOCK_CONNECTION);
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // In production:
    // 1. Validate token with GitHub API
    // 2. Store encrypted token in database
    // 3. Return user info

    // For demo, simulate connection
    await new Promise(resolve => setTimeout(resolve, 500));

    // Validate token format (basic check)
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
      return NextResponse.json(
        { error: 'Invalid token format. Token should start with ghp_ or github_pat_' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      connected: true,
      user: {
        login: 'demo-user',
        avatar_url: 'https://avatars.githubusercontent.com/u/12345?v=4',
        name: 'Demo User',
      },
      repos: [
        { id: 1, name: 'my-website', full_name: 'demo-user/my-website', private: false },
        { id: 2, name: 'react-app', full_name: 'demo-user/react-app', private: false },
        { id: 3, name: 'vue-dashboard', full_name: 'demo-user/vue-dashboard', private: true },
      ],
    });
  } catch {
    return NextResponse.json({ error: 'Failed to connect' }, { status: 500 });
  }
}

export async function DELETE() {
  // In production:
  // 1. Revoke token with GitHub API
  // 2. Remove token from database

  // For demo, simulate disconnection
  await new Promise(resolve => setTimeout(resolve, 300));

  return NextResponse.json({ connected: false });
}
