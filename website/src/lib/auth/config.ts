/**
 * Auth Configuration
 *
 * Centralized auth configuration for Clerk and Stripe integration.
 */

// Environment variables with type safety
export const authConfig = {
  // Clerk
  clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  clerkSecretKey: process.env.CLERK_SECRET_KEY,

  // Clerk URLs
  signInUrl: '/sign-in',
  signUpUrl: '/sign-up',
  afterSignInUrl: '/dashboard',
  afterSignUpUrl: '/onboarding',

  // Stripe
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

  // Stripe Price IDs
  stripePrices: {
    pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY!,
    team_monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY!,
    team_yearly: process.env.STRIPE_PRICE_TEAM_YEARLY!,
  },

  // Dashboard URL
  dashboardUrl: process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:5173',

  // API URL
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
} as const;

// Plan to Stripe price mapping
export const planToPriceId = {
  pro: {
    monthly: authConfig.stripePrices.pro_monthly,
    yearly: authConfig.stripePrices.pro_yearly,
  },
  team: {
    monthly: authConfig.stripePrices.team_monthly,
    yearly: authConfig.stripePrices.team_yearly,
  },
} as const;

// Stripe price to plan mapping (reverse lookup)
export function getPlanFromPriceId(priceId: string): { plan: 'pro' | 'team'; interval: 'monthly' | 'yearly' } | null {
  for (const [plan, prices] of Object.entries(planToPriceId)) {
    for (const [interval, id] of Object.entries(prices)) {
      if (id === priceId) {
        return { plan: plan as 'pro' | 'team', interval: interval as 'monthly' | 'yearly' };
      }
    }
  }
  return null;
}
