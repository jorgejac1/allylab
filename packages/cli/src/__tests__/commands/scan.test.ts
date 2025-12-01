import { beforeEach, describe, expect, it, vi, afterAll } from "vitest";

const mockFetchScan = vi.fn();
const mockFormatResults = vi.fn(() => "formatted");
const mockFormatScore = vi.fn(() => "score");
const mockWriteOutput = vi.fn();

const spinner = { text: "", succeed: vi.fn(), fail: vi.fn() };
const mockOra = vi.fn(() => ({ start: vi.fn(() => spinner) }));

const exitCalls: Array<string | number | null | undefined> = [];
const mockExit = vi.spyOn(process, "exit").mockImplementation((code?: string | number | null) => {
  exitCalls.push(code ?? undefined);
  return undefined as never;
});

vi.mock("../../utils/api.js", () => ({ fetchScan: mockFetchScan }));
vi.mock("../../utils/output.js", () => ({
  formatResults: mockFormatResults,
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

describe("cli/scan command", () => {
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
    const { scanCommand } = await import("../../commands/scan.js");
    if (!capturedAction) {
      throw new Error("Action not captured");
    }
    // ensure chain to silence lint
    void scanCommand;
    return capturedAction!;
  };

  it("normalizes URL and prints pretty results", async () => {
    const action = await loadCommand();
    mockFetchScan.mockResolvedValueOnce({
      score: 80,
      totalIssues: 0,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
      findings: [],
    });

    await action("example.com", { standard: "wcag21aa", viewport: "desktop", format: "pretty", apiUrl: "http://api" });

    expect(mockFetchScan).toHaveBeenCalledWith("http://api", "https://example.com", "wcag21aa", "desktop");
    expect(mockFormatResults).toHaveBeenCalled();
    expect(spinner.succeed).toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
  });

  it("writes JSON output when requested", async () => {
    const action = await loadCommand();
    mockFetchScan.mockResolvedValueOnce({ score: 70, totalIssues: 1, critical: 0, serious: 0, moderate: 0, minor: 1 });

    await action("https://example.com", { standard: "wcag21aa", viewport: "desktop", format: "json", output: "out.json", apiUrl: "http://api" });

    expect(mockWriteOutput).toHaveBeenCalledWith("out.json", expect.stringContaining('"score": 70'));
  });

  it("prints JSON to console when no output file provided", async () => {
    const action = await loadCommand();
    mockFetchScan.mockResolvedValueOnce({ score: 70, totalIssues: 1, critical: 0, serious: 0, moderate: 0, minor: 1 });
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await action("https://example.com", { standard: "wcag21aa", viewport: "desktop", format: "json", apiUrl: "http://api" });

    expect(mockWriteOutput).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"score": 70'));
    consoleSpy.mockRestore();
  });

  it("writes pretty output to file when output specified", async () => {
    const action = await loadCommand();
    mockFetchScan.mockResolvedValueOnce({
      score: 80,
      totalIssues: 0,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
      findings: [],
    });
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await action("https://example.com", {
      standard: "wcag21aa",
      viewport: "desktop",
      format: "pretty",
      apiUrl: "http://api",
      output: "out.json",
    });

    expect(mockWriteOutput).toHaveBeenCalledWith("out.json", expect.stringContaining('"score": 80'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("✓ Results written to out.json"));
    consoleSpy.mockRestore();
  });

  it("prints summary format", async () => {
    const action = await loadCommand();
    mockFetchScan.mockResolvedValueOnce({ score: 55, totalIssues: 2, critical: 1, serious: 0, moderate: 1, minor: 0 });

    await action("https://example.com", { standard: "wcag21aa", viewport: "desktop", format: "summary", apiUrl: "http://api" });

    expect(mockFormatScore).toHaveBeenCalledWith(55);
  });

  it("exits with code 2 for invalid failOn", async () => {
    const action = await loadCommand();
    mockFetchScan.mockResolvedValueOnce({ score: 80, totalIssues: 0, critical: 0, serious: 0, moderate: 0, minor: 0 });

    await action("https://example.com", { standard: "wcag21aa", viewport: "desktop", format: "pretty", apiUrl: "http://api", failOn: "bad" });
    expect(mockExit).toHaveBeenCalledWith(2);
  });

  it("exits with code 1 when failOn threshold hit", async () => {
    const action = await loadCommand();
    mockFetchScan.mockResolvedValueOnce({ score: 80, totalIssues: 1, critical: 0, serious: 1, moderate: 0, minor: 0 });

    await action("https://example.com", { standard: "wcag21aa", viewport: "desktop", format: "pretty", apiUrl: "http://api", failOn: "serious" });
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("exits with code 1 when failOn moderate counts serious/critical", async () => {
    const action = await loadCommand();
    mockFetchScan.mockResolvedValueOnce({ score: 80, totalIssues: 3, critical: 1, serious: 1, moderate: 1, minor: 0 });

    await action("https://example.com", { standard: "wcag21aa", viewport: "desktop", format: "pretty", apiUrl: "http://api", failOn: "moderate" });
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("counts only critical when failOn moderate and other severities zero", async () => {
    const action = await loadCommand();
    mockFetchScan.mockResolvedValueOnce({ score: 80, totalIssues: 1, critical: 1, serious: 0, moderate: 0, minor: 0 });

    await action("https://example.com", { standard: "wcag21aa", viewport: "desktop", format: "pretty", apiUrl: "http://api", failOn: "moderate" });
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("exits with code 1 when failOn critical counts only critical issues", async () => {
    const action = await loadCommand();
    mockFetchScan.mockResolvedValueOnce({ score: 80, totalIssues: 1, critical: 1, serious: 0, moderate: 0, minor: 0 });

    await action("https://example.com", { standard: "wcag21aa", viewport: "desktop", format: "pretty", apiUrl: "http://api", failOn: "critical" });
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("skips critical branch when indexOf returns value above range (else coverage)", async () => {
    const action = await loadCommand();
    mockFetchScan.mockResolvedValueOnce({ score: 80, totalIssues: 0, critical: 1, serious: 0, moderate: 0, minor: 0 });
    const originalIndexOf = Array.prototype.indexOf;
    Array.prototype.indexOf = function (...args: unknown[]) {
      if (Array.isArray(this) && this[0] === "minor" && args[0] === "critical") {
        return 4;
      }
      const typedArgs = args as Parameters<typeof Array.prototype.indexOf>;
      return originalIndexOf.apply(this, typedArgs);
    };

    await action("https://example.com", { standard: "wcag21aa", viewport: "desktop", format: "pretty", apiUrl: "http://api", failOn: "critical" });
    expect(mockExit).not.toHaveBeenCalledWith(1);

    Array.prototype.indexOf = originalIndexOf;
  });

  it("counts critical issues when failOn is minor (lowest threshold)", async () => {
    const action = await loadCommand();
    mockFetchScan.mockResolvedValueOnce({ score: 80, totalIssues: 1, critical: 1, serious: 0, moderate: 0, minor: 0 });

    await action("https://example.com", { standard: "wcag21aa", viewport: "desktop", format: "pretty", apiUrl: "http://api", failOn: "minor" });
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("handles fetch errors and exits code 1", async () => {
    const action = await loadCommand();
    mockFetchScan.mockRejectedValueOnce("fail");

    await action("https://example.com", { standard: "wcag21aa", viewport: "desktop", format: "pretty", apiUrl: "http://api" });
    expect(spinner.fail).toHaveBeenCalledWith("Scan failed");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("reports Error message on fetch failure", async () => {
    const action = await loadCommand();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetchScan.mockRejectedValueOnce(new Error("boom"));

    await action("https://example.com", { standard: "wcag21aa", viewport: "desktop", format: "pretty", apiUrl: "http://api" });

    expect(spinner.fail).toHaveBeenCalledWith("Scan failed");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("boom"));
    expect(mockExit).toHaveBeenCalledWith(1);
    consoleSpy.mockRestore();
  });
});
