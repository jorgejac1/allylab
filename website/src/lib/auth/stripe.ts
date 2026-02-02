/**
 * Stripe Utilities
 *
 * Server-side Stripe utilities for checkout and billing portal.
 */

import Stripe from 'stripe';
import { authConfig, planToPriceId } from './config';

// Lazy Stripe initialization (server-side only)
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!authConfig.stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }
    stripeInstance = new Stripe(authConfig.stripeSecretKey);
  }
  return stripeInstance;
}


export type BillingInterval = 'monthly' | 'yearly';

interface CreateCheckoutParams {
  organizationId: string;
  organizationName: string;
  userEmail: string;
  plan: 'pro' | 'team';
  interval: BillingInterval;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Create a Stripe Checkout session for new subscriptions
 */
export async function createCheckoutSession(params: CreateCheckoutParams): Promise<string> {
  const { organizationId, organizationName, userEmail, plan, interval, successUrl, cancelUrl } = params;

  const priceId = planToPriceId[plan][interval];

  if (!priceId) {
    throw new Error(`No price configured for ${plan} ${interval}`);
  }

  // Check if customer already exists
  const existingCustomers = await getStripe().customers.list({
    email: userEmail,
    limit: 1,
  });

  let customerId: string | undefined;
  if (existingCustomers.data.length > 0) {
    customerId = existingCustomers.data[0].id;
  }

  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: customerId,
    customer_email: customerId ? undefined : userEmail,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      organizationId,
      organizationName,
      plan,
      interval,
    },
    subscription_data: {
      metadata: {
        organizationId,
        plan,
      },
      trial_period_days: plan === 'pro' ? 14 : 30, // 14 days for Pro, 30 for Team
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  });

  return session.url!;
}

interface CreatePortalParams {
  stripeCustomerId: string;
  returnUrl: string;
}

/**
 * Create a Stripe Billing Portal session for managing subscriptions
 */
export async function createBillingPortalSession(params: CreatePortalParams): Promise<string> {
  const { stripeCustomerId, returnUrl } = params;

  const session = await getStripe().billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  try {
    return await getStripe().subscriptions.retrieve(subscriptionId);
  } catch {
    return null;
  }
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return getStripe().subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return getStripe().subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Update subscription to a different plan
 */
export async function updateSubscriptionPlan(
  subscriptionId: string,
  newPlan: 'pro' | 'team',
  interval: BillingInterval
): Promise<Stripe.Subscription> {
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const newPriceId = planToPriceId[newPlan][interval];

  return getStripe().subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'create_prorations',
    metadata: {
      plan: newPlan,
    },
  });
}
