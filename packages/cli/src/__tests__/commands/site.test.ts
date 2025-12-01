import { beforeEach, describe, expect, it, vi, afterAll } from "vitest";

const mockFetchSiteScan = vi.fn();
const mockFormatSiteResults = vi.fn(() => "formatted");
const mockFormatScore = vi.fn(() => "score");
const mockWriteOutput = vi.fn();

const spinner = { text: "", succeed: vi.fn(), fail: vi.fn() };
const mockOra = vi.fn(() => ({ start: vi.fn(() => spinner) }));

const exitCalls: Array<string | number | null | undefined> = [];
const mockExit = vi.spyOn(process, "exit").mockImplementation((code?: string | number | null) => {
  exitCalls.push(code ?? undefined);
  return undefined as never;
});

vi.mock("../../utils/api.js", () => ({ fetchSiteScan: mockFetchSiteScan }));
vi.mock("../../utils/output.js", () => ({
  formatSiteResults: mockFormatSiteResults,
  formatScore: mockFormatScore,
}));
vi.mock("../../utils/file.js", () => ({ writeOutput: mockWriteOutput }));
vi.mock("ora", () => ({ default: mockOra, __esModule: true }));
vi.mock("chalk", () => {
  const id = (s: string) => s;
  const color = Object.assign((s: string) => s, { bold: (s: string) => s });
  return {
    default: Object.assign(id, {
      bold: Object.assign(id, { blue: color, red: color, green: color }),
      dim: color,
      cyan: color,
      yellow: color,
      red: color,
      green: color,
      hex: () => color,
    }),
    __esModule: true,
  };
});

