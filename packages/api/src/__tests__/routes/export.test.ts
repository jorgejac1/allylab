import { describe, it, expect, beforeEach, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { exportRoutes } from "../../routes/export";

type ExportBody = {
  findings: Array<{
    id: string;
    ruleId: string;
    ruleTitle: string;
    description: string;
    impact: string;
    selector: string;
    wcagTags: string[];
    status?: string;
    falsePositive?: boolean;
  }>;
  scanUrl: string;
  scanDate: string;
  format: "csv" | "json";
};

type RouteHandler = (
  req: { body: ExportBody },
  reply: ReplyMock
) => Promise<unknown> | unknown;

type FastifyMock = {
  post: (path: string, handler: RouteHandler) => FastifyMock;
  routes: Map<string, RouteHandler>;
};

type ReplyMock = {
  headers: Record<string, string>;
  payload: unknown;
  header: (key: string, value: string) => ReplyMock;
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
    headers: {},
    payload: undefined,
    header: (key: string, value: string) => {
      reply.headers[key] = value;
      return reply;
    },
    send: (payload: unknown) => {
      reply.payload = payload;
      return payload;
    },
  };

  return reply;
}

describe("routes/export", () => {
  let fastify: FastifyMock;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2020-01-01T00:00:00.000Z"));
    fastify = createFastifyMock();
    await exportRoutes(fastify as unknown as FastifyInstance);
  });

  it("exports findings to CSV with escaped fields and headers", async () => {
    const handler = fastify.routes.get("/export/csv")!;
    const reply = createReply();

    await handler(
      {
        body: {
          findings: [
            {
              id: "1",
              ruleId: "rule-1",
              ruleTitle: 'Title "quoted"',
              description: "Desc line1\nline2",
              impact: "critical",
              selector: "#main",
              wcagTags: ["wcag2a"],
              falsePositive: true,
            },
            {
              id: "2",
              ruleId: "rule-2",
              ruleTitle: "Plain",
              description: "Normal",
              impact: "minor",
              selector: ".btn",
              wcagTags: ["wcag2aa", "wcag2aaa"],
              status: "fixed",
              falsePositive: false,
            },
            {
              id: "3",
              ruleId: "",
              ruleTitle: "",
              description: "",
              impact: "minor",
              selector: "",
              wcagTags: [],
            },
            {
              id: "4",
                ruleId: "rule-4",
                ruleTitle: "No tags",
                description: "No tags desc",
                impact: "minor",
                selector: "#no-tags",
                wcagTags: []
            },
          ],
          scanUrl: "https://example.com",
          scanDate: "2020-01-01",
          format: "csv",
        },
      },
      reply
    );

    const csv = reply.payload as string;

    expect(reply.headers["Content-Type"]).toBe("text/csv");
    expect(reply.headers["Content-Disposition"]).toContain(
      "allylab-findings-1577836800000.csv"
    );
    expect(csv.split("\n")[0]).toBe(
      "ID,Severity,Status,Rule ID,Issue Title,Description,Element Selector,WCAG Tags,False Positive,Scan URL,Scan Date"
    );
    expect(csv).toContain(
      '1,critical,new,rule-1,"Title ""quoted""","Desc line1 line2","#main","wcag2a",Yes,https://example.com,2020-01-01'
    );
    expect(csv).toContain(
      '2,minor,fixed,rule-2,"Plain","Normal",".btn","wcag2aa, wcag2aaa",No,https://example.com,2020-01-01'
    );
    // Empty fallback values stay quoted/empty
    expect(csv).toContain(
      '3,minor,new,,"","","","",No,https://example.com,2020-01-01'
    );
    // Missing wcagTags still produces quoted empty cell
    expect(csv).toContain(
      '4,minor,new,rule-4,"No tags","No tags desc","#no-tags","",No,https://example.com,2020-01-01'
    );

    // wcagTags undefined still yields empty cell
    const reply2 = createReply();
    await handler(
      {
        body: {
          findings: [
            {
              id: "5",
              ruleId: "rule-5",
              ruleTitle: "Undefined tags",
              description: "desc",
              impact: "minor",
              selector: ".x",
              // intentionally omit wcagTags
            } as unknown as ExportBody["findings"][number],
          ],
          scanUrl: "https://example.com",
          scanDate: "2020-01-01",
          format: "csv",
        },
      },
      reply2
    );
    expect((reply2.payload as string)).toContain(
      '5,minor,new,rule-5,"Undefined tags","desc",".x","",No,https://example.com,2020-01-01'
    );
  });

  it("exports findings to JSON with summary counts and defaults", async () => {
    const handler = fastify.routes.get("/export/json")!;
    const reply = createReply();

    await handler(
      {
        body: {
          findings: [
            {
              id: "1",
              ruleId: "rule-1",
              ruleTitle: "Critical issue",
              description: "Desc",
              impact: "critical",
              selector: "#main",
              wcagTags: ["wcag2a"],
            },
            {
              id: "2",
              ruleId: "rule-2",
              ruleTitle: "Serious issue",
              description: "Desc",
              impact: "serious",
              selector: ".btn",
              wcagTags: [],
              falsePositive: true,
            },
          ],
          scanUrl: "https://example.com",
          scanDate: "2020-01-01",
          format: "json",
        },
      },
      reply
    );

    expect(reply.headers["Content-Type"]).toBe("application/json");
    expect(reply.headers["Content-Disposition"]).toContain(
      "allylab-findings-1577836800000.json"
    );

    const payload = JSON.parse(reply.payload as string) as {
      exportedAt: string;
      scanUrl: string;
      scanDate: string;
      totalFindings: number;
      summary: Record<string, number>;
      findings: Array<{
        id: string;
        severity: string;
        status: string;
        falsePositive: boolean;
      }>;
    };

    expect(payload.exportedAt).toBe("2020-01-01T00:00:00.000Z");
    expect(payload.scanUrl).toBe("https://example.com");
    expect(payload.scanDate).toBe("2020-01-01");
    expect(payload.totalFindings).toBe(2);
    expect(payload.summary).toEqual({
      critical: 1,
      serious: 1,
      moderate: 0,
      minor: 0,
    });
    expect(payload.findings[0]).toMatchObject({
      id: "1",
      severity: "critical",
      status: "new",
      falsePositive: false,
    });
    expect(payload.findings[1]).toMatchObject({
      id: "2",
      severity: "serious",
      status: "new",
      falsePositive: true,
    });
  });
});
