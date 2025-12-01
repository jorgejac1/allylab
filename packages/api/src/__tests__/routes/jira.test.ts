import type { FastifyInstance } from "fastify";
import { beforeEach, describe, expect, it, vi, afterAll } from "vitest";
import { jiraRoutes } from "../../routes/jira";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

type RouteHandler = (
  req: { body?: Record<string, unknown>; params?: Record<string, string> },
  reply: ReplyMock
) => Promise<unknown> | unknown;

type FastifyMock = {
  get: (path: string, handler: RouteHandler) => FastifyMock;
  post: (path: string, handler: RouteHandler) => FastifyMock;
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

function getRoute(f: FastifyMock, method: string, path: string) {
  return f.routes.get(`${method}:${path}`)!;
}

describe("routes/jira (mock mode)", () => {
  let fastify: FastifyMock;
  const originalBase = process.env.JIRA_BASE_URL;
  const originalEmail = process.env.JIRA_EMAIL;
  const originalToken = process.env.JIRA_API_TOKEN;
  const originalMock = process.env.JIRA_MOCK_MODE;

  beforeEach(async () => {
    vi.clearAllMocks();
    fetchMock.mockReset();
    delete process.env.JIRA_BASE_URL;
    delete process.env.JIRA_EMAIL;
    delete process.env.JIRA_API_TOKEN;
    delete process.env.JIRA_MOCK_MODE;
    fastify = createFastifyMock();
    await jiraRoutes(fastify as unknown as FastifyInstance);
    // clear mock issues between tests
    const clear = getRoute(fastify, "DELETE", "/jira/mock/issues");
    await clear({} as never, createReply());
  });

  afterAll(() => {
    process.env.JIRA_BASE_URL = originalBase;
    process.env.JIRA_EMAIL = originalEmail;
    process.env.JIRA_API_TOKEN = originalToken;
    process.env.JIRA_MOCK_MODE = originalMock;
  });

  it("tests connection in mock mode", async () => {
    const handler = getRoute(fastify, "POST", "/jira/test");
    const reply = createReply();

    await handler({} as never, reply);

    expect(reply.payload).toEqual({
      success: true,
      message: "Mock mode - connection simulated",
      mockMode: true,
    });
  });

  it("creates issue in mock mode and retrieves it", async () => {
    const createHandler = getRoute(fastify, "POST", "/jira/create");
    const getHandler = getRoute(fastify, "GET", "/jira/issue/:key");
    const replyCreate = createReply();

    await createHandler({ body: { fields: { summary: "Bug", project: { key: "P" } } } }, replyCreate);
    const key = (replyCreate.payload as { key: string }).key;
    const replyGet = createReply();
    await getHandler({ params: { key } }, replyGet);

    expect(replyGet.payload).toMatchObject({ key, mockMode: true });
  });

  it("returns 404 for missing mock issue", async () => {
    const handler = getRoute(fastify, "GET", "/jira/issue/:key");
    const reply = createReply();

    await handler({ params: { key: "nope" } }, reply);

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: "Issue not found" });
  });

  it("bulk creates issues in mock mode", async () => {
    const handler = getRoute(fastify, "POST", "/jira/bulk");
    const reply = createReply();

    await handler({ body: { issues: [{ fields: {} }, { fields: {} }] } }, reply);

    expect(reply.payload).toMatchObject({
      total: 2,
      successful: 2,
      failed: 0,
    });
  });

  it("links findings and lists links", async () => {
    const linkHandler = getRoute(fastify, "POST", "/jira/link");
    const linksHandler = getRoute(fastify, "GET", "/jira/links/:scanId");
    const replyLink = createReply();
    await linkHandler({ body: { findingId: "f1", issueKey: "KEY-1", scanId: "s1" } }, replyLink);
    expect(replyLink.payload).toEqual({
      success: true,
      findingId: "f1",
      issueKey: "KEY-1",
      message: "Finding linked to KEY-1",
    });

    const replyLinks = createReply();
    await linksHandler({ params: { scanId: "s1" } }, replyLinks);
    expect(replyLinks.payload).toEqual({ scanId: "s1", links: { f1: "KEY-1" } });
  });

  it("lists and clears mock issues", async () => {
    const createHandler = getRoute(fastify, "POST", "/jira/create");
    const listHandler = getRoute(fastify, "GET", "/jira/mock/issues");
    const clearHandler = getRoute(fastify, "DELETE", "/jira/mock/issues");

    await createHandler({ body: { fields: { summary: "Bug", project: { key: "P" } } } }, createReply());
    const replyList = createReply();
    await listHandler({} as never, replyList);
    const listPayload = replyList.payload as { issues: unknown[] };
    expect(listPayload.issues.length).toBe(1);

    const replyClear = createReply();
    await clearHandler({} as never, replyClear);
    expect(replyClear.payload).toEqual({ success: true, message: "Mock issues cleared" });
  });

  it("validates real Jira connection with basic auth header", async () => {
    process.env.JIRA_BASE_URL = "https://jira.example.com";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token123";
    process.env.JIRA_MOCK_MODE = "false";
    fastify = createFastifyMock();
    await jiraRoutes(fastify as unknown as FastifyInstance);

    const handler = getRoute(fastify, "POST", "/jira/test");
    const reply = createReply();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ displayName: "User" }),
    });

    await handler({} as never, reply);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://jira.example.com/rest/api/2/myself",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
        }),
      })
    );
    expect(reply.payload).toEqual({
      success: true,
      message: "Connected as User",
      mockMode: false,
    });
  });

  it("creates Jira issue in real mode", async () => {
    process.env.JIRA_BASE_URL = "https://jira.example.com";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token123";
    process.env.JIRA_MOCK_MODE = "false";
    fastify = createFastifyMock();
    await jiraRoutes(fastify as unknown as FastifyInstance);

    const handler = getRoute(fastify, "POST", "/jira/create");
    const reply = createReply();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ key: "KEY-1", id: "1", self: "url" }),
    });

    await handler({ body: { fields: { summary: "Bug", project: { key: "P" } } } }, reply);

    expect(reply.payload).toEqual({ success: true, key: "KEY-1", id: "1", self: "url" });
  });

  it("returns 400 when Jira create responds with error", async () => {
    process.env.JIRA_BASE_URL = "https://jira.example.com";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token123";
    process.env.JIRA_MOCK_MODE = "false";
    fastify = createFastifyMock();
    await jiraRoutes(fastify as unknown as FastifyInstance);

    const handler = getRoute(fastify, "POST", "/jira/create");
    const reply = createReply();

    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ errorMessages: ["bad"] }),
    });

    await handler({ body: { fields: { summary: "Bug", project: { key: "P" } } } }, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toEqual({ success: false, error: "bad" });
  });

  it("returns default Failed to create issue when errorMessages missing", async () => {
    process.env.JIRA_BASE_URL = "https://jira.example.com";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token123";
    process.env.JIRA_MOCK_MODE = "false";
    fastify = createFastifyMock();
    await jiraRoutes(fastify as unknown as FastifyInstance);

    const handler = getRoute(fastify, "POST", "/jira/create");
    const reply = createReply();

    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    await handler({ body: { fields: { summary: "Bug", project: { key: "P" } } } }, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toEqual({ success: false, error: "Failed to create issue" });
  });

  it("returns 500 when Jira create throws", async () => {
    process.env.JIRA_BASE_URL = "https://jira.example.com";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token123";
    process.env.JIRA_MOCK_MODE = "false";
    fastify = createFastifyMock();
    await jiraRoutes(fastify as unknown as FastifyInstance);

    const handler = getRoute(fastify, "POST", "/jira/create");
    const reply = createReply();

    fetchMock.mockRejectedValueOnce(new Error("network down"));

    await handler({ body: { fields: { summary: "Bug", project: { key: "P" } } } }, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ error: "network down", success: false });
  });

  it("returns Network error when Jira create throws non-Error", async () => {
    process.env.JIRA_BASE_URL = "https://jira.example.com";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token123";
    process.env.JIRA_MOCK_MODE = "false";
    fastify = createFastifyMock();
    await jiraRoutes(fastify as unknown as FastifyInstance);

    const handler = getRoute(fastify, "POST", "/jira/create");
    const reply = createReply();

    fetchMock.mockRejectedValueOnce("bad");

    await handler({ body: { fields: { summary: "Bug", project: { key: "P" } } } }, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ error: "Network error", success: false });
  });
  it("returns 400 when real Jira test returns error payload", async () => {
    process.env.JIRA_BASE_URL = "https://jira.example.com";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token123";
    process.env.JIRA_MOCK_MODE = "false";
    fastify = createFastifyMock();
    await jiraRoutes(fastify as unknown as FastifyInstance);

    const handler = getRoute(fastify, "POST", "/jira/test");
    const reply = createReply();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ errorMessages: ["bad"] }),
    });

    await handler({} as never, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toEqual({ success: false, message: "bad" });
  });

  it("falls back to Connection failed when Jira test errorMessages missing", async () => {
    process.env.JIRA_BASE_URL = "https://jira.example.com";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token123";
    process.env.JIRA_MOCK_MODE = "false";
    fastify = createFastifyMock();
    await jiraRoutes(fastify as unknown as FastifyInstance);

    const handler = getRoute(fastify, "POST", "/jira/test");
    const reply = createReply();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    await handler({} as never, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toEqual({ success: false, message: "Connection failed" });
  });

  it("returns 500 on Jira test fetch failure", async () => {
    process.env.JIRA_BASE_URL = "https://jira.example.com";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token123";
    process.env.JIRA_MOCK_MODE = "false";
    fastify = createFastifyMock();
    await jiraRoutes(fastify as unknown as FastifyInstance);

    const handler = getRoute(fastify, "POST", "/jira/test");
    const reply = createReply();
    fetchMock.mockRejectedValueOnce("network");

    await handler({} as never, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ success: false, message: "Network error" });
  });

  it("returns 500 with Error message on Jira test failure", async () => {
    process.env.JIRA_BASE_URL = "https://jira.example.com";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token123";
    process.env.JIRA_MOCK_MODE = "false";
    fastify = createFastifyMock();
    await jiraRoutes(fastify as unknown as FastifyInstance);

    const handler = getRoute(fastify, "POST", "/jira/test");
    const reply = createReply();
    fetchMock.mockRejectedValueOnce(new Error("net boom"));

    await handler({} as never, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ success: false, message: "net boom" });
  });
  it("handles bulk create in real mode success and failure branches", async () => {
    process.env.JIRA_BASE_URL = "https://jira.example.com";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token123";
    process.env.JIRA_MOCK_MODE = "false";
    fastify = createFastifyMock();
    await jiraRoutes(fastify as unknown as FastifyInstance);

    const handler = getRoute(fastify, "POST", "/jira/bulk");
    const reply = createReply();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ key: "K1", id: "1", self: "s1" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ errorMessages: ["bad"] }),
      });

    await handler({ body: { issues: [{ fields: {} }, { fields: {} }] } }, reply);

    const payload = reply.payload as {
      total: number;
      successful: number;
      failed: number;
      results: Array<{ success: boolean }>;
    };
    expect(payload.successful).toBe(1);
    expect(payload.failed).toBe(1);
  });

  it("handles bulk create network failure", async () => {
    process.env.JIRA_BASE_URL = "https://jira.example.com";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token123";
    process.env.JIRA_MOCK_MODE = "false";
    fastify = createFastifyMock();
    await jiraRoutes(fastify as unknown as FastifyInstance);

    const handler = getRoute(fastify, "POST", "/jira/bulk");
    const reply = createReply();
    fetchMock.mockRejectedValueOnce(new Error("net"));

    await handler({ body: { issues: [{ fields: {} }] } }, reply);

    const payload = reply.payload as { failed: number; results: Array<{ error: string }> };
    expect(payload.failed).toBe(1);
    expect(payload.results[0].error).toBe("net");
  });

  it("uses default Failed message when bulk errorMessages missing", async () => {
    process.env.JIRA_BASE_URL = "https://jira.example.com";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token123";
    process.env.JIRA_MOCK_MODE = "false";
    fastify = createFastifyMock();
    await jiraRoutes(fastify as unknown as FastifyInstance);

    const handler = getRoute(fastify, "POST", "/jira/bulk");
    const reply = createReply();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    await handler({ body: { issues: [{ fields: {} }] } }, reply);

    const payload = reply.payload as { results: Array<{ error?: string }> };
    expect(payload.results[0].error).toBe("Failed");
  });

  it("returns Network error when bulk throws non-Error", async () => {
    process.env.JIRA_BASE_URL = "https://jira.example.com";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token123";
    process.env.JIRA_MOCK_MODE = "false";
    fastify = createFastifyMock();
    await jiraRoutes(fastify as unknown as FastifyInstance);

    const handler = getRoute(fastify, "POST", "/jira/bulk");
    const reply = createReply();
    fetchMock.mockRejectedValueOnce("boom");

    await handler({ body: { issues: [{ fields: {} }] } }, reply);

    const payload = reply.payload as { results: Array<{ error?: string }>; failed: number };
    expect(payload.results[0].error).toBe("Network error");
    expect(payload.failed).toBe(1);
  });

  it("gets issue in real mode when found", async () => {
    process.env.JIRA_BASE_URL = "https://jira.example.com";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token123";
    process.env.JIRA_MOCK_MODE = "false";
    fastify = createFastifyMock();
    await jiraRoutes(fastify as unknown as FastifyInstance);

    const handler = getRoute(fastify, "GET", "/jira/issue/:key");
    const reply = createReply();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "1" }),
    });

    await handler({ params: { key: "K1" } }, reply);
    expect(reply.payload).toEqual({ id: "1" });
  });

  it("returns status code from Jira when issue not found", async () => {
    process.env.JIRA_BASE_URL = "https://jira.example.com";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token123";
    process.env.JIRA_MOCK_MODE = "false";
    fastify = createFastifyMock();
    await jiraRoutes(fastify as unknown as FastifyInstance);

    const handler = getRoute(fastify, "GET", "/jira/issue/:key");
    const reply = createReply();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await handler({ params: { key: "NOPE" } }, reply);
    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: "Issue not found" });
  });

  it("returns 500 when real issue fetch fails", async () => {
    process.env.JIRA_BASE_URL = "https://jira.example.com";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token123";
    process.env.JIRA_MOCK_MODE = "false";
    fastify = createFastifyMock();
    await jiraRoutes(fastify as unknown as FastifyInstance);

    const handler = getRoute(fastify, "GET", "/jira/issue/:key");
    const reply = createReply();
    fetchMock.mockRejectedValueOnce(new Error("issue fail"));

    await handler({ params: { key: "NOPE" } }, reply);
    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ error: "issue fail" });
  });

  it("returns Network error when issue fetch throws non-Error", async () => {
    process.env.JIRA_BASE_URL = "https://jira.example.com";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token123";
    process.env.JIRA_MOCK_MODE = "false";
    fastify = createFastifyMock();
    await jiraRoutes(fastify as unknown as FastifyInstance);

    const handler = getRoute(fastify, "GET", "/jira/issue/:key");
    const reply = createReply();
    fetchMock.mockRejectedValueOnce("boom");

    await handler({ params: { key: "NOPE" } }, reply);
    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ error: "Network error" });
  });

  it("includes non-matching linked issues to cover false branch", async () => {
    const linkHandler = getRoute(fastify, "POST", "/jira/link");
    const linksHandler = getRoute(fastify, "GET", "/jira/links/:scanId");
    await linkHandler({ body: { findingId: "f-other", issueKey: "KEY-2", scanId: "other" } }, createReply());
    await linkHandler({ body: { findingId: "f-main", issueKey: "KEY-1", scanId: "main" } }, createReply());

    const reply = createReply();
    await linksHandler({ params: { scanId: "main" } }, reply);
    expect(reply.payload).toEqual({ scanId: "main", links: { "f-main": "KEY-1" } });
  });

  it("returns 400 for mock issues endpoints when not in mock mode", async () => {
    process.env.JIRA_BASE_URL = "https://jira.example.com";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token123";
    process.env.JIRA_MOCK_MODE = "false";
    fastify = createFastifyMock();
    await jiraRoutes(fastify as unknown as FastifyInstance);

    const listHandler = getRoute(fastify, "GET", "/jira/mock/issues");
    const replyList = createReply();
    await listHandler({} as never, replyList);
    expect(replyList.statusCode).toBe(400);

    const deleteHandler = getRoute(fastify, "DELETE", "/jira/mock/issues");
    const replyDelete = createReply();
    await deleteHandler({} as never, replyDelete);
    expect(replyDelete.statusCode).toBe(400);
  });
});
