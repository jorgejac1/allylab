import { vi } from 'vitest';
import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Create a mock Fastify request object
 */
export function createMockRequest(overrides: Partial<FastifyRequest> = {}): FastifyRequest {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    log: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
    ...overrides,
  } as unknown as FastifyRequest;
}

/**
 * Mock reply type with test helpers
 */
export interface MockFastifyReply {
  _statusCode: number;
  _payload: unknown;
  _headers: Record<string, string>;
  status: (code: number) => MockFastifyReply;
  send: (payload: unknown) => MockFastifyReply;
  header: (name: string, value: string) => MockFastifyReply;
  raw: {
    writeHead: ReturnType<typeof vi.fn>;
    write: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
  };
}

/**
 * Create a mock Fastify reply object
 */
export function createMockReply(): MockFastifyReply {
  const reply: MockFastifyReply = {
    _statusCode: 200,
    _payload: null as unknown,
    _headers: {},
    
    status(code: number) {
      this._statusCode = code;
      return this;
    },
    
    send(payload: unknown) {
      this._payload = payload;
      return this;
    },
    
    header(name: string, value: string) {
      this._headers[name] = value;
      return this;
    },
    
    raw: {
      writeHead: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    },
  };

  return reply;
}

/**
 * Get mock reply as FastifyReply (for passing to route handlers)
 */
export function asFastifyReply(mock: MockFastifyReply): FastifyReply {
  return mock as unknown as FastifyReply;
}

/**
 * Create a mock Fastify instance
 */
export function createMockFastify() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    register: vi.fn(),
    log: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
  };
}