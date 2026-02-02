import { describe, expect, it, vi, afterEach } from "vitest";

type MockedServer = {
  register: ReturnType<typeof vi.fn>;
  addHook: ReturnType<typeof vi.fn>;
  setErrorHandler: ReturnType<typeof vi.fn>;
  setNotFoundHandler: ReturnType<typeof vi.fn>;
};

async function loadServer(nodeEnv: "development" | "production") {
  vi.resetModules();

  const registerRoutes = vi.fn();
  const initScheduler = vi.fn();
  const shutdownScheduler = vi.fn();
  const corsPlugin = Symbol("cors");
  const rateLimitPlugin = Symbol("rateLimit");
  const swaggerPlugin = Symbol("swagger");
  const swaggerUiPlugin = Symbol("swagger-ui");
  const server: MockedServer = {
    register: vi.fn(async () => undefined),
    addHook: vi.fn(async () => undefined),
    setErrorHandler: vi.fn(() => undefined),
    setNotFoundHandler: vi.fn(() => undefined),
  };
  let fastifyFactory: ReturnType<typeof vi.fn>;

  const processOnSpy = vi.spyOn(process, "on").mockImplementation(() => process);

  vi.doMock("../config/env", () => ({
    config: {
      port: 3001,
      nodeEnv,
      anthropicApiKey: "",
      enableAiFixes: false,
      githubApiUrl: "https://api.github.com",
      enableRateLimiting: false,
    },
  }));

  vi.doMock("@fastify/cors", () => ({ default: corsPlugin, __esModule: true }));
  vi.doMock("@fastify/rate-limit", () => ({ default: rateLimitPlugin, __esModule: true }));
  vi.doMock("@fastify/swagger", () => ({ default: swaggerPlugin, __esModule: true }));
  vi.doMock("@fastify/swagger-ui", () => ({ default: swaggerUiPlugin, __esModule: true }));

  // Mock swagger config
  vi.doMock("../config/swagger.js", () => ({
    swaggerConfig: { openapi: {} },
    swaggerUiConfig: { routePrefix: "/docs" },
  }));
  vi.doMock("../routes/index", () => ({ registerRoutes }));
  vi.doMock("../services/scheduler", () => ({
    initScheduler,
    shutdownScheduler,
  }));

  // Mock browser service
  vi.doMock("../services/browser.js", () => ({
    shutdownPool: vi.fn().mockResolvedValue(undefined),
    closeBrowser: vi.fn().mockResolvedValue(undefined),
  }));

  // Mock metrics module to avoid duplicate registration issues
  vi.doMock("../utils/metrics.js", () => ({
    httpRequestsInProgress: {
      inc: vi.fn(),
      dec: vi.fn(),
    },
    recordHttpRequest: vi.fn(),
    recordError: vi.fn(),
  }));

  // Mock errors module
  vi.doMock("../utils/errors.js", () => ({
    errorHandler: vi.fn(),
    notFoundHandler: vi.fn(),
  }));

  vi.doMock("fastify", () => {
    fastifyFactory = vi.fn(() => server);
    return { default: fastifyFactory };
  });

  const { createServer } = await import("../server");
  const created = (await createServer()) as unknown as MockedServer;

  return {
    server: created,
    registerRoutes,
    initScheduler,
    shutdownScheduler,
    corsPlugin,
    fastifyFactory: fastifyFactory!,
    processOnSpy,
  };
}

describe("server/createServer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("initializes server with pretty logger in development", async () => {
    const {
      server,
      registerRoutes,
      initScheduler,
      fastifyFactory,
      corsPlugin,
      processOnSpy,
    } = await loadServer("development");

    expect(fastifyFactory).toHaveBeenCalledWith(
      expect.objectContaining({
        logger: expect.objectContaining({
          transport: expect.objectContaining({
            target: "pino-pretty",
          }),
        }),
      })
    );
    expect(server.register).toHaveBeenCalledWith(
      corsPlugin,
      expect.objectContaining({ origin: true, credentials: true })
    );
    expect(registerRoutes).toHaveBeenCalled();
    expect(initScheduler).toHaveBeenCalled();
    expect(processOnSpy).toHaveBeenCalledWith("SIGINT", expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith("SIGTERM", expect.any(Function));
  });

  it("registers request metrics hooks", async () => {
    const { server } = await loadServer("development");

    // Should have registered onRequest, onResponse, and onError hooks
    expect(server.addHook).toHaveBeenCalledWith("onRequest", expect.any(Function));
    expect(server.addHook).toHaveBeenCalledWith("onResponse", expect.any(Function));
    expect(server.addHook).toHaveBeenCalledWith("onError", expect.any(Function));
  });

  it("registers signal handlers for graceful shutdown", async () => {
    const { processOnSpy } = await loadServer("development");

    // Verify that both SIGINT and SIGTERM handlers are registered
    const sigintCalls = processOnSpy.mock.calls.filter(call => call[0] === "SIGINT");
    const sigtermCalls = processOnSpy.mock.calls.filter(call => call[0] === "SIGTERM");

    expect(sigintCalls.length).toBeGreaterThan(0);
    expect(sigtermCalls.length).toBeGreaterThan(0);

    // Verify the handlers are functions
    const sigintHandler = sigintCalls[0][1];
    const sigtermHandler = sigtermCalls[0][1];
    expect(typeof sigintHandler).toBe("function");
    expect(typeof sigtermHandler).toBe("function");
  });

  it("initializes server with default logger in production", async () => {
    const { fastifyFactory, server, corsPlugin } = await loadServer("production");

    expect(fastifyFactory).toHaveBeenCalledWith(
      expect.objectContaining({ logger: true })
    );
    expect(server.register).toHaveBeenCalledWith(
      corsPlugin,
      expect.objectContaining({ origin: true, credentials: true })
    );
  });
});
