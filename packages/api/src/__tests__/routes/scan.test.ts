import type { FastifyInstance } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { scanRoutes } from "../../routes/scan";

const mockRunScan = vi.fn();
const mockTriggerWebhooks = vi.fn();
const mockSendSSE = vi.fn();
const mockEndSSE = vi.fn();

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

type RouteHandler = (
  req: { body: Record<string, unknown> },
  reply: ReplyMock
) => Promise<unknown> | unknown;

type FastifyMock = {
  post: (path: string, handler: RouteHandler) => FastifyMock;
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

describe("routes/scan", () => {
  let fastify: FastifyMock;

  beforeEach(async () => {
    vi.clearAllMocks();
    fastify = createFastifyMock();
    await scanRoutes(fastify as unknown as FastifyInstance);
  });

  it("returns 400 when url is missing", async () => {
    const handler = fastify.routes.get("/scan")!;
    const reply = createReply();

    await handler({ body: {} }, reply);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.payload as Record<string, string>).toEqual({
      error: "URL is required",
    });
    expect(mockEndSSE).not.toHaveBeenCalled();
  });

  it("streams scan progress and triggers webhooks on success", async () => {
    const handler = fastify.routes.get("/scan")!;
    const reply = createReply();

    mockRunScan.mockImplementationOnce(async (opts: {
      onProgress?: (progress: Record<string, unknown>) => void;
      onFinding?: (finding: Record<string, unknown>) => void;
    }) => {
      opts.onProgress?.({ percent: 50 });
      opts.onFinding?.({ impact: "serious" });
      return {
        score: 88,
        totalIssues: 4,
        findings: [
          { impact: "critical" },
          { impact: "serious" },
          { impact: "minor" },
          { impact: "moderate" },
        ],
        customRulesCount: 2,
      };
    });

    await handler(
      {
        body: {
          url: "https://example.com",
          standard: "wcag21aa",
          viewport: "desktop",
          includeWarnings: true,
          includeCustomRules: false,
        },
      },
      reply
    );

    expect(reply.raw.writeHead).toHaveBeenCalledWith(
      200,
      expect.objectContaining({ "Content-Type": "text/event-stream" })
    );
    expect(mockSendSSE).toHaveBeenCalledWith(
      reply,
      "status",
      expect.objectContaining({ phase: "init" })
    );
    expect(mockSendSSE).toHaveBeenCalledWith(
      reply,
      "complete",
      expect.objectContaining({ score: 88, totalIssues: 4 })
    );
    expect(
      mockSendSSE.mock.calls.find(call => call[1] === "progress")
    ).toBeTruthy();
    expect(
      mockSendSSE.mock.calls.find(call => call[1] === "finding")
    ).toBeTruthy();
    expect(mockTriggerWebhooks).toHaveBeenCalledWith(
      "scan.completed",
      expect.objectContaining({ scanUrl: "https://example.com", score: 88 })
    );
    expect(mockTriggerWebhooks).toHaveBeenCalledWith(
      "critical.found",
      expect.objectContaining({ critical: 1 })
    );
    expect(mockEndSSE).toHaveBeenCalledWith(reply);
  });

  it("does not send critical webhook when no critical findings", async () => {
    const handler = fastify.routes.get("/scan")!;
    const reply = createReply();

    mockRunScan.mockResolvedValueOnce({
      score: 50,
      totalIssues: 2,
      findings: [{ impact: "minor" }, { impact: "moderate" }],
      customRulesCount: 0,
    });

    await handler({ body: { url: "https://example.com" } }, reply);

    expect(
      mockTriggerWebhooks.mock.calls.find(call => call[0] === "critical.found")
    ).toBeUndefined();
  });

  it("sends error events and triggers failure webhook when scan throws", async () => {
    const handler = fastify.routes.get("/scan")!;
    const reply = createReply();
    mockRunScan.mockRejectedValueOnce(new Error("boom"));

    await handler({ body: { url: "https://example.com" } }, reply);

    expect(mockSendSSE).toHaveBeenCalledWith(
      reply,
      "error",
      expect.objectContaining({ message: "boom" })
    );
    expect(mockTriggerWebhooks).toHaveBeenCalledWith(
      "scan.failed",
      expect.objectContaining({ error: "boom", scanUrl: "https://example.com" })
    );
    expect(mockEndSSE).toHaveBeenCalledWith(reply);
  });

  it("falls back to Unknown error message when thrown value is not Error", async () => {
    const handler = fastify.routes.get("/scan")!;
    const reply = createReply();
    mockRunScan.mockRejectedValueOnce("oops");

    await handler({ body: { url: "https://example.com" } }, reply);

    expect(mockSendSSE).toHaveBeenCalledWith(
      reply,
      "error",
      expect.objectContaining({ message: "Unknown error" })
    );
    expect(mockTriggerWebhooks).toHaveBeenCalledWith(
      "scan.failed",
      expect.objectContaining({ error: "Unknown error" })
    );
    expect(mockEndSSE).toHaveBeenCalled();
  });
});
