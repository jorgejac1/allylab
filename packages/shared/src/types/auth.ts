/**
 * Shared Auth Types
 *
 * These types are shared across website, dashboard, and API.
 * They define the user management and subscription system for AllyLab.
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
  scansPerMonth: number;        // -1 for unlimited
  pagesPerScan: number;         // -1 for unlimited
  usersAllowed: number;         // -1 for unlimited
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

// Stripe price IDs (configured in environment)
export interface StripePriceIds {
  pro_monthly: string;
  pro_yearly: string;
  team_monthly: string;
  team_yearly: string;
}

// User from Clerk with our metadata
export interface ClerkUserMetadata {
  organizationId?: string;
  role?: Role;
  onboardingComplete?: boolean;
}

// Organization metadata stored in Clerk
export interface ClerkOrgMetadata {
  plan: Plan;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: SubscriptionStatus;
  trialEndsAt?: string;
  currentPeriodEnd?: string;
}

// User type for our application (derived from Clerk)
export interface User {
  id: string;                    // Clerk user ID
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  imageUrl: string | null;
  role: Role;
  organizationId: string;
  createdAt: string;
  lastSignInAt: string | null;
}

// Organization type for our application
export interface Organization {
  id: string;                    // Clerk organization ID
  name: string;
  slug: string;
  imageUrl: string | null;
  plan: Plan;
  limits: PlanLimits;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  usage: {
    scansThisMonth: number;
    usersCount: number;
  };
}

// Permission types
export type Permission =
  // Scan permissions
  | 'scan:run'
  | 'scan:schedule'
  | 'scan:cancel'
  | 'scan:view-history'
  // Findings permissions
  | 'findings:view'
  | 'findings:export'
  | 'findings:mark-false-positive'
  // Fix permissions
  | 'fixes:generate'
  | 'fixes:create-pr'
  | 'fixes:batch-pr'
  // Reports permissions
  | 'reports:view'
  | 'reports:export-pdf'
  | 'reports:view-executive'
  | 'reports:benchmark'
  // Settings permissions
  | 'settings:view'
  | 'settings:edit'
  | 'settings:manage-users'
  | 'settings:manage-integrations'
  | 'settings:manage-custom-rules'
  | 'settings:manage-billing';

// Navigation pages
export type NavigationPage =
  | 'scan'
  | 'site-scan'
  | 'reports'
  | 'executive'
  | 'benchmark'
  | 'settings';

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'scan:run', 'scan:schedule', 'scan:cancel', 'scan:view-history',
    'findings:view', 'findings:export', 'findings:mark-false-positive',
    'fixes:generate', 'fixes:create-pr', 'fixes:batch-pr',
    'reports:view', 'reports:export-pdf', 'reports:view-executive', 'reports:benchmark',
    'settings:view', 'settings:edit', 'settings:manage-users',
    'settings:manage-integrations', 'settings:manage-custom-rules', 'settings:manage-billing',
  ],
  manager: [
    'scan:run', 'scan:schedule', 'scan:cancel', 'scan:view-history',
    'findings:view', 'findings:export', 'findings:mark-false-positive',
    'fixes:generate', 'fixes:create-pr', 'fixes:batch-pr',
    'reports:view', 'reports:export-pdf', 'reports:view-executive', 'reports:benchmark',
    'settings:view', 'settings:edit', 'settings:manage-integrations',
  ],
  developer: [
    'scan:run', 'scan:view-history',
    'findings:view', 'findings:export', 'findings:mark-false-positive',
    'fixes:generate', 'fixes:create-pr',
    'reports:view',
    'settings:view',
  ],
  viewer: [
    'scan:view-history',
    'findings:view',
    'reports:view', 'reports:export-pdf',
    'settings:view',
  ],
  compliance: [
    'scan:view-history',
    'findings:view', 'findings:export',
    'reports:view', 'reports:export-pdf', 'reports:view-executive', 'reports:benchmark',
    'settings:view',
  ],
};

// Role to accessible pages mapping
export const ROLE_PAGES: Record<Role, NavigationPage[]> = {
  admin: ['scan', 'site-scan', 'reports', 'executive', 'benchmark', 'settings'],
  manager: ['scan', 'site-scan', 'reports', 'executive', 'benchmark', 'settings'],
  developer: ['scan', 'site-scan', 'reports', 'settings'],
  viewer: ['scan', 'reports'],
  compliance: ['reports', 'executive', 'benchmark'],
};

// Helper functions
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAccessPage(role: Role, page: NavigationPage): boolean {
  return ROLE_PAGES[role]?.includes(page) ?? false;
}

export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function getRolePages(role: Role): NavigationPage[] {
  return ROLE_PAGES[role] ?? [];
}

export function isPlanActive(status: SubscriptionStatus | null): boolean {
  return status === 'active' || status === 'trialing';
}

export function canUsePlanFeature(org: Organization, feature: keyof PlanLimits): boolean {
  if (!isPlanActive(org.subscriptionStatus) && org.plan !== 'free') {
    return false;
  }
  const limit = org.limits[feature];
  return typeof limit === 'boolean' ? limit : limit !== 0;
}
