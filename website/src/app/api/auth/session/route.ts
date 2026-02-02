/**
 * Auth Session API
 *
 * Returns current user session information.
 * Used by the dashboard to verify authentication.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // In production with Clerk:
  // const { userId, orgId } = auth();
  // if (!userId) {
  //   return NextResponse.json({ authenticated: false }, { status: 401 });
  // }
  // const user = await currentUser();
  // const org = await clerkClient.organizations.getOrganization({ organizationId: orgId });

  // For demo mode, return mock session
  const isDemoMode = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (isDemoMode) {
    // Check for demo org in request (would normally be in cookie/localStorage)
    return NextResponse.json({
      authenticated: true,
      mode: 'demo',
      user: {
        id: 'user_demo',
        email: 'demo@allylab.com',
        name: 'Demo User',
        role: 'admin',
      },
      organization: {
        id: 'org_demo',
        name: 'Demo Organization',
        plan: 'team',
      },
      dashboardUrl: process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:5173',
    });
  }

  // Not authenticated
  return NextResponse.json({
    authenticated: false,
    loginUrl: '/sign-in',
  });
}
