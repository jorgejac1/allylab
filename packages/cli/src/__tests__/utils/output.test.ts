import { describe, expect, it, vi, beforeAll } from "vitest";

vi.mock("chalk", () => {
  const id = (s: string) => s;
  const color = Object.assign((s: string) => s, { bold: (s: string) => s });
  const hex = () => color;
  return {
    default: Object.assign(id, {
      bold: Object.assign(id, { blue: color, red: color, green: color }),
      dim: color,
      cyan: color,
      yellow: color,
      red: color,
      green: color,
      hex,
    }),
    __esModule: true,
  };
});

describe("utils/output", () => {
  beforeAll(() => {
    vi.resetModules();
  });

  it("formats site paths with truncation and fallback slash", async () => {
    const { formatSiteResults } = await import("../../utils/output.js");
    const output = formatSiteResults({
      averageScore: 50,
      pagesScanned: 2,
      totalIssues: 2,
      critical: 0,
      serious: 1,
      moderate: 1,
      minor: 0,
      results: [
        { url: "https://example.com", score: 70, critical: 0, serious: 0, moderate: 0, minor: 0, totalIssues: 0, scanTime: 10 },
        { url: "https://example.com/this/is/a/very/long/path/that/should/be/truncated", score: 40, critical: 0, serious: 1, moderate: 0, minor: 0, totalIssues: 1, scanTime: 20 },
      ],
    });
    expect(output).toContain("/"); // fallback path
    const longPath = new URL("https://example.com/this/is/a/very/long/path/that/should/be/truncated").pathname;
    const truncated = longPath.slice(0, 27) + "...";
    expect(output).toContain(truncated); // truncated
  });

  it("formats compact score with green threshold for high scores", async () => {
    const { formatSiteResults } = await import("../../utils/output.js");
    const output = formatSiteResults({
      averageScore: 95,
      pagesScanned: 1,
      totalIssues: 0,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
      results: [
        { url: "https://example.com/high", score: 95, critical: 0, serious: 0, moderate: 0, minor: 0, totalIssues: 0, scanTime: 5 },
      ],
    });
    expect(output).toContain(" 95");
  });

  it("falls back to '/' when pathname is empty", async () => {
    const OriginalURL = URL;
    class MockURL {
      pathname: string;
      constructor(url: string) {
        if (url.includes("empty-path")) {
          this.pathname = "";
        } else {
          const real = new OriginalURL(url);
          this.pathname = real.pathname;
        }
      }
    }
    // @ts-expect-error override for test
    globalThis.URL = MockURL;

    const { formatSiteResults } = await import("../../utils/output.js");
    const output = formatSiteResults({
      averageScore: 80,
      pagesScanned: 1,
      totalIssues: 0,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
      results: [
        { url: "https://example.com/empty-path", score: 80, critical: 0, serious: 0, moderate: 0, minor: 0, totalIssues: 0, scanTime: 5 },
      ],
    });

    expect(output).toContain("  /");
    globalThis.URL = OriginalURL;
  });

  it("formats score labels by thresholds", async () => {
    const { formatScore } = await import("../../utils/output.js");
    expect(formatScore(95)).toContain("Excellent");
    expect(formatScore(75)).toContain("Good");
    expect(formatScore(55)).toContain("Needs Work");
    expect(formatScore(10)).toContain("Poor");
  });

  it("formats scan results with top issues and totals", async () => {
    const { formatResults } = await import("../../utils/output.js");
    const output = formatResults({
      score: 80,
      totalIssues: 6,
      critical: 2,
      serious: 2,
      moderate: 1,
      minor: 1,
      scanTime: 1500,
      url: "https://example.com",
      timestamp: "2024-01-01T00:00:00.000Z",
      findings: [
        { impact: "critical", selector: "#a", ruleTitle: "Crit 1", ruleId: "r1", description: "desc", wcagTags: [], html: "<div>", helpUrl: "" },
        { impact: "critical", selector: "#b", ruleTitle: "Crit 2", ruleId: "r2", description: "desc", wcagTags: [], html: "<div>", helpUrl: "" },
        { impact: "serious", selector: "#".padEnd(70, "x"), ruleTitle: "Ser 1", ruleId: "r3", description: "desc", wcagTags: [], html: "<div>", helpUrl: "" },
        { impact: "serious", selector: "#d", ruleTitle: "Ser 2", ruleId: "r4", description: "desc", wcagTags: [], html: "<div>", helpUrl: "" },
        { impact: "serious", selector: "#e", ruleTitle: "Ser 3", ruleId: "r5", description: "desc", wcagTags: [], html: "<div>", helpUrl: "" },
      ],
    });
    expect(output).toContain("🔍 Top Issues");
    expect(output).toContain("... and 1 more issues");
    expect(output).toContain("Critical:");
    expect(output).toContain("Serious:");
    expect(output).toContain("Scan completed in 1.5s");
  });

  it("formats scan results without findings and without extra issues message", async () => {
    const { formatResults } = await import("../../utils/output.js");
    const output = formatResults({
      score: 90,
      totalIssues: 2,
      critical: 1,
      serious: 1,
      moderate: 0,
      minor: 0,
      scanTime: 500,
      url: "https://example.com",
      timestamp: "2024-01-01T00:00:00.000Z",
      findings: [],
    });
    expect(output).not.toContain("Top Issues");
    expect(output).not.toContain("... and");
    expect(output).toContain("Scan completed in 0.5s");
  });

  it("formats scan results with findings but without overflow message when total <=5", async () => {
    const { formatResults } = await import("../../utils/output.js");
    const output = formatResults({
      score: 75,
      totalIssues: 3,
      critical: 1,
      serious: 1,
      moderate: 1,
      minor: 0,
      scanTime: 800,
      url: "https://example.com",
      timestamp: "2024-01-01T00:00:00.000Z",
      findings: [
        { impact: "critical", selector: "#a", ruleTitle: "Crit 1", ruleId: "r1", description: "desc", wcagTags: [], html: "<div>", helpUrl: "" },
        { impact: "serious", selector: "#b", ruleTitle: "Ser 1", ruleId: "r2", description: "desc", wcagTags: [], html: "<div>", helpUrl: "" },
        { impact: "moderate", selector: "#c", ruleTitle: "Mod 1", ruleId: "r3", description: "desc", wcagTags: [], html: "<div>", helpUrl: "" },
      ],
    });
    expect(output).toContain("Top Issues");
    expect(output).not.toContain("... and");
  });

  it("formats site results sorted by score", async () => {
    const { formatSiteResults } = await import("../../utils/output.js");
    const output = formatSiteResults({
      averageScore: 70,
      pagesScanned: 2,
      totalIssues: 3,
      critical: 1,
      serious: 1,
      moderate: 1,
      minor: 0,
      results: [
        { url: "https://example.com/b", score: 80, critical: 0, serious: 0, moderate: 0, minor: 0, totalIssues: 0, scanTime: 10 },
        { url: "https://example.com/a", score: 60, critical: 1, serious: 0, moderate: 0, minor: 0, totalIssues: 1, scanTime: 20 },
      ],
    });
    const firstListing = output.indexOf("/a");
    const secondListing = output.indexOf("/b");
    expect(firstListing).toBeLessThan(secondListing);
    expect(output).toContain("Pages Scanned: 2");
    expect(output).toContain("Total Issues:");
  });

  it("formats errors", async () => {
    const { formatError } = await import("../../utils/output.js");
    expect(formatError("oops")).toContain("❌ Error: oops");
  });
});
