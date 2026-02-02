import type { FastifyInstance } from "fastify";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { healthRoutes, formatUptime, determineStatus } from "../../routes/health";

// Mock dependencies
vi.mock("../../services/browser.js", () => ({
  getPoolStats: vi.fn(() => ({
    total: 5,
    active: 2,
    idle: 3,
    waiting: 0,
    maxPages: 10,
  })),
}));

vi.mock("../../services/github.js", () => ({
  getGitHubCacheStats: vi.fn(() => ({
    users: 1,
    repos: 5,
    branches: 10,
    trees: 3,
  })),
}));

type RouteHandler = () => Promise<unknown> | unknown;

type FastifyMock = {
  get: (path: string, handler: RouteHandler) => FastifyMock;
  routes: Map<string, RouteHandler>;
};

function createFastifyMock(): FastifyMock {
  const routes = new Map<string, RouteHandler>();
  const fastify: FastifyMock = {
    get: ((path: string, handler: RouteHandler) => {
      routes.set(path, handler);
      return fastify;
    }) as FastifyMock["get"],
    routes,
  };
  return fastify;
}

describe("routes/health", () => {
  let fastify: FastifyMock;

  beforeEach(() => {
    fastify = createFastifyMock();
  });

  describe("GET /health", () => {
    it("returns static health payload with timestamp and service info", async () => {
      await healthRoutes(fastify as unknown as FastifyInstance);

      const handler = fastify.routes.get("/health")!;
      const payload = (await handler()) as Record<string, string>;

      expect(payload.status).toBe("ok");
      expect(payload.service).toBe("allylab-api");
      expect(payload.version).toBe("1.0.0");
      expect(() => new Date(payload.timestamp).toISOString()).not.toThrow();
    });
  });

  describe("GET /health/detailed", () => {
    it("returns detailed health status with all metrics", async () => {
      await healthRoutes(fastify as unknown as FastifyInstance);

      const handler = fastify.routes.get("/health/detailed")!;
      const payload = (await handler()) as Record<string, unknown>;

      expect(payload.status).toBe("ok");
      expect(payload.service).toBe("allylab-api");
      expect(payload.version).toBe("1.0.0");
      expect(payload.timestamp).toBeDefined();

      // Check uptime
      const uptime = payload.uptime as { seconds: number; formatted: string };
      expect(typeof uptime.seconds).toBe("number");
      expect(typeof uptime.formatted).toBe("string");

      // Check memory
      const memory = payload.memory as Record<string, number>;
      expect(typeof memory.heapUsed).toBe("number");
      expect(typeof memory.heapTotal).toBe("number");
      expect(typeof memory.heapUsedMB).toBe("number");
      expect(typeof memory.heapTotalMB).toBe("number");

      // Check browser pool stats
      const browser = payload.browser as Record<string, number>;
      expect(browser.poolTotal).toBe(5);
      expect(browser.poolActive).toBe(2);
      expect(browser.poolIdle).toBe(3);
      expect(browser.poolWaiting).toBe(0);
      expect(browser.poolMaxPages).toBe(10);

      // Check cache stats
      const cache = payload.cache as { github: Record<string, number> };
      expect(cache.github.users).toBe(1);
      expect(cache.github.repos).toBe(5);
    });
  });

  describe("GET /health/live", () => {
    it("returns simple liveness status", async () => {
      await healthRoutes(fastify as unknown as FastifyInstance);

      const handler = fastify.routes.get("/health/live")!;
      const payload = (await handler()) as Record<string, string>;

      expect(payload.status).toBe("ok");
    });
  });

  describe("GET /health/ready", () => {
    it("returns ready status when pool is healthy", async () => {
      await healthRoutes(fastify as unknown as FastifyInstance);

      const handler = fastify.routes.get("/health/ready")!;
      const payload = (await handler()) as Record<string, string>;

      expect(payload.status).toBe("ready");
    });

    it("returns not_ready when pool has too many waiters", async () => {
      const { getPoolStats } = await import("../../services/browser.js");
      vi.mocked(getPoolStats).mockReturnValueOnce({
        total: 10,
        active: 10,
        idle: 0,
        waiting: 15,
        maxPages: 10,
      });

      await healthRoutes(fastify as unknown as FastifyInstance);

      const handler = fastify.routes.get("/health/ready")!;
      const payload = (await handler()) as Record<string, string>;

      expect(payload.status).toBe("not_ready");
      expect(payload.reason).toBe("browser_pool_overloaded");
    });
  });
});

describe("formatUptime", () => {
  it("formats seconds only", () => {
    expect(formatUptime(45)).toBe("45s");
  });

  it("formats minutes and seconds", () => {
    expect(formatUptime(125)).toBe("2m 5s");
  });

  it("formats hours, minutes, and seconds", () => {
    expect(formatUptime(3725)).toBe("1h 2m 5s");
  });

  it("formats days, hours, minutes, and seconds", () => {
    expect(formatUptime(90125)).toBe("1d 1h 2m 5s");
  });

  it("handles zero seconds", () => {
    expect(formatUptime(0)).toBe("0s");
  });
});

describe("determineStatus", () => {
  const healthyMemory = {
    heapUsed: 50 * 1024 * 1024,
    heapTotal: 100 * 1024 * 1024,
    external: 0,
    rss: 150 * 1024 * 1024,
    arrayBuffers: 0,
  };

  const healthyPool = {
    total: 5,
    active: 2,
    idle: 3,
    waiting: 0,
    maxPages: 10,
  };

  it("returns ok for healthy metrics", () => {
    expect(determineStatus(healthyMemory, healthyPool)).toBe("ok");
  });

  it("returns degraded when heap usage is above 85%", () => {
    const highMemory = {
      ...healthyMemory,
      heapUsed: 87 * 1024 * 1024,
      heapTotal: 100 * 1024 * 1024,
    };
    expect(determineStatus(highMemory, healthyPool)).toBe("degraded");
  });

  it("returns unhealthy when heap usage is above 95%", () => {
    const criticalMemory = {
      ...healthyMemory,
      heapUsed: 96 * 1024 * 1024,
      heapTotal: 100 * 1024 * 1024,
    };
    expect(determineStatus(criticalMemory, healthyPool)).toBe("unhealthy");
  });

  it("returns degraded when pool is full with waiters", () => {
    const fullPool = {
      ...healthyPool,
      active: 10,
      idle: 0,
      waiting: 2,
      maxPages: 10,
    };
    expect(determineStatus(healthyMemory, fullPool)).toBe("degraded");
  });

  it("returns unhealthy when too many waiters", () => {
    const overloadedPool = {
      ...healthyPool,
      waiting: 10,
    };
    expect(determineStatus(healthyMemory, overloadedPool)).toBe("unhealthy");
  });
});
