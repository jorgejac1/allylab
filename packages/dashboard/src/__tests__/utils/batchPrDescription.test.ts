import { describe, expect, it } from "vitest";
import { generateBatchDescription, generateSmartTitle, generateSmartBranchName } from "../../utils/batchPrDescription";
import type { FindingWithFix } from "../../types/batch-pr";

const baseFix: FindingWithFix = {
  filePath: "src/a.tsx",
  finding: {
    id: "1",
    ruleId: "r1",
    ruleTitle: "Title",
    description: "desc",
    impact: "critical",
    selector: "#a",
    html: "<div>",
    helpUrl: "",
    wcagTags: [],
    status: "new",
    fingerprint: "fp1",
  },
  fix: null,
  isGenerating: false,
  error: null,
};

describe("utils/batchPrDescription", () => {
  describe("generateSmartTitle", () => {
    it("returns generic title for empty fixes", () => {
      expect(generateSmartTitle([])).toBe("♿ Fix accessibility issues");
    });

    it("returns specific title for single rule type", () => {
      const fixes = [
        baseFix,
        { ...baseFix, finding: { ...baseFix.finding, id: "2" } },
      ];
      expect(generateSmartTitle(fixes)).toBe("♿ Fix 2 R1 issues");
    });

    it("returns specific title for single issue", () => {
      const fixes = [baseFix];
      expect(generateSmartTitle(fixes)).toBe("♿ Fix 1 R1 issue");
    });

    it("lists rule names for 2-3 different rule types", () => {
      const fixes = [
        baseFix,
        { ...baseFix, finding: { ...baseFix.finding, id: "2", ruleId: "r2" } },
      ];
      const title = generateSmartTitle(fixes);
      expect(title).toContain("♿ Fix 2 accessibility issues");
      expect(title).toContain("R1");
      expect(title).toContain("R2");
    });

    it("returns generic title for many different rule types", () => {
      const fixes = [
        baseFix,
        { ...baseFix, finding: { ...baseFix.finding, id: "2", ruleId: "r2" } },
        { ...baseFix, finding: { ...baseFix.finding, id: "3", ruleId: "r3" } },
        { ...baseFix, finding: { ...baseFix.finding, id: "4", ruleId: "r4" } },
      ];
      expect(generateSmartTitle(fixes)).toBe("♿ Fix 4 accessibility issues");
    });

    it("uses 'accessibility' as default rule when ruleId is missing", () => {
      const fixes = [
        { ...baseFix, finding: { ...baseFix.finding, ruleId: "" } },
      ];
      expect(generateSmartTitle(fixes)).toBe("♿ Fix 1 Accessibility issue");
    });

    it("formats rule names with ARIA, Alt, and WCAG correctly", () => {
      const fixes = [
        { ...baseFix, finding: { ...baseFix.finding, ruleId: "aria-label-test" } },
      ];
      expect(generateSmartTitle(fixes)).toContain("ARIA");
    });
  });

  describe("generateSmartBranchName", () => {
    it("includes rule name for single rule type", () => {
      const fixes = [baseFix, { ...baseFix, finding: { ...baseFix.finding, id: "2" } }];
      const branchName = generateSmartBranchName(fixes);
      expect(branchName).toMatch(/^fix\/a11y-batch-2-r1-\w+$/);
    });

    it("uses generic name for multiple rule types", () => {
      const fixes = [
        baseFix,
        { ...baseFix, finding: { ...baseFix.finding, id: "2", ruleId: "r2" } },
      ];
      const branchName = generateSmartBranchName(fixes);
      expect(branchName).toMatch(/^fix\/a11y-batch-2-issues-\w+$/);
    });

    it("uses 'a11y' as default when ruleId is missing", () => {
      const fixes = [
        { ...baseFix, finding: { ...baseFix.finding, ruleId: "" } },
      ];
      const branchName = generateSmartBranchName(fixes);
      expect(branchName).toMatch(/^fix\/a11y-batch-1-a11y-\w+$/);
    });

    it("sanitizes special characters in rule name", () => {
      const fixes = [
        { ...baseFix, finding: { ...baseFix.finding, ruleId: "rule@#$special" } },
      ];
      const branchName = generateSmartBranchName(fixes);
      expect(branchName).not.toContain("@");
      expect(branchName).not.toContain("#");
      expect(branchName).not.toContain("$");
    });
  });

  describe("generateBatchDescription", () => {
    it("generates markdown summary with counts", () => {
      const markdown = generateBatchDescription([
        baseFix,
        { ...baseFix, finding: { ...baseFix.finding, impact: "serious", ruleId: "r2" }, filePath: "src/b.tsx" },
      ]);
      expect(markdown).toContain("Batch Accessibility Fixes");
      expect(markdown).toContain("Critical | 1");
      expect(markdown).toContain("Serious | 1");
      expect(markdown).toContain("src/a.tsx");
    });

    it("groups fixes by file", () => {
      const fixes = [
        baseFix,
        { ...baseFix, finding: { ...baseFix.finding, id: "2", ruleId: "r2" } },
      ];
      const markdown = generateBatchDescription(fixes);
      expect(markdown).toContain("src/a.tsx");
      expect(markdown).toContain("(2 fixes)");
    });

    it("includes scan URL when provided", () => {
      const markdown = generateBatchDescription([baseFix], "https://scan.example.com");
      expect(markdown).toContain("[View scan results](https://scan.example.com)");
    });

    it("excludes scan URL when not provided", () => {
      const markdown = generateBatchDescription([baseFix]);
      expect(markdown).not.toContain("View scan results");
    });

    it("handles fixes with null fix object", () => {
      const markdown = generateBatchDescription([baseFix]);
      expect(markdown).toContain("N/A");
    });

    it("handles all severity types", () => {
      const fixes = [
        baseFix,
        { ...baseFix, finding: { ...baseFix.finding, id: "2", impact: "serious" as const } },
        { ...baseFix, finding: { ...baseFix.finding, id: "3", impact: "moderate" as const } },
        { ...baseFix, finding: { ...baseFix.finding, id: "4", impact: "minor" as const } },
      ];
      const markdown = generateBatchDescription(fixes);
      expect(markdown).toContain("Critical | 1");
      expect(markdown).toContain("Serious | 1");
      expect(markdown).toContain("Moderate | 1");
      expect(markdown).toContain("Minor | 1");
    });

    it("uses ruleTitle as fallback when ruleId is missing", () => {
      const fixes = [
        { ...baseFix, finding: { ...baseFix.finding, ruleId: "" } },
      ];
      const markdown = generateBatchDescription(fixes);
      expect(markdown).toContain("Title");
    });

    it("handles Unknown file path", () => {
      const fixes = [
        { ...baseFix, filePath: "" },
      ];
      const markdown = generateBatchDescription(fixes);
      expect(markdown).toContain("Unknown");
    });

    it("includes fix code when available", () => {
      const fixes: FindingWithFix[] = [
        {
          ...baseFix,
          fix: {
            id: "fix1",
            findingId: "1",
            ruleId: "r1",
            original: { code: '<img src="test.jpg">', selector: "img", language: "html" },
            fixes: { html: '<img src="test.jpg" alt="Test image">' },
            diff: "",
            explanation: "Added alt text",
            confidence: "high",
            effort: "easy",
            wcagCriteria: [],
            createdAt: new Date().toISOString(),
          },
        },
      ];
      const markdown = generateBatchDescription(fixes);
      expect(markdown).toContain('<img src="test.jpg">');
      expect(markdown).toContain('<img src="test.jpg" alt="Test image">');
    });
  });
});
