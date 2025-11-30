import { describe, expect, it, vi, beforeEach } from "vitest";

let mockPageHeight = 297;
type MockPdfInstance = {
  instances: Array<{
    save: ReturnType<typeof vi.fn>;
    addPage: ReturnType<typeof vi.fn>;
    text: ReturnType<typeof vi.fn>;
  }>;
};

vi.mock("jspdf", () => {
  class MockPDF {
    static instances: MockPDF[] = [];
    internal = {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => mockPageHeight,
      },
      pages: [null],
    };
    addPage = vi.fn(() => {
      this.internal.pages.push(null);
    });
    setPage = vi.fn();
    setFontSize = vi.fn();
    setFont = vi.fn();
    setTextColor = vi.fn();
    setFillColor = vi.fn();
    rect = vi.fn();
    text = vi.fn();
    splitTextToSize = vi.fn().mockImplementation((t: string) => [t]);
    save = vi.fn();

    constructor() {
      MockPDF.instances.push(this);
    }
  }
  return { default: MockPDF };
});

import { generateTrendsPDF, generateExecutiveReportPDF } from "../../utils/pdfExport";
import type { SavedScan } from "../../types";
import type { PDFDashboardData, SiteStats, TopIssue } from "../../types/executive";

const baseScan: SavedScan = {
  id: "s1",
  url: "https://example.com",
  timestamp: "2024-01-01T00:00:00Z",
  score: 90,
  totalIssues: 1,
  critical: 1,
  serious: 0,
  moderate: 0,
  minor: 0,
  findings: [],
  scanDuration: 1,
};

