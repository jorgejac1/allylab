import crypto from 'crypto';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { initScheduler, shutdownScheduler } from './services/scheduler.js';
import { registerRoutes } from './routes/index.js';
import { initializeMockData } from './services/auth.js';
import { config } from './config/env.js';
import { swaggerConfig, swaggerUiConfig } from './config/swagger.js';
import {
  httpRequestsInProgress,
  recordHttpRequest,
  recordError,
} from './utils/metrics.js';
import { errorHandler, notFoundHandler } from './utils/errors.js';
import { shutdownPool, closeBrowser } from './services/browser.js';

// Track if shutdown is in progress
let isShuttingDown = false;

// Graceful shutdown timeout (30 seconds)
const SHUTDOWN_TIMEOUT_MS = 30000;

/**
 * Generate a unique request ID
 * Format: timestamp-random for sortability and uniqueness
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${random}`;
}

export async function createServer() {
  const server = Fastify({
    logger: config.nodeEnv === 'development'
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
            },
          },
        }
      : true,
    // Request body size limits
    bodyLimit: 1048576, // 1MB default
    // Generate unique request IDs for correlation
    genReqId: (request) => {
      // Use incoming X-Request-ID header if provided, otherwise generate one
      const incomingId = request.headers['x-request-id'];
      if (typeof incomingId === 'string' && incomingId.length > 0) {
        return incomingId;
      }
      return generateRequestId();
    },
    // Disable default request ID header (we'll set it ourselves)
    requestIdHeader: 'x-request-id',
  });

  // CORS configuration
  await server.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  });

  // Cookie support for auth
  await server.register(cookie, {
    secret: config.jwtSecret, // for signed cookies (optional)
    parseOptions: {},
  });

  // OpenAPI documentation
  await server.register(swagger, swaggerConfig);
  await server.register(swaggerUi, swaggerUiConfig);

  // Rate limiting
  if (config.enableRateLimiting) {
    await server.register(rateLimit, {
      max: config.rateLimitMax,
      timeWindow: config.rateLimitTimeWindow,
      // Custom error response in standardized format
      errorResponseBuilder: (request, context) => ({
        success: false,
        error: 'Too many requests',
        code: 'RATE_LIMITED',
        details: { retryAfter: context.after },
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }),
      // Skip rate limiting for health checks, metrics, and docs
      allowList: (request) =>
        request.url === '/health' ||
        request.url === '/metrics' ||
        request.url.startsWith('/docs'),
      // Add rate limit headers
      addHeadersOnExceeding: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
      },
      addHeaders: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
        'retry-after': true,
      },
    });
  }

  // Request correlation and metrics hooks
  server.addHook('onRequest', async (request, reply) => {
    // Track request start time
    request.startTime = process.hrtime.bigint();
    // Store request ID on request object for easy access
    request.requestId = request.id;
    // Set request ID header in response
    reply.header('x-request-id', request.id);
    // Increment in-progress counter
    httpRequestsInProgress.inc({ method: request.method });
  });

  server.addHook('onResponse', async (request, reply) => {
    // Calculate duration in seconds
    const duration = request.startTime
      ? Number(process.hrtime.bigint() - request.startTime) / 1e9
      : 0;

    // Decrement in-progress counter
    httpRequestsInProgress.dec({ method: request.method });

    // Record request metrics (skip metrics endpoint to avoid self-referencing)
    if (request.url !== '/metrics') {
      recordHttpRequest(request.method, request.url, reply.statusCode, duration);
    }
  });

  server.addHook('onError', async (request, _reply, error) => {
    // Record error metrics
    recordError('http', error.name || 'UnknownError');
  });

  // Global error handler for standardized responses
  server.setErrorHandler(errorHandler);

  // 404 handler for undefined routes
  server.setNotFoundHandler(notFoundHandler);

  await registerRoutes(server);

  // Initialize mock user data for development
  await initializeMockData();

  // Initialize scheduler
  initScheduler();

  // Setup graceful shutdown
  setupGracefulShutdown(server);

  return server;
}

/**
 * Graceful shutdown handler
 * Ensures all resources are properly cleaned up before exit
 */
async function gracefulShutdown(server: FastifyInstance, signal: string): Promise<void> {
  if (isShuttingDown) {
    server.log.warn({ signal }, 'Shutdown already in progress, ignoring signal');
    return;
  }

  isShuttingDown = true;
  server.log.info({ signal }, 'Starting graceful shutdown');

  // Set a timeout to force exit if shutdown takes too long
  const forceExitTimeout = setTimeout(() => {
    server.log.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  try {
    // 1. Stop accepting new connections and drain existing ones
    server.log.info('Closing server connections...');
    await server.close();
    server.log.info('Server connections closed');

    // 2. Shutdown scheduler (stops scheduled scans)
    server.log.info('Shutting down scheduler...');
    shutdownScheduler();
    server.log.info('Scheduler stopped');

    // 3. Shutdown browser page pool
    server.log.info('Shutting down browser pool...');
    await shutdownPool();
    server.log.info('Browser pool closed');

    // 4. Close browser instance
    server.log.info('Closing browser...');
    await closeBrowser();
    server.log.info('Browser closed');

    // Clear the force exit timeout
    clearTimeout(forceExitTimeout);

    server.log.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    server.log.error({ err: error }, 'Error during graceful shutdown');
    clearTimeout(forceExitTimeout);
    process.exit(1);
  }
}

/**
 * Setup signal handlers for graceful shutdown
 */
function setupGracefulShutdown(server: FastifyInstance): void {
  const shutdownHandler = (signal: string) => {
    // Don't use arrow function to preserve 'this'
    gracefulShutdown(server, signal).catch((err) => {
      server.log.error({ err }, 'Unhandled error in shutdown');
      process.exit(1);
    });
  };

  process.on('SIGINT', () => shutdownHandler('SIGINT'));
  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
}

/**
 * Check if server is shutting down
 */
export function isServerShuttingDown(): boolean {
  return isShuttingDown;
}