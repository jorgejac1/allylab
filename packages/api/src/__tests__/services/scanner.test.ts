import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createSchedule,
  deleteSchedule,
  runScheduleNow,
  startJob,
} from "../../services/scheduler";
import * as scannerModule from "../../services/scanner";
import * as schedulerModule from "../../services/scheduler";
import type { ScheduleFrequency } from "../../types/schedule.js";
import type { Page } from "playwright";

const mockAnalyze = vi.fn();
const mockWithTags = vi.fn();

vi.mock("../../services/browser.js", () => ({
  acquirePage: vi.fn(),
  releasePage: vi.fn(),
  destroyPage: vi.fn(),
}));

vi.mock("../../services/rule-evaluator.js", () => ({
  evaluateCustomRules: vi.fn(),
  getEnabledRulesCount: vi.fn(),
}));

vi.mock("../../utils/scoring.js", () => ({
  calculateScore: vi.fn(),
}));

vi.mock("../../utils/wcag.js", () => ({
  getWcagTags: vi.fn(),
}));

vi.mock("@axe-core/playwright", () => {
  return {
    default: class MockAxeBuilder {
      withTags(tags: string[]) {
        mockWithTags(tags);
        return this;
      }
      analyze() {
        return mockAnalyze();
      }
    },
  };
});

import { runScan } from "../../services/scanner";
import { acquirePage, releasePage, destroyPage } from "../../services/browser";
import {
  evaluateCustomRules,
  getEnabledRulesCount,
} from "../../services/rule-evaluator";
import { calculateScore } from "../../utils/scoring";
import { getWcagTags } from "../../utils/wcag";

const mockAcquirePage = vi.mocked(acquirePage);
const mockReleasePage = vi.mocked(releasePage);
const mockDestroyPage = vi.mocked(destroyPage);
const mockEvaluateCustomRules = vi.mocked(evaluateCustomRules);
const mockGetEnabledRulesCount = vi.mocked(getEnabledRulesCount);
const mockCalculateScore = vi.mocked(calculateScore);
const mockGetWcagTags = vi.mocked(getWcagTags);

