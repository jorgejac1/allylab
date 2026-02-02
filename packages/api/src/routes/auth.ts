/**
 * Authentication Routes
 *
 * Handles login, logout, and session management.
 * Supports both cookie-based auth (for browser) and token-based auth (for API clients).
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticateUser, getUserById, getOrganizationById } from '../services/auth.js';
import { generateToken, verifyToken, AUTH_COOKIE_NAME, type JWTPayload } from '../middleware/auth.js';
import { toUserResponse } from '../types/auth.js';
import { config } from '../config/env.js';

// Map internal roles to JWT roles
function mapRole(role: string): 'admin' | 'user' | 'viewer' {
  switch (role) {
    case 'admin':
      return 'admin';
    case 'manager':
    case 'developer':
    case 'compliance':
      return 'user';
    case 'viewer':
    default:
      return 'viewer';
  }
}

interface LoginBody {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId: string;
    avatarUrl?: string;
  };
  organization?: {
    id: string;
    name: string;
    plan: string;
  };
  token?: string;
  error?: string;
  code?: string;
}

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /auth/login
   * Authenticate user and return session
   */
  fastify.post<{ Body: LoginBody }>('/auth/login', {
    schema: {
      description: 'Authenticate user with email and password',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 },
          rememberMe: { type: 'boolean' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                organizationId: { type: 'string' },
                avatarUrl: { type: 'string' },
              },
            },
            organization: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                plan: { type: 'string' },
              },
            },
            token: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            code: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply): Promise<LoginResponse> => {
    const { email, password, rememberMe } = request.body;

    // Authenticate user
    const user = await authenticateUser(email, password);
    if (!user) {
      reply.status(401);
      return {
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      };
    }

    // Get organization
    const organization = await getOrganizationById(user.organizationId);

    // Generate JWT token
    const token = generateToken({
      sub: user.id,
      email: user.email,
      role: mapRole(user.role),
    });

    // Set cookie for browser-based auth
    const isProduction = config.nodeEnv === 'production';
    const maxAge = rememberMe
      ? 30 * 24 * 60 * 60 * 1000  // 30 days
      : 24 * 60 * 60 * 1000;      // 24 hours

    reply.setCookie(AUTH_COOKIE_NAME, token, {
      path: '/',
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: maxAge / 1000, // Cookie maxAge is in seconds
    });

    const userResponse = toUserResponse(user);

    return {
      success: true,
      user: {
        id: userResponse.id,
        email: userResponse.email,
        name: userResponse.name,
        role: userResponse.role,
        organizationId: userResponse.organizationId,
        avatarUrl: userResponse.avatarUrl,
      },
      organization: organization ? {
        id: organization.id,
        name: organization.name,
        plan: organization.plan,
      } : undefined,
      token,
    };
  });

  /**
   * POST /auth/logout
   * Clear session cookie
   */
  fastify.post('/auth/logout', {
    schema: {
      description: 'Clear authentication session',
      tags: ['Authentication'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    // Clear auth cookie
    reply.clearCookie(AUTH_COOKIE_NAME, {
      path: '/',
    });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  });

  /**
   * GET /auth/me
   * Get current authenticated user
   */
  fastify.get('/auth/me', {
    schema: {
      description: 'Get current authenticated user',
      tags: ['Authentication'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                organizationId: { type: 'string' },
                avatarUrl: { type: 'string' },
              },
            },
            organization: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                plan: { type: 'string' },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            code: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    // Try to get token from header or cookie
    const authHeader = request.headers.authorization;
    let token: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (request.cookies && request.cookies[AUTH_COOKIE_NAME]) {
      token = request.cookies[AUTH_COOKIE_NAME];
    }

    if (!token) {
      // In development without auth, return mock user
      if (!config.enableAuth && config.nodeEnv !== 'production') {
        return {
          success: true,
          user: {
            id: 'dev-user',
            email: 'dev@localhost',
            name: 'Development User',
            role: 'admin',
            organizationId: 'org_acme',
          },
          organization: {
            id: 'org_acme',
            name: 'Acme Corp',
            plan: 'team',
          },
        };
      }

      reply.status(401);
      return {
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      };
    }

    try {
      const payload: JWTPayload = verifyToken(token);
      const user = await getUserById(payload.sub);

      if (!user) {
        reply.status(401);
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        };
      }

      const organization = await getOrganizationById(user.organizationId);
      const userResponse = toUserResponse(user);

      return {
        success: true,
        user: {
          id: userResponse.id,
          email: userResponse.email,
          name: userResponse.name,
          role: userResponse.role,
          organizationId: userResponse.organizationId,
          avatarUrl: userResponse.avatarUrl,
        },
        organization: organization ? {
          id: organization.id,
          name: organization.name,
          plan: organization.plan,
        } : undefined,
      };
    } catch (error) {
      reply.status(401);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid token',
        code: 'INVALID_TOKEN',
      };
    }
  });

  /**
   * POST /auth/refresh
   * Refresh the authentication token
   */
  fastify.post('/auth/refresh', {
    schema: {
      description: 'Refresh authentication token',
      tags: ['Authentication'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            token: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            code: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    // Get current token
    const authHeader = request.headers.authorization;
    let token: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (request.cookies && request.cookies[AUTH_COOKIE_NAME]) {
      token = request.cookies[AUTH_COOKIE_NAME];
    }

    if (!token) {
      reply.status(401);
      return {
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      };
    }

    try {
      const payload: JWTPayload = verifyToken(token);

      // Generate new token with same claims
      const newToken = generateToken({
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      });

      // Update cookie
      const isProduction = config.nodeEnv === 'production';
      reply.setCookie(AUTH_COOKIE_NAME, newToken, {
        path: '/',
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60, // 24 hours in seconds
      });

      return {
        success: true,
        token: newToken,
      };
    } catch (error) {
      reply.status(401);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid token',
        code: 'INVALID_TOKEN',
      };
    }
  });
}
