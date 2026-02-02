import { describe, expect, it } from "vitest";
import { toHtml, formatHtml, siteToHtml } from "../../utils/html.js";
import type { ScanResult, SiteScanResult } from "../../utils/api.js";

describe("utils/html", () => {
  const mockScanResult: ScanResult = {
    url: "https://example.com",
    timestamp: "2024-01-15T10:30:00.000Z",
    score: 75,
    totalIssues: 3,
    critical: 0,
    serious: 1,
    moderate: 1,
    minor: 1,
    scanTime: 1234,
    findings: [
      {
        ruleId: "color-contrast",
        ruleTitle: "Elements must have sufficient color contrast",
        description: "Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds",
        impact: "serious",
        wcagTags: ["wcag2aa", "wcag143"],
        selector: ".low-contrast-text",
        html: '<span class="low-contrast-text">Hard to read</span>',
        helpUrl: "https://dequeuniversity.com/rules/axe/4.4/color-contrast",
      },
    ],
  };

  describe("toHtml", () => {
    it("generates valid HTML document", () => {
      const html = toHtml(mockScanResult);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html lang=\"en\">");
      expect(html).toContain("</html>");
    });

    it("includes page title with URL", () => {
      const html = toHtml(mockScanResult);

      expect(html).toContain("<title>Accessibility Report - https://example.com</title>");
    });

    it("includes scanned URL", () => {
      const html = toHtml(mockScanResult);

      expect(html).toContain("https://example.com");
    });

    it("displays score", () => {
      const html = toHtml(mockScanResult);

      expect(html).toContain("75");
      expect(html).toContain("/100");
    });

    it("displays severity counts", () => {
      const html = toHtml(mockScanResult);

      expect(html).toContain("Critical");
      expect(html).toContain("Serious");
      expect(html).toContain("Moderate");
      expect(html).toContain("Minor");
    });

    it("includes findings section", () => {
      const html = toHtml(mockScanResult);

      expect(html).toContain("Findings");
      expect(html).toContain("color-contrast");
      expect(html).toContain("Elements must have sufficient color contrast");
    });

    it("includes WCAG tags", () => {
      const html = toHtml(mockScanResult);

      expect(html).toContain("wcag2aa");
      expect(html).toContain("wcag143");
    });

    it("includes element HTML snippet", () => {
      const html = toHtml(mockScanResult);

      expect(html).toContain("low-contrast-text");
    });

    it("includes help link", () => {
      const html = toHtml(mockScanResult);

      expect(html).toContain("Learn more about this issue");
      expect(html).toContain("dequeuniversity.com");
    });

    it("includes AllyLab footer", () => {
      const html = toHtml(mockScanResult);

      expect(html).toContain("AllyLab");
    });

    it("shows no-findings message when empty", () => {
      const emptyResult: ScanResult = {
        ...mockScanResult,
        findings: [],
        totalIssues: 0,
      };

      const html = toHtml(emptyResult);

      expect(html).toContain("No accessibility issues found");
    });

    it("escapes HTML in findings", () => {
      const resultWithHtmlContent: ScanResult = {
        ...mockScanResult,
        findings: [
          {
            ...mockScanResult.findings[0],
            html: '<script>alert("xss")</script>',
            ruleTitle: "Test <script> injection",
          },
        ],
      };

      const html = toHtml(resultWithHtmlContent);

      expect(html).not.toContain('<script>alert("xss")</script>');
      expect(html).toContain("&lt;script&gt;");
    });

    it("includes CSS styles", () => {
      const html = toHtml(mockScanResult);

      expect(html).toContain("<style>");
      expect(html).toContain("</style>");
    });
  });

  describe("formatHtml", () => {
    it("returns HTML string", () => {
      const result = formatHtml(mockScanResult);

      expect(typeof result).toBe("string");
      expect(result).toContain("<!DOCTYPE html>");
    });
  });

  describe("siteToHtml", () => {
    const mockSiteScanResult: SiteScanResult = {
      pagesScanned: 5,
      averageScore: 80,
      totalIssues: 10,
      critical: 1,
      serious: 3,
      moderate: 4,
      minor: 2,
      results: [
        {
          url: "https://example.com/",
          score: 85,
          totalIssues: 2,
          critical: 0,
          serious: 1,
          moderate: 1,
          minor: 0,
          scanTime: 1000,
        },
        {
          url: "https://example.com/about",
          score: 75,
          totalIssues: 3,
          critical: 1,
          serious: 1,
          moderate: 0,
          minor: 1,
          scanTime: 800,
        },
      ],
    };

    it("generates valid HTML document", () => {
      const html = siteToHtml(mockSiteScanResult);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Site Accessibility Report");
    });

    it("displays average score", () => {
      const html = siteToHtml(mockSiteScanResult);

      expect(html).toContain("80");
      expect(html).toContain("Average Score");
    });

    it("displays pages scanned count", () => {
      const html = siteToHtml(mockSiteScanResult);

      expect(html).toContain("5");
      expect(html).toContain("Pages Scanned");
    });

    it("includes page results table", () => {
      const html = siteToHtml(mockSiteScanResult);

      expect(html).toContain("<table");
      expect(html).toContain("/about");
    });

    it("displays severity totals", () => {
      const html = siteToHtml(mockSiteScanResult);

      expect(html).toContain("Critical");
      expect(html).toContain("Serious");
      expect(html).toContain("Moderate");
      expect(html).toContain("Minor");
    });
  });
});
