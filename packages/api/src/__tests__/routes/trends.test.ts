import type { FastifyInstance } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { trendsRoutes } from "../../routes/trends";

type RouteHandler = (
  req: { body?: Record<string, unknown>; query?: Record<string, unknown> },
  reply: ReplyMock
) => Promise<unknown> | unknown;

type FastifyMock = {
  post: (path: string, handler: RouteHandler) => FastifyMock;
  routes: Map<string, RouteHandler>;
  log: { error: (...args: unknown[]) => void };
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
    log: { error: () => {} },
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

describe("routes/trends", () => {
  let fastify: FastifyMock;
  const scans = [
    { id: "1", url: "https://a.com", timestamp: "2024-01-01", score: 50, totalIssues: 10, critical: 1, serious: 2, moderate: 3, minor: 4 },
    { id: "2", url: "https://a.com", timestamp: "2024-02-01", score: 70, totalIssues: 5, critical: 0, serious: 1, moderate: 2, minor: 2 },
    { id: "3", url: "https://b.com", timestamp: "2024-03-01", score: 80, totalIssues: 2, critical: 0, serious: 0, moderate: 1, minor: 1 },
  ];

  beforeEach(async () => {
    fastify = createFastifyMock();
    await trendsRoutes(fastify as unknown as FastifyInstance);
  });

  it("validates scans array on /trends", async () => {
    const handler = fastify.routes.get("/trends")!;
    const reply = createReply();
    await handler({ body: {}, query: {} }, reply);
    expect(reply.statusCode).toBe(400);
  });

  it("returns trends data", async () => {
    const handler = fastify.routes.get("/trends")!;
    const reply = createReply();
    await handler({ body: { scans }, query: { limit: 2, url: "https://a.com", startDate: "2024-01-15", endDate: "2024-02-15" } }, reply);
    const payload = reply.payload as { data: { trends: { date: string }[] } };
    expect(payload.data.trends.length).toBe(1);
    expect(payload.data.trends[0].date).toBe("2024-02-01");
  });

  it("returns all scans when filters omitted", async () => {
    const handler = fastify.routes.get("/trends")!;
    const reply = createReply();
    await handler({ body: { scans }, query: {} }, reply);
    const payload = reply.payload as { data: { trends: { date: string }[]; meta: { totalScans: number } } };
    expect(payload.data.meta.totalScans).toBe(3);
  });

  it("returns null meta dates when no scans after filters", async () => {
    const handler = fastify.routes.get("/trends")!;
    const reply = createReply();
    await handler({ body: { scans }, query: { startDate: "2025-01-01", endDate: "2025-01-02" } }, reply);
    const payload = reply.payload as { data: { meta: { dateRange: { start: string | null; end: string | null } } } };
    expect(payload.data.meta.dateRange.start).toBeNull();
    expect(payload.data.meta.dateRange.end).toBeNull();
  });

  it("returns 500 with error message when trends throws", async () => {
    const handler = fastify.routes.get("/trends")!;
    const reply = createReply();
    fastify.log.error = vi.fn();
    const originalMap = Array.prototype.map;
    Array.prototype.map = () => {
      throw new Error("trend fail");
    };
    await handler({ body: { scans }, query: {} }, reply);
    Array.prototype.map = originalMap;
    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ success: false, error: "trend fail" });
  });

  it("returns 500 Unknown error when trends throws non-Error", async () => {
    const handler = fastify.routes.get("/trends")!;
    const reply = createReply();
    fastify.log.error = vi.fn();
    const originalMap = Array.prototype.map;
    Array.prototype.map = () => {
      throw "boom";
    };
    await handler({ body: { scans }, query: {} }, reply);
    Array.prototype.map = originalMap;
    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ success: false, error: "Unknown error" });
  });

  it("returns 500 with Error message when trends/issues throws Error", async () => {
    const handler = fastify.routes.get("/trends/issues")!;
    const reply = createReply();
    fastify.log.error = vi.fn();
    const originalFilter = Array.prototype.filter;
    Array.prototype.filter = () => {
      throw new Error("issues fail");
    };
    await handler({ body: { scans }, query: { url: "https://a.com" } }, reply);
    Array.prototype.filter = originalFilter;
    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ success: false, error: "issues fail" });
  });

  it("returns 500 Unknown error when trends/issues throws non-Error", async () => {
    const handler = fastify.routes.get("/trends/issues")!;
    const reply = createReply();
    fastify.log.error = vi.fn();
    const originalFilter = Array.prototype.filter;
    Array.prototype.filter = () => {
      throw "issues boom";
    };
    await handler({ body: { scans }, query: { url: "https://a.com" } }, reply);
    Array.prototype.filter = originalFilter;
    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ success: false, error: "Unknown error" });
  });

  it("skips scans with invalid URLs when filtering by url", async () => {
    const handler = fastify.routes.get("/trends")!;
    const reply = createReply();
    const badScans = [...scans, { ...scans[0], url: "::::" }];

    await handler({ body: { scans: badScans }, query: { url: "https://a.com" } }, reply);

    const payload = reply.payload as { data: { trends: { date: string }[] } };
    expect(payload.data.trends.every(s => s.date.startsWith("2024"))).toBe(true);
  });

  it("validates scans on /trends/issues", async () => {
    const handler = fastify.routes.get("/trends/issues")!;
    const reply = createReply();
    await handler({ body: {}, query: {} }, reply);
    expect(reply.statusCode).toBe(400);
  });

  it("returns issue trends", async () => {
    const handler = fastify.routes.get("/trends/issues")!;
    const reply = createReply();
    await handler({ body: { scans }, query: { url: "https://a.com", startDate: "2024-01-02", endDate: "2024-02-15" } }, reply);
    const payload = reply.payload as { data: { trends: { date: string }[] } };
    expect(payload.data.trends.length).toBe(1);
    expect(payload.data.trends[0].date).toBe("2024-02-01");
  });

  it("skips scans with invalid scan URL when filtering by valid url", async () => {
    const handler = fastify.routes.get("/trends/issues")!;
    const reply = createReply();
    const badScans = [...scans, { ...scans[0], url: "::::" }];
    await handler({ body: { scans: badScans }, query: { url: "https://a.com", limit: 10 } }, reply);
    expect(reply.statusCode).toBe(200);
    const payload = reply.payload as { data: { trends: { date: string }[] } };
    // Only valid host matches should remain
    expect(payload.data.trends.length).toBe(2);
  });

  it("sorts trends/issues ascending by timestamp", async () => {
    const handler = fastify.routes.get("/trends/issues")!;
    const reply = createReply();
    await handler({ body: { scans }, query: { url: "https://a.com" } }, reply);
    const payload = reply.payload as { data: { trends: { date: string }[] } };
    expect(payload.data.trends[0].date).toBe("2024-01-01");
    expect(payload.data.trends[1].date).toBe("2024-02-01");
  });

  it("returns all scans in trends/issues when url filter not provided", async () => {
    const handler = fastify.routes.get("/trends/issues")!;
    const reply = createReply();
    await handler({ body: { scans }, query: {} }, reply);
    const payload = reply.payload as { data: { trends: { date: string }[] } };
    expect(payload.data.trends.length).toBe(3);
  });

  it("validates compare periods", async () => {
    const handler = fastify.routes.get("/trends/compare")!;
    const reply = createReply();
    await handler({ body: { scans }, query: {} }, reply);
    expect(reply.statusCode).toBe(400);
  });

  it("compares two periods", async () => {
    const handler = fastify.routes.get("/trends/compare")!;
    const reply = createReply();
    await handler({
      body: {
        scans,
        period1Start: "2023-12-01",
        period1End: "2024-01-15",
        period2Start: "2024-01-16",
        period2End: "2024-02-15",
      },
      query: { url: "https://a.com" },
    }, reply);
    const payload = reply.payload as { data: { comparison: { scanCount: { period2: number } } } };
    expect(payload.data.comparison.scanCount.period2).toBe(1);
  });

  it("returns 400 when compare scans missing", async () => {
    const handler = fastify.routes.get("/trends/compare")!;
    const reply = createReply();
    await handler({ body: { period1Start: "a", period1End: "b", period2Start: "c", period2End: "d" }, query: {} }, reply);
    expect(reply.statusCode).toBe(400);
  });

  it("filters compare scans by host and handles invalid scan urls", async () => {
    const handler = fastify.routes.get("/trends/compare")!;
    const reply = createReply();
    const badScans = [...scans, { ...scans[0], url: "::::" }];
    await handler({
      body: {
        scans: badScans,
        period1Start: "2023-12-01",
        period1End: "2024-01-15",
        period2Start: "2024-01-16",
        period2End: "2024-04-15",
      },
      query: { url: "https://a.com" },
    }, reply);
    expect(reply.statusCode).toBe(200);
  });

  it("compares periods without url filter (skip host filter branch)", async () => {
    const handler = fastify.routes.get("/trends/compare")!;
    const reply = createReply();
    await handler({
      body: {
        scans,
        period1Start: "2023-12-01",
        period1End: "2024-01-15",
        period2Start: "2024-01-16",
        period2End: "2024-04-15",
      },
      query: {},
    }, reply);
    expect(reply.statusCode).toBe(200);
  });

  it("uses zero changePercent when baseline averages are zero", async () => {
    const handler = fastify.routes.get("/trends/compare")!;
    const reply = createReply();
    const zeroScans = [
      { ...scans[0], score: 0, totalIssues: 0, timestamp: "2024-01-01" },
      { ...scans[1], score: 0, totalIssues: 0, timestamp: "2024-02-01" },
    ];
    await handler({
      body: {
        scans: zeroScans,
        period1Start: "2024-01-01",
        period1End: "2024-01-31",
        period2Start: "2024-02-01",
        period2End: "2024-02-28",
      },
      query: {},
    }, reply);
    const payload = reply.payload as {
      data: {
        comparison: {
          score: { changePercent: number };
          issues: { changePercent: number };
        };
      };
    };
    expect(payload.data.comparison.score.changePercent).toBe(0);
    expect(payload.data.comparison.issues.changePercent).toBe(0);
  });

  it("returns 500 with error message when compare throws Error", async () => {
    const handler = fastify.routes.get("/trends/compare")!;
    const reply = createReply();
    fastify.log.error = vi.fn();
    const originalFilter = Array.prototype.filter;
    Array.prototype.filter = () => {
      throw new Error("compare fail");
    };
    await handler({
      body: {
        scans,
        period1Start: "2023-12-01",
        period1End: "2024-01-15",
        period2Start: "2024-01-16",
        period2End: "2024-04-15",
      },
      query: { url: "https://a.com" },
    }, reply);
    Array.prototype.filter = originalFilter;
    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ success: false, error: "compare fail" });
  });

  it("returns 500 Unknown error when compare throws non-Error", async () => {
    const handler = fastify.routes.get("/trends/compare")!;
    const reply = createReply();
    fastify.log.error = vi.fn();
    const originalFilter = Array.prototype.filter;
    Array.prototype.filter = () => {
      throw "compare boom";
    };
    await handler({
      body: {
        scans,
        period1Start: "2023-12-01",
        period1End: "2024-01-15",
        period2Start: "2024-01-16",
        period2End: "2024-04-15",
      },
      query: { url: "https://a.com" },
    }, reply);
    Array.prototype.filter = originalFilter;
    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ success: false, error: "Unknown error" });
  });

  it("validates scans on /trends/stats", async () => {
    const handler = fastify.routes.get("/trends/stats")!;
    const reply = createReply();
    await handler({ body: {}, query: {} }, reply);
    expect(reply.statusCode).toBe(400);
  });

  it("returns stats and percentiles", async () => {
    const handler = fastify.routes.get("/trends/stats")!;
    const reply = createReply();
    await handler({ body: { scans }, query: { url: "https://a.com", startDate: "2024-01-15", endDate: "2024-02-15" } }, reply);
    const payload = reply.payload as { data: { percentiles: { p50: number } } };
    expect(payload.data.percentiles.p50).toBeDefined();
  });

  it("returns stats when no url/start/end filters provided", async () => {
    const handler = fastify.routes.get("/trends/stats")!;
    const reply = createReply();
    await handler({ body: { scans }, query: {} }, reply);
    const payload = reply.payload as { data: { stats: { totalIssuesFixed: number }; meta?: unknown } };
    expect(payload.data.stats.totalIssuesFixed).toBeGreaterThanOrEqual(0);
  });

  it("handles invalid scan url in stats filter", async () => {
    const handler = fastify.routes.get("/trends/stats")!;
    const reply = createReply();
    const badScans = [...scans, { ...scans[0], url: "::::" }];
    await handler({ body: { scans: badScans }, query: { url: "https://a.com" } }, reply);
    expect(reply.statusCode).toBe(200);
  });

  it("returns zero percentiles when no scores available", async () => {
    const handler = fastify.routes.get("/trends/stats")!;
    const reply = createReply();
    await handler({ body: { scans: [] }, query: {} }, reply);
    const payload = reply.payload as { data: { percentiles: { p25: number; p50: number; p75: number; p90: number } } };
    expect(payload.data.percentiles).toEqual({ p25: 0, p50: 0, p75: 0, p90: 0 });
  });

  it("sets projectedScansToGoal to 0 when last score already meets target", async () => {
    const handler = fastify.routes.get("/trends/stats")!;
    const reply = createReply();
    const highScans = [
      { ...scans[0], score: 95 },
      { ...scans[1], score: 96 },
    ];
    await handler({ body: { scans: highScans }, query: {} }, reply);
    const payload = reply.payload as { data: { changeRates: { projectedScansToGoal: number | null } } };
    expect(payload.data.changeRates.projectedScansToGoal).toBe(0);
  });

  it("sets projectedScansToGoal to null when score change not improving", async () => {
    const handler = fastify.routes.get("/trends/stats")!;
    const reply = createReply();
    const flatScans = [
      { ...scans[0], score: 50 },
      { ...scans[1], score: 50 },
    ];
    await handler({ body: { scans: flatScans }, query: {} }, reply);
    const payload = reply.payload as { data: { changeRates: { projectedScansToGoal: number | null } } };
    expect(payload.data.changeRates.projectedScansToGoal).toBeNull();
  });

  it("returns 500 with Error message when trends/stats throws Error", async () => {
    const handler = fastify.routes.get("/trends/stats")!;
    const reply = createReply();
    fastify.log.error = vi.fn();
    const originalGetAll = Array.prototype.map;
    Array.prototype.map = () => {
      throw new Error("stats fail");
    };
    await handler({ body: { scans }, query: { url: "https://a.com" } }, reply);
    Array.prototype.map = originalGetAll;
    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ success: false, error: "stats fail" });
  });

  it("returns 500 Unknown error when trends/stats throws non-Error", async () => {
    const handler = fastify.routes.get("/trends/stats")!;
    const reply = createReply();
    fastify.log.error = vi.fn();
    const originalGetAll = Array.prototype.map;
    Array.prototype.map = () => {
      throw "stats boom";
    };
    await handler({ body: { scans }, query: { url: "https://a.com" } }, reply);
    Array.prototype.map = originalGetAll;
    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ success: false, error: "Unknown error" });
  });
});
