import { describe, expect, it } from "vitest";
import { SEVERITY_COLORS, SEVERITY_BG, SEVERITY_LABELS, STATUS_ICONS, DEV_TIME_PER_ISSUE, HOURS_PER_SPRINT, HOURS_PER_WEEK } from "../../utils/constants";

describe("utils/constants", () => {
  it("exposes severity maps and labels", () => {
    expect(SEVERITY_COLORS.critical).toBeDefined();
    expect(SEVERITY_BG.serious).toBeDefined();
    expect(SEVERITY_LABELS.moderate).toBe("Moderate");
  });

  it("has status icons and dev time constants", () => {
    expect(STATUS_ICONS.new).toBe("🆕");
    expect(DEV_TIME_PER_ISSUE.minor).toBe(0.5);
    expect(HOURS_PER_SPRINT).toBeGreaterThan(0);
    expect(HOURS_PER_WEEK).toBeGreaterThan(0);
  });
});
