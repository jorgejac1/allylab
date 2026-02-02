/**
 * User Routes
 *
 * REST API endpoints for user management.
 * Includes authentication, profile, and admin user management.
 */

import type { FastifyInstance } from 'fastify';
import { requireAuth, requireRole, generateToken, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  getUserById,
  getUsersByOrganization,
  createUser,
  updateUser,
  deleteUser,
  authenticateUser,
  changePassword,
  getOrganizationById,
} from '../services/auth.js';
import { toUserResponse, hasPermission, type Role } from '../types/auth.js';

// Request body types
interface LoginBody {
  email: string;
  password: string;
}

interface CreateUserBody {
  email: string;
  name: string;
  password: string;
  role: Role;
}

interface UpdateUserBody {
  name?: string;
  email?: string;
  role?: Role;
  isActive?: boolean;
}

interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

// Params types
interface UserParams {
  id: string;
}

export async function userRoutes(server: FastifyInstance) {
  // ============================================================================
  // Authentication
  // ============================================================================

  /**
   * POST /api/auth/login
   * Authenticate user and return JWT token
   */
  server.post<{ Body: LoginBody }>('/api/auth/login', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.status(400).send({
        success: false,
        error: 'Email and password are required',
      });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Map our 5 roles to the 3 JWT roles
    // admin/manager -> admin, developer -> user, viewer/compliance -> viewer
    const jwtRole = user.role === 'admin' || user.role === 'manager'
      ? 'admin'
      : user.role === 'developer'
        ? 'user'
        : 'viewer';

    const token = generateToken({
      sub: user.id,
      email: user.email,
      role: jwtRole,
    });

    const org = await getOrganizationById(user.organizationId);

    return {
      success: true,
      data: {
        token,
        user: toUserResponse(user),
        organization: org ? {
          id: org.id,
          name: org.name,
          plan: org.plan,
        } : null,
      },
    };
  });

  /**
   * POST /api/auth/logout
   * Logout user (client-side token removal)
   */
  server.post('/api/auth/logout', async () => {
    return { success: true, message: 'Logged out successfully' };
  });

  // ============================================================================
  // Current User
  // ============================================================================

  /**
   * GET /api/users/me
   * Get current authenticated user profile
   */
  server.get('/api/users/me', {
    preHandler: requireAuth,
  }, async (request: AuthenticatedRequest, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    const user = await getUserById(request.user.sub);
    if (!user) {
      return reply.status(404).send({
        success: false,
        error: 'User not found',
      });
    }

    const org = await getOrganizationById(user.organizationId);

    return {
      success: true,
      data: {
        user: toUserResponse(user),
        organization: org ? {
          id: org.id,
          name: org.name,
          plan: org.plan,
          limits: org.limits,
          usage: org.usage,
        } : null,
      },
    };
  });

  /**
   * PATCH /api/users/me
   * Update current user's own profile (limited fields)
   */
  server.patch<{ Body: Pick<UpdateUserBody, 'name' | 'email'> }>('/api/users/me', {
    preHandler: requireAuth,
  }, async (request: AuthenticatedRequest, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    const body = request.body as Pick<UpdateUserBody, 'name' | 'email'>;
    const { name, email } = body;

    try {
      const updated = await updateUser(request.user.sub, { name, email });
      return { success: true, data: updated };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update failed';
      return reply.status(400).send({
        success: false,
        error: message,
      });
    }
  });

  /**
   * POST /api/users/me/password
   * Change current user's password
   */
  server.post<{ Body: ChangePasswordBody }>('/api/users/me/password', {
    preHandler: requireAuth,
  }, async (request: AuthenticatedRequest, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    const body = request.body as ChangePasswordBody;
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return reply.status(400).send({
        success: false,
        error: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return reply.status(400).send({
        success: false,
        error: 'New password must be at least 8 characters',
      });
    }

    const success = await changePassword(request.user.sub, currentPassword, newPassword);
    if (!success) {
      return reply.status(400).send({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    return { success: true, message: 'Password changed successfully' };
  });

  // ============================================================================
  // Organization Users (Admin/Manager)
  // ============================================================================

  /**
   * GET /api/users
   * Get all users in the organization (admin/manager only)
   */
  server.get('/api/users', {
    preHandler: requireRole('admin'),
  }, async (request: AuthenticatedRequest, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    const currentUser = await getUserById(request.user.sub);
    if (!currentUser) {
      return reply.status(404).send({
        success: false,
        error: 'User not found',
      });
    }

    // Check if user has permission to manage users
    if (!hasPermission(currentUser.role, 'settings:manage-users')) {
      return reply.status(403).send({
        success: false,
        error: 'Permission denied',
      });
    }

    const users = await getUsersByOrganization(currentUser.organizationId);
    return { success: true, data: users };
  });

  /**
   * GET /api/users/:id
   * Get a specific user (admin/manager only)
   */
  server.get<{ Params: UserParams }>('/api/users/:id', {
    preHandler: requireRole('admin'),
  }, async (request: AuthenticatedRequest, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    const currentUser = await getUserById(request.user.sub);
    if (!currentUser || !hasPermission(currentUser.role, 'settings:manage-users')) {
      return reply.status(403).send({
        success: false,
        error: 'Permission denied',
      });
    }

    const params = request.params as UserParams;
    const user = await getUserById(params.id);
    if (!user) {
      return reply.status(404).send({
        success: false,
        error: 'User not found',
      });
    }

    // Ensure user is in same organization
    if (user.organizationId !== currentUser.organizationId) {
      return reply.status(403).send({
        success: false,
        error: 'Permission denied',
      });
    }

    return { success: true, data: toUserResponse(user) };
  });

  /**
   * POST /api/users
   * Create a new user (admin only)
   */
  server.post<{ Body: CreateUserBody }>('/api/users', {
    preHandler: requireRole('admin'),
  }, async (request: AuthenticatedRequest, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    const currentUser = await getUserById(request.user.sub);
    if (!currentUser || !hasPermission(currentUser.role, 'settings:manage-users')) {
      return reply.status(403).send({
        success: false,
        error: 'Permission denied',
      });
    }

    const body = request.body as CreateUserBody;
    const { email, name, password, role } = body;

    if (!email || !name || !password || !role) {
      return reply.status(400).send({
        success: false,
        error: 'Email, name, password, and role are required',
      });
    }

    if (password.length < 8) {
      return reply.status(400).send({
        success: false,
        error: 'Password must be at least 8 characters',
      });
    }

    // Non-admin can't create admin users
    if (currentUser.role !== 'admin' && role === 'admin') {
      return reply.status(403).send({
        success: false,
        error: 'Only admins can create admin users',
      });
    }

    try {
      const newUser = await createUser({
        email,
        name,
        password,
        role,
        organizationId: currentUser.organizationId,
      });
      return reply.status(201).send({ success: true, data: newUser });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      return reply.status(400).send({
        success: false,
        error: message,
      });
    }
  });

  /**
   * PATCH /api/users/:id
   * Update a user (admin only)
   */
  server.patch<{ Params: UserParams; Body: UpdateUserBody }>('/api/users/:id', {
    preHandler: requireRole('admin'),
  }, async (request: AuthenticatedRequest, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    const currentUser = await getUserById(request.user.sub);
    if (!currentUser || !hasPermission(currentUser.role, 'settings:manage-users')) {
      return reply.status(403).send({
        success: false,
        error: 'Permission denied',
      });
    }

    const params = request.params as UserParams;
    const body = request.body as UpdateUserBody;

    const targetUser = await getUserById(params.id);
    if (!targetUser) {
      return reply.status(404).send({
        success: false,
        error: 'User not found',
      });
    }

    // Ensure target user is in same organization
    if (targetUser.organizationId !== currentUser.organizationId) {
      return reply.status(403).send({
        success: false,
        error: 'Permission denied',
      });
    }

    // Prevent non-admin from elevating to admin or demoting admin
    const { role } = body;
    if (currentUser.role !== 'admin') {
      if (role === 'admin' || targetUser.role === 'admin') {
        return reply.status(403).send({
          success: false,
          error: 'Only admins can modify admin users',
        });
      }
    }

    // Prevent admin from demoting themselves
    if (targetUser.id === currentUser.id && role && role !== currentUser.role) {
      return reply.status(400).send({
        success: false,
        error: 'Cannot change your own role',
      });
    }

    try {
      const updated = await updateUser(params.id, body);
      return { success: true, data: updated };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update failed';
      return reply.status(400).send({
        success: false,
        error: message,
      });
    }
  });

  /**
   * DELETE /api/users/:id
   * Delete a user (admin only, soft delete)
   */
  server.delete<{ Params: UserParams }>('/api/users/:id', {
    preHandler: requireRole('admin'),
  }, async (request: AuthenticatedRequest, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    const currentUser = await getUserById(request.user.sub);
    if (!currentUser || currentUser.role !== 'admin') {
      return reply.status(403).send({
        success: false,
        error: 'Only admins can delete users',
      });
    }

    const params = request.params as UserParams;

    const targetUser = await getUserById(params.id);
    if (!targetUser) {
      return reply.status(404).send({
        success: false,
        error: 'User not found',
      });
    }

    // Ensure target user is in same organization
    if (targetUser.organizationId !== currentUser.organizationId) {
      return reply.status(403).send({
        success: false,
        error: 'Permission denied',
      });
    }

    // Prevent admin from deleting themselves
    if (targetUser.id === currentUser.id) {
      return reply.status(400).send({
        success: false,
        error: 'Cannot delete your own account',
      });
    }

    const deleted = await deleteUser(params.id);
    if (!deleted) {
      return reply.status(404).send({
        success: false,
        error: 'User not found',
      });
    }

    return { success: true, message: 'User deleted successfully' };
  });

  // ============================================================================
  // Organization
  // ============================================================================

  /**
   * GET /api/organization
   * Get current user's organization
   */
  server.get('/api/organization', {
    preHandler: requireAuth,
  }, async (request: AuthenticatedRequest, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    const user = await getUserById(request.user.sub);
    if (!user) {
      return reply.status(404).send({
        success: false,
        error: 'User not found',
      });
    }

    const org = await getOrganizationById(user.organizationId);
    if (!org) {
      return reply.status(404).send({
        success: false,
        error: 'Organization not found',
      });
    }

    return {
      success: true,
      data: {
        id: org.id,
        name: org.name,
        plan: org.plan,
        limits: org.limits,
        usage: org.usage,
        settings: hasPermission(user.role, 'settings:view') ? org.settings : undefined,
      },
    };
  });
}
