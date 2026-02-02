import type { FastifyInstance } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { webhookRoutes } from "../../routes/webhooks";

const mockGetAll = vi.fn();
const mockGetById = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockTest = vi.fn();

vi.mock("../../services/webhooks", () => ({
  getAllWebhooks: (...args: unknown[]) => mockGetAll(...args),
  getWebhookById: (...args: unknown[]) => mockGetById(...args),
  createWebhook: (...args: unknown[]) => mockCreate(...args),
  updateWebhook: (...args: unknown[]) => mockUpdate(...args),
  deleteWebhook: (...args: unknown[]) => mockDelete(...args),
  testWebhook: (...args: unknown[]) => mockTest(...args),
}));

type RouteHandler = (
  req: { body?: Record<string, unknown>; params?: Record<string, string> },
  reply: ReplyMock
) => Promise<unknown> | unknown;

type FastifyMock = {
  get: (path: string, handler: RouteHandler) => FastifyMock;
  post: (path: string, handler: RouteHandler) => FastifyMock;
  patch: (path: string, handler: RouteHandler) => FastifyMock;
  delete: (path: string, handler: RouteHandler) => FastifyMock;
  routes: Map<string, RouteHandler>;
};

type ReplyMock = {
  statusCode: number;
  payload: unknown;
  status: (code: number) => ReplyMock;
  send: (payload: unknown) => unknown;
};

function createFastifyMock(): FastifyMock {
  const routes = new Map<string, RouteHandler>();
  const fastify: FastifyMock = {
    get: ((path: string, handler: RouteHandler) => {
      routes.set(`GET:${path}`, handler);
      return fastify;
    }) as FastifyMock["get"],
    post: ((path: string, handler: RouteHandler) => {
      routes.set(`POST:${path}`, handler);
      return fastify;
    }) as FastifyMock["post"],
    patch: ((path: string, handler: RouteHandler) => {
      routes.set(`PATCH:${path}`, handler);
      return fastify;
    }) as FastifyMock["patch"],
    delete: ((path: string, handler: RouteHandler) => {
      routes.set(`DELETE:${path}`, handler);
      return fastify;
    }) as FastifyMock["delete"],
    routes,
  };
  return fastify;
}

function createReply(): ReplyMock {
  const reply: ReplyMock = {
    statusCode: 200,
    payload: undefined,
    status: (code: number) => {
      reply.statusCode = code;
      return reply;
    },
    send: (payload: unknown) => {
      reply.payload = payload;
      return payload;
    },
  };
  return reply;
}

function route(fastify: FastifyMock, method: string, path: string) {
  return fastify.routes.get(`${method}:${path}`)!;
}

describe("routes/webhooks", () => {
  let fastify: FastifyMock;

  beforeEach(async () => {
    vi.clearAllMocks();
    fastify = createFastifyMock();
    await webhookRoutes(fastify as unknown as FastifyInstance);
  });

  it("masks secrets when listing", async () => {
    mockGetAll.mockReturnValueOnce([{ id: "1", secret: "abc" }, { id: "2", secret: "" }]);
    const handler = route(fastify, "GET", "/webhooks");
    const reply = createReply();
    await handler({ query: {} } as never, reply);
    const payload = reply.payload as { webhooks: Array<{ secret?: string }>; pagination: unknown };
    expect(payload.webhooks[0]?.secret).toBe("••••••••");
    expect(payload.webhooks[1]?.secret).toBeUndefined();
    expect(payload.pagination).toBeDefined();
  });

  it("returns 404 when webhook missing", async () => {
    mockGetById.mockReturnValueOnce(undefined);
    const handler = route(fastify, "GET", "/webhooks/:id");
    const reply = createReply();
    await handler({ params: { id: "missing" } }, reply);
    expect(reply.statusCode).toBe(404);
  });

  it("returns webhook when found", async () => {
    mockGetById.mockReturnValueOnce({ id: "1", secret: "abc", name: "n" });
    const handler = route(fastify, "GET", "/webhooks/:id");
    const reply = createReply();
    await handler({ params: { id: "1" } }, reply);
    expect(reply.payload).toEqual({ id: "1", secret: "••••••••", name: "n" });
  });

  it("returns webhook with undefined secret when not set", async () => {
    mockGetById.mockReturnValueOnce({ id: "2", name: "n2", secret: "" });
    const handler = route(fastify, "GET", "/webhooks/:id");
    const reply = createReply();
    await handler({ params: { id: "2" } }, reply);
    expect(reply.payload).toEqual({ id: "2", name: "n2", secret: undefined });
  });

  it("validates required fields and URL on create", async () => {
    const handler = route(fastify, "POST", "/webhooks");
    const replyBad = createReply();
    await handler({ body: { name: "", url: "", events: [] } }, replyBad);
    expect(replyBad.statusCode).toBe(400);

    const replyInvalid = createReply();
    await handler({ body: { name: "n", url: "bad", events: ["e"] } }, replyInvalid);
    expect(replyInvalid.statusCode).toBe(400);
  });

  it("creates webhook", async () => {
    const handler = route(fastify, "POST", "/webhooks");
    mockCreate.mockReturnValueOnce({ id: "1" });
    const reply = createReply();
    await handler({ body: { name: "n", url: "https://a.com", events: ["e"], secret: "s" } }, reply);
    expect(reply.statusCode).toBe(201);
    expect(reply.payload).toEqual({ id: "1" });
  });

  it("updates or returns 404", async () => {
    const handler = route(fastify, "PATCH", "/webhooks/:id");
    const replyMissing = createReply();
    mockUpdate.mockReturnValueOnce(null);
    await handler({ params: { id: "missing" }, body: {} }, replyMissing);
    expect(replyMissing.statusCode).toBe(404);

    const replyOk = createReply();
    mockUpdate.mockReturnValueOnce({ id: "1", name: "u" });
    await handler({ params: { id: "1" }, body: { name: "u" } }, replyOk);
    expect(replyOk.payload).toEqual({ id: "1", name: "u" });
  });

  it("deletes or returns 404", async () => {
    const handler = route(fastify, "DELETE", "/webhooks/:id");
    const replyMissing = createReply();
    mockDelete.mockReturnValueOnce(false);
    await handler({ params: { id: "missing" } }, replyMissing);
    expect(replyMissing.statusCode).toBe(404);

    const replyOk = createReply();
    mockDelete.mockReturnValueOnce(true);
    await handler({ params: { id: "1" } }, replyOk);
    expect(replyOk.payload).toEqual({ success: true });
  });

  it("tests webhook", async () => {
    const handler = route(fastify, "POST", "/webhooks/:id/test");
    mockTest.mockResolvedValueOnce({ ok: true });
    const reply = createReply();
    await handler({ params: { id: "1" } }, reply);
    expect(reply.payload).toEqual({ ok: true });
  });
});
