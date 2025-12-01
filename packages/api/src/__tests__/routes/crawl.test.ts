import type { FastifyInstance } from "fastify";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { crawlRoutes } from "../../routes/crawl";

const mockCrawlSite = vi.fn();
const mockRunScan = vi.fn();
const mockTriggerWebhooks = vi.fn();
const mockSendSSE = vi.fn();
const mockEndSSE = vi.fn();

vi.mock("../../services/crawler", () => ({
  crawlSite: (...args: unknown[]) => mockCrawlSite(...args),
}));
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

type RouteHandler = (req: { body: Record<string, unknown> }, reply: ReplyMock) => Promise<unknown> | unknown;

type FastifyMock = {
  post: (path: string, handler: RouteHandler) => FastifyMock;
  routes: Map<string, RouteHandler>;
};

function createFastifyMock() {
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

type FnMock<Args extends unknown[], Return> = ReturnType<
  typeof vi.fn<(...args: Args) => Return>
>;

type ReplyMock = {
  statusCode: number;
  payload: unknown;
  raw: { writeHead: FnMock<[number, Record<string, string>], void> };
  status: FnMock<[number], unknown>;
  send: FnMock<[unknown], unknown>;
};

function createReply() {
  const reply: ReplyMock = {
    statusCode: 200,
    payload: undefined as unknown,
    raw: {
      writeHead: vi.fn<(status: number, headers: Record<string, string>) => void>() as FnMock<
        [number, Record<string, string>],
        void
      >,
    },
    status: vi.fn<(code: number) => ReplyMock>() as FnMock<[number], unknown>,
    send: vi.fn<(payload: unknown) => unknown>() as FnMock<[unknown], unknown>,
  };

  reply.status = vi.fn((code: number) => {
    reply.statusCode = code;
    return reply;
  });

  reply.send = vi.fn((payload: unknown) => {
    reply.payload = payload;
    return payload;
  });

  return reply;
}

describe("routes/crawl", () => {
  let fastify: FastifyMock;

  beforeEach(async () => {
    vi.clearAllMocks();
    fastify = createFastifyMock();
    await crawlRoutes(fastify as unknown as FastifyInstance);
  });

  describe("POST /crawl", () => {
    it("returns 400 when url is missing", async () => {
      const reply = createReply();
      const handler = fastify.routes.get("/crawl")!;

      await handler({ body: {} }, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.payload as Record<string, unknown>).toEqual({ error: "URL is required" });
    });

    it("returns crawl result when successful", async () => {
      const reply = createReply();
      const handler = fastify.routes.get("/crawl")!;
      mockCrawlSite.mockResolvedValueOnce({ urls: ["https://a.com"], totalFound: 1 });

      await handler({ body: { url: "https://example.com" } }, reply);

      expect(mockCrawlSite).toHaveBeenCalledWith({
        startUrl: "https://example.com",
        maxPages: 10,
        maxDepth: 2,
        sameDomainOnly: true,
      });
      expect(reply.payload as { urls: string[]; totalFound: number }).toEqual({
        urls: ["https://a.com"],
        totalFound: 1,
      });
    });

    it("returns 500 on crawl failure with fallback message", async () => {
      const reply = createReply();
      const handler = fastify.routes.get("/crawl")!;
      mockCrawlSite.mockRejectedValueOnce("boom");

      await handler({ body: { url: "https://example.com" } }, reply);

      expect(reply.status).toHaveBeenCalledWith(500);
      expect(reply.payload as Record<string, unknown>).toEqual({ error: "Crawl failed" });
    });

    it("returns specific error message when crawl throws Error", async () => {
      const reply = createReply();
      const handler = fastify.routes.get("/crawl")!;
      mockCrawlSite.mockRejectedValueOnce(new Error("boom message"));

      await handler({ body: { url: "https://example.com" } }, reply);

      expect(reply.status).toHaveBeenCalledWith(500);
      expect(reply.payload as Record<string, unknown>).toEqual({
        error: "boom message",
      });
    });
  });

  describe("POST /crawl/scan (SSE)", () => {
    it("returns 400 when url is missing", async () => {
      const reply = createReply();
      const handler = fastify.routes.get("/crawl/scan")!;

      await handler({ body: {} }, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.payload as Record<string, unknown>).toEqual({ error: "URL is required" });
      expect(mockEndSSE).not.toHaveBeenCalled();
    });

    it("streams crawl and scan results and triggers webhooks", async () => {
      const reply = createReply();
      const handler = fastify.routes.get("/crawl/scan")!;

      mockCrawlSite.mockResolvedValueOnce({
        urls: ["https://a.com", "https://b.com"],
        totalFound: 2,
      });

      mockRunScan
        .mockResolvedValueOnce({
          score: 80,
          totalIssues: 5,
          findings: [
            { impact: "critical" },
            { impact: "minor" },
            { impact: "serious" },
          ],
        })
        .mockResolvedValueOnce({
          score: 60,
          totalIssues: 3,
          findings: [{ impact: "minor" }],
        });

      await handler({ body: { url: "https://example.com" } }, reply);

      expect(reply.raw.writeHead).toHaveBeenCalledWith(
        200,
        expect.objectContaining({ "Content-Type": "text/event-stream" })
      );
      expect(mockSendSSE).toHaveBeenCalledWith(
        reply,
        "status",
        expect.objectContaining({ phase: "crawl" })
      );
      expect(mockSendSSE).toHaveBeenCalledWith(
        reply,
        "crawl-complete",
        expect.objectContaining({ totalFound: 2 })
      );
      expect(mockSendSSE).toHaveBeenCalledWith(
        reply,
        "page-complete",
        expect.objectContaining({ url: "https://a.com" })
      );
      expect(mockSendSSE).toHaveBeenCalledWith(
        reply,
        "page-complete",
        expect.objectContaining({ url: "https://b.com" })
      );
      expect(mockSendSSE).toHaveBeenCalledWith(
        reply,
        "complete",
        expect.objectContaining({ totalIssues: 8, pagesScanned: 2 })
      );
      expect(mockTriggerWebhooks).toHaveBeenCalledWith(
        "scan.completed",
        expect.objectContaining({ totalIssues: 8 })
      );
      expect(mockTriggerWebhooks).toHaveBeenCalledWith(
        "critical.found",
        expect.objectContaining({ critical: 1 })
      );
      expect(mockEndSSE).toHaveBeenCalledWith(reply);
    });

    it("sends page-error when a page scan fails", async () => {
      const reply = createReply();
      const handler = fastify.routes.get("/crawl/scan")!;

      mockCrawlSite.mockResolvedValueOnce({
        urls: ["https://a.com"],
        totalFound: 1,
      });

      mockRunScan.mockRejectedValueOnce(new Error("scan failed"));

      await handler({ body: { url: "https://example.com" } }, reply);

      expect(mockSendSSE).toHaveBeenCalledWith(
        reply,
        "page-error",
        expect.objectContaining({
          url: "https://a.com",
          error: "scan failed",
        })
      );
      expect(mockTriggerWebhooks).not.toHaveBeenCalledWith("critical.found", expect.anything());
      expect(mockEndSSE).toHaveBeenCalled();
    });

    it("uses default page-error message when scan failure is not an Error", async () => {
      const reply = createReply();
      const handler = fastify.routes.get("/crawl/scan")!;

      mockCrawlSite.mockResolvedValueOnce({
        urls: ["https://a.com"],
        totalFound: 1,
      });

      mockRunScan.mockRejectedValueOnce("boom");

      await handler({ body: { url: "https://example.com" } }, reply);

      expect(mockSendSSE).toHaveBeenCalledWith(
        reply,
        "page-error",
        expect.objectContaining({
          url: "https://a.com",
          error: "Scan failed",
        })
      );
      expect(mockEndSSE).toHaveBeenCalled();
    });

    it("handles crawl error and triggers scan.failed webhook", async () => {
      const reply = createReply();
      const handler = fastify.routes.get("/crawl/scan")!;

      mockCrawlSite.mockRejectedValueOnce(new Error("crawl bad"));

      await handler({ body: { url: "https://example.com" } }, reply);

      expect(mockSendSSE).toHaveBeenCalledWith(
        reply,
        "error",
        expect.objectContaining({ message: "crawl bad" })
      );
      expect(mockTriggerWebhooks).toHaveBeenCalledWith(
        "scan.failed",
        expect.objectContaining({ error: "crawl bad" })
      );
      expect(mockEndSSE).toHaveBeenCalled();
    });

    it("falls back to generic error message when crawl throws non-Error", async () => {
      const reply = createReply();
      const handler = fastify.routes.get("/crawl/scan")!;

      mockCrawlSite.mockRejectedValueOnce("nope");

      await handler({ body: { url: "https://example.com" } }, reply);

      expect(mockSendSSE).toHaveBeenCalledWith(
        reply,
        "error",
        expect.objectContaining({ message: "Crawl failed" })
      );
      expect(mockTriggerWebhooks).toHaveBeenCalledWith(
        "scan.failed",
        expect.objectContaining({ error: "Crawl failed" })
      );
      expect(mockEndSSE).toHaveBeenCalled();
    });
  });

  describe("POST /crawl/scan/json", () => {
    it("returns 400 when url is missing", async () => {
      const reply = createReply();
      const handler = fastify.routes.get("/crawl/scan/json")!;

      await handler({ body: {} }, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.payload as Record<string, unknown>).toEqual({ error: "URL is required" });
    });

    it("returns aggregated JSON response and skips failed scans", async () => {
      const reply = createReply();
      const handler = fastify.routes.get("/crawl/scan/json")!;

      mockCrawlSite.mockResolvedValueOnce({
        urls: ["https://a.com", "https://b.com"],
        totalFound: 2,
      });

      mockRunScan
        .mockResolvedValueOnce({
          score: 90,
          totalIssues: 2,
          findings: [{ impact: "critical" }],
        })
        .mockRejectedValueOnce(new Error("scan error"));

      await handler({ body: { url: "https://example.com" } }, reply);

      const payload = reply.payload as {
        startUrl: string;
        pagesScanned: number;
        summary: { critical: number };
        totalIssues: number;
        averageScore: number;
      };

      expect(payload.startUrl).toBe("https://example.com");
      expect(payload.pagesScanned).toBe(1);
      expect(payload.summary.critical).toBe(1);
      expect(payload.totalIssues).toBe(2);
      expect(payload.averageScore).toBe(90);
    });

    it("returns average score 0 when no results", async () => {
      const reply = createReply();
      const handler = fastify.routes.get("/crawl/scan/json")!;

      mockCrawlSite.mockResolvedValueOnce({
        urls: [],
        totalFound: 0,
      });

      await handler({ body: { url: "https://example.com" } }, reply);

      const payload = reply.payload as {
        averageScore: number;
        pagesScanned: number;
      };

      expect(payload.pagesScanned).toBe(0);
      expect(payload.averageScore).toBe(0);
    });

    it("returns 500 when crawl fails", async () => {
      const reply = createReply();
      const handler = fastify.routes.get("/crawl/scan/json")!;
      mockCrawlSite.mockRejectedValueOnce("oops");

      await handler({ body: { url: "https://example.com" } }, reply);

      expect(reply.status).toHaveBeenCalledWith(500);
      expect(reply.payload as Record<string, unknown>).toEqual({ error: "Crawl failed" });
    });

    it("returns crawl error message when crawl throws Error", async () => {
      const reply = createReply();
      const handler = fastify.routes.get("/crawl/scan/json")!;
      mockCrawlSite.mockRejectedValueOnce(new Error("json crawl bad"));

      await handler({ body: { url: "https://example.com" } }, reply);

      expect(reply.status).toHaveBeenCalledWith(500);
      expect(reply.payload as Record<string, unknown>).toEqual({
        error: "json crawl bad",
      });
    });
  });
});
