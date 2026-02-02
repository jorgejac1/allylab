/**
 * Billing Portal API
 *
 * Creates a Stripe Billing Portal session for managing subscriptions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createBillingPortalSession } from '@/lib/auth';
import { getOrganizationWithDetails } from '@/lib/auth/clerk';

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!orgId) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400 }
      );
    }

    const org = await getOrganizationWithDetails(orgId);

    if (!org.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing account found' },
        { status: 400 }
      );
    }

    const portalUrl = await createBillingPortalSession({
      stripeCustomerId: org.stripeCustomerId,
      returnUrl: request.nextUrl.origin + '/settings/billing',
    });

    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
