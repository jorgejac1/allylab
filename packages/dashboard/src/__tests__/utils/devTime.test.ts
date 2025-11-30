import { describe, expect, it } from "vitest";
import { calculateDevTime, getRiskAssessment } from "../../utils/devTime";

describe("utils/devTime", () => {
  it("calculates dev time totals and breakdown", () => {
    const result = calculateDevTime({ critical: 1, serious: 2, moderate: 3, minor: 4 });
    expect(result.totalHours).toBeGreaterThan(0);
    expect(result.bySeverity.critical).toBeGreaterThan(0);
    expect(result.sprints).toBeGreaterThan(0);
  });

  it("assesses risk levels", () => {
    expect(getRiskAssessment(60, 0).level).toBe("critical");
    expect(getRiskAssessment(25, 0).level).toBe("high");
    expect(getRiskAssessment(1, 60).level).toBe("medium");
    expect(getRiskAssessment(0, 0).level).toBe("low");
  });
});
