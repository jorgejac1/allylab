/**
 * Clerk Utilities
 *
 * Server-side Clerk utilities for user and organization management.
 */

import { clerkClient } from '@clerk/nextjs/server';
import type { Plan, Role, SubscriptionStatus, ClerkOrgMetadata } from './types';
import { PLAN_LIMITS } from './types';

/**
 * Get or create an organization for a user
 */
export async function getOrCreateOrganization(
  userId: string,
  orgName: string
): Promise<{ id: string; isNew: boolean }> {
  const client = await clerkClient();

  // Check if user already has an organization
  const memberships = await client.users.getOrganizationMembershipList({ userId });

  if (memberships.data.length > 0) {
    return {
      id: memberships.data[0].organization.id,
      isNew: false,
    };
  }

  // Create new organization
  const org = await client.organizations.createOrganization({
    name: orgName,
    createdBy: userId,
    publicMetadata: {
      plan: 'free',
      subscriptionStatus: undefined,
    } satisfies ClerkOrgMetadata,
  });

  return {
    id: org.id,
    isNew: true,
  };
}

/**
 * Update organization subscription metadata
 */
export async function updateOrganizationSubscription(
  organizationId: string,
  data: {
    plan: Plan;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: SubscriptionStatus;
    trialEndsAt?: string;
    currentPeriodEnd?: string;
  }
): Promise<void> {
  const client = await clerkClient();

  // Get current metadata
  const org = await client.organizations.getOrganization({ organizationId });
  const currentMetadata = (org.publicMetadata || {}) as unknown as ClerkOrgMetadata;

  // Merge with new data
  await client.organizations.updateOrganization(organizationId, {
    publicMetadata: {
      ...currentMetadata,
      ...data,
    } satisfies ClerkOrgMetadata,
  });
}

/**
 * Get organization with full details
 */
export async function getOrganizationWithDetails(organizationId: string) {
  const client = await clerkClient();
  const org = await client.organizations.getOrganization({ organizationId });
  const metadata = (org.publicMetadata || {}) as unknown as ClerkOrgMetadata;
  const plan = metadata.plan || 'free';

  // Get member count
  const members = await client.organizations.getOrganizationMembershipList({
    organizationId,
  });

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    imageUrl: org.imageUrl,
    plan,
    limits: PLAN_LIMITS[plan],
    stripeCustomerId: metadata.stripeCustomerId || null,
    stripeSubscriptionId: metadata.stripeSubscriptionId || null,
    subscriptionStatus: metadata.subscriptionStatus || null,
    trialEndsAt: metadata.trialEndsAt || null,
    currentPeriodEnd: metadata.currentPeriodEnd || null,
    createdAt: new Date(org.createdAt).toISOString(),
    usage: {
      scansThisMonth: 0, // TODO: Get from API
      usersCount: members.data.length,
    },
  };
}

/**
 * Update user role in organization
 */
export async function updateUserRole(
  organizationId: string,
  userId: string,
  role: Role
): Promise<void> {
  const client = await clerkClient();

  // Map our role to Clerk organization role
  // Clerk has: org:admin and org:member by default
  // We store our custom role in user's publicMetadata
  await client.users.updateUser(userId, {
    publicMetadata: {
      organizationId,
      role,
    },
  });
}

/**
 * Get user's role in their organization
 */
export async function getUserRole(userId: string): Promise<Role> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const metadata = user.publicMetadata as { role?: Role } | undefined;
  return metadata?.role || 'viewer';
}

/**
 * Invite user to organization
 */
export async function inviteToOrganization(
  organizationId: string,
  email: string,
  role: Role
): Promise<void> {
  const client = await clerkClient();

  await client.organizations.createOrganizationInvitation({
    organizationId,
    emailAddress: email,
    role: role === 'admin' ? 'org:admin' : 'org:member',
    publicMetadata: {
      role, // Store our custom role
    },
  });
}

/**
 * Remove user from organization
 */
export async function removeFromOrganization(
  organizationId: string,
  userId: string
): Promise<void> {
  const client = await clerkClient();

  await client.organizations.deleteOrganizationMembership({
    organizationId,
    userId,
  });
}
