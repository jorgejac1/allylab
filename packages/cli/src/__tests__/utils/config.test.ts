import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const mockReadFileSync = vi.fn();
const mockExistsSync = vi.fn();

vi.mock("fs", () => ({
  readFileSync: mockReadFileSync,
  existsSync: mockExistsSync,
}));

describe("utils/config", () => {
  const originalEnv = { ...process.env };
  const originalCwd = process.cwd;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Reset environment variables
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("ALLYLAB_")) {
        delete process.env[key];
      }
    });
    mockExistsSync.mockReturnValue(false);
    mockReadFileSync.mockReturnValue("{}");
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    process.cwd = originalCwd;
  });

  describe("loadConfig", () => {
    it("returns default config when no file or env vars", async () => {
      mockExistsSync.mockReturnValue(false);

      const { loadConfig } = await import("../../utils/config.js");
      const config = loadConfig();

      expect(config.apiUrl).toBe("http://localhost:3001");
      expect(config.standard).toBe("wcag21aa");
      expect(config.viewport).toBe("desktop");
      expect(config.format).toBe("pretty");
      expect(config.timeout).toBe(60000);
      expect(config.ignoreRules).toEqual([]);
      expect(config.maxPages).toBe(10);
      expect(config.maxDepth).toBe(2);
    });

    it("loads config from config file when found", async () => {
      mockExistsSync.mockImplementation((path: string) => path.endsWith(".allylabrc.json"));
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          apiUrl: "http://custom:4000",
          standard: "wcag22aa",
          viewport: "mobile",
        })
      );

      const { loadConfig } = await import("../../utils/config.js");
      const config = loadConfig();

      expect(config.apiUrl).toBe("http://custom:4000");
      expect(config.standard).toBe("wcag22aa");
      expect(config.viewport).toBe("mobile");
    });

    it("normalizes ignoreRules from comma-separated string", async () => {
      mockExistsSync.mockImplementation((path: string) => path.endsWith(".allylabrc.json"));
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          ignoreRules: "color-contrast, image-alt , region",
        })
      );

      const { loadConfig } = await import("../../utils/config.js");
      const config = loadConfig();

      expect(config.ignoreRules).toEqual(["color-contrast", "image-alt", "region"]);
    });

    it("handles malformed config file gracefully", async () => {
      mockExistsSync.mockImplementation((path: string) => path.endsWith(".allylabrc.json"));
      mockReadFileSync.mockReturnValue("{ invalid json }");

      const { loadConfig } = await import("../../utils/config.js");
      const config = loadConfig();

      // Should fall back to defaults
      expect(config.apiUrl).toBe("http://localhost:3001");
    });

    it("applies environment variables over file config", async () => {
      mockExistsSync.mockImplementation((path: string) => path.endsWith(".allylabrc.json"));
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          apiUrl: "http://file:3000",
          standard: "wcag21a",
        })
      );
      process.env.ALLYLAB_API_URL = "http://env:4000";

      const { loadConfig } = await import("../../utils/config.js");
      const config = loadConfig();

      expect(config.apiUrl).toBe("http://env:4000");
      expect(config.standard).toBe("wcag21a"); // From file
    });

    it("loads all supported environment variables", async () => {
      mockExistsSync.mockReturnValue(false);
      process.env.ALLYLAB_API_URL = "http://env:5000";
      process.env.ALLYLAB_STANDARD = "wcag22aa";
      process.env.ALLYLAB_VIEWPORT = "tablet";
      process.env.ALLYLAB_FAIL_ON = "critical";
      process.env.ALLYLAB_FORMAT = "sarif";
      process.env.ALLYLAB_TIMEOUT = "45000";
      process.env.ALLYLAB_IGNORE_RULES = "rule1, rule2";
      process.env.ALLYLAB_MAX_PAGES = "25";
      process.env.ALLYLAB_MAX_DEPTH = "3";

      const { loadConfig } = await import("../../utils/config.js");
      const config = loadConfig();

      expect(config.apiUrl).toBe("http://env:5000");
      expect(config.standard).toBe("wcag22aa");
      expect(config.viewport).toBe("tablet");
      expect(config.failOn).toBe("critical");
      expect(config.format).toBe("sarif");
      expect(config.timeout).toBe(45000);
      expect(config.ignoreRules).toEqual(["rule1", "rule2"]);
      expect(config.maxPages).toBe(25);
      expect(config.maxDepth).toBe(3);
    });

    it("ignores invalid numeric environment variables", async () => {
      mockExistsSync.mockReturnValue(false);
      process.env.ALLYLAB_TIMEOUT = "not-a-number";
      process.env.ALLYLAB_MAX_PAGES = "abc";
      process.env.ALLYLAB_MAX_DEPTH = "";

      const { loadConfig } = await import("../../utils/config.js");
      const config = loadConfig();

      expect(config.timeout).toBe(60000); // Default
      expect(config.maxPages).toBe(10); // Default
      expect(config.maxDepth).toBe(2); // Default
    });

    it("applies CLI options with highest priority", async () => {
      mockExistsSync.mockImplementation((path: string) => path.endsWith(".allylabrc.json"));
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          apiUrl: "http://file:3000",
          standard: "wcag21a",
        })
      );
      process.env.ALLYLAB_API_URL = "http://env:4000";

      const { loadConfig } = await import("../../utils/config.js");
      const config = loadConfig({
        apiUrl: "http://cli:5000",
      });

      expect(config.apiUrl).toBe("http://cli:5000");
    });

    it("applies all CLI options correctly", async () => {
      mockExistsSync.mockReturnValue(false);

      const { loadConfig } = await import("../../utils/config.js");
      const config = loadConfig({
        apiUrl: "http://cli:1234",
        standard: "wcag22aa",
        viewport: "mobile",
        failOn: "serious",
        format: "json",
        timeout: 90000,
        ignoreRules: ["rule1"],
        output: "report.json",
        maxPages: 100,
        maxDepth: 10,
      });

      expect(config.apiUrl).toBe("http://cli:1234");
      expect(config.standard).toBe("wcag22aa");
      expect(config.viewport).toBe("mobile");
      expect(config.failOn).toBe("serious");
      expect(config.format).toBe("json");
      expect(config.timeout).toBe(90000);
      expect(config.ignoreRules).toEqual(["rule1"]);
      expect(config.output).toBe("report.json");
      expect(config.maxPages).toBe(100);
      expect(config.maxDepth).toBe(10);
    });
  });

  describe("getConfigPath", () => {
    it("returns path when config file exists", async () => {
      mockExistsSync.mockImplementation((path: string) => path.endsWith(".allylabrc.json"));

      const { getConfigPath } = await import("../../utils/config.js");
      const path = getConfigPath();

      expect(path).toContain(".allylabrc.json");
    });

    it("returns null when no config file exists", async () => {
      mockExistsSync.mockReturnValue(false);

      const { getConfigPath } = await import("../../utils/config.js");
      const path = getConfigPath();

      expect(path).toBeNull();
    });
  });

  describe("createSampleConfig", () => {
    it("returns valid JSON with all default options", async () => {
      const { createSampleConfig } = await import("../../utils/config.js");
      const sample = createSampleConfig();
      const config = JSON.parse(sample);

      expect(config.apiUrl).toBe("http://localhost:3001");
      expect(config.standard).toBe("wcag21aa");
      expect(config.viewport).toBe("desktop");
      expect(config.failOn).toBe("serious");
      expect(config.format).toBe("pretty");
      expect(config.timeout).toBe(60000);
      expect(config.ignoreRules).toEqual([]);
      expect(config.maxPages).toBe(10);
      expect(config.maxDepth).toBe(2);
    });
  });
});
