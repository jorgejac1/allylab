import type { FastifyInstance } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { scanJsonRoutes } from "../../routes/scan-json";

const mockRunScan = vi.fn();
const mockTriggerWebhooks = vi.fn();

vi.mock("../../services/scanner", () => ({
  runScan: (...args: unknown[]) => mockRunScan(...args),
}));
vi.mock("../../services/webhooks", () => ({
  triggerWebhooks: (...args: unknown[]) => mockTriggerWebhooks(...args),
}));

type RouteHandler = (
  req: { body: Record<string, unknown> },
  reply: ReplyMock
) => Promise<unknown> | unknown;

type FastifyMock = {
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
    post: ((path: string, handler: RouteHandler) => {
      routes.set(path, handler);
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

describe("routes/scan-json", () => {
  let fastify: FastifyMock;

  beforeEach(async () => {
    vi.clearAllMocks();
    fastify = createFastifyMock();
    await scanJsonRoutes(fastify as unknown as FastifyInstance);
  });

  it("returns 400 when url is missing", async () => {
    const handler = fastify.routes.get("/scan/json")!;
    const reply = createReply();

    await handler({ body: {} }, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload as Record<string, string>).toEqual({
      error: "URL is required",
    });
  });

  it("returns scan result and triggers webhooks", async () => {
    const handler = fastify.routes.get("/scan/json")!;
    const reply = createReply();

    mockRunScan.mockResolvedValueOnce({
      score: 75,
      totalIssues: 5,
      findings: [
        { impact: "critical" },
        { impact: "serious" },
        { impact: "moderate" },
        { impact: "minor" },
      ],
    });

    const result = await handler(
      { body: { url: "https://example.com", standard: "wcag21aa" } },
      reply
    );

    expect(result).toEqual(
      expect.objectContaining({ score: 75, totalIssues: 5 })
    );
    expect(mockTriggerWebhooks).toHaveBeenCalledWith(
      "scan.completed",
      expect.objectContaining({ scanUrl: "https://example.com", critical: 1 })
    );
    expect(mockTriggerWebhooks).toHaveBeenCalledWith(
      "critical.found",
      expect.objectContaining({ critical: 1 })
    );
  });

  it("does not send critical webhook when none found", async () => {
    const handler = fastify.routes.get("/scan/json")!;
    const reply = createReply();

    mockRunScan.mockResolvedValueOnce({
      score: 80,
      totalIssues: 1,
      findings: [{ impact: "minor" }],
    });

    await handler({ body: { url: "https://example.com" } }, reply);

    expect(mockTriggerWebhooks).toHaveBeenCalledWith(
      "scan.completed",
      expect.objectContaining({ critical: 0 })
    );
    expect(
      mockTriggerWebhooks.mock.calls.find(
        call => call[0] === "critical.found"
      )
    ).toBeUndefined();
  });

  it("returns 500 and triggers failure webhook when scan fails", async () => {
    const handler = fastify.routes.get("/scan/json")!;
    const reply = createReply();
    mockRunScan.mockRejectedValueOnce(new Error("fail"));

    await handler({ body: { url: "https://example.com" } }, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload as Record<string, string>).toEqual({ error: "fail" });
    expect(mockTriggerWebhooks).toHaveBeenCalledWith(
      "scan.failed",
      expect.objectContaining({ scanUrl: "https://example.com", error: "fail" })
    );
  });

  it("returns 500 with fallback message when scan fails with non-Error", async () => {
    const handler = fastify.routes.get("/scan/json")!;
    const reply = createReply();
    mockRunScan.mockRejectedValueOnce("boom");

    await handler({ body: { url: "https://example.com" } }, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ error: "Scan failed" });
    expect(mockTriggerWebhooks).toHaveBeenCalledWith(
      "scan.failed",
      expect.objectContaining({ error: "Scan failed" })
    );
  });
});
