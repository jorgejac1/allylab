import { describe, expect, it, vi } from "vitest";
import { getDateRangeBounds, formatDateRangeLabel, formatDateForInput } from "../../utils/dateRange";

describe("utils/dateRange", () => {
  it("computes bounds for presets and default", () => {
    const now = new Date("2024-01-10T12:00:00Z");
    vi.setSystemTime(now);
    const seven = getDateRangeBounds("7days", { start: null, end: null });
    expect(seven.end?.getDate()).toBe(10);
    const diffSeven = (seven.end!.getTime() - seven.start!.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffSeven).toBeGreaterThanOrEqual(7);

    const thirty = getDateRangeBounds("30days", { start: null, end: null });
    const diffThirty = (thirty.end!.getTime() - thirty.start!.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffThirty).toBeGreaterThanOrEqual(30);

    const ninety = getDateRangeBounds("90days", { start: null, end: null });
    const diffNinety = (ninety.end!.getTime() - ninety.start!.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffNinety).toBeGreaterThanOrEqual(90);
    expect(ninety.start?.getHours()).toBe(0);
    expect(ninety.start?.getMinutes()).toBe(0);

    const custom = getDateRangeBounds("custom", { start: new Date("2024-01-01"), end: new Date("2024-01-02") });
    expect(custom.start?.getTime()).toBe(new Date("2024-01-01").getTime());

    const unknown = getDateRangeBounds("other" as never, { start: null, end: null });
    expect(unknown).toEqual({ start: null, end: null });
    vi.useRealTimers();
  });

  it("formats labels", () => {
    const customRange = { start: new Date("2024-01-01"), end: new Date("2024-01-02") };
    expect(formatDateRangeLabel("7days", customRange)).toBe("Last 7 days");
    expect(formatDateRangeLabel("30days", customRange)).toBe("Last 30 days");
    expect(formatDateRangeLabel("90days", customRange)).toBe("Last 90 days");
    expect(formatDateRangeLabel("custom", { start: null, end: null })).toBe("Custom range");
    expect(formatDateRangeLabel("custom", customRange)).toContain("2024");
    expect(formatDateRangeLabel("other" as never, customRange)).toBe("");
  });

  it("formats date for input", () => {
    expect(formatDateForInput(null)).toBe("");
    expect(formatDateForInput(new Date("2024-01-01T12:00:00Z"))).toBe("2024-01-01");
  });
});
