import { describe, it, expect, vi } from 'vitest';
import type { FastifyReply, FastifyRequest, FastifyError } from 'fastify';
import {
  ApiError,
  ErrorCodes,
  createErrorResponse,
  sendError,
  errorHandler,
  notFoundHandler,
} from '../../utils/errors';

describe('utils/errors', () => {
  describe('ApiError', () => {
    it('creates error with all properties', () => {
      const error = new ApiError('Test error', ErrorCodes.BAD_REQUEST, 400, { field: 'name' });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'name' });
      expect(error.name).toBe('ApiError');
    });

    describe('static factory methods', () => {
      it('creates badRequest error', () => {
        const error = ApiError.badRequest('Invalid input', { field: 'email' });
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('BAD_REQUEST');
        expect(error.details).toEqual({ field: 'email' });
      });

      it('creates validationError', () => {
        const error = ApiError.validationError('Validation failed');
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('VALIDATION_ERROR');
      });

      it('creates unauthorized error', () => {
        const error = ApiError.unauthorized();
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('UNAUTHORIZED');
        expect(error.message).toBe('Authentication required');
      });

      it('creates forbidden error', () => {
        const error = ApiError.forbidden();
        expect(error.statusCode).toBe(403);
        expect(error.code).toBe('FORBIDDEN');
      });

      it('creates notFound error', () => {
        const error = ApiError.notFound('User');
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe('NOT_FOUND');
        expect(error.message).toBe('User not found');
      });

      it('creates conflict error', () => {
        const error = ApiError.conflict('Resource already exists');
        expect(error.statusCode).toBe(409);
        expect(error.code).toBe('CONFLICT');
      });

      it('creates rateLimited error', () => {
        const error = ApiError.rateLimited('60s');
        expect(error.statusCode).toBe(429);
        expect(error.code).toBe('RATE_LIMITED');
        expect(error.details).toEqual({ retryAfter: '60s' });
      });

      it('creates internalError', () => {
        const error = ApiError.internalError();
        expect(error.statusCode).toBe(500);
        expect(error.code).toBe('INTERNAL_ERROR');
      });

      it('creates timeout error', () => {
        const error = ApiError.timeout();
        expect(error.statusCode).toBe(504);
        expect(error.code).toBe('TIMEOUT');
      });

      it('creates scanFailed error', () => {
        const error = ApiError.scanFailed('Scan failed', { url: 'http://example.com' });
        expect(error.statusCode).toBe(500);
        expect(error.code).toBe('SCAN_FAILED');
        expect(error.details).toEqual({ url: 'http://example.com' });
      });

      it('creates scanTimeout error', () => {
        const error = ApiError.scanTimeout('http://example.com');
        expect(error.statusCode).toBe(504);
        expect(error.code).toBe('SCAN_TIMEOUT');
        expect(error.details).toEqual({ url: 'http://example.com' });
      });

      it('creates githubError', () => {
        const error = ApiError.githubError('GitHub API error');
        expect(error.statusCode).toBe(502);
        expect(error.code).toBe('GITHUB_ERROR');
      });

      it('creates jiraError', () => {
        const error = ApiError.jiraError('Jira API error');
        expect(error.statusCode).toBe(502);
        expect(error.code).toBe('JIRA_ERROR');
      });
    });
  });

  describe('createErrorResponse', () => {
    it('creates response from ApiError', () => {
      const error = ApiError.badRequest('Invalid input', { field: 'email' });
      const response = createErrorResponse(error, 'req-123');

      expect(response.success).toBe(false);
      expect(response.error).toBe('Invalid input');
      expect(response.code).toBe('BAD_REQUEST');
      expect(response.details).toEqual({ field: 'email' });
      expect(response.requestId).toBe('req-123');
      expect(response.timestamp).toBeDefined();
    });

    it('creates response from standard Error', () => {
      const error = new Error('Something went wrong');
      const response = createErrorResponse(error, 'req-456');

      expect(response.success).toBe(false);
      expect(response.error).toBe('Something went wrong');
      expect(response.code).toBe('INTERNAL_ERROR');
      expect(response.requestId).toBe('req-456');
    });

    it('handles Fastify validation errors', () => {
      const error = {
        validation: [{ dataPath: '.email', message: 'must be valid email' }],
        message: 'Validation error',
      } as unknown as FastifyError;

      const response = createErrorResponse(error);

      expect(response.code).toBe('VALIDATION_ERROR');
      expect(response.details).toEqual({
        errors: error.validation,
      });
    });

    it('handles error without message', () => {
      const error = new Error();
      error.message = '';
      const response = createErrorResponse(error);

      expect(response.error).toBe('An unexpected error occurred');
    });
  });

  describe('sendError', () => {
    it('sends error response with correct status code', () => {
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      const error = ApiError.notFound('User');
      sendError(mockReply, error, 'req-789');

      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'User not found',
          code: 'NOT_FOUND',
        })
      );
    });

    it('defaults to 500 for standard errors', () => {
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      const error = new Error('Unknown error');
      sendError(mockReply, error);

      expect(mockReply.status).toHaveBeenCalledWith(500);
    });
  });

  describe('errorHandler', () => {
    it('handles errors and sends standardized response', () => {
      const mockRequest = {
        id: 'req-abc',
        url: '/api/test',
        method: 'GET',
        log: { error: vi.fn() },
      } as unknown as FastifyRequest;

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      const error = {
        message: 'Test error',
        statusCode: 400,
      } as FastifyError;

      errorHandler(error, mockRequest, mockReply);

      expect(mockRequest.log.error).toHaveBeenCalled();
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          requestId: 'req-abc',
        })
      );
    });

    it('handles validation errors with 400 status', () => {
      const mockRequest = {
        id: 'req-def',
        url: '/api/test',
        method: 'POST',
        log: { error: vi.fn() },
      } as unknown as FastifyRequest;

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      const error = {
        code: 'FST_ERR_VALIDATION',
        message: 'Validation failed',
      } as FastifyError;

      errorHandler(error, mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
    });
  });

  describe('notFoundHandler', () => {
    it('sends 404 response with standardized format', () => {
      const mockRequest = {
        id: 'req-ghi',
      } as unknown as FastifyRequest;

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      notFoundHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'NOT_FOUND',
          requestId: 'req-ghi',
        })
      );
    });
  });
});
