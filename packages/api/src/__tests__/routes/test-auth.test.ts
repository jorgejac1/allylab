import type { FastifyInstance } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { scanRoutes } from "../../routes/scan";

const mockRunScan = vi.fn();
const mockTriggerWebhooks = vi.fn();
const mockSendSSE = vi.fn();
const mockEndSSE = vi.fn();
const mockCreateAuthenticatedContext = vi.fn();
const mockExecuteLoginFlow = vi.fn();

vi.mock("../../services/scanner", () => ({
  runScan: (...args: unknown[]) => mockRunScan(...args),
}));
vi.mock("../../services/webhooks", () => ({
  triggerWebhooks: (...args: unknown[]) => mockTriggerWebhooks(...args),
}));
vi.mock("../../utils/sse", () => ({
  sendSSE: (...args: unknown[]) => mockSendSSE(...args),
  endSSE: (...args: unknown[]) => mockEndSSE(...args),
}));
vi.mock("../../services/browser", () => ({
  createAuthenticatedContext: (...args: unknown[]) => mockCreateAuthenticatedContext(...args),
  executeLoginFlow: (...args: unknown[]) => mockExecuteLoginFlow(...args),
}));
vi.mock("../../utils/url-validator", () => ({
  validateUrlWithConfig: (url: string) => {
    if (!url || url === "invalid" || url.includes("blocked")) {
      return { valid: false, error: "Invalid URL" };
    }
    return { valid: true, url: new URL(url) };
  },
}));
vi.mock("../../config/env", () => ({
  config: {
    enableRateLimiting: false,
    scanRateLimitMax: 10,
    scanRateLimitTimeWindow: "1 minute",
  },
}));

type RouteHandler = (
  req: { body: Record<string, unknown> },
  reply: ReplyMock
) => Promise<unknown> | unknown;

type FastifyMock = {
  post: (path: string, ...args: unknown[]) => FastifyMock;
  routes: Map<string, RouteHandler>;
};

type FnMock<Args extends unknown[], Return> = ReturnType<
  typeof vi.fn<(...args: Args) => Return>
>;

type ReplyMock = {
  statusCode: number;
  payload: unknown;
  raw: { writeHead: FnMock<[number, Record<string, string>], void> };
  status: FnMock<[number], ReplyMock>;
  send: FnMock<[unknown], unknown>;
};

function createFastifyMock(): FastifyMock {
  const routes = new Map<string, RouteHandler>();
  const fastify: FastifyMock = {
    post: ((path: string, ...args: unknown[]) => {
      const handler = args.length > 1 ? args[1] : args[0];
      routes.set(path, handler as RouteHandler);
      return fastify;
    }) as FastifyMock["post"],
    routes,
  };
  return fastify;
}

function createReply(): ReplyMock {
  const reply: ReplyMock = {
    statusCode: 200,
    payload: undefined,
    raw: {
      writeHead: vi.fn() as FnMock<[number, Record<string, string>], void>,
    },
    status: vi.fn() as FnMock<[number], ReplyMock>,
    send: vi.fn() as FnMock<[unknown], unknown>,
  };

  reply.status = vi.fn((code: number) => {
    reply.statusCode = code;
    return reply;
  }) as ReplyMock["status"];

  reply.send = vi.fn((payload: unknown) => {
    reply.payload = payload;
    return payload;
  }) as ReplyMock["send"];

  return reply;
}

