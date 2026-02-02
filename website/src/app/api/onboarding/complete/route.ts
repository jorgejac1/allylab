/**
 * Complete Onboarding API
 *
 * Completes the onboarding process for users selecting the free plan.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { updateOrganizationSubscription } from '@/lib/auth/clerk';
import type { Plan } from '@/lib/auth/types';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan } = body as { plan: Plan };

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan is required' },
        { status: 400 }
      );
    }

    // Get user's organization
    const client = await clerkClient();
    const memberships = await client.users.getOrganizationMembershipList({ userId });

    if (memberships.data.length === 0) {
      return NextResponse.json(
        { error: 'No organization found. Please create one first.' },
        { status: 400 }
      );
    }

    const organizationId = memberships.data[0].organization.id;

    // Update organization with plan
    await updateOrganizationSubscription(organizationId, {
      plan,
      subscriptionStatus: plan === 'free' ? undefined : 'active',
    });

    return NextResponse.json({
      success: true,
      organizationId,
      plan,
    });
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
