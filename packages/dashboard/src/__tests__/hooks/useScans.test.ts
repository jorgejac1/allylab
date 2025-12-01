import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { useScans, filterRecentRegressions } from "../../hooks/useScans";
import type { SavedScan, ScanResult } from "../../types";
import type { RegressionInfo } from "../../hooks/useScans";

const mockLoadAllScans = vi.hoisted(() => vi.fn());
const mockSaveScan = vi.hoisted(() => vi.fn());
const mockDeleteScan = vi.hoisted(() => vi.fn());
const mockGetScansForUrl = vi.hoisted(() => vi.fn());
const mockGetTrackingStats = vi.hoisted(() => vi.fn());
const mockGetPreviousFingerprints = vi.hoisted(() => vi.fn());
const mockGenerateFingerprint = vi.hoisted(() => vi.fn());
const mockGenerateFindingId = vi.hoisted(() => vi.fn());
const mockLoadAlertSettings = vi.hoisted(() => vi.fn());

vi.mock("../../utils/storage", () => ({
  loadAllScans: mockLoadAllScans,
  saveScan: mockSaveScan,
  deleteScan: mockDeleteScan,
  getScansForUrl: mockGetScansForUrl,
}));

vi.mock("../../utils/issueTracker", () => ({
  getTrackingStats: mockGetTrackingStats,
  getPreviousFingerprints: mockGetPreviousFingerprints,
}));

vi.mock("../../utils/fingerprint", () => ({
  generateFingerprint: mockGenerateFingerprint,
  generateFindingId: mockGenerateFindingId,
}));

vi.mock("../../utils/alertSettings", () => ({
  loadAlertSettings: mockLoadAlertSettings,
}));

const baseResult: ScanResult = {
  id: "s1",
  url: "https://a.com/page",
  timestamp: "2024-01-01",
  score: 80,
  totalIssues: 2,
  critical: 1,
  serious: 1,
  moderate: 0,
  minor: 0,
  findings: [
    { id: "f1", ruleId: "r1", ruleTitle: "t1", description: "", impact: "critical", selector: "#a", html: "<a>", helpUrl: "", wcagTags: [] },
    { id: "f2", ruleId: "r2", ruleTitle: "t2", description: "", impact: "serious", selector: "#b", html: "<b>", helpUrl: "", wcagTags: [] },
  ],
  scanDuration: 1,
};

