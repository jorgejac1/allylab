import type { FastifyInstance } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { githubRoutes } from "../../routes/github";

const mockSetToken = vi.fn();
const mockRemoveToken = vi.fn();
const mockGetToken = vi.fn();
const mockGetConnection = vi.fn();
const mockGetRepos = vi.fn();
const mockGetBranches = vi.fn();
const mockGetFile = vi.fn();
const mockCreatePR = vi.fn();
const mockGetPRStatus = vi.fn();

vi.mock("../../services/github", () => ({
  setGitHubToken: (...args: unknown[]) => mockSetToken(...args),
  removeGitHubToken: (...args: unknown[]) => mockRemoveToken(...args),
  getGitHubToken: (...args: unknown[]) => mockGetToken(...args),
  getConnection: (...args: unknown[]) => mockGetConnection(...args),
  getRepos: (...args: unknown[]) => mockGetRepos(...args),
  getRepoBranches: (...args: unknown[]) => mockGetBranches(...args),
  getFileContent: (...args: unknown[]) => mockGetFile(...args),
  createPullRequest: (...args: unknown[]) => mockCreatePR(...args),
  getPRStatus: (...args: unknown[]) => mockGetPRStatus(...args),
}));

const mockRunScan = vi.fn().mockResolvedValue({
  findings: [],
  score: 95,
});

vi.mock("../../services/scanner.js", () => ({
  runScan: (...args: unknown[]) => mockRunScan(...args),
}));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

type RouteHandler = (
  req: { body?: Record<string, unknown>; params?: Record<string, string>; query?: Record<string, string> },
  reply: ReplyMock
) => Promise<unknown> | unknown;

