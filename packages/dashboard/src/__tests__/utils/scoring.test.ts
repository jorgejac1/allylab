import { describe, expect, it } from "vitest";
import { calculateScore, getScoreColor, getScoreGrade } from "../../utils/scoring";

describe("utils/scoring", () => {
  it("calculates score with zero penalty", () => {
    expect(calculateScore({ critical: 0, serious: 0, moderate: 0, minor: 0 })).toBe(100);
  });

  it("calculates score with penalties and rounds", () => {
    const score = calculateScore({ critical: 1, serious: 2, moderate: 3, minor: 4 });
    expect(score).toBeLessThan(100);
  });

  it("maps score to colors", () => {
    expect(getScoreColor(80)).toBe("#10b981");
    expect(getScoreColor(50)).toBe("#f59e0b");
    expect(getScoreColor(10)).toBe("#ef4444");
  });

  it("maps grade buckets", () => {
    expect(getScoreGrade(95)).toBe("A");
    expect(getScoreGrade(85)).toBe("B");
    expect(getScoreGrade(75)).toBe("C");
    expect(getScoreGrade(65)).toBe("D");
    expect(getScoreGrade(10)).toBe("F");
  });
});
