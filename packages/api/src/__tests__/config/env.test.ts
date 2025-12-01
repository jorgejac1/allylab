import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("config/env", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("applies defaults when env vars missing", async () => {
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GITHUB_API_URL;

    const { config } = await import("../../config/env");

    expect(config.port).toBe(3001);
    expect(config.nodeEnv).toBe("development");
    expect(config.anthropicApiKey).toBe("");
    expect(config.enableAiFixes).toBe(false);
    expect(config.githubApiUrl).toBe("https://api.github.com");
  });

  it("uses provided env vars", async () => {
    process.env.PORT = "8080";
    process.env.NODE_ENV = "production";
    process.env.ANTHROPIC_API_KEY = "key";
    process.env.GITHUB_API_URL = "https://custom.api";

    const { config } = await import("../../config/env");

    expect(config.port).toBe(8080);
    expect(config.nodeEnv).toBe("production");
    expect(config.anthropicApiKey).toBe("key");
    expect(config.enableAiFixes).toBe(true);
    expect(config.githubApiUrl).toBe("https://custom.api");
  });
});