type FastifyMock = {
  get: (path: string, handler: RouteHandler) => FastifyMock;
  post: (path: string, handler: RouteHandler) => FastifyMock;
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

describe("routes/github", () => {
  let fastify: FastifyMock;

  beforeEach(async () => {
    vi.clearAllMocks();
    fetchMock.mockReset();
    fastify = createFastifyMock();
    await githubRoutes(fastify as unknown as FastifyInstance);
  });

  it("validates missing token on connect", async () => {
    const handler = route(fastify, "POST", "/github/connect");
    const reply = createReply();

    await handler({ body: {} }, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toEqual({ error: "Token is required" });
  });

  it("rejects invalid GitHub token", async () => {
    const handler = route(fastify, "POST", "/github/connect");
    const reply = createReply();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });

    await handler({ body: { token: "bad" } }, reply);

    expect(reply.statusCode).toBe(401);
    expect(reply.payload).toEqual({ error: "Invalid GitHub token" });
  });

  it("stores token on successful connect", async () => {
    const handler = route(fastify, "POST", "/github/connect");
    const reply = createReply();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ login: "me", avatar_url: "a", name: "Test" }),
    });

    await handler({ body: { token: "good" } }, reply);

    expect(mockSetToken).toHaveBeenCalledWith("default-user", "good");
    expect(reply.payload).toEqual({
      success: true,
      user: { login: "me", avatar_url: "a", name: "Test" },
    });
  });

  it("returns 500 when connect fetch throws", async () => {
    const handler = route(fastify, "POST", "/github/connect");
    const reply = createReply();
    fetchMock.mockRejectedValueOnce(new Error("explode"));

    await handler({ body: { token: "boom" } }, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ error: "Failed to validate token" });
  });

  it("falls back to Unknown error branch on connect when non-Error thrown", async () => {
    const handler = route(fastify, "POST", "/github/connect");
    const reply = createReply();
    fetchMock.mockRejectedValueOnce("nope");

    await handler({ body: { token: "bad" } }, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ error: "Failed to validate token" });
  });

  it("returns 500 when status check fails", async () => {
    const handler = route(fastify, "GET", "/github/status");
    const reply = createReply();
    mockGetConnection.mockRejectedValueOnce(new Error("oops"));

    await handler({} as never, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ error: "Failed to check connection status" });
  });

  it("falls back to Unknown error branch on status check when non-Error thrown", async () => {
    const handler = route(fastify, "GET", "/github/status");
    const reply = createReply();
    mockGetConnection.mockRejectedValueOnce("oops");

    await handler({} as never, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ error: "Failed to check connection status" });
  });

  it("disconnects and clears token", async () => {
    const handler = route(fastify, "POST", "/github/disconnect");
    const reply = createReply();
    await handler({} as never, reply);
    expect(mockRemoveToken).toHaveBeenCalledWith("default-user");
    expect(reply.payload).toEqual({ success: true });
  });

  it("returns connection status", async () => {
    const handler = route(fastify, "GET", "/github/status");
    const reply = createReply();
    mockGetConnection.mockResolvedValueOnce({ connected: true });

    await handler({} as never, reply);

    expect(reply.payload).toEqual({ connected: true });
  });

  it("requires token for repos", async () => {
    const handler = route(fastify, "GET", "/github/repos");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce(undefined);

    await handler({} as never, reply);

    expect(reply.statusCode).toBe(401);
    expect(reply.payload).toEqual({ error: "GitHub not connected" });
  });

  it("returns repos when connected", async () => {
    const handler = route(fastify, "GET", "/github/repos");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockGetRepos.mockResolvedValueOnce([{ id: 1 }]);

    await handler({} as never, reply);

    expect(reply.payload).toEqual([{ id: 1 }]);
  });

  it("returns 500 when repos call fails", async () => {
    const handler = route(fastify, "GET", "/github/repos");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockGetRepos.mockRejectedValueOnce(new Error("repo fail"));

    await handler({} as never, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ error: "repo fail" });
  });

  it("falls back to Unknown error when repos throws non-Error", async () => {
    const handler = route(fastify, "GET", "/github/repos");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockGetRepos.mockRejectedValueOnce("boom");

    await handler({} as never, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ error: "Unknown error" });
  });

  it("returns 401 when repos requested without token", async () => {
    const handler = route(fastify, "GET", "/github/repos");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce(undefined);

    await handler({} as never, reply);

    expect(reply.statusCode).toBe(401);
    expect(reply.payload).toEqual({ error: "GitHub not connected" });
  });

  it("validates file query params and not found", async () => {
    const handler = route(fastify, "GET", "/github/repos/:owner/:repo/file");
    const replyMissingPath = createReply();
    mockGetToken.mockReturnValueOnce("tok");

    await handler({ params: { owner: "o", repo: "r" }, query: { path: "" } }, replyMissingPath);
    expect(replyMissingPath.statusCode).toBe(400);

    const replyNotFound = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockGetFile.mockResolvedValueOnce(null);
    await handler({ params: { owner: "o", repo: "r" }, query: { path: "file" } }, replyNotFound);
    expect(replyNotFound.statusCode).toBe(404);
  });

  it("returns 500 when file fetch fails", async () => {
    const handler = route(fastify, "GET", "/github/repos/:owner/:repo/file");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockGetFile.mockRejectedValueOnce(new Error("file bad"));

    await handler({ params: { owner: "o", repo: "r" }, query: { path: "file" } }, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ error: "file bad" });
  });

  it("falls back to Unknown error when file fetch throws non-Error", async () => {
    const handler = route(fastify, "GET", "/github/repos/:owner/:repo/file");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockGetFile.mockRejectedValueOnce("file nope");

    await handler({ params: { owner: "o", repo: "r" }, query: { path: "file" } }, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ error: "Unknown error" });
  });

  it("returns file content when found", async () => {
    const handler = route(fastify, "GET", "/github/repos/:owner/:repo/file");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockGetFile.mockResolvedValueOnce({ path: "file" });

    await handler({ params: { owner: "o", repo: "r" }, query: { path: "file" } }, reply);

    expect(reply.payload).toEqual({ path: "file" });
  });

  it("validates PR creation required fields", async () => {
    const handler = route(fastify, "POST", "/github/pr");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");

    await handler({ body: { owner: "", repo: "" } }, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toEqual({
      error: "Missing required fields: owner, repo, baseBranch, fixes",
    });
  });

  it("handles PR creation failure response", async () => {
    const handler = route(fastify, "POST", "/github/pr");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockCreatePR.mockResolvedValueOnce({ success: false, error: "bad" });

    await handler({
      body: { owner: "o", repo: "r", baseBranch: "main", fixes: [{}], title: "t", description: "d" },
    }, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ success: false, error: "bad" });
  });

  it("returns 500 when PR creation throws", async () => {
    const handler = route(fastify, "POST", "/github/pr");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockCreatePR.mockRejectedValueOnce(new Error("explode"));

    await handler({
      body: { owner: "o", repo: "r", baseBranch: "main", fixes: [{}], title: "t", description: "d" },
    }, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ success: false, error: "explode" });
  });

  it("returns PR creation result when successful", async () => {
    const handler = route(fastify, "POST", "/github/pr");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockCreatePR.mockResolvedValueOnce({ success: true, url: "http://example/pr" });

    await handler({
      body: { owner: "o", repo: "r", baseBranch: "main", fixes: [{}], title: "t", description: "d" },
    }, reply);

    expect(reply.payload).toEqual({ success: true, url: "http://example/pr" });
  });
  it("falls back to Unknown error when PR creation throws non-Error", async () => {
    const handler = route(fastify, "POST", "/github/pr");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockCreatePR.mockRejectedValueOnce("bad pr");

    await handler({
      body: { owner: "o", repo: "r", baseBranch: "main", fixes: [{}], title: "t", description: "d" },
    }, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ success: false, error: "Unknown error" });
  });

  it("returns PR status 404 when missing", async () => {
    const handler = route(fastify, "GET", "/github/repos/:owner/:repo/pulls/:prNumber");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockGetPRStatus.mockResolvedValueOnce(null);

    await handler({ params: { owner: "o", repo: "r", prNumber: "1" } }, reply);

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: "PR not found" });
  });

  it("returns PR status when found", async () => {
    const handler = route(fastify, "GET", "/github/repos/:owner/:repo/pulls/:prNumber");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockGetPRStatus.mockResolvedValueOnce({ merged: true });

    await handler({ params: { owner: "o", repo: "r", prNumber: "2" } }, reply);

    expect(reply.payload).toEqual({ merged: true });
  });

  it("returns 500 when PR status throws", async () => {
    const handler = route(fastify, "GET", "/github/repos/:owner/:repo/pulls/:prNumber");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockGetPRStatus.mockRejectedValueOnce(new Error("status fail"));

    await handler({ params: { owner: "o", repo: "r", prNumber: "1" } }, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ error: "status fail" });
  });

  it("falls back to Unknown error when PR status throws non-Error", async () => {
    const handler = route(fastify, "GET", "/github/repos/:owner/:repo/pulls/:prNumber");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockGetPRStatus.mockRejectedValueOnce("status nope");

    await handler({ params: { owner: "o", repo: "r", prNumber: "1" } }, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ error: "Unknown error" });
  });

  it("validates verify fix flow for merged PR", async () => {
    const handler = route(fastify, "POST", "/github/verify");
    const replyMissingToken = createReply();

    await handler({ body: {} }, replyMissingToken);
    expect(replyMissingToken.statusCode).toBe(401);

    const replyMissingFields = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    await handler({ body: { url: "", findingIds: [] } }, replyMissingFields);
    expect(replyMissingFields.statusCode).toBe(400);

    const replyNotFound = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockGetPRStatus.mockResolvedValueOnce(null);
    await handler({ body: { url: "https://a.com", findingIds: ["f"], prNumber: 1, owner: "o", repo: "r" } }, replyNotFound);
    expect(replyNotFound.statusCode).toBe(404);

    const replyNotMerged = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockGetPRStatus.mockResolvedValueOnce({ merged: false });
    await handler({ body: { url: "https://a.com", findingIds: ["f"], prNumber: 1, owner: "o", repo: "r" } }, replyNotMerged);
    expect(replyNotMerged.statusCode).toBe(400);
    expect((replyNotMerged.payload as Record<string, string>).error).toMatch(/not merged/);
  });

  it("returns 500 when verify throws", async () => {
    const handler = route(fastify, "POST", "/github/verify");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockGetPRStatus.mockRejectedValueOnce(new Error("verify fail"));

    await handler({ body: { url: "https://a.com", findingIds: ["f"], prNumber: 1, owner: "o", repo: "r" } }, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ success: false, error: "verify fail" });
  });

  it("falls back to Unknown error when verify throws non-Error", async () => {
    const handler = route(fastify, "POST", "/github/verify");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockGetPRStatus.mockRejectedValueOnce("verify nope");

    await handler({ body: { url: "https://a.com", findingIds: ["f"], prNumber: 1, owner: "o", repo: "r" } }, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ success: false, error: "Unknown error" });
  });

  it("returns verification result when PR merged and scan passes", async () => {
    const handler = route(fastify, "POST", "/github/verify");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockGetPRStatus.mockResolvedValueOnce({ merged: true });

    await handler({ body: { url: "https://a.com", findingIds: ["f"], prNumber: 1, owner: "o", repo: "r" } }, reply);

    expect((reply.payload as { success: boolean }).success).toBe(true);
  });

  it("treats missing findings as empty array in verification", async () => {
    const handler = route(fastify, "POST", "/github/verify");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockGetPRStatus.mockResolvedValueOnce({ merged: true });
    mockRunScan.mockResolvedValueOnce({ score: 70 }); // no findings property

    await handler({ body: { url: "https://a.com", findingIds: ["rule-1"], prNumber: 1, owner: "o", repo: "r" } }, reply);

    const payload = reply.payload as { success: boolean; allFixed: boolean };
    expect(payload.success).toBe(true);
    expect(payload.allFixed).toBe(true);
  });

  it("marks findings as still present when ruleId matches scan findings", async () => {
    const handler = route(fastify, "POST", "/github/verify");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockGetPRStatus.mockResolvedValueOnce({ merged: true });
    mockRunScan.mockResolvedValueOnce({
      score: 80,
      findings: [{ ruleId: "rule-1" }],
    });

    await handler(
      { body: { url: "https://a.com", findingIds: ["rule-1-1"], prNumber: 1, owner: "o", repo: "r" } },
      reply
    );

    const payload = reply.payload as {
      success: boolean;
      allFixed: boolean;
      findingsVerified: Array<{ stillPresent: boolean; ruleId: string }>;
    };
    expect(payload.success).toBe(true);
    expect(payload.allFixed).toBe(false);
    expect(payload.findingsVerified[0]).toMatchObject({ ruleId: "rule-1", stillPresent: true });
  });

  it("returns 500 when branches call fails", async () => {
    const handler = route(fastify, "GET", "/github/repos/:owner/:repo/branches");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockGetBranches.mockRejectedValueOnce(new Error("branches bad"));

    await handler({ params: { owner: "o", repo: "r" } }, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ error: "branches bad" });
  });

  it("falls back to Unknown error when branches call throws non-Error", async () => {
    const handler = route(fastify, "GET", "/github/repos/:owner/:repo/branches");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockGetBranches.mockRejectedValueOnce("branches nope");

    await handler({ params: { owner: "o", repo: "r" } }, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ error: "Unknown error" });
  });

  it("returns 401 when branches requested without token", async () => {
    const handler = route(fastify, "GET", "/github/repos/:owner/:repo/branches");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce(undefined);

    await handler({ params: { owner: "o", repo: "r" } }, reply);

    expect(reply.statusCode).toBe(401);
    expect(reply.payload).toEqual({ error: "GitHub not connected" });
  });

  it("returns branches when token present", async () => {
    const handler = route(fastify, "GET", "/github/repos/:owner/:repo/branches");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce("tok");
    mockGetBranches.mockResolvedValueOnce([{ name: "main" }]);

    await handler({ params: { owner: "o", repo: "r" } }, reply);

    expect(reply.payload).toEqual([{ name: "main" }]);
  });

  it("returns 401 when file requested without token", async () => {
    const handler = route(fastify, "GET", "/github/repos/:owner/:repo/file");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce(undefined);

    await handler({ params: { owner: "o", repo: "r" }, query: { path: "file" } }, reply);

    expect(reply.statusCode).toBe(401);
    expect(reply.payload).toEqual({ error: "GitHub not connected" });
  });

  it("returns 401 when PR creation attempted without token", async () => {
    const handler = route(fastify, "POST", "/github/pr");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce(undefined);

    await handler({ body: { owner: "o", repo: "r", baseBranch: "main", fixes: [{}] } }, reply);

    expect(reply.statusCode).toBe(401);
    expect(reply.payload).toEqual({ error: "GitHub not connected" });
  });

  it("returns 401 when PR status requested without token", async () => {
    const handler = route(fastify, "GET", "/github/repos/:owner/:repo/pulls/:prNumber");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce(undefined);

    await handler({ params: { owner: "o", repo: "r", prNumber: "1" } }, reply);

    expect(reply.statusCode).toBe(401);
    expect(reply.payload).toEqual({ error: "GitHub not connected" });
  });

  it("returns 401 when verify requested without token", async () => {
    const handler = route(fastify, "POST", "/github/verify");
    const reply = createReply();
    mockGetToken.mockReturnValueOnce(undefined);

    await handler({ body: { url: "https://a.com", findingIds: ["f"], prNumber: 1, owner: "o", repo: "r" } }, reply);

    expect(reply.statusCode).toBe(401);
    expect(reply.payload).toEqual({ error: "GitHub not connected" });
  });
});
