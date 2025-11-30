import { describe, expect, it } from "vitest";
import { getSeverityColor, getScoreColor, getScoreGrade, getDomain, formatDate } from "../../utils/scoreUtils";

describe("utils/scoreUtils", () => {
  it("maps severity to colors with fallback", () => {
    expect(getSeverityColor("critical")).toBe("#dc2626");
    expect(getSeverityColor("serious")).toBe("#ea580c");
    expect(getSeverityColor("moderate")).toBe("#ca8a04");
    expect(getSeverityColor("minor")).toBe("#2563eb");
    expect(getSeverityColor("unknown" as never)).toBe("#6b7280");
  });

  it("maps scores to colors", () => {
    expect(getScoreColor(95)).toBe("#10b981");
    expect(getScoreColor(75)).toBe("#f59e0b");
    expect(getScoreColor(55)).toBe("#ea580c");
    expect(getScoreColor(10)).toBe("#dc2626");
  });

  it("returns score grade buckets", () => {
    expect(getScoreGrade(95)).toBe("A");
    expect(getScoreGrade(85)).toBe("B");
    expect(getScoreGrade(75)).toBe("C");
    expect(getScoreGrade(65)).toBe("D");
    expect(getScoreGrade(10)).toBe("F");
  });

  it("gets domain with fallback on invalid URL", () => {
    expect(getDomain("https://www.example.com/page")).toBe("example.com");
    expect(getDomain("not a url")).toBe("not a url");
  });

  it("formats date", () => {
    const formatted = formatDate("2024-01-01T12:30:00Z");
    expect(formatted).toContain("Jan");
  });
});
