import type { FastifyInstance } from "fastify";
import { describe, it, expect } from "vitest";
import { healthRoutes } from "../../routes/health";

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
  it("returns static health payload with timestamp and service info", async () => {
    const fastify = createFastifyMock();
    await healthRoutes(fastify as unknown as FastifyInstance);

    const handler = fastify.routes.get("/health")!;
    const payload = (await handler()) as Record<string, string>;

    expect(payload.status).toBe("ok");
    expect(payload.service).toBe("allylab-api");
    expect(payload.version).toBe("1.0.0");
    expect(() => new Date(payload.timestamp).toISOString()).not.toThrow();
  });
});
