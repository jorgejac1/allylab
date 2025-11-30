import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import {
  loadFalsePositives,
  markAsFalsePositive,
  unmarkFalsePositive,
  isFalsePositive,
  getFalsePositiveEntry,
  applyFalsePositiveStatus,
  getFalsePositiveCount,
  clearAllFalsePositives,
} from "../../utils/falsePositives";
import type { TrackedFinding } from "../../types";

const globalWithWindow = globalThis as unknown as { window?: Window };
if (!globalWithWindow.window) globalWithWindow.window = {} as Window;
const makeStorage = () =>
  ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  } as unknown as Storage);

describe("utils/falsePositives", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const storage = makeStorage();
    Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
    if (!globalWithWindow.window) globalWithWindow.window = {} as Window;
    Object.defineProperty(globalWithWindow.window, "localStorage", { value: storage, configurable: true });
  });

  it("loads empty when no data", () => {
    (window.localStorage.getItem as Mock).mockReturnValue(null);
    expect(loadFalsePositives()).toEqual([]);
  });

  it("returns empty array when load fails", () => {
    (window.localStorage.getItem as Mock).mockImplementation(() => {
      throw new Error("boom");
    });
    expect(loadFalsePositives()).toEqual([]);
  });

  it("marks, checks, retrieves, and unmarks false positives", () => {
    (window.localStorage.getItem as Mock).mockReturnValueOnce(JSON.stringify([]));
    markAsFalsePositive("fp1", "rule1", "reason");
    expect(window.localStorage.setItem).toHaveBeenCalled();

    (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([{ fingerprint: "fp1", ruleId: "rule1", reason: "reason", markedAt: "now" }]));
    expect(isFalsePositive("fp1")).toBe(true);
    expect(getFalsePositiveEntry("fp1")?.ruleId).toBe("rule1");

    unmarkFalsePositive("fp1");
    expect(window.localStorage.setItem).toHaveBeenCalledTimes(2);
  });

  it("applies false positive status to findings", () => {
    const findings: TrackedFinding[] = [
      {
        id: "1",
        ruleId: "r1",
        ruleTitle: "t",
        description: "d",
        impact: "critical",
        selector: "#a",
        html: "<div>",
        helpUrl: "",
        wcagTags: [],
        fingerprint: "fp1",
        status: "new",
      },
    ];
    (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([{ fingerprint: "fp1", ruleId: "r1", reason: "ok", markedAt: "now" }]));
    const applied = applyFalsePositiveStatus(findings);
    expect(applied[0].falsePositive).toBe(true);
    expect(applied[0].falsePositiveReason).toBe("ok");
  });

  it("leaves finding unchanged when not marked as false positive", () => {
    const findings: TrackedFinding[] = [
      {
        id: "2",
        ruleId: "r2",
        ruleTitle: "t2",
        description: "d2",
        impact: "serious",
        selector: "#b",
        html: "<span>",
        helpUrl: "",
        wcagTags: [],
        fingerprint: "fp2",
        status: "new",
      },
    ];
    (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([]));
    const applied = applyFalsePositiveStatus(findings);
    expect(applied[0].falsePositive).toBe(false);
    expect(applied[0].falsePositiveReason).toBeUndefined();
    expect(applied[0].falsePositiveMarkedAt).toBeUndefined();
  });

  it("updates existing entry when marking same fingerprint", () => {
    (window.localStorage.getItem as Mock).mockReturnValueOnce(JSON.stringify([
      { fingerprint: "fp1", ruleId: "old", reason: "old reason", markedAt: "before" },
    ]));
    markAsFalsePositive("fp1", "rule1", "new reason");
    const saved = JSON.parse((window.localStorage.setItem as Mock).mock.calls[0][1]) as Array<{ ruleId: string; reason?: string }>;
    expect(saved[0].ruleId).toBe("rule1");
    expect(saved[0].reason).toBe("new reason");
  });

  it("counts and clears false positives", () => {
    (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([{ fingerprint: "fp1", ruleId: "r1", markedAt: "now" }]));
    expect(getFalsePositiveCount()).toBe(1);
    clearAllFalsePositives();
    expect(window.localStorage.removeItem).toHaveBeenCalled();
  });
});
