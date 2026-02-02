/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events for subscription management.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/auth/stripe';
import { authConfig, getPlanFromPriceId } from '@/lib/auth/config';
import { updateOrganizationSubscription } from '@/lib/auth/clerk';
import {
  sendSubscriptionConfirmation,
  sendPaymentFailedEmail,
  sendSubscriptionCanceledEmail,
} from '@/lib/email';
import type { Plan, SubscriptionStatus } from '@/lib/auth/types';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !authConfig.stripeWebhookSecret) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      authConfig.stripeWebhookSecret
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Helper to get subscription period end
function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): number {
  // Access through items data for newer Stripe API
  const item = subscription.items.data[0];
  if (item?.current_period_end) {
    return item.current_period_end;
  }
  // Fallback: access from subscription object directly (may be typed differently)
  return (subscription as unknown as { current_period_end: number }).current_period_end;
}

// Helper to get subscription ID from invoice
function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  // In newer Stripe API, subscription is accessed via parent.subscription_details
  const parent = invoice.parent;
  if (parent?.type === 'subscription_details' && parent.subscription_details?.subscription) {
    const sub = parent.subscription_details.subscription;
    if (typeof sub === 'string') return sub;
    return (sub as Stripe.Subscription).id;
  }
  return null;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { organizationId, organizationName, plan, interval } = session.metadata || {};

  if (!organizationId || !plan) {
    console.error('Missing metadata in checkout session');
    return;
  }

  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  // Get subscription details
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const periodEnd = getSubscriptionPeriodEnd(subscription);

  await updateOrganizationSubscription(organizationId, {
    plan: plan as Plan,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    subscriptionStatus: subscription.status as SubscriptionStatus,
    trialEndsAt: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : undefined,
    currentPeriodEnd: new Date(periodEnd * 1000).toISOString(),
  });

  // Send subscription confirmation email
  const customerEmail = session.customer_email || session.customer_details?.email;
  if (customerEmail) {
    await sendSubscriptionConfirmation(
      customerEmail,
      organizationName || 'there',
      plan,
      (interval as 'monthly' | 'yearly') || 'monthly'
    );
  }

  console.log(`Checkout completed for org ${organizationId}, plan: ${plan}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { organizationId } = subscription.metadata || {};

  if (!organizationId) {
    console.error('Missing organizationId in subscription metadata');
    return;
  }

  // Determine plan from price
  const priceId = subscription.items.data[0]?.price?.id;
  const planInfo = priceId ? getPlanFromPriceId(priceId) : null;
  const plan = planInfo?.plan || (subscription.metadata.plan as Plan) || 'free';
  const periodEnd = getSubscriptionPeriodEnd(subscription);

  await updateOrganizationSubscription(organizationId, {
    plan,
    subscriptionStatus: subscription.status as SubscriptionStatus,
    trialEndsAt: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : undefined,
    currentPeriodEnd: new Date(periodEnd * 1000).toISOString(),
  });

  console.log(`Subscription updated for org ${organizationId}, status: ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { organizationId } = subscription.metadata || {};

  if (!organizationId) {
    console.error('Missing organizationId in subscription metadata');
    return;
  }

  // Downgrade to free plan
  await updateOrganizationSubscription(organizationId, {
    plan: 'free',
    subscriptionStatus: 'canceled',
  });

  // Get customer email and send cancellation notification
  const customerId = subscription.customer;
  if (customerId && typeof customerId === 'string') {
    try {
      const customer = await getStripe().customers.retrieve(customerId);
      if (!customer.deleted && customer.email) {
        const periodEnd = getSubscriptionPeriodEnd(subscription);
        const endDate = new Date(periodEnd * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        await sendSubscriptionCanceledEmail(customer.email, customer.name || 'there', endDate);
      }
    } catch (err) {
      console.error('Failed to send cancellation email:', err);
    }
  }

  console.log(`Subscription deleted for org ${organizationId}, downgraded to free`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice);

  if (!subscriptionId) return;

  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const { organizationId } = subscription.metadata || {};

  if (!organizationId) return;

  const periodEnd = getSubscriptionPeriodEnd(subscription);

  // Update period end
  await updateOrganizationSubscription(organizationId, {
    plan: subscription.metadata.plan as Plan,
    subscriptionStatus: 'active',
    currentPeriodEnd: new Date(periodEnd * 1000).toISOString(),
  });

  console.log(`Payment succeeded for org ${organizationId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice);

  if (!subscriptionId) return;

  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const { organizationId } = subscription.metadata || {};

  if (!organizationId) return;

  await updateOrganizationSubscription(organizationId, {
    plan: subscription.metadata.plan as Plan,
    subscriptionStatus: subscription.status as SubscriptionStatus,
  });

  // Get customer email and send payment failed notification
  const customerId = subscription.customer;
  if (customerId && typeof customerId === 'string') {
    try {
      const customer = await getStripe().customers.retrieve(customerId);
      if (!customer.deleted && customer.email) {
        await sendPaymentFailedEmail(
          customer.email,
          customer.name || 'there',
          subscription.metadata.plan || 'your'
        );
      }
    } catch (err) {
      console.error('Failed to send payment failed email:', err);
    }
  }

  console.log(`Payment failed for org ${organizationId}, status: ${subscription.status}`);
}
