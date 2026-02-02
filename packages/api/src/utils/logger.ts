/**
 * Structured Logging Utility
 *
 * Provides consistent, structured logging across the application using Pino.
 * Replaces console.log/error/warn with structured JSON logging.
 */

import pino from 'pino';
import { config } from '../config/env.js';

// Configure Pino options based on environment
const pinoOptions: pino.LoggerOptions = config.nodeEnv === 'development'
  ? {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
      level: 'debug',
    }
  : {
      level: process.env.LOG_LEVEL || 'info',
      formatters: {
        level: (label) => ({ level: label }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    };

// Create the base logger
const baseLogger = pino(pinoOptions);

// Export child loggers for different services
export const logger = baseLogger;

/**
 * Create a child logger with a specific service context
 */
export function createLogger(service: string) {
  return baseLogger.child({ service });
}

// Pre-created loggers for common services
export const scannerLogger = createLogger('scanner');
export const browserLogger = createLogger('browser');
export const storageLogger = createLogger('storage');
export const githubLogger = createLogger('github');
export const schedulerLogger = createLogger('scheduler');
export const webhookLogger = createLogger('webhooks');
export const crawlerLogger = createLogger('crawler');
export const aiLogger = createLogger('ai-fixes');
export const ruleLogger = createLogger('rules');

/**
 * Log an error with context
 */
export function logError(
  logger: pino.Logger,
  error: unknown,
  context?: Record<string, unknown>
): void {
  if (error instanceof Error) {
    logger.error({
      err: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      ...context,
    });
  } else {
    logger.error({ error, ...context });
  }
}

/**
 * Log a request/response cycle for API calls
 */
export function logApiCall(
  logger: pino.Logger,
  method: string,
  url: string,
  status: number,
  duration: number,
  context?: Record<string, unknown>
): void {
  logger.info({
    type: 'api_call',
    method,
    url,
    status,
    duration,
    ...context,
  });
}

/**
 * Log a scan operation
 */
export function logScan(
  url: string,
  viewport: string,
  status: 'started' | 'completed' | 'failed',
  context?: Record<string, unknown>
): void {
  if (status === 'failed') {
    scannerLogger.error({ type: 'scan', url, viewport, status, ...context });
  } else {
    scannerLogger.info({ type: 'scan', url, viewport, status, ...context });
  }
}