describe("cli/site command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exitCalls.length = 0;
  });

  afterAll(() => {
    mockExit.mockRestore();
  });

  const loadCommand = async () => {
    vi.resetModules();
    let capturedAction: ((url: string, opts: Record<string, unknown>) => Promise<void>) | undefined;
    vi.doMock("commander", () => {
      class MockCommand {
        description() { return this; }
        argument() { return this; }
        option() { return this; }
        action(fn: (url: string, opts: Record<string, unknown>) => Promise<void>) {
          capturedAction = fn;
          return this;
        }
      }
      return { Command: MockCommand };
    });
    const { siteCommand } = await import("../../commands/site.js");
    if (!capturedAction) throw new Error("Action not captured");
    void siteCommand;
    return capturedAction!;
  };

  it("normalizes URL and prints pretty results", async () => {
    const action = await loadCommand();
    mockFetchSiteScan.mockResolvedValueOnce({
      pagesScanned: 1,
      averageScore: 90,
      totalIssues: 0,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
      results: [],
    });

    await action("example.com", { maxPages: "5", maxDepth: "2", standard: "wcag21aa", format: "pretty", apiUrl: "http://api" });

    expect(mockFetchSiteScan).toHaveBeenCalledWith(
      "http://api",
      "https://example.com",
      5,
      2,
      "wcag21aa",
      expect.any(Function)
    );
    expect(mockFormatSiteResults).toHaveBeenCalled();
    expect(spinner.succeed).toHaveBeenCalled();
  });

  it("writes JSON output when requested", async () => {
    const action = await loadCommand();
    mockFetchSiteScan.mockResolvedValueOnce({
      pagesScanned: 1,
      averageScore: 80,
      totalIssues: 1,
      critical: 0,
      serious: 1,
      moderate: 0,
      minor: 0,
      results: [],
    });

    await action("https://example.com", { maxPages: "5", maxDepth: "2", standard: "wcag21aa", format: "json", output: "out.json", apiUrl: "http://api" });

    expect(mockWriteOutput).toHaveBeenCalledWith("out.json", expect.stringContaining('"pagesScanned": 1'));
  });

  it("prints JSON to console when no output file provided", async () => {
    const action = await loadCommand();
    mockFetchSiteScan.mockResolvedValueOnce({
      pagesScanned: 1,
      averageScore: 80,
      totalIssues: 1,
      critical: 0,
      serious: 1,
      moderate: 0,
      minor: 0,
      results: [],
    });
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await action("https://example.com", { maxPages: "5", maxDepth: "2", standard: "wcag21aa", format: "json", apiUrl: "http://api" });

    expect(mockWriteOutput).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"pagesScanned": 1'));
    consoleSpy.mockRestore();
  });

  it("writes pretty site output to file when output specified", async () => {
    const action = await loadCommand();
    mockFetchSiteScan.mockResolvedValueOnce({
      pagesScanned: 1,
      averageScore: 90,
      totalIssues: 0,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
      results: [],
    });
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await action("https://example.com", {
      maxPages: "5",
      maxDepth: "2",
      standard: "wcag21aa",
      format: "pretty",
      apiUrl: "http://api",
      output: "out.json",
    });

    expect(mockWriteOutput).toHaveBeenCalledWith("out.json", expect.stringContaining('"pagesScanned": 1'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("✓ Results written to out.json"));
    consoleSpy.mockRestore();
  });

  it("prints summary format", async () => {
    const action = await loadCommand();
    mockFetchSiteScan.mockResolvedValueOnce({
      pagesScanned: 2,
      averageScore: 55,
      totalIssues: 2,
      critical: 1,
      serious: 0,
      moderate: 1,
      minor: 0,
      results: [],
    });

    await action("https://example.com", { maxPages: "5", maxDepth: "2", standard: "wcag21aa", format: "summary", apiUrl: "http://api" });

    expect(mockFormatScore).toHaveBeenCalledWith(55);
  });

  it("updates spinner text for crawl and page events", async () => {
    const action = await loadCommand();
    let handler: ((event: { type: string; data: Record<string, unknown> }) => void) | undefined;
    mockFetchSiteScan.mockImplementationOnce(async (_api, _url, _maxPages, _maxDepth, _standard, cb) => {
      handler = cb;
      return {
        pagesScanned: 1,
        averageScore: 80,
        totalIssues: 0,
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0,
        results: [],
      };
    });

    await action("https://example.com", { maxPages: "5", maxDepth: "2", standard: "wcag21aa", format: "pretty", apiUrl: "http://api" });
    expect(handler).toBeDefined();
    handler?.({ type: "crawl-complete", data: { totalFound: 7 } });
    expect(spinner.text).toContain("Found 7 pages");

    handler?.({
      type: "page-start",
      data: { index: 2, total: 3, url: "https://example.com/foo" },
    });
    expect(spinner.text).toContain("2/3");
    expect(spinner.text).toContain("/foo");

    handler?.({ type: "page-complete", data: {} });
    expect(spinner.text).toContain("/foo"); // unchanged
  });

  it("exits with code 2 for invalid failOn", async () => {
    const action = await loadCommand();
    mockFetchSiteScan.mockResolvedValueOnce({
      pagesScanned: 1,
      averageScore: 80,
      totalIssues: 0,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
      results: [],
    });

    await action("https://example.com", { maxPages: "5", maxDepth: "2", standard: "wcag21aa", format: "pretty", apiUrl: "http://api", failOn: "bad" });
    expect(mockExit).toHaveBeenCalledWith(2);
  });

  it("exits with code 1 when failOn threshold hit", async () => {
    const action = await loadCommand();
    mockFetchSiteScan.mockResolvedValueOnce({
      pagesScanned: 1,
      averageScore: 80,
      totalIssues: 1,
      critical: 0,
      serious: 1,
      moderate: 0,
      minor: 0,
      results: [],
    });

    await action("https://example.com", { maxPages: "5", maxDepth: "2", standard: "wcag21aa", format: "pretty", apiUrl: "http://api", failOn: "serious" });
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("skips counting critical when indexOf returns out of range (else coverage)", async () => {
    const action = await loadCommand();
    mockFetchSiteScan.mockResolvedValueOnce({
      pagesScanned: 1,
      averageScore: 90,
      totalIssues: 1,
      critical: 1,
      serious: 0,
      moderate: 0,
      minor: 0,
      results: [],
    });
    const originalIndexOf = Array.prototype.indexOf;
    Array.prototype.indexOf = function (...args: unknown[]) {
      if (Array.isArray(this) && this[0] === "minor" && args[0] === "critical") {
        return 4;
      }
      const typedArgs = args as Parameters<typeof Array.prototype.indexOf>;
      return originalIndexOf.apply(this, typedArgs);
    };

    await action("https://example.com", { maxPages: "5", maxDepth: "2", standard: "wcag21aa", format: "pretty", apiUrl: "http://api", failOn: "critical" });
    expect(mockExit).not.toHaveBeenCalledWith(1);

    Array.prototype.indexOf = originalIndexOf;
  });

  it("handles fetch errors and exits code 1", async () => {
    const action = await loadCommand();
    mockFetchSiteScan.mockRejectedValueOnce(new Error("fail"));

    await action("https://example.com", { maxPages: "5", maxDepth: "2", standard: "wcag21aa", format: "pretty", apiUrl: "http://api" });
    expect(spinner.fail).toHaveBeenCalledWith("Site scan failed");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("reports Unknown error when fetch throws non-Error", async () => {
    const action = await loadCommand();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetchSiteScan.mockRejectedValueOnce("boom");

    await action("https://example.com", { maxPages: "5", maxDepth: "2", standard: "wcag21aa", format: "pretty", apiUrl: "http://api" });

    expect(spinner.fail).toHaveBeenCalledWith("Site scan failed");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Unknown error"));
    expect(mockExit).toHaveBeenCalledWith(1);
    consoleSpy.mockRestore();
  });
});