interface MockPage {
  goto: ReturnType<typeof vi.fn>;
  waitForTimeout: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

describe("services/scanner", () => {
  let mockPage: MockPage;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPage = {
      goto: vi.fn().mockResolvedValue(null),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };

    mockAcquirePage.mockResolvedValue(mockPage as unknown as Page);
    mockReleasePage.mockResolvedValue(undefined);
    mockDestroyPage.mockResolvedValue(undefined);

    mockAnalyze.mockResolvedValue({
      violations: [],
      incomplete: [],
      passes: [],
      inapplicable: [],
    });

    mockGetWcagTags.mockReturnValue(["wcag2a", "wcag2aa", "wcag21aa"]);
    mockCalculateScore.mockReturnValue(100);
    mockGetEnabledRulesCount.mockResolvedValue(0);
    mockEvaluateCustomRules.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("runScan", () => {
    it("scans URL and returns result", async () => {
      const result = await runScan({ url: "https://example.com" });

      expect(result).toMatchObject({
        url: "https://example.com",
        score: 100,
        totalIssues: 0,
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0,
        findings: [],
        viewport: "desktop",
      });
      expect(result.id).toMatch(/^scan_/);
      expect(result.timestamp).toBeDefined();
      expect(result.scanDuration).toBeGreaterThanOrEqual(0);
    });

    it("creates page with specified viewport", async () => {
      await runScan({ url: "https://example.com", viewport: "mobile" });

      expect(mockAcquirePage).toHaveBeenCalledWith("mobile", expect.any(Number));
    });

    it("creates page with desktop viewport by default", async () => {
      await runScan({ url: "https://example.com" });

      expect(mockAcquirePage).toHaveBeenCalledWith("desktop", expect.any(Number));
    });

    it("navigates to URL with correct options", async () => {
      await runScan({ url: "https://example.com" });

      expect(mockPage.goto).toHaveBeenCalledWith("https://example.com", {
        waitUntil: "domcontentloaded",
        timeout: expect.any(Number),
      });
    });

    it("uses specified WCAG standard", async () => {
      await runScan({ url: "https://example.com", standard: "wcag22aa" });

      expect(mockGetWcagTags).toHaveBeenCalledWith("wcag22aa");
    });

    it("uses wcag21aa standard by default", async () => {
      await runScan({ url: "https://example.com" });

      expect(mockGetWcagTags).toHaveBeenCalledWith("wcag21aa");
    });

    it("configures AxeBuilder with WCAG tags", async () => {
      mockGetWcagTags.mockReturnValue(["wcag2a", "wcag21aa"]);

      await runScan({ url: "https://example.com" });

      expect(mockWithTags).toHaveBeenCalledWith(["wcag2a", "wcag21aa"]);
    });

    it("processes axe violations into findings", async () => {
      mockAnalyze.mockResolvedValue({
        violations: [
          {
            id: "image-alt",
            impact: "critical",
            help: "Images must have alternate text",
            description: "Ensures img elements have alternate text",
            helpUrl: "https://dequeuniversity.com/rules/axe/4.0/image-alt",
            tags: ["wcag2a", "wcag111", "section508"],
            nodes: [
              {
                target: ["img.photo"],
                html: '<img src="photo.jpg" class="photo">',
              },
            ],
          },
        ],
        incomplete: [],
        passes: [],
        inapplicable: [],
      });

      mockCalculateScore.mockReturnValue(75);

      const result = await runScan({ url: "https://example.com" });

      expect(result.findings).toHaveLength(1);
      expect(result.findings[0]).toMatchObject({
        ruleId: "image-alt",
        ruleTitle: "Images must have alternate text",
        description: "Ensures img elements have alternate text",
        impact: "critical",
        selector: "img.photo",
        html: '<img src="photo.jpg" class="photo">',
        helpUrl: "https://dequeuniversity.com/rules/axe/4.0/image-alt",
        wcagTags: ["wcag2a", "wcag111"],
        source: "axe-core",
      });
      expect(result.critical).toBe(1);
      expect(result.totalIssues).toBe(1);
    });

    it("processes multiple nodes per violation", async () => {
      mockAnalyze.mockResolvedValue({
        violations: [
          {
            id: "image-alt",
            impact: "critical",
            help: "Images must have alternate text",
            description: "Test",
            helpUrl: "https://example.com",
            tags: ["wcag2a"],
            nodes: [
              { target: ["img:nth-child(1)"], html: '<img src="1.jpg">' },
              { target: ["img:nth-child(2)"], html: '<img src="2.jpg">' },
              { target: ["img:nth-child(3)"], html: '<img src="3.jpg">' },
            ],
          },
        ],
        incomplete: [],
        passes: [],
        inapplicable: [],
      });

      const result = await runScan({ url: "https://example.com" });

      expect(result.findings).toHaveLength(3);
      expect(result.critical).toBe(1);
    });

    it("counts severity correctly for multiple violations", async () => {
      mockAnalyze.mockResolvedValue({
        violations: [
          {
            id: "image-alt",
            impact: "critical",
            help: "Test",
            description: "Test",
            helpUrl: "",
            tags: [],
            nodes: [{ target: ["img"], html: "<img>" }],
          },
          {
            id: "color-contrast-1",
            impact: "serious",
            help: "Test",
            description: "Test",
            helpUrl: "",
            tags: [],
            nodes: [{ target: ["p:nth-child(1)"], html: "<p>1</p>" }],
          },
          {
            id: "color-contrast-2",
            impact: "serious",
            help: "Test",
            description: "Test",
            helpUrl: "",
            tags: [],
            nodes: [{ target: ["p:nth-child(2)"], html: "<p>2</p>" }],
          },
          {
            id: "link-name",
            impact: "moderate",
            help: "Test",
            description: "Test",
            helpUrl: "",
            tags: [],
            nodes: [{ target: ["a"], html: "<a></a>" }],
          },
          {
            id: "meta-viewport",
            impact: "minor",
            help: "Test",
            description: "Test",
            helpUrl: "",
            tags: [],
            nodes: [{ target: ["meta"], html: "<meta>" }],
          },
        ],
        incomplete: [],
        passes: [],
        inapplicable: [],
      });

      const result = await runScan({ url: "https://example.com" });

      expect(result.critical).toBe(1);
      expect(result.serious).toBe(2);
      expect(result.moderate).toBe(1);
      expect(result.minor).toBe(1);
      expect(result.totalIssues).toBe(5);
    });

    it("calls calculateScore with severity counts", async () => {
      vi.clearAllMocks();

      mockAcquirePage.mockResolvedValue(mockPage as unknown as Page);
      mockGetWcagTags.mockReturnValue(["wcag2a", "wcag2aa", "wcag21aa"]);
      mockGetEnabledRulesCount.mockResolvedValue(0);
      mockEvaluateCustomRules.mockResolvedValue([]);

      mockAnalyze.mockResolvedValue({
        violations: [
          {
            id: "rule-1",
            impact: "critical",
            help: "Test",
            description: "Test",
            helpUrl: "",
            tags: [],
            nodes: [{ target: ["div"], html: "<div>" }],
          },
          {
            id: "rule-2a",
            impact: "serious",
            help: "Test",
            description: "Test",
            helpUrl: "",
            tags: [],
            nodes: [{ target: ["p:nth-child(1)"], html: "<p>" }],
          },
          {
            id: "rule-2b",
            impact: "serious",
            help: "Test",
            description: "Test",
            helpUrl: "",
            tags: [],
            nodes: [{ target: ["p:nth-child(2)"], html: "<p>" }],
          },
        ],
        incomplete: [],
        passes: [],
        inapplicable: [],
      });

      await runScan({ url: "https://example.com" });

      expect(mockCalculateScore).toHaveBeenCalledWith({
        critical: 1,
        serious: 2,
        moderate: 0,
        minor: 0,
      });
    });

    it("includes incomplete results when includeWarnings is true", async () => {
      mockAnalyze.mockResolvedValue({
        violations: [
          {
            id: "violation-1",
            impact: "critical",
            help: "Test",
            description: "Test",
            helpUrl: "",
            tags: [],
            nodes: [{ target: ["div"], html: "<div>" }],
          },
        ],
        incomplete: [
          {
            id: "incomplete-1",
            impact: "moderate",
            help: "Test incomplete",
            description: "Test",
            helpUrl: "",
            tags: [],
            nodes: [{ target: ["span"], html: "<span>" }],
          },
        ],
        passes: [],
        inapplicable: [],
      });

      const result = await runScan({
        url: "https://example.com",
        includeWarnings: true,
      });

      expect(result.findings).toHaveLength(2);
      expect(result.critical).toBe(1);
      expect(result.moderate).toBe(1);
    });

    it("excludes incomplete results when includeWarnings is false", async () => {
      mockAnalyze.mockResolvedValue({
        violations: [
          {
            id: "violation-1",
            impact: "critical",
            help: "Test",
            description: "Test",
            helpUrl: "",
            tags: [],
            nodes: [{ target: ["div"], html: "<div>" }],
          },
        ],
        incomplete: [
          {
            id: "incomplete-1",
            impact: "moderate",
            help: "Test incomplete",
            description: "Test",
            helpUrl: "",
            tags: [],
            nodes: [{ target: ["span"], html: "<span>" }],
          },
        ],
        passes: [],
        inapplicable: [],
      });

      const result = await runScan({
        url: "https://example.com",
        includeWarnings: false,
      });

      expect(result.findings).toHaveLength(1);
      expect(result.critical).toBe(1);
      expect(result.moderate).toBe(0);
    });

    it("defaults to minor severity when impact is missing", async () => {
      mockAnalyze.mockResolvedValue({
        violations: [
          {
            id: "unknown-rule",
            impact: undefined,
            help: "Test",
            description: "Test",
            helpUrl: "",
            tags: [],
            nodes: [{ target: ["div"], html: "<div>" }],
          },
        ],
        incomplete: [],
        passes: [],
        inapplicable: [],
      });

      const result = await runScan({ url: "https://example.com" });

      expect(result.findings[0].impact).toBe("minor");
      expect(result.minor).toBe(1);
    });

    it("filters wcag tags from violation tags", async () => {
      mockAnalyze.mockResolvedValue({
        violations: [
          {
            id: "test-rule",
            impact: "critical",
            help: "Test",
            description: "Test",
            helpUrl: "",
            tags: [
              "wcag2a",
              "wcag111",
              "section508",
              "best-practice",
              "cat.forms",
            ],
            nodes: [{ target: ["div"], html: "<div>" }],
          },
        ],
        incomplete: [],
        passes: [],
        inapplicable: [],
      });

      const result = await runScan({ url: "https://example.com" });

      expect(result.findings[0].wcagTags).toEqual(["wcag2a", "wcag111"]);
    });

    it("releases page after scan completes", async () => {
      await runScan({ url: "https://example.com" });

      expect(mockReleasePage).toHaveBeenCalledWith(mockPage);
    });

    it("destroys page when scan fails", async () => {
      mockAnalyze.mockRejectedValue(new Error("Analyze failed"));

      await expect(runScan({ url: "https://example.com" })).rejects.toThrow(
        "Analyze failed"
      );

      expect(mockDestroyPage).toHaveBeenCalledWith(mockPage);
    });

    it("handles navigation timeout with fallback", async () => {
      mockPage.goto
        .mockRejectedValueOnce(new Error("Timeout exceeded"))
        .mockResolvedValueOnce(null);

      await runScan({ url: "https://example.com" });

      expect(mockPage.goto).toHaveBeenCalledTimes(2);
      expect(mockPage.goto).toHaveBeenLastCalledWith("https://example.com", {
        waitUntil: "commit",
        timeout: 30000,
      });
    });

    it("throws non-timeout navigation errors", async () => {
      mockPage.goto.mockRejectedValue(new Error("net::ERR_NAME_NOT_RESOLVED"));

      await expect(
        runScan({ url: "https://invalid-domain.example" })
      ).rejects.toThrow("net::ERR_NAME_NOT_RESOLVED");
    });

    it("waits for page to render", async () => {
      await runScan({ url: "https://example.com" });

      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(2000);
    });
  });

  describe("progress callbacks", () => {
    it("calls onProgress at each stage", async () => {
      const onProgress = vi.fn();

      await runScan({ url: "https://example.com", onProgress });

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          percent: 10,
          message: expect.stringContaining("Navigating"),
        })
      );
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          percent: 30,
          message: expect.stringContaining("render"),
        })
      );
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          percent: 40,
          message: expect.stringContaining("accessibility scan"),
        })
      );
      // Note: 55-70% progress calls only happen when processing violations
      // Since mock returns empty violations, we skip to score calculation
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          percent: 90,
          message: expect.stringContaining("score"),
        })
      );
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          percent: 100,
          message: expect.stringContaining("complete"),
        })
      );
    });

    it("includes viewport label in progress messages", async () => {
      const onProgress = vi.fn();

      await runScan({
        url: "https://example.com",
        viewport: "mobile",
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining("Mobile") })
      );
    });

    it("reports slow loading page", async () => {
      const onProgress = vi.fn();

      mockPage.goto
        .mockRejectedValueOnce(new Error("Timeout exceeded"))
        .mockResolvedValueOnce(null);

      await runScan({ url: "https://example.com", onProgress });

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          percent: 15,
          message: expect.stringContaining("slowly"),
        })
      );
    });
  });

  describe("finding callbacks", () => {
    it("calls onFinding for each finding", async () => {
      mockAnalyze.mockResolvedValue({
        violations: [
          {
            id: "rule-1",
            impact: "critical",
            help: "Test 1",
            description: "Test",
            helpUrl: "",
            tags: [],
            nodes: [{ target: ["div"], html: "<div>" }],
          },
          {
            id: "rule-2",
            impact: "serious",
            help: "Test 2",
            description: "Test",
            helpUrl: "",
            tags: [],
            nodes: [{ target: ["span"], html: "<span>" }],
          },
        ],
        incomplete: [],
        passes: [],
        inapplicable: [],
      });

      const onFinding = vi.fn();

      await runScan({ url: "https://example.com", onFinding });

      expect(onFinding).toHaveBeenCalledTimes(2);
      expect(onFinding).toHaveBeenCalledWith(
        expect.objectContaining({ ruleId: "rule-1" })
      );
      expect(onFinding).toHaveBeenCalledWith(
        expect.objectContaining({ ruleId: "rule-2" })
      );
    });
  });

  describe("custom rules integration", () => {
    it("runs custom rules when enabled and rules exist", async () => {
      mockGetEnabledRulesCount.mockResolvedValue(3);
      mockEvaluateCustomRules.mockResolvedValue([]);

      await runScan({ url: "https://example.com", includeCustomRules: true });

      expect(mockEvaluateCustomRules).toHaveBeenCalledWith(
        expect.objectContaining({
          page: mockPage,
        })
      );
    });

    it("skips custom rules when disabled", async () => {
      mockGetEnabledRulesCount.mockResolvedValue(3);

      await runScan({ url: "https://example.com", includeCustomRules: false });

      expect(mockEvaluateCustomRules).not.toHaveBeenCalled();
    });

    it("skips custom rules when none are enabled", async () => {
      mockGetEnabledRulesCount.mockResolvedValue(0);

      await runScan({ url: "https://example.com", includeCustomRules: true });

      expect(mockEvaluateCustomRules).not.toHaveBeenCalled();
    });

    it("includes customRulesCount in result", async () => {
      mockGetEnabledRulesCount.mockResolvedValue(7);

      const result = await runScan({ url: "https://example.com" });

      expect(result.customRulesCount).toBe(7);
    });

    it("sets customRulesCount to 0 when custom rules disabled", async () => {
      mockGetEnabledRulesCount.mockResolvedValue(5);

      const result = await runScan({
        url: "https://example.com",
        includeCustomRules: false,
      });

      expect(result.customRulesCount).toBe(0);
    });
  });

  describe("custom rules integration extended", () => {
    it("includes custom rule violations in findings and counts severity", async () => {
      mockGetEnabledRulesCount.mockResolvedValue(2);

      mockEvaluateCustomRules.mockImplementation(async (options) => {
        const violations = [
          {
            ruleId: "custom-rule-1",
            ruleName: "Custom Rule 1",
            selector: ".element-1",
            html: '<div class="element-1">',
            message: "Custom violation 1",
            severity: "critical" as const,
            wcagTags: ["wcag2a"],
          },
          {
            ruleId: "custom-rule-2",
            ruleName: "Custom Rule 2",
            selector: ".element-2",
            html: '<div class="element-2">',
            message: "Custom violation 2",
            severity: "serious" as const,
            wcagTags: [],
          },
        ];

        for (const violation of violations) {
          options.onViolation?.(violation);
        }

        return violations;
      });

      const result = await runScan({ url: "https://example.com" });

      expect(result.findings).toHaveLength(2);
      expect(result.critical).toBe(1);
      expect(result.serious).toBe(1);
      expect(result.findings[0].source).toBe("custom-rule");
      expect(result.findings[1].source).toBe("custom-rule");
    });

    it("reports custom rules violation count in progress", async () => {
      mockGetEnabledRulesCount.mockResolvedValue(3);

      mockEvaluateCustomRules.mockImplementation(async (options) => {
        const violations = [
          {
            ruleId: "custom-1",
            ruleName: "Custom",
            selector: "div",
            html: "<div>",
            message: "Test",
            severity: "minor" as const,
            wcagTags: [],
          },
          {
            ruleId: "custom-2",
            ruleName: "Custom",
            selector: "span",
            html: "<span>",
            message: "Test",
            severity: "minor" as const,
            wcagTags: [],
          },
        ];

        for (const v of violations) {
          options.onViolation?.(v);
        }

        return violations;
      });

      const onProgress = vi.fn();

      await runScan({ url: "https://example.com", onProgress });

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          percent: 85,
          message: expect.stringContaining("2 issues"),
        })
      );
    });
  });

  describe("result format", () => {
    it("generates unique scan ID", async () => {
      const result1 = await runScan({ url: "https://example.com" });
      const result2 = await runScan({ url: "https://example.com" });

      expect(result1.id).not.toBe(result2.id);
      expect(result1.id).toMatch(/^scan_\d+_[a-z0-9]+$/);
    });

    it("includes ISO timestamp", async () => {
      const result = await runScan({ url: "https://example.com" });

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("calculates scan duration", async () => {
      const result = await runScan({ url: "https://example.com" });

      expect(result.scanDuration).toBeGreaterThanOrEqual(0);
    });

    it("includes viewport in result", async () => {
      const desktopResult = await runScan({
        url: "https://example.com",
        viewport: "desktop",
      });
      const mobileResult = await runScan({
        url: "https://example.com",
        viewport: "mobile",
      });
      const tabletResult = await runScan({
        url: "https://example.com",
        viewport: "tablet",
      });

      expect(desktopResult.viewport).toBe("desktop");
      expect(mobileResult.viewport).toBe("mobile");
      expect(tabletResult.viewport).toBe("tablet");
    });
  });

  describe("scheduler default cases", () => {
    it("calculateNextRun falls back to daily when frequency is unknown", () => {
      vi.useFakeTimers();
      const base = new Date("2025-01-01T00:00:00.000Z");
      vi.setSystemTime(base);

      const DAY_MS = 24 * 60 * 60 * 1000;

      const freq = "unknown" as ScheduleFrequency;
      const schedule = createSchedule("https://example.com", freq);

      const nextRun = new Date(schedule.nextRun!);
      const diff = nextRun.getTime() - base.getTime();

      expect(diff).toBe(DAY_MS);

      deleteSchedule(schedule.id);
      vi.useRealTimers();
    });

    it("getIntervalMs falls back to daily interval for unknown frequency", () => {
      const setIntervalSpy = vi.spyOn(global, "setInterval");

      const freq = "weird" as ScheduleFrequency;
      const schedule = createSchedule("https://example.com", freq);

      const DAY_MS = 24 * 60 * 60 * 1000;

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), DAY_MS);

      setIntervalSpy.mockRestore();
      deleteSchedule(schedule.id);
    });
  });

  describe("scheduler error handling", () => {
    it("sets Unknown error when runScan throws non-Error value", async () => {
      const freq = "daily" as ScheduleFrequency;
      const schedule = createSchedule("https://example.com", freq);

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const runScanSpy = vi
        .spyOn(scannerModule, "runScan")
        .mockRejectedValueOnce("non-error-failure" as never);

      const result = await runScheduleNow(schedule.id);

      expect(result).not.toBeNull();
      expect(result?.success).toBe(false);
      expect(result?.error).toBe("Unknown error");

      expect(consoleSpy).toHaveBeenCalledWith(
        `[Scheduler] Scan failed: ${schedule.url}`,
        "non-error-failure"
      );

      runScanSpy.mockRestore();
      consoleSpy.mockRestore();
      deleteSchedule(schedule.id);
    });
  });

  describe("scheduler startJob branches", () => {
    it("covers else branch in interval callback when schedule is disabled", () => {
      const setIntervalSpy = vi.spyOn(global, "setInterval");

      const freq: ScheduleFrequency = "daily";
      const schedule = createSchedule("https://example.com", freq);

      expect(setIntervalSpy).toHaveBeenCalled();

      const intervalCall = setIntervalSpy.mock.calls[0];
      const callback = intervalCall[0] as () => void;

      schedule.enabled = false;

      callback();

      setIntervalSpy.mockRestore();
      deleteSchedule(schedule.id);
    });

    it("does not start job when schedule.enabled is false", () => {
      const freq: ScheduleFrequency = "daily";
      const schedule = createSchedule("https://example.com", freq);

      schedule.enabled = false;

      const setIntervalSpy = vi.spyOn(global, "setInterval");

      startJob(schedule);

      expect(setIntervalSpy).not.toHaveBeenCalled();

      setIntervalSpy.mockRestore();
      deleteSchedule(schedule.id);
    });
  });

  describe("scheduler initScheduler branches", () => {
    it("does NOT call startJob for disabled schedules (covers else path)", () => {
      const freq: ScheduleFrequency = "daily";

      const schedule = createSchedule("https://example.com", freq);

      schedule.enabled = false;

      const startJobSpy = vi.spyOn(schedulerModule, "startJob");

      schedulerModule.initScheduler();

      expect(startJobSpy).not.toHaveBeenCalled();

      startJobSpy.mockRestore();
      deleteSchedule(schedule.id);
    });
  });
});
