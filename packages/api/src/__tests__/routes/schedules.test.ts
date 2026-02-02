import type { FastifyInstance } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { scheduleRoutes } from "../../routes/schedules";

const mockGetAll = vi.fn();
const mockGetById = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockHistory = vi.fn();
const mockRunNow = vi.fn();

vi.mock("../../services/scheduler", () => ({
  getAllSchedules: (...args: unknown[]) => mockGetAll(...args),
  getScheduleById: (...args: unknown[]) => mockGetById(...args),
  createSchedule: (...args: unknown[]) => mockCreate(...args),
  updateSchedule: (...args: unknown[]) => mockUpdate(...args),
  deleteSchedule: (...args: unknown[]) => mockDelete(...args),
  getScheduleHistory: (...args: unknown[]) => mockHistory(...args),
  runScheduleNow: (...args: unknown[]) => mockRunNow(...args),
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

function getRoute(fastify: FastifyMock, method: string, path: string): RouteHandler {
  return fastify.routes.get(`${method.toUpperCase()}:${path}`)!;
}

describe("routes/schedules", () => {
  let fastify: FastifyMock;

  beforeEach(async () => {
    vi.clearAllMocks();
    fastify = createFastifyMock();
    await scheduleRoutes(fastify as unknown as FastifyInstance);
  });

  it("lists schedules", async () => {
    const handler = getRoute(fastify, "get", "/schedules");
    const reply = createReply();
    mockGetAll.mockReturnValueOnce([{ id: "1" }]);

    await handler({ query: {} } as never, reply);

    const payload = reply.payload as { schedules: unknown[]; pagination: unknown };
    expect(payload.schedules).toEqual([{ id: "1" }]);
    expect(payload.pagination).toBeDefined();
  });

  it("returns 404 when schedule not found", async () => {
    const handler = getRoute(fastify, "get", "/schedules/:id");
    const reply = createReply();
    mockGetById.mockReturnValueOnce(undefined);

    await handler({ params: { id: "missing" } }, reply);

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: "Schedule not found" });
  });

  it("returns schedule when found", async () => {
    const handler = getRoute(fastify, "get", "/schedules/:id");
    const reply = createReply();
    mockGetById.mockReturnValueOnce({ id: "123", url: "https://example.com" });

    await handler({ params: { id: "123" } }, reply);

    expect(reply.payload).toEqual({ id: "123", url: "https://example.com" });
  });

  it("returns 400 for missing fields on create", async () => {
    const handler = getRoute(fastify, "post", "/schedules");
    const reply = createReply();

    await handler({ body: {} }, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toEqual({ error: "url and frequency are required" });
  });

  it("validates URL and frequency on create", async () => {
    const handler = getRoute(fastify, "post", "/schedules");
    const reply1 = createReply();

    await handler({ body: { url: "bad", frequency: "daily" } }, reply1);
    expect(reply1.statusCode).toBe(400);
    expect(reply1.payload).toEqual({ error: "Invalid URL" });

    const reply2 = createReply();
    await handler({ body: { url: "https://example.com", frequency: "never" } }, reply2);
    expect(reply2.statusCode).toBe(400);
    expect(reply2.payload).toEqual({
      error: "Invalid frequency. Must be one of: hourly, daily, weekly, monthly",
    });
  });

  it("creates schedule and returns 201", async () => {
    const handler = getRoute(fastify, "post", "/schedules");
    const reply = createReply();
    mockCreate.mockReturnValueOnce({ id: "sch-1" });

    await handler({ body: { url: "https://example.com", frequency: "daily" } }, reply);

    expect(reply.statusCode).toBe(201);
    expect(reply.payload).toEqual({ id: "sch-1" });
  });

  it("updates schedule or returns 404", async () => {
    const handler = getRoute(fastify, "patch", "/schedules/:id");
    const replyNotFound = createReply();
    mockUpdate.mockReturnValueOnce(null);

    await handler({ params: { id: "missing" }, body: {} }, replyNotFound);
    expect(replyNotFound.statusCode).toBe(404);
    expect(replyNotFound.payload).toEqual({ error: "Schedule not found" });

    const replyOk = createReply();
    mockUpdate.mockReturnValueOnce({ id: "ok" });
    await handler({ params: { id: "ok" }, body: { enabled: true } }, replyOk);
    expect(replyOk.payload).toEqual({ id: "ok" });
  });

  it("deletes schedule or returns 404", async () => {
    const handler = getRoute(fastify, "delete", "/schedules/:id");
    const replyMissing = createReply();
    mockDelete.mockReturnValueOnce(false);

    await handler({ params: { id: "missing" } }, replyMissing);
    expect(replyMissing.statusCode).toBe(404);
    expect(replyMissing.payload).toEqual({ error: "Schedule not found" });

    const replyOk = createReply();
    mockDelete.mockReturnValueOnce(true);
    await handler({ params: { id: "exists" } }, replyOk);
    expect(replyOk.payload).toEqual({ success: true });
  });

  it("returns history or 404 when missing", async () => {
    const handler = getRoute(fastify, "get", "/schedules/:id/history");
    const replyMissing = createReply();
    mockGetById.mockReturnValueOnce(undefined);

    await handler({ params: { id: "missing" } }, replyMissing);
    expect(replyMissing.statusCode).toBe(404);
    expect(replyMissing.payload).toEqual({ error: "Schedule not found" });

    const replyOk = createReply();
    mockGetById.mockReturnValueOnce({ id: "hist" });
    mockHistory.mockReturnValueOnce([{ id: "r1" }]);
    await handler({ params: { id: "hist" } }, replyOk);
    expect(replyOk.payload).toEqual({ history: [{ id: "r1" }] });
  });

  it("runs schedule immediately or returns 404", async () => {
    const handler = getRoute(fastify, "post", "/schedules/:id/run");
    const replyMissing = createReply();
    mockRunNow.mockResolvedValueOnce(null);

    await handler({ params: { id: "missing" } }, replyMissing);
    expect(replyMissing.statusCode).toBe(404);
    expect(replyMissing.payload).toEqual({ error: "Schedule not found" });

    const replyOk = createReply();
    mockRunNow.mockResolvedValueOnce({ id: "run1" });
    await handler({ params: { id: "run" } }, replyOk);
    expect(replyOk.payload).toEqual({ id: "run1" });
  });
});
