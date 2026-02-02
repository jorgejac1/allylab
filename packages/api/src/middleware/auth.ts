/**
 * Authentication Middleware
 *
 * Provides JWT-based authentication for API endpoints.
 * Can be disabled for development with DISABLE_AUTH=true
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { config } from '../config/env.js';

// Simple JWT implementation (no external dependency)
// For production, consider using @fastify/jwt

export interface JWTPayload {
  sub: string;       // User ID
  email?: string;    // User email
  role: 'admin' | 'user' | 'viewer';
  iat: number;       // Issued at
  exp: number;       // Expiration
}

export interface AuthenticatedRequest extends FastifyRequest {
  user?: JWTPayload;
}

/**
 * Base64URL encode
 */
function base64UrlEncode(data: string): string {
  return Buffer.from(data)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64URL decode
 */
function base64UrlDecode(data: string): string {
  const padded = data + '='.repeat((4 - data.length % 4) % 4);
  return Buffer.from(
    padded.replace(/-/g, '+').replace(/_/g, '/'),
    'base64'
  ).toString();
}

/**
 * Create HMAC signature
 */
function createSignature(data: string, secret: string): string {
  return base64UrlEncode(
    crypto.createHmac('sha256', secret).update(data).digest('base64')
  );
}

/**
 * Parse JWT expiration string to seconds
 */
function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 86400; // Default 24 hours

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 86400;
  }
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const now = Math.floor(Date.now() / 1000);
  const expiresInSeconds = parseExpiresIn(config.jwtExpiresIn);

  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = createSignature(`${header}.${body}`, config.jwtSecret);

  return `${header}.${body}.${signature}`;
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [header, body, signature] = parts;

  // Verify signature
  const expectedSignature = createSignature(`${header}.${body}`, config.jwtSecret);
  if (signature !== expectedSignature) {
    throw new Error('Invalid token signature');
  }

  // Decode payload
  const payload = JSON.parse(base64UrlDecode(body)) as JWTPayload;

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new Error('Token has expired');
  }

  return payload;
}

// Cookie name for auth token
export const AUTH_COOKIE_NAME = 'allylab_token';

/**
 * Extract token from request (Authorization header or cookie)
 */
function extractToken(request: FastifyRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Try cookie
  const cookies = request.cookies;
  if (cookies && cookies[AUTH_COOKIE_NAME]) {
    return cookies[AUTH_COOKIE_NAME];
  }

  return null;
}

/**
 * Authentication middleware - requires valid JWT token
 * Supports both Authorization header and cookie-based auth
 */
export async function requireAuth(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  // Allow bypass in development if auth is disabled
  if (!config.enableAuth && config.nodeEnv !== 'production') {
    request.user = {
      sub: 'dev-user',
      email: 'dev@localhost',
      role: 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    };
    return;
  }

  const token = extractToken(request);

  if (!token) {
    return reply.status(401).send({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }

  try {
    const payload = verifyToken(token);
    request.user = payload;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid token';
    return reply.status(401).send({
      success: false,
      error: message,
      code: 'INVALID_TOKEN',
    });
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...allowedRoles: Array<'admin' | 'user' | 'viewer'>) {
  return async (
    request: AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> => {
    // First verify authentication
    await requireAuth(request, reply);

    // If auth failed, reply was already sent
    if (reply.sent) return;

    const user = request.user;
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
 * Optional authentication - sets user if token present, but doesn't require it
 * Supports both Authorization header and cookie-based auth
 */
export async function optionalAuth(
  request: AuthenticatedRequest,
  _reply: FastifyReply
): Promise<void> {
  const token = extractToken(request);

  if (!token) {
    return; // No token, continue without user
  }

  try {
    const payload = verifyToken(token);
    request.user = payload;
  } catch {
    // Invalid token in optional auth - just ignore
  }
}

/**
 * Generate a development token for testing
 * Only works in development mode
 */
export function generateDevToken(userId = 'dev-user', role: 'admin' | 'user' | 'viewer' = 'admin'): string {
  if (config.nodeEnv === 'production') {
    throw new Error('Cannot generate dev tokens in production');
  }

  return generateToken({
    sub: userId,
    email: `${userId}@localhost`,
    role,
  });
}
