import { describe, expect, it } from "vitest";
import { generateFingerprint, generateFindingId } from "../../utils/fingerprint";
import type { Finding } from "../../types";

const baseFinding: Finding = {
  id: "f1",
  ruleId: "rule-1",
  ruleTitle: "Title",
  description: "desc",
  impact: "critical",
  selector: "#main",
  html: "<div>content</div>",
  helpUrl: "",
  wcagTags: [],
};

describe("utils/fingerprint", () => {
  it("generates deterministic fingerprint and id", () => {
    const fp1 = generateFingerprint(baseFinding);
    const fp2 = generateFingerprint(baseFinding);
    expect(fp1).toBe(fp2);

    const findingId = generateFindingId(baseFinding, 3);
    expect(findingId).toContain("rule-1-3-");
    const hashPart = findingId.split("-").pop() as string;
    expect(hashPart.length).toBe(6);
  });

  it("truncates html portion in fingerprint key", () => {
    const longHtml = "<p>" + "x".repeat(200) + "</p>";
    const fp = generateFingerprint({ ...baseFinding, html: longHtml });
    expect(fp).toBeDefined();
  });
});
