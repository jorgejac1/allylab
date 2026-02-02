/**
 * Clerk Authentication Middleware
 *
 * Validates Clerk JWT tokens and enriches requests with user data.
 * Falls back to mock auth when CLERK_SECRET_KEY is not configured.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { createClerkClient } from '@clerk/backend';
import { config } from '../config/env.js';
import { getUserById } from '../services/auth.js';
import type { Role } from '../types/auth.js';

// Initialize Clerk client (only if configured)
const clerk = config.clerkSecretKey
  ? createClerkClient({ secretKey: config.clerkSecretKey })
  : null;

export interface ClerkUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  organizationId: string | null;
  role: Role;
}

export interface ClerkAuthenticatedRequest extends FastifyRequest {
  clerkUser?: ClerkUser;
}

/**
 * Check if Clerk is configured
 */
export function isClerkConfigured(): boolean {
  return Boolean(clerk);
}

/**
 * Extract and verify Clerk session token
 */
async function verifyClerkToken(token: string): Promise<ClerkUser | null> {
  if (!clerk) return null;

  try {
    // Verify the session token
    const session = await clerk.sessions.getSession(token);
    if (!session || session.status !== 'active') {
      return null;
    }

    // Get user details
    const user = await clerk.users.getUser(session.userId);
    if (!user) return null;

    // Get user's organization membership
    const memberships = await clerk.users.getOrganizationMembershipList({
      userId: user.id,
    });

    const primaryMembership = memberships.data[0];
    const organizationId = primaryMembership?.organization?.id || null;

    // Get role from user metadata or default to viewer
    const metadata = user.publicMetadata as { role?: Role } | undefined;
    const role = metadata?.role || 'viewer';

    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      organizationId,
      role,
    };
  } catch (error) {
    console.error('Clerk token verification failed:', error);
    return null;
  }
}

/**
 * Clerk authentication middleware
 * Validates Clerk JWT and adds user to request
 */
export async function requireClerkAuth(
  request: ClerkAuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  // If Clerk is not configured, use mock auth
  if (!isClerkConfigured()) {
    return useMockAuth(request, reply);
  }

  // Get token from Authorization header or cookie
  const authHeader = request.headers.authorization;
  const sessionToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : request.cookies?.['__session'];

  if (!sessionToken) {
    return reply.status(401).send({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }

  const user = await verifyClerkToken(sessionToken);
  if (!user) {
    return reply.status(401).send({
      success: false,
      error: 'Invalid or expired session',
      code: 'INVALID_SESSION',
    });
  }

  request.clerkUser = user;
}

/**
 * Optional Clerk auth - doesn't fail if no token
 */
export async function optionalClerkAuth(
  request: ClerkAuthenticatedRequest,
  _reply: FastifyReply
): Promise<void> {
  if (!isClerkConfigured()) {
    // Use mock auth in dev mode
    await useMockAuthOptional(request);
    return;
  }

  const authHeader = request.headers.authorization;
  const sessionToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : request.cookies?.['__session'];

  if (!sessionToken) return;

  const user = await verifyClerkToken(sessionToken);
  if (user) {
    request.clerkUser = user;
  }
}

/**
 * Role-based authorization for Clerk users
 */
export function requireClerkRole(...allowedRoles: Role[]) {
  return async (
    request: ClerkAuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> => {
    // First verify authentication
    await requireClerkAuth(request, reply);

    // If reply was sent, auth failed
    if (reply.sent) return;

    const user = request.clerkUser;
    if (!user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return reply.status(403).send({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }
  };
}

/**
 * Mock auth for development when Clerk is not configured
 */
async function useMockAuth(
  request: ClerkAuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  // In dev mode without Clerk, use the default admin user
  const mockUser = await getUserById('user_admin');

  if (!mockUser) {
    return reply.status(500).send({
      success: false,
      error: 'Mock auth not initialized',
      code: 'MOCK_AUTH_ERROR',
    });
  }

  request.clerkUser = {
    id: mockUser.id,
    email: mockUser.email,
    firstName: mockUser.name.split(' ')[0],
    lastName: mockUser.name.split(' ')[1] || null,
    imageUrl: mockUser.avatarUrl || null,
    organizationId: mockUser.organizationId,
    role: mockUser.role,
  };
}

/**
 * Optional mock auth for development
 */
async function useMockAuthOptional(
  request: ClerkAuthenticatedRequest
): Promise<void> {
  const mockUser = await getUserById('user_admin');

  if (mockUser) {
    request.clerkUser = {
      id: mockUser.id,
      email: mockUser.email,
      firstName: mockUser.name.split(' ')[0],
      lastName: mockUser.name.split(' ')[1] || null,
      imageUrl: mockUser.avatarUrl || null,
      organizationId: mockUser.organizationId,
      role: mockUser.role,
    };
  }
}