function createMockPage(options: {
  statusCode?: number;
  url?: string;
  content?: string;
}) {
  return {
    goto: vi.fn().mockResolvedValue({
      status: () => options.statusCode ?? 200,
    }),
    url: vi.fn().mockReturnValue(options.url ?? "https://example.com/dashboard"),
    content: vi.fn().mockResolvedValue(options.content ?? "<html><body>Dashboard</body></html>"),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockContext(page: ReturnType<typeof createMockPage>) {
  return {
    page,
    context: {
      close: vi.fn().mockResolvedValue(undefined),
    },
  };
}

describe("routes/scan test-auth endpoint", () => {
  let fastify: FastifyMock;

  beforeEach(async () => {
    vi.clearAllMocks();
    fastify = createFastifyMock();
    await scanRoutes(fastify as unknown as FastifyInstance);
  });

  describe("POST /scan/test-auth", () => {
    it("returns 400 when url is missing", async () => {
      const handler = fastify.routes.get("/scan/test-auth")!;
      const reply = createReply();

      await handler({ body: {} }, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
      const payload = reply.payload as Record<string, unknown>;
      expect(payload.success).toBe(false);
      expect(payload.error).toBe("Validation failed");
    });

    it("returns 400 when auth options are missing", async () => {
      const handler = fastify.routes.get("/scan/test-auth")!;
      const reply = createReply();

      await handler({ body: { url: "https://example.com" } }, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 for blocked URL", async () => {
      const handler = fastify.routes.get("/scan/test-auth")!;
      const reply = createReply();

      await handler({
        body: {
          url: "https://blocked.com",
          auth: { cookies: [{ name: "test", value: "val", domain: ".example.com" }] },
        },
      }, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
      const payload = reply.payload as Record<string, unknown>;
      expect(payload.error).toBe("Invalid URL");
    });

    it("returns success when authentication works with cookies", async () => {
      const mockPage = createMockPage({
        statusCode: 200,
        url: "https://example.com/dashboard",
        content: "<html><body>Welcome to dashboard</body></html>",
      });
      mockCreateAuthenticatedContext.mockResolvedValue(createMockContext(mockPage));

      const handler = fastify.routes.get("/scan/test-auth")!;
      const reply = createReply();

      await handler({
        body: {
          url: "https://example.com/dashboard",
          auth: {
            cookies: [{ name: "session", value: "abc123", domain: ".example.com" }],
          },
        },
      }, reply);

      const payload = reply.payload as Record<string, unknown>;
      expect(payload.success).toBe(true);
      expect(payload.message).toContain("Authentication successful");
      expect(payload.authenticatedContent).toBe(true);
    });

    it("returns success when authentication works with headers", async () => {
      const mockPage = createMockPage({});
      mockCreateAuthenticatedContext.mockResolvedValue(createMockContext(mockPage));

      const handler = fastify.routes.get("/scan/test-auth")!;
      const reply = createReply();

      await handler({
        body: {
          url: "https://api.example.com/protected",
          auth: {
            headers: { Authorization: "Bearer token123" },
          },
        },
      }, reply);

      const payload = reply.payload as Record<string, unknown>;
      expect(payload.success).toBe(true);
    });

    it("returns failure when redirected to login page", async () => {
      const mockPage = createMockPage({
        statusCode: 200,
        url: "https://example.com/login?redirect=/dashboard",
        content: '<html><body><input type="password"></body></html>',
      });
      mockCreateAuthenticatedContext.mockResolvedValue(createMockContext(mockPage));

      const handler = fastify.routes.get("/scan/test-auth")!;
      const reply = createReply();

      await handler({
        body: {
          url: "https://example.com/dashboard",
          auth: {
            cookies: [{ name: "session", value: "expired", domain: ".example.com" }],
          },
        },
      }, reply);

      const payload = reply.payload as Record<string, unknown>;
      expect(payload.success).toBe(false);
      expect(payload.message).toContain("Redirected to login page");
    });

    it("returns failure on 401 status", async () => {
      const mockPage = createMockPage({
        statusCode: 401,
        url: "https://example.com/dashboard",
      });
      mockCreateAuthenticatedContext.mockResolvedValue(createMockContext(mockPage));

      const handler = fastify.routes.get("/scan/test-auth")!;
      const reply = createReply();

      await handler({
        body: {
          url: "https://example.com/dashboard",
          auth: {
            cookies: [{ name: "session", value: "invalid", domain: ".example.com" }],
          },
        },
      }, reply);

      const payload = reply.payload as Record<string, unknown>;
      expect(payload.success).toBe(false);
      expect(payload.message).toContain("Authentication failed with status 401");
    });

    it("returns failure on 403 status", async () => {
      const mockPage = createMockPage({
        statusCode: 403,
        url: "https://example.com/admin",
      });
      mockCreateAuthenticatedContext.mockResolvedValue(createMockContext(mockPage));

      const handler = fastify.routes.get("/scan/test-auth")!;
      const reply = createReply();

      await handler({
        body: {
          url: "https://example.com/admin",
          auth: {
            basicAuth: { username: "user", password: "pass" },
          },
        },
      }, reply);

      const payload = reply.payload as Record<string, unknown>;
      expect(payload.success).toBe(false);
      expect(payload.statusCode).toBe(403);
    });

    it("executes login flow when provided", async () => {
      const mockPage = createMockPage({});
      mockCreateAuthenticatedContext.mockResolvedValue(createMockContext(mockPage));
      mockExecuteLoginFlow.mockResolvedValue(true);

      const handler = fastify.routes.get("/scan/test-auth")!;
      const reply = createReply();

      await handler({
        body: {
          url: "https://example.com/dashboard",
          auth: {
            loginFlow: {
              loginUrl: "https://example.com/login",
              steps: [
                { action: "fill", selector: "#email", value: "test@example.com" },
                { action: "fill", selector: "#password", value: "password" },
                { action: "click", selector: "button[type=submit]" },
              ],
              successIndicator: { type: "url-contains", value: "/dashboard" },
            },
          },
        },
      }, reply);

      expect(mockExecuteLoginFlow).toHaveBeenCalled();
      const payload = reply.payload as Record<string, unknown>;
      expect(payload.success).toBe(true);
    });

    it("returns failure when login flow fails", async () => {
      const mockPage = createMockPage({});
      mockCreateAuthenticatedContext.mockResolvedValue(createMockContext(mockPage));
      mockExecuteLoginFlow.mockResolvedValue(false);

      const handler = fastify.routes.get("/scan/test-auth")!;
      const reply = createReply();

      await handler({
        body: {
          url: "https://example.com/dashboard",
          auth: {
            loginFlow: {
              loginUrl: "https://example.com/login",
              steps: [{ action: "fill", selector: "#email", value: "test@example.com" }],
              successIndicator: { type: "url-contains", value: "/dashboard" },
            },
          },
        },
      }, reply);

      const payload = reply.payload as Record<string, unknown>;
      expect(payload.success).toBe(false);
      expect(payload.message).toBe("Login flow failed");
    });

    it("returns 500 when context creation throws", async () => {
      mockCreateAuthenticatedContext.mockRejectedValue(new Error("Browser error"));

      const handler = fastify.routes.get("/scan/test-auth")!;
      const reply = createReply();

      await handler({
        body: {
          url: "https://example.com/dashboard",
          auth: {
            cookies: [{ name: "session", value: "test", domain: ".example.com" }],
          },
        },
      }, reply);

      expect(reply.status).toHaveBeenCalledWith(500);
      const payload = reply.payload as Record<string, unknown>;
      expect(payload.error).toBe("Browser error");
    });

    it("cleans up context on success", async () => {
      const mockPage = createMockPage({});
      const mockContext = createMockContext(mockPage);
      mockCreateAuthenticatedContext.mockResolvedValue(mockContext);

      const handler = fastify.routes.get("/scan/test-auth")!;
      const reply = createReply();

      await handler({
        body: {
          url: "https://example.com/dashboard",
          auth: {
            cookies: [{ name: "session", value: "test", domain: ".example.com" }],
          },
        },
      }, reply);

      expect(mockPage.close).toHaveBeenCalled();
      expect(mockContext.context.close).toHaveBeenCalled();
    });

    it("cleans up context on error", async () => {
      const mockPage = createMockPage({});
      mockPage.goto.mockRejectedValue(new Error("Navigation failed"));
      const mockContext = createMockContext(mockPage);
      mockCreateAuthenticatedContext.mockResolvedValue(mockContext);

      const handler = fastify.routes.get("/scan/test-auth")!;
      const reply = createReply();

      await handler({
        body: {
          url: "https://example.com/dashboard",
          auth: {
            cookies: [{ name: "session", value: "test", domain: ".example.com" }],
          },
        },
      }, reply);

      expect(mockPage.close).toHaveBeenCalled();
      expect(mockContext.context.close).toHaveBeenCalled();
    });
  });
});
