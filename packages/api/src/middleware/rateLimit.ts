/**
 * Rate Limiting Middleware
 *
 * Provides route-specific rate limiting configurations.
 * Global rate limiting is configured in server.ts.
 */

import type { FastifyInstance, FastifyRequest } from 'fastify';
import rateLimit from '@fastify/rate-limit';

interface RateLimitConfig {
  max: number;
  timeWindow: string;
}

// Route-specific rate limits
const routeLimits: Record<string, RateLimitConfig> = {
  // Scan endpoints - lower limits due to resource intensity
  '/api/scan': { max: 20, timeWindow: '1 minute' },
  '/api/scan/batch': { max: 5, timeWindow: '1 minute' },

  // AI fix generation - lower limits due to API costs
  '/api/fixes/generate': { max: 30, timeWindow: '1 minute' },
  '/api/fixes/batch': { max: 10, timeWindow: '1 minute' },

  // GitHub PR creation - lower limits due to API rate limits
  '/api/github/pr': { max: 10, timeWindow: '1 minute' },

  // Authentication endpoints - stricter limits to prevent brute force
  '/api/auth/login': { max: 5, timeWindow: '1 minute' },
  '/api/auth/register': { max: 3, timeWindow: '1 minute' },
  '/api/auth/reset-password': { max: 3, timeWindow: '1 minute' },

  // Webhook endpoints - higher limits for automation
  '/api/webhooks': { max: 100, timeWindow: '1 minute' },

  // Health check - no limit (handled by allowList in global config)
  '/health': { max: 1000, timeWindow: '1 minute' },
};

/**
 * Get rate limit configuration for a specific route
 */
export function getRateLimitForRoute(url: string): RateLimitConfig | null {
  // Check exact match first
  if (routeLimits[url]) {
    return routeLimits[url];
  }

  // Check prefix matches
  for (const [route, config] of Object.entries(routeLimits)) {
    if (url.startsWith(route)) {
      return config;
    }
  }

  return null;
}

/**
 * Register route-specific rate limiters
 */
export async function registerRouteLimiters(server: FastifyInstance) {
  // Register scan rate limiter
  await server.register(async (instance) => {
    await instance.register(rateLimit, {
      max: 20,
      timeWindow: '1 minute',
      keyGenerator: (request: FastifyRequest) => {
        // Use user ID if authenticated, otherwise IP
        return request.headers['x-user-id'] as string || request.ip;
      },
      errorResponseBuilder: (request, context) => ({
        success: false,
        error: 'Too many scan requests. Please wait before scanning again.',
        code: 'RATE_LIMITED',
        details: { retryAfter: context.after },
        requestId: request.id,
      }),
    });
  }, { prefix: '/api/scan' });

  // Register auth rate limiter
  await server.register(async (instance) => {
    await instance.register(rateLimit, {
      max: 5,
      timeWindow: '1 minute',
      keyGenerator: (request: FastifyRequest) => request.ip,
      errorResponseBuilder: (request, context) => ({
        success: false,
        error: 'Too many authentication attempts. Please try again later.',
        code: 'AUTH_RATE_LIMITED',
        details: { retryAfter: context.after },
        requestId: request.id,
      }),
    });
  }, { prefix: '/api/auth' });

  // Register AI fix rate limiter
  await server.register(async (instance) => {
    await instance.register(rateLimit, {
      max: 30,
      timeWindow: '1 minute',
      keyGenerator: (request: FastifyRequest) => {
        return request.headers['x-user-id'] as string || request.ip;
      },
      errorResponseBuilder: (request, context) => ({
        success: false,
        error: 'Too many fix generation requests. Please wait before generating more fixes.',
        code: 'RATE_LIMITED',
        details: { retryAfter: context.after },
        requestId: request.id,
      }),
    });
  }, { prefix: '/api/fixes' });
}

/**
 * Rate limit bypass key generator
 * Returns a unique key for rate limiting
 */
export function generateRateLimitKey(request: FastifyRequest): string {
  // Prefer user ID for authenticated requests
  const userId = request.headers['x-user-id'];
  if (userId && typeof userId === 'string') {
    return `user:${userId}`;
  }

  // Fall back to IP address
  return `ip:${request.ip}`;
}

/**
 * Check if a request should bypass rate limiting
 */
export function shouldBypassRateLimit(request: FastifyRequest): boolean {
  // Admin bypass (requires valid admin token)
  const adminToken = request.headers['x-admin-token'];
  if (adminToken === process.env.ADMIN_BYPASS_TOKEN) {
    return true;
  }

  // Internal service bypass
  const serviceToken = request.headers['x-service-token'];
  if (serviceToken === process.env.SERVICE_TOKEN) {
    return true;
  }

  return false;
}
