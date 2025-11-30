import { describe, expect, it } from "vitest";
import { analyzePatterns, calculateEfficiencyGain } from "../../utils/patterns";
import type { Finding } from "../../types";

const findings: Finding[] = [
  { id: "1", ruleId: "r1", ruleTitle: "T1", description: "d", impact: "critical", selector: "#a", html: "<div>", helpUrl: "", wcagTags: [], page: "/a" },
  { id: "2", ruleId: "r1", ruleTitle: "T1", description: "d", impact: "critical", selector: "#b", html: "<div>", helpUrl: "", wcagTags: [], page: "/b" },
  { id: "3", ruleId: "r2", ruleTitle: "T2", description: "d", impact: "serious", selector: "#c", html: "<div>", helpUrl: "", wcagTags: [], page: "/c" },
  { id: "4", ruleId: "r2", ruleTitle: "T2", description: "d", impact: "serious", selector: "#c", html: "<div>", helpUrl: "", wcagTags: [] }, // no page
  { id: "5", ruleId: "r3", ruleTitle: "T3", description: "d", impact: "moderate", selector: "#d", html: "<div>", helpUrl: "", wcagTags: [], page: undefined },
];

describe("utils/patterns", () => {
  it("analyzes patterns and determines types/strategies", () => {
    const patterns = analyzePatterns(findings);
    expect(patterns[0].ruleId).toBe("r1");
    expect(["template", "global", "page-specific"]).toContain(patterns[0].type);
    expect(patterns[0].fixStrategy).toBeDefined();
  });

  it("calculates efficiency gain", () => {
    const gain = calculateEfficiencyGain(analyzePatterns(findings));
    expect(gain).toBeGreaterThanOrEqual(0);
  });

  it("classifies template patterns when selectors few and count high", () => {
    const manySame: Finding[] = Array.from({ length: 11 }).map((_, i) => ({
      ...findings[0],
      id: `t${i}`,
      selector: "#template",
    }));
    const patterns = analyzePatterns(manySame);
    expect(patterns[0].type).toBe("template");
    expect(patterns[0].fixStrategy).toContain("template");
  });

  it("calculates zero efficiency when no issues", () => {
    expect(calculateEfficiencyGain([])).toBe(0);
  });

  it("uses default pages count and pluralizes fix strategy", () => {
    const singlePagePattern = analyzePatterns([findings[4]]);
    expect(singlePagePattern[0].pages).toBe(1);
    const multiTemplate = analyzePatterns(Array.from({ length: 12 }).map((_, i) => ({
      ...findings[0],
      id: `m${i}`,
      selector: "#template",
      page: `/page${i % 2}`,
    })));
    expect(multiTemplate[0].fixStrategy).toContain("templates");
  });
});