describe("hooks/useScans", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadAllScans.mockReturnValue([]);
    mockLoadAlertSettings.mockReturnValue({ showRegressionAlerts: false, recentDays: 7, regressionThreshold: 5 });
    mockGenerateFingerprint.mockImplementation((finding) => `${finding.ruleId}-fp`);
    mockGenerateFindingId.mockImplementation((_f, idx) => `fid-${idx}`);
    mockGetPreviousFingerprints.mockReturnValue(new Set(["r1-fp"]));
    mockGetTrackingStats.mockReturnValue({ new: 1, recurring: 0, fixed: 0, total: 1 });
  });

  it("adds scans with tracked findings and handles recurring fingerprints", () => {
    const { result } = renderHook(() => useScans());
    act(() => {
      const saved = result.current.addScan(baseResult);
      expect(saved.trackedFindings?.[0].status).toBe("recurring");
      expect(saved.trackedFindings?.[1].status).toBe("new");
      expect(mockSaveScan).toHaveBeenCalled();
    });
    expect(result.current.scans.length).toBe(1);
  });

  it("removes scans and refreshes", () => {
    mockLoadAllScans.mockReturnValue([{ ...baseResult, trackedFindings: [] } as SavedScan]);
    const { result } = renderHook(() => useScans());
    act(() => result.current.removeScan("s1"));
    expect(mockDeleteScan).toHaveBeenCalledWith("s1");

    mockLoadAllScans.mockReturnValue([{ ...baseResult, id: "s2", trackedFindings: [] } as SavedScan]);
    act(() => result.current.refresh());
    expect(result.current.scans[0].id).toBe("s2");
  });

  it("computes regressions and regression helpers", () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const scans: SavedScan[] = [
      { ...baseResult, id: "old", url: "https://a.com", score: 90, timestamp: yesterday.toISOString(), trackedFindings: [] },
      { ...baseResult, id: "new", url: "https://a.com", score: 70, timestamp: now.toISOString(), trackedFindings: [] },
    ];
    mockLoadAllScans.mockReturnValue(scans);
    mockLoadAlertSettings.mockReturnValue({ showRegressionAlerts: true, recentDays: 30, regressionThreshold: 10 });

    const { result } = renderHook(() => useScans());
    const regressions = result.current.getRecentRegressions();
    expect(regressions[0]?.scoreDrop).toBe(20);
    expect(result.current.hasRegression("new")).toBeTruthy();
  });

  it("skips regression when score drop below threshold", () => {
    const now = new Date();
    const scans: SavedScan[] = [
      { ...baseResult, id: "old", url: "https://a.com", score: 90, timestamp: now.toISOString(), trackedFindings: [] },
      { ...baseResult, id: "new", url: "https://a.com", score: 87, timestamp: new Date(now.getTime() + 1000).toISOString(), trackedFindings: [] },
    ];
    mockLoadAllScans.mockReturnValue(scans);
    mockLoadAlertSettings.mockReturnValue({ showRegressionAlerts: true, recentDays: 30, regressionThreshold: 5 });

    const { result } = renderHook(() => useScans());
    expect(result.current.getRecentRegressions()).toEqual([]);
    expect(result.current.hasRegression("new")).toBeUndefined();
  });

  it("sorts recent regressions by timestamp descending", () => {
    const recent = new Date();
    const older = new Date(recent.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const newest = recent.toISOString();
    const regressions = new Map<string, RegressionInfo>([
      ["r1", { scanId: "s1", currentScore: 70, previousScore: 90, scoreDrop: 20, url: "a.com", timestamp: older }],
      ["r2", { scanId: "s2", currentScore: 60, previousScore: 80, scoreDrop: 20, url: "a.com", timestamp: newest }],
    ]);

    const sorted = filterRecentRegressions(regressions, 10);
    expect(sorted.map(r => r.scanId)).toEqual(["s2", "s1"]);
  });

  it("skips regressions when alerts disabled", () => {
    mockLoadAlertSettings.mockReturnValue({ showRegressionAlerts: false, recentDays: 7, regressionThreshold: 5 });
    const { result } = renderHook(() => useScans());
    expect(result.current.getRecentRegressions()).toEqual([]);
  });

  it("supports url helpers and stats", () => {
    const scanA: SavedScan = { ...baseResult, id: "a", url: "https://a.com/page", timestamp: "2024-01-01T00:00:00Z", trackedFindings: [] };
    const scanB: SavedScan = { ...baseResult, id: "b", url: "https://b.com", timestamp: "2024-01-02T00:00:00Z", trackedFindings: [] };
    const scanANewer: SavedScan = { ...baseResult, id: "a2", url: "https://a.com/other", timestamp: "2024-02-01T00:00:00Z", trackedFindings: [] };
    mockLoadAllScans.mockReturnValue([scanA, scanB]);
    mockGetScansForUrl.mockReturnValue([scanA]);
    mockGetTrackingStats.mockReturnValue({ new: 1, recurring: 0, fixed: 0, total: 1 });

    const { result } = renderHook(() => useScans());
    // refresh to include newer a.com scan
    act(() => {
      mockLoadAllScans.mockReturnValue([scanA, scanB, scanANewer]);
      result.current.refresh();
    });
    expect(result.current.getUrlScans("https://a.com").length).toBe(1);
    expect(result.current.getScanTrackingStats(scanA)).toEqual({ new: 1, recurring: 0, fixed: 0, total: 1 });
    expect(result.current.getUniqueUrls()).toEqual(["a.com", "b.com"]);
    expect(result.current.getLatestScan("https://a.com")?.id).toBe("a2");
  });

  it("handles missing trackedFindings when computing stats", () => {
    const scanNoFindings: SavedScan = { ...baseResult, id: "nf", trackedFindings: undefined };
    mockLoadAllScans.mockReturnValue([scanNoFindings]);
    mockGetTrackingStats.mockReturnValue({ new: 0, recurring: 0, fixed: 0, total: 0 });

    const { result } = renderHook(() => useScans());
    const stats = result.current.getScanTrackingStats(scanNoFindings);
    expect(stats).toEqual({ new: 0, recurring: 0, fixed: 0, total: 0 });
    expect(mockGetTrackingStats).toHaveBeenCalledWith([]);
  });
});
