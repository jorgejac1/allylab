/**
 * Standardized Error Handling
 *
 * Provides consistent error response format across all API endpoints.
 * All errors include request ID for correlation and debugging.
 */

import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

/**
 * Standard error response format
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: Record<string, unknown>;
  requestId?: string;
  timestamp: string;
}

/**
 * Standard error codes
 */
export const ErrorCodes = {
  // Client errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',

  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT: 'TIMEOUT',

  // Business logic errors
  SCAN_FAILED: 'SCAN_FAILED',
  SCAN_TIMEOUT: 'SCAN_TIMEOUT',
  FIX_GENERATION_FAILED: 'FIX_GENERATION_FAILED',
  GITHUB_ERROR: 'GITHUB_ERROR',
  JIRA_ERROR: 'JIRA_ERROR',
  WEBHOOK_ERROR: 'WEBHOOK_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Custom API error class
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(message, ErrorCodes.BAD_REQUEST, 400, details);
  }

  static validationError(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(message, ErrorCodes.VALIDATION_ERROR, 400, details);
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(message, ErrorCodes.UNAUTHORIZED, 401);
  }

  static forbidden(message = 'Access denied'): ApiError {
    return new ApiError(message, ErrorCodes.FORBIDDEN, 403);
  }

  static notFound(resource: string): ApiError {
    return new ApiError(`${resource} not found`, ErrorCodes.NOT_FOUND, 404);
  }

  static conflict(message: string): ApiError {
    return new ApiError(message, ErrorCodes.CONFLICT, 409);
  }

  static rateLimited(retryAfter?: string): ApiError {
    return new ApiError(
      'Too many requests',
      ErrorCodes.RATE_LIMITED,
      429,
      retryAfter ? { retryAfter } : undefined
    );
  }

  static internalError(message = 'An unexpected error occurred'): ApiError {
    return new ApiError(message, ErrorCodes.INTERNAL_ERROR, 500);
  }

  static timeout(message = 'Request timed out'): ApiError {
    return new ApiError(message, ErrorCodes.TIMEOUT, 504);
  }

  static scanFailed(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(message, ErrorCodes.SCAN_FAILED, 500, details);
  }

  static scanTimeout(url: string): ApiError {
    return new ApiError(
      `Scan timed out for ${url}`,
      ErrorCodes.SCAN_TIMEOUT,
      504,
      { url }
    );
  }

  static githubError(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(message, ErrorCodes.GITHUB_ERROR, 502, details);
  }

  static jiraError(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(message, ErrorCodes.JIRA_ERROR, 502, details);
  }
}

/**
 * Create a standard error response
 */
export function createErrorResponse(
  error: ApiError | Error | FastifyError,
  requestId?: string
): ApiErrorResponse {
  const timestamp = new Date().toISOString();

  if (error instanceof ApiError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
      requestId,
      timestamp,
    };
  }

  // Handle Fastify validation errors
  if ('validation' in error && Array.isArray((error as FastifyError).validation)) {
    const fastifyError = error as FastifyError;
    return {
      success: false,
      error: 'Validation failed',
      code: ErrorCodes.VALIDATION_ERROR,
      details: {
        errors: fastifyError.validation,
      },
      requestId,
      timestamp,
    };
  }

  // Handle standard errors
  return {
    success: false,
    error: error.message || 'An unexpected error occurred',
    code: ErrorCodes.INTERNAL_ERROR,
    requestId,
    timestamp,
  };
}

/**
 * Send a standardized error response
 */
export function sendError(
  reply: FastifyReply,
  error: ApiError | Error,
  requestId?: string
): FastifyReply {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const response = createErrorResponse(error, requestId);

  return reply.status(statusCode).send(response);
}

/**
 * Global error handler for Fastify
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const requestId = request.id;

  // Log the error
  request.log.error({
    err: error,
    requestId,
    url: request.url,
    method: request.method,
  });

  // Determine status code
  let statusCode = error.statusCode || 500;

  // Handle specific Fastify error codes
  if (error.code === 'FST_ERR_VALIDATION') {
    statusCode = 400;
  } else if (error.code === 'FST_ERR_NOT_FOUND') {
    statusCode = 404;
  } else if (error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
    statusCode = 413;
  }

  const response = createErrorResponse(error, requestId);

  reply.status(statusCode).send(response);
}

/**
 * Not found handler for undefined routes
 */
export function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const response = createErrorResponse(
    ApiError.notFound('Route'),
    request.id
  );

  reply.status(404).send(response);
}
