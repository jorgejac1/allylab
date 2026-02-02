/**
 * Auth Types (shared between website and dashboard)
 */

// User roles within an organization
export type Role = 'admin' | 'manager' | 'developer' | 'viewer' | 'compliance';

// Subscription plans
export type Plan = 'free' | 'pro' | 'team' | 'enterprise';

// Subscription status from Stripe
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'paused'
  | 'trialing'
  | 'unpaid';

// Plan limits configuration
export interface PlanLimits {
  scansPerMonth: number;
  pagesPerScan: number;
  usersAllowed: number;
  scheduledScans: boolean;
  customRules: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  ssoEnabled: boolean;
  multipleWorkspaces: boolean;
  auditLogs: boolean;
  whiteLabel: boolean;
  dedicatedSupport: boolean;
}

// Default limits per plan
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    scansPerMonth: 10,
    pagesPerScan: 5,
    usersAllowed: 1,
    scheduledScans: false,
    customRules: false,
    apiAccess: false,
    prioritySupport: false,
    ssoEnabled: false,
    multipleWorkspaces: false,
    auditLogs: false,
    whiteLabel: false,
    dedicatedSupport: false,
  },
  pro: {
    scansPerMonth: 100,
    pagesPerScan: 25,
    usersAllowed: 1,
    scheduledScans: true,
    customRules: false,
    apiAccess: true,
    prioritySupport: false,
    ssoEnabled: false,
    multipleWorkspaces: false,
    auditLogs: false,
    whiteLabel: false,
    dedicatedSupport: false,
  },
  team: {
    scansPerMonth: 500,
    pagesPerScan: 100,
    usersAllowed: 10,
    scheduledScans: true,
    customRules: true,
    apiAccess: true,
    prioritySupport: true,
    ssoEnabled: false,
    multipleWorkspaces: true,
    auditLogs: true,
    whiteLabel: false,
    dedicatedSupport: false,
  },
  enterprise: {
    scansPerMonth: -1,
    pagesPerScan: -1,
    usersAllowed: -1,
    scheduledScans: true,
    customRules: true,
    apiAccess: true,
    prioritySupport: true,
    ssoEnabled: true,
    multipleWorkspaces: true,
    auditLogs: true,
    whiteLabel: true,
    dedicatedSupport: true,
  },
};

// Organization metadata stored in Clerk
export interface ClerkOrgMetadata {
  plan: Plan;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: SubscriptionStatus;
  trialEndsAt?: string;
  currentPeriodEnd?: string;
}
