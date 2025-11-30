import { describe, expect, it } from "vitest";
import { generateBatchDescription } from "../../utils/batchPrDescription";
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
});
