import { describe, expect, it } from "vitest";
import { toSarif, formatSarif, siteScanToSarif } from "../../utils/sarif.js";
import type { ScanResult, Finding, SiteScanResult } from "../../utils/api.js";

describe("utils/sarif", () => {
  const mockFinding: Finding = {
    ruleId: "color-contrast",
    ruleTitle: "Elements must have sufficient color contrast",
    description: "Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds",
    impact: "serious",
    wcagTags: ["wcag2aa", "wcag143"],
    selector: ".low-contrast-text",
    html: '<span class="low-contrast-text">Hard to read</span>',
    helpUrl: "https://dequeuniversity.com/rules/axe/4.4/color-contrast",
  };

  const mockScanResult: ScanResult = {
    url: "https://example.com",
    timestamp: "2024-01-15T10:30:00.000Z",
    score: 75,
    totalIssues: 2,
    critical: 0,
    serious: 1,
    moderate: 1,
    minor: 0,
    scanTime: 1234,
    findings: [
      mockFinding,
      {
        ruleId: "image-alt",
        ruleTitle: "Images must have alternate text",
        description: "Ensures <img> elements have alternate text or a role of none or presentation",
        impact: "moderate",
        wcagTags: ["wcag2a", "wcag111"],
        selector: "img.hero-image",
        html: '<img class="hero-image" src="/hero.jpg">',
        helpUrl: "https://dequeuniversity.com/rules/axe/4.4/image-alt",
      },
    ],
  };

  describe("toSarif", () => {
    it("converts scan result to valid SARIF format", () => {
      const sarif = toSarif(mockScanResult);

      expect(sarif.$schema).toContain("sarif-schema-2.1.0.json");
      expect(sarif.version).toBe("2.1.0");
      expect(sarif.runs).toHaveLength(1);
    });

    it("includes tool information", () => {
      const sarif = toSarif(mockScanResult);
      const tool = sarif.runs[0].tool.driver;

      expect(tool.name).toBe("AllyLab");
      expect(tool.version).toBe("1.0.0");
      expect(tool.informationUri).toContain("allylab");
    });

    it("extracts unique rules from findings", () => {
      const sarif = toSarif(mockScanResult);
      const rules = sarif.runs[0].tool.driver.rules;

      expect(rules).toHaveLength(2);
      expect(rules[0].id).toBe("color-contrast");
      expect(rules[1].id).toBe("image-alt");
    });

    it("deduplicates rules when same ruleId appears multiple times", () => {
      const resultWithDuplicates: ScanResult = {
        ...mockScanResult,
        findings: [mockFinding, mockFinding, mockFinding],
      };

      const sarif = toSarif(resultWithDuplicates);
      const rules = sarif.runs[0].tool.driver.rules;

      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe("color-contrast");
    });

    it("creates SARIF results for each finding", () => {
      const sarif = toSarif(mockScanResult);
      const results = sarif.runs[0].results;

      expect(results).toHaveLength(2);
    });

    it("maps severity levels correctly to SARIF levels", () => {
      const resultWithAllSeverities: ScanResult = {
        ...mockScanResult,
        findings: [
          { ...mockFinding, impact: "critical", ruleId: "rule1" },
          { ...mockFinding, impact: "serious", ruleId: "rule2" },
          { ...mockFinding, impact: "moderate", ruleId: "rule3" },
          { ...mockFinding, impact: "minor", ruleId: "rule4" },
        ],
      };

      const sarif = toSarif(resultWithAllSeverities);
      const results = sarif.runs[0].results;

      expect(results[0].level).toBe("error");
      expect(results[1].level).toBe("error");
      expect(results[2].level).toBe("warning");
      expect(results[3].level).toBe("note");
    });

    it("includes location information with selector", () => {
      const sarif = toSarif(mockScanResult);
      const result = sarif.runs[0].results[0];

      expect(result.locations).toHaveLength(1);
      expect(result.locations![0].physicalLocation?.artifactLocation?.uri).toBe("https://example.com");
      expect(result.locations![0].physicalLocation?.region?.snippet?.text).toBe(mockFinding.html);
      expect(result.locations![0].logicalLocations?.[0].name).toBe(".low-contrast-text");
      expect(result.locations![0].logicalLocations?.[0].kind).toBe("element");
    });

    it("includes partial fingerprints for deduplication", () => {
      const sarif = toSarif(mockScanResult);
      const result = sarif.runs[0].results[0];

      expect(result.partialFingerprints).toBeDefined();
      expect(result.partialFingerprints?.primaryLocationLineHash).toBeDefined();
    });

    it("includes rule properties with WCAG tags", () => {
      const sarif = toSarif(mockScanResult);
      const rule = sarif.runs[0].tool.driver.rules[0];

      expect(rule.properties?.tags).toContain("accessibility");
      expect(rule.properties?.tags).toContain("a11y");
      expect(rule.properties?.tags).toContain("wcag2aa");
      expect(rule.properties?.["problem.severity"]).toBe("serious");
    });

    it("includes help information with markdown", () => {
      const sarif = toSarif(mockScanResult);
      const rule = sarif.runs[0].tool.driver.rules[0];

      expect(rule.help?.text).toBe(mockFinding.description);
      expect(rule.help?.markdown).toContain("[Learn more]");
      expect(rule.helpUri).toBe(mockFinding.helpUrl);
    });

    it("includes invocation with timestamp", () => {
      const sarif = toSarif(mockScanResult);
      const invocation = sarif.runs[0].invocations?.[0];

      expect(invocation?.executionSuccessful).toBe(true);
      expect(invocation?.endTimeUtc).toBe(mockScanResult.timestamp);
    });

    it("includes result properties with metadata", () => {
      const sarif = toSarif(mockScanResult);
      const result = sarif.runs[0].results[0];

      expect(result.properties?.impact).toBe("serious");
      expect(result.properties?.wcagTags).toEqual(["wcag2aa", "wcag143"]);
      expect(result.properties?.selector).toBe(".low-contrast-text");
      expect(result.properties?.html).toBe(mockFinding.html);
    });

    it("handles empty findings", () => {
      const emptyResult: ScanResult = {
        ...mockScanResult,
        findings: [],
        totalIssues: 0,
      };

      const sarif = toSarif(emptyResult);

      expect(sarif.runs[0].results).toHaveLength(0);
      expect(sarif.runs[0].tool.driver.rules).toHaveLength(0);
    });
  });

  describe("formatSarif", () => {
    it("returns JSON string", () => {
      const result = formatSarif(mockScanResult);

      expect(typeof result).toBe("string");
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it("produces formatted JSON with indentation", () => {
      const result = formatSarif(mockScanResult);

      expect(result).toContain("\n");
      expect(result).toContain("  ");
    });

    it("contains expected SARIF fields", () => {
      const result = formatSarif(mockScanResult);
      const parsed = JSON.parse(result);

      expect(parsed.$schema).toBeDefined();
      expect(parsed.version).toBe("2.1.0");
      expect(parsed.runs).toBeDefined();
    });
  });

  describe("siteScanToSarif", () => {
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
          url: "https://example.com",
          score: 75,
          totalIssues: 5,
          critical: 0,
          serious: 2,
          moderate: 2,
          minor: 1,
          scanTime: 1000,
        },
      ],
    };

    it("converts site scan result to valid SARIF format", () => {
      const sarif = siteScanToSarif(mockSiteScanResult, [mockFinding]);

      expect(sarif.$schema).toContain("sarif-schema-2.1.0.json");
      expect(sarif.version).toBe("2.1.0");
      expect(sarif.runs).toHaveLength(1);
    });

    it("includes site scan metadata in properties", () => {
      const sarif = siteScanToSarif(mockSiteScanResult, [mockFinding]);
      const run = sarif.runs[0];

      expect(run.properties).toBeDefined();
      expect(run.properties?.pagesScanned).toBe(5);
      expect(run.properties?.averageScore).toBe(80);
      expect(run.properties?.totalIssues).toBe(10);
      expect(run.properties?.critical).toBe(1);
      expect(run.properties?.serious).toBe(3);
      expect(run.properties?.moderate).toBe(4);
      expect(run.properties?.minor).toBe(2);
    });

    it("extracts rules from provided findings", () => {
      const sarif = siteScanToSarif(mockSiteScanResult, [mockFinding]);
      const rules = sarif.runs[0].tool.driver.rules;

      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe("color-contrast");
    });

    it("handles empty findings", () => {
      const sarif = siteScanToSarif(mockSiteScanResult, []);

      expect(sarif.runs[0].results).toHaveLength(0);
      expect(sarif.runs[0].tool.driver.rules).toHaveLength(0);
    });

    it("includes invocation with current timestamp", () => {
      const before = new Date().toISOString();
      const sarif = siteScanToSarif(mockSiteScanResult, []);
      const after = new Date().toISOString();

      const invocation = sarif.runs[0].invocations?.[0];
      expect(invocation?.executionSuccessful).toBe(true);
      expect(invocation?.endTimeUtc).toBeDefined();

      // Timestamp should be between before and after
      const timestamp = invocation?.endTimeUtc || "";
      expect(timestamp >= before || timestamp <= after).toBe(true);
    });
  });
});
