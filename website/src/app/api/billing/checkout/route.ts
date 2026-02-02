/**
 * Create Checkout Session API
 *
 * Creates a Stripe Checkout session for subscribing to a plan.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createCheckoutSession, type BillingInterval } from '@/lib/auth';
import { authConfig } from '@/lib/auth/config';
import { getOrCreateOrganization } from '@/lib/auth/clerk';

interface CheckoutRequest {
  plan: 'pro' | 'team';
  interval: BillingInterval;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as CheckoutRequest;
    const { plan, interval } = body;

    if (!plan || !['pro', 'team'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    if (!interval || !['monthly', 'yearly'].includes(interval)) {
      return NextResponse.json(
        { error: 'Invalid interval' },
        { status: 400 }
      );
    }

    // Get or create organization for user
    const orgName = user.firstName
      ? `${user.firstName}'s Organization`
      : `${user.emailAddresses[0].emailAddress.split('@')[0]}'s Organization`;

    const { id: organizationId } = await getOrCreateOrganization(userId, orgName);

    const checkoutUrl = await createCheckoutSession({
      organizationId,
      organizationName: orgName,
      userEmail: user.emailAddresses[0].emailAddress,
      plan,
      interval,
      successUrl: `${authConfig.dashboardUrl}?checkout=success`,
      cancelUrl: `${request.nextUrl.origin}/pricing?checkout=canceled`,
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
