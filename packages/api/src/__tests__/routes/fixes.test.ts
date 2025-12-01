import type { FastifyInstance } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fixesRoutes } from "../../routes/fixes";

const mockGenerateEnhancedFix = vi.fn();

vi.mock("../../services/ai-fixes", () => ({
  generateEnhancedFix: (...args: unknown[]) => mockGenerateEnhancedFix(...args),
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
    status: vi.fn(),
    send: vi.fn(),
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

describe("routes/fixes", () => {
  let fastify: FastifyMock;

  beforeEach(async () => {
    vi.clearAllMocks();
    fastify = createFastifyMock();
    await fixesRoutes(fastify as unknown as FastifyInstance);
  });

  it("returns 400 when required finding data is missing", async () => {
    const handler = fastify.routes.get("/fixes/generate")!;
    const reply = createReply();

    await handler({ body: {} }, reply);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.payload as Record<string, string>).toEqual({
      error: "Missing required finding data",
    });
    expect(mockGenerateEnhancedFix).not.toHaveBeenCalled();
  });

  it("returns generated fix when AI service succeeds", async () => {
    const handler = fastify.routes.get("/fixes/generate")!;
    const reply = createReply();
    const fakeFix = { id: "fix-1" };
    mockGenerateEnhancedFix.mockResolvedValueOnce(fakeFix);

    await handler(
      {
        body: {
          finding: { ruleId: "rule-1", html: "<div />", selector: "#a" },
          framework: "react",
          context: { project: "allylab" },
        },
      },
      reply
    );

    expect(mockGenerateEnhancedFix).toHaveBeenCalledWith({
      finding: { ruleId: "rule-1", html: "<div />", selector: "#a" },
      framework: "react",
      context: { project: "allylab" },
    });
    expect(reply.payload as Record<string, unknown>).toEqual({
      success: true,
      fix: fakeFix,
    });
  });

  it("returns 500 when AI service returns null", async () => {
    const handler = fastify.routes.get("/fixes/generate")!;
    const reply = createReply();
    mockGenerateEnhancedFix.mockResolvedValueOnce(null);

    await handler(
      {
        body: { finding: { ruleId: "rule-1", html: "<div />", selector: "#a" } },
      },
      reply
    );

    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.payload as Record<string, unknown>).toEqual({
      success: false,
      error: "Failed to generate fix. AI service may be unavailable.",
    });
  });

  it("returns 500 with error message when AI service throws", async () => {
    const handler = fastify.routes.get("/fixes/generate")!;
    const reply = createReply();
    mockGenerateEnhancedFix.mockRejectedValueOnce(new Error("boom"));

    await handler(
      {
        body: { finding: { ruleId: "rule-1", html: "<div />", selector: "#a" } },
      },
      reply
    );

    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.payload as Record<string, unknown>).toEqual({
      success: false,
      error: "boom",
    });
  });

  it("returns 500 with fallback message when AI service throws non-Error", async () => {
    const handler = fastify.routes.get("/fixes/generate")!;
    const reply = createReply();
    mockGenerateEnhancedFix.mockRejectedValueOnce("fail");

    await handler(
      {
        body: { finding: { ruleId: "rule-1", html: "<div />", selector: "#a" } },
      },
      reply
    );

    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.payload as Record<string, unknown>).toEqual({
      success: false,
      error: "Fix generation failed",
    });
  });
});
