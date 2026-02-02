import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dotenv to prevent loading from .env file
vi.mock("dotenv", () => ({
  default: { config: vi.fn() },
}));

describe("config/env", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    // Create a clean env object
    process.env = {};
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("applies defaults when env vars missing", async () => {
    // Ensure critical vars are not set
    process.env = {};

    const { config } = await import("../../config/env");

    expect(config.port).toBe(3001);
    expect(config.nodeEnv).toBe("development");
    expect(config.anthropicApiKey).toBe("");
    expect(config.enableAiFixes).toBe(false);
    expect(config.githubApiUrl).toBe("https://api.github.com");
    // Security defaults
    expect(config.enableSSRFProtection).toBe(true);
    expect(config.enableRateLimiting).toBe(true);
    expect(config.enableAuth).toBe(true);
    expect(config.jwtSecret).toBeTruthy(); // Random secret generated in dev
  });

  it("uses provided env vars", async () => {
    process.env.PORT = "8080";
    process.env.NODE_ENV = "test"; // Use "test" instead of "production" to avoid exit
    process.env.ANTHROPIC_API_KEY = "key";
    process.env.GITHUB_API_URL = "https://custom.api";
    process.env.JWT_SECRET = "test-secret";
    process.env.DISABLE_SSRF_PROTECTION = "true";
    process.env.DISABLE_RATE_LIMITING = "true";

    const { config } = await import("../../config/env");

    expect(config.port).toBe(8080);
    expect(config.nodeEnv).toBe("test");
    expect(config.anthropicApiKey).toBe("key");
    expect(config.enableAiFixes).toBe(true);
    expect(config.githubApiUrl).toBe("https://custom.api");
    expect(config.jwtSecret).toBe("test-secret");
    expect(config.enableSSRFProtection).toBe(false);
    expect(config.enableRateLimiting).toBe(false);
  });
});