describe("utils/pdfExport", () => {
  beforeEach(async () => {
    const mod = await import("jspdf");
    (mod.default as unknown as MockPdfInstance).instances = [];
    vi.clearAllMocks();
  });

  it("throws when no scans provided for trends PDF", async () => {
    await expect(generateTrendsPDF({ scans: [], settings: { includeScoreTrend: true, includeIssueTrend: true, includeDistribution: true, includeStats: true, includeSummary: true, companyName: "", logoUrl: "" }, scoreGoal: 90 })).rejects.toThrow("No scan data to export");
  });

  it("generates trends PDF and saves file", async () => {
    await generateTrendsPDF({
      scans: [
        { ...baseScan, score: 80, timestamp: "2024-01-02T00:00:00Z" },
        { ...baseScan, score: 85, timestamp: "2024-01-03T00:00:00Z" },
      ],
      settings: { includeScoreTrend: true, includeIssueTrend: true, includeDistribution: true, includeStats: true, includeSummary: true, companyName: "Acme", logoUrl: "" },
      scoreGoal: 95,
    });
    const mod = (await import("jspdf")).default as unknown as MockPdfInstance;
    expect(mod.instances[0].save).toHaveBeenCalled();
  });

  it("adds pages and re-renders headers when height is limited", async () => {
    mockPageHeight = 40;
    await generateTrendsPDF({
      scans: [
        { ...baseScan, score: 80, timestamp: "2024-01-02T00:00:00Z" },
        { ...baseScan, score: 85, timestamp: "2024-01-03T00:00:00Z" },
      ],
      settings: { includeScoreTrend: true, includeIssueTrend: true, includeDistribution: true, includeStats: true, includeSummary: true, companyName: "Acme", logoUrl: "" },
      scoreGoal: 95,
    });
    const mod = (await import("jspdf")).default as unknown as MockPdfInstance;
    expect(mod.instances[0].addPage).toHaveBeenCalled();
    mockPageHeight = 297;
  });

  it("skips score trend when setting disabled", async () => {
    await generateTrendsPDF({
      scans: [
        { ...baseScan, score: 80, timestamp: "2024-01-02T00:00:00Z" },
        { ...baseScan, score: 85, timestamp: "2024-01-03T00:00:00Z" },
      ],
      settings: { includeScoreTrend: false, includeIssueTrend: true, includeDistribution: true, includeStats: true, includeSummary: true, companyName: "Acme", logoUrl: "" },
      scoreGoal: 95,
    });
    const mod = (await import("jspdf")).default as unknown as MockPdfInstance;
    // When score trend disabled, it should still save without adding extra pages for that section
    expect(mod.instances[0].save).toHaveBeenCalled();
  });

  it("renders issue distribution when enabled", async () => {
    await generateTrendsPDF({
      scans: [
        { ...baseScan, score: 80, timestamp: "2024-01-02T00:00:00Z", totalIssues: 2, critical: 1, serious: 1 },
        { ...baseScan, score: 85, timestamp: "2024-01-03T00:00:00Z", totalIssues: 4, critical: 2, serious: 1, moderate: 1 },
      ],
      settings: { includeScoreTrend: false, includeIssueTrend: false, includeDistribution: true, includeStats: false, includeSummary: false, companyName: "Acme", logoUrl: "" },
      scoreGoal: 95,
    });
    const mod = (await import("jspdf")).default as unknown as MockPdfInstance;
    const texts = mod.instances[0].text;
    expect(texts).toHaveBeenCalledWith("Current Issue Distribution", expect.any(Number), expect.any(Number));
  });

  it("skips issue distribution when disabled", async () => {
    await generateTrendsPDF({
      scans: [
        { ...baseScan, score: 80, timestamp: "2024-01-02T00:00:00Z", totalIssues: 2, critical: 1, serious: 1 },
        { ...baseScan, score: 85, timestamp: "2024-01-03T00:00:00Z", totalIssues: 4, critical: 2, serious: 1, moderate: 1 },
      ],
      settings: { includeScoreTrend: false, includeIssueTrend: false, includeDistribution: false, includeStats: true, includeSummary: true, companyName: "Acme", logoUrl: "" },
      scoreGoal: 95,
    });
    const mod = (await import("jspdf")).default as unknown as MockPdfInstance;
    const textCalls = (mod.instances[0].text as { mock: { calls: unknown[][] } }).mock.calls;
    expect(textCalls.some(call => call[0] === "Current Issue Distribution")).toBe(false);
  });

  it("falls back to total 1 when latest.totalIssues is 0", async () => {
    await generateTrendsPDF({
      scans: [
        { ...baseScan, score: 80, timestamp: "2024-01-02T00:00:00Z", totalIssues: 0, critical: 0, serious: 0, moderate: 0, minor: 0 },
      ],
      settings: { includeScoreTrend: false, includeIssueTrend: false, includeDistribution: true, includeStats: false, includeSummary: false, companyName: "Acme", logoUrl: "" },
      scoreGoal: 95,
    });
    const mod = (await import("jspdf")).default as unknown as MockPdfInstance;
    const textCalls = (mod.instances[0].text as { mock: { calls: unknown[][] } }).mock.calls;
    expect(textCalls.some(call => call[0] === "Current Issue Distribution")).toBe(true);
  });

  it("renders summary text with decreased score and unmet goal", async () => {
    await generateTrendsPDF({
      scans: [
        { ...baseScan, score: 90, totalIssues: 5, timestamp: "2024-01-01T00:00:00Z" },
        { ...baseScan, score: 80, totalIssues: 7, timestamp: "2024-01-02T00:00:00Z" },
      ],
      settings: { includeScoreTrend: false, includeIssueTrend: false, includeDistribution: false, includeStats: false, includeSummary: true, companyName: "Acme", logoUrl: "" },
      scoreGoal: 95,
    });
    const mod = (await import("jspdf")).default as unknown as MockPdfInstance;
    const textCalls = (mod.instances[0].text as { mock: { calls: unknown[][] } }).mock.calls;
    const lines = textCalls.map(call => call[0] as string);
    expect(lines.some(l => l.includes("decreased"))).toBe(true);
    expect(lines.some(l => l.includes("more points needed"))).toBe(true);
  });

  it("renders summary when goal reached", async () => {
    await generateTrendsPDF({
      scans: [
        { ...baseScan, score: 90, totalIssues: 5, timestamp: "2024-01-01T00:00:00Z" },
        { ...baseScan, score: 100, totalIssues: 2, timestamp: "2024-01-02T00:00:00Z" },
      ],
      settings: { includeScoreTrend: false, includeIssueTrend: false, includeDistribution: false, includeStats: false, includeSummary: true, companyName: "Acme", logoUrl: "" },
      scoreGoal: 95,
    });
    const mod = (await import("jspdf")).default as unknown as MockPdfInstance;
    const textCalls = (mod.instances[0].text as { mock: { calls: unknown[][] } }).mock.calls;
    const lines = textCalls.map(call => call[0] as string);
    expect(lines.some(l => l.includes("goal has been reached"))).toBe(true);
  });

  it("adds pages in executive report when space is limited", async () => {
    mockPageHeight = 40;
    const data: PDFDashboardData = {
      averageScore: 80,
      totalIssues: 100,
      sitesMonitored: 20,
      severity: { critical: 10, serious: 20, moderate: 30, minor: 40 },
      overallTrend: [70, 75, 80],
      criticalTrend: [5, 4, 3],
    };
    const sites: SiteStats[] = Array.from({ length: 10 }).map((_, i) => ({
      url: `https://example.com/${i}`,
      domain: `example${i}.com`,
      latestScore: 80 - i,
      latestIssues: 10 + i,
      critical: i,
      serious: i + 1,
      moderate: i + 2,
      minor: i + 3,
      scanCount: 5,
      trend: [1, 2, 3],
      lastScanned: "2024-01-01T00:00:00Z",
      scoreChange: -i,
    }));
    const topIssues: TopIssue[] = Array.from({ length: 6 }).map((_, i) => ({
      ruleId: `r${i}`,
      title: `Issue ${i}`,
      count: 5 + i,
      severity: "critical",
      affectedSites: 2,
    }));

    await generateExecutiveReportPDF(data, sites, topIssues, {
      companyName: "Acme",
      title: "Exec Report",
      dateRange: "Jan 2024",
    });

    const mod = (await import("jspdf")).default as unknown as MockPdfInstance;
    expect(mod.instances[0].addPage).toHaveBeenCalled();
    mockPageHeight = 297;
  });

  it("generates executive report PDF and saves file", async () => {
    const data: PDFDashboardData = {
      averageScore: 80,
      totalIssues: 100,
      sitesMonitored: 2,
      severity: { critical: 10, serious: 20, moderate: 30, minor: 40 },
      overallTrend: [70, 75, 80],
      criticalTrend: [5, 4, 3],
    };
    const sites: SiteStats[] = [
      { url: "https://example.com", domain: "example.com", latestScore: 80, latestIssues: 10, critical: 1, serious: 2, moderate: 3, minor: 4, scanCount: 5, trend: [1, 2, 3], lastScanned: "2024-01-01T00:00:00Z", scoreChange: 5 },
    ];
    const topIssues: TopIssue[] = [
      { ruleId: "r1", title: "Issue", count: 5, severity: "critical", affectedSites: 2 },
    ];

    await generateExecutiveReportPDF(data, sites, topIssues, {
      companyName: "Acme",
      title: "Exec Report",
      dateRange: "Jan 2024",
    });

    const mod = (await import("jspdf")).default as unknown as MockPdfInstance;
    const pdf = mod.instances[0];
    expect(pdf.save).toHaveBeenCalled();
    expect(pdf.text).toHaveBeenCalledWith("Exec Report", expect.any(Number), expect.any(Number));
  });

  it("handles zero trend change and negative trend label", async () => {
    const data: PDFDashboardData = {
      averageScore: 80,
      totalIssues: 100,
      sitesMonitored: 2,
      severity: { critical: 10, serious: 20, moderate: 30, minor: 40 },
      overallTrend: [75],
      criticalTrend: [5],
    };
    const sites: SiteStats[] = [];
    const topIssues: TopIssue[] = [];

    await generateExecutiveReportPDF(data, sites, topIssues, {
      companyName: "Acme",
      title: "Exec Report",
      dateRange: "Jan 2024",
    });

    const mod = (await import("jspdf")).default as unknown as MockPdfInstance & {
      instances: Array<{ text: { mock: { calls: unknown[][] } } }>;
    };
    const calls = mod.instances[0].text.mock.calls.map(call => call[0] as string);
    expect(calls.some(c => c.includes("Score Trend"))).toBe(true);
  });

  it("renders score change without plus when negative in stats", async () => {
    await generateTrendsPDF({
      scans: [
        { ...baseScan, score: 90, timestamp: "2024-01-01T00:00:00Z" },
        { ...baseScan, score: 80, timestamp: "2024-01-02T00:00:00Z" },
      ],
      settings: { includeScoreTrend: false, includeIssueTrend: false, includeDistribution: false, includeStats: true, includeSummary: false, companyName: "Acme", logoUrl: "" },
      scoreGoal: 95,
    });
    const mod = (await import("jspdf")).default as unknown as MockPdfInstance & {
      instances: Array<{ text: { mock: { calls: unknown[][] } } }>;
    };
    const calls = mod.instances[0].text.mock.calls.map(call => call[0] as string);
    expect(calls.some(c => c.includes("Score Change"))).toBe(true);
    expect(calls.some(c => c.includes("-10"))).toBe(true);
    expect(calls.every(c => !c.includes("+-10"))).toBe(true);
  });

  it("uses default company name when none provided", async () => {
    await generateTrendsPDF({
      scans: [
        { ...baseScan, score: 80, timestamp: "2024-01-02T00:00:00Z" },
        { ...baseScan, score: 85, timestamp: "2024-01-03T00:00:00Z" },
      ],
      settings: { includeScoreTrend: true, includeIssueTrend: true, includeDistribution: true, includeStats: true, includeSummary: true, companyName: "", logoUrl: "" },
      scoreGoal: 95,
    });
    const mod = (await import("jspdf")).default as unknown as MockPdfInstance & {
      instances: Array<{ text: { mock: { calls: unknown[][] } } }>;
    };
    const calls = mod.instances[0].text.mock.calls.map(call => call[0] as string);
    expect(calls.some(c => c === "AllyLab")).toBe(true);
  });

  it("renders score trend with negative change (no plus prefix)", async () => {
    const data: PDFDashboardData = {
      averageScore: 70,
      totalIssues: 50,
      sitesMonitored: 1,
      severity: { critical: 1, serious: 2, moderate: 3, minor: 4 },
      overallTrend: [90, 80],
      criticalTrend: [5, 4],
    };
    await generateExecutiveReportPDF(data, [], [], {
      companyName: "Acme",
      title: "Exec Report",
      dateRange: "Jan 2024",
    });
    const mod = (await import("jspdf")).default as unknown as MockPdfInstance & {
      instances: Array<{ text: { mock: { calls: unknown[][] } } }>;
    };
    const calls = mod.instances[0].text.mock.calls.map(call => call[0] as string);
    expect(calls.some(c => c.includes("Score Trend"))).toBe(true);
    expect(calls.some(c => c.includes("-10"))).toBe(true);
  });

  it("truncates long text and leaves short text intact", async () => {
    // exercise truncateText via executive report content
    await generateExecutiveReportPDF(
      {
        averageScore: 80,
        totalIssues: 0,
        sitesMonitored: 0,
        severity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
        overallTrend: [],
        criticalTrend: [],
      },
      [{ url: "https://example.com", domain: "short.com", latestScore: 0, latestIssues: 0, critical: 0, serious: 0, moderate: 0, minor: 0, scanCount: 0, trend: [], lastScanned: "", scoreChange: 0 }],
      [{ ruleId: "r1", title: "A very very long issue title that should truncate", count: 1, severity: "critical", affectedSites: 1 }],
      { companyName: "Acme", title: "Exec", dateRange: "2024" }
    );
    const mod = (await import("jspdf")).default as unknown as MockPdfInstance & { instances: Array<{ text: { mock: { calls: unknown[][] } } }> };
    const calls = mod.instances[0].text.mock.calls.map(call => call[0] as string);
    expect(calls.some(c => c.includes("..."))).toBe(true);
    expect(calls.some(c => c.includes("short.com"))).toBe(true);
  });

  it("renders score change with plus prefix in stats", async () => {
    const data: PDFDashboardData = {
      averageScore: 80,
      totalIssues: 100,
      sitesMonitored: 2,
      severity: { critical: 10, serious: 20, moderate: 30, minor: 40 },
      overallTrend: [70, 80], // +10
      criticalTrend: [5, 4, 3],
    };
    await generateExecutiveReportPDF(data, [], [], {
      companyName: "Acme",
      title: "Exec Report",
      dateRange: "Jan 2024",
    });
    const mod = (await import("jspdf")).default as unknown as MockPdfInstance & {
      instances: Array<{ text: { mock: { calls: unknown[][] } } }>;
    };
    const calls = mod.instances[0].text.mock.calls.map(call => call[0] as string);
    expect(calls.some(c => c.includes("+10"))).toBe(true);
  });

  it("falls back to black color when hex parsing fails", async () => {
    vi.resetModules();
    vi.doMock("../../utils/constants", () => ({
      SEVERITY_COLORS: { critical: "bad", serious: "bad", moderate: "bad", minor: "bad" },
      __esModule: true,
    }));
    const { generateTrendsPDF } = await import("../../utils/pdfExport");
    await generateTrendsPDF({
      scans: [{ ...baseScan, totalIssues: 1, critical: 0, serious: 0, moderate: 0, minor: 0 }],
      settings: { includeScoreTrend: false, includeIssueTrend: false, includeDistribution: true, includeStats: false, includeSummary: false, companyName: "Acme", logoUrl: "" },
      scoreGoal: 90,
    });
    const mod = (await import("jspdf")).default as unknown as MockPdfInstance & {
      instances: Array<{ setFillColor: { mock: { calls: unknown[][] } } }>;
    };
    expect(mod.instances[0].setFillColor.mock.calls.some(call => call[0] === 0 && call[1] === 0 && call[2] === 0)).toBe(true);
    vi.resetModules();
  });
});
