import { describe, expect, it, vi, afterEach } from "vitest";

type MockedServer = {
  register: ReturnType<typeof vi.fn>;
};

async function loadServer(nodeEnv: "development" | "production") {
  vi.resetModules();

  const registerRoutes = vi.fn();
  const initScheduler = vi.fn();
  const shutdownScheduler = vi.fn();
  const corsPlugin = Symbol("cors");
  const server: MockedServer = {
    register: vi.fn(async () => undefined),
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
    },
  }));

  vi.doMock("@fastify/cors", () => ({ default: corsPlugin, __esModule: true }));
  vi.doMock("../routes/index", () => ({ registerRoutes }));
  vi.doMock("../services/scheduler", () => ({
    initScheduler,
    shutdownScheduler,
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

  it("registers signal handlers that shut down scheduler and exit", async () => {
    const { shutdownScheduler, processOnSpy } = await loadServer("development");
    const [, sigintHandler] = processOnSpy.mock.calls.find(call => call[0] === "SIGINT")!;
    const [, sigtermHandler] = processOnSpy.mock.calls.find(call => call[0] === "SIGTERM")!;

    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit called");
    });

    expect(() => sigintHandler()).toThrow("exit called");
    expect(shutdownScheduler).toHaveBeenCalledTimes(1);

    shutdownScheduler.mockClear();
    expect(() => sigtermHandler()).toThrow("exit called");
    expect(shutdownScheduler).toHaveBeenCalledTimes(1);

    exitSpy.mockRestore();
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
