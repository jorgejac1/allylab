import type { FastifyInstance } from "fastify";
import { describe, expect, it, vi } from "vitest";
import { registerRoutes } from "../../routes";

const mockRegister = vi.fn();

vi.mock("../../routes/health", () => ({ healthRoutes: vi.fn() }));
vi.mock("../../routes/scan", () => ({ scanRoutes: vi.fn() }));
vi.mock("../../routes/scan-json", () => ({ scanJsonRoutes: vi.fn() }));
vi.mock("../../routes/jira", () => ({ jiraRoutes: vi.fn() }));
vi.mock("../../routes/schedules", () => ({ scheduleRoutes: vi.fn() }));
vi.mock("../../routes/export", () => ({ exportRoutes: vi.fn() }));
vi.mock("../../routes/webhooks", () => ({ webhookRoutes: vi.fn() }));
vi.mock("../../routes/crawl", () => ({ crawlRoutes: vi.fn() }));
vi.mock("../../routes/github", () => ({ githubRoutes: vi.fn() }));
vi.mock("../../routes/fixes", () => ({ fixesRoutes: vi.fn() }));
vi.mock("../../routes/trends", () => ({ trendsRoutes: vi.fn() }));
vi.mock("../../routes/rules", () => ({ rulesRoutes: vi.fn() }));

describe("routes/index registerRoutes", () => {
  it("registers all route modules with fastify", async () => {
    const fastify = { register: mockRegister } as unknown as FastifyInstance;

    await registerRoutes(fastify);

    expect(mockRegister).toHaveBeenCalledTimes(12);
  });
});
