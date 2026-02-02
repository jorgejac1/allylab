import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDashboardData } from "../../hooks/useDashboardData";
import type { SavedScan } from "../../types";

const mockLoadAllScans = vi.hoisted(() => vi.fn());
vi.mock("../../utils/storage", () => ({
  loadAllScans: mockLoadAllScans,
}));
vi.mock("../../utils/scoreUtils", () => ({
  getDomain: (url: string) => new URL(url).hostname,
}));

const baseScan: SavedScan = {
  id: "s1",
  url: "https://a.com",
  timestamp: "2024-01-02",
  score: 80,
  totalIssues: 2,
  critical: 1,
  serious: 1,
  moderate: 0,
  minor: 0,
  findings: [
    { id: "f1", ruleId: "r1", ruleTitle: "T1", description: "", impact: "critical", selector: "#a", html: "<a>", helpUrl: "", wcagTags: [] },
  ],
  scanDuration: 1,
};

describe("hooks/useDashboardData", () => {
  it("returns empty state when no scans", () => {
    mockLoadAllScans.mockReturnValue([]);
    const { result } = renderHook(() => useDashboardData());
    expect(result.current.totalSites).toBe(0);
    expect(result.current.topIssues.length).toBe(0);
  });

  it("computes stats, trends, and top issues", () => {
    const scan2: SavedScan = { ...baseScan, id: "s2", timestamp: "2024-01-01", score: 90, findings: [{ ...baseScan.findings[0], ruleId: "r2", ruleTitle: "T2" }] };
    const scan3: SavedScan = { ...baseScan, id: "s3", timestamp: "2024-01-03", score: 70, findings: [{ ...baseScan.findings[0], ruleId: "r2", ruleTitle: "T2" }] };
    mockLoadAllScans.mockReturnValue([baseScan, scan2, scan3]);
    const { result } = renderHook(() => useDashboardData());

    expect(result.current.totalSites).toBe(1);
    expect(result.current.totalScans).toBe(3);
    expect(result.current.severityCounts.critical).toBe(baseScan.critical);
    // siteStats sorted ascending by latestScore (70)
    expect(result.current.siteStats[0].latestScore).toBe(70);
    expect(result.current.topIssues[0].count).toBeGreaterThan(0);
    // topIssues sorted descending by count (r2 appears twice)
    expect(result.current.topIssues[0].ruleId).toBe("r2");
    expect(result.current.overallTrend.length).toBeGreaterThan(0);
  });

  it("sorts site stats by latestScore and top issues by count", () => {
    const siteBScanOld: SavedScan = { ...baseScan, id: "b-old", url: "https://b.com", timestamp: "2024-01-01", score: 95, findings: [{ ...baseScan.findings[0], ruleId: "r3", ruleTitle: "T3" }] };
    const siteBScanNew: SavedScan = { ...siteBScanOld, id: "b-new", timestamp: "2024-01-04", score: 85 };
    const siteAScan: SavedScan = { ...baseScan, id: "a-new", timestamp: "2024-01-05", score: 65, findings: [{ ...baseScan.findings[0], ruleId: "r1", ruleTitle: "T1" }, { ...baseScan.findings[0], ruleId: "r1", ruleTitle: "T1" }] };
    mockLoadAllScans.mockReturnValue([siteBScanOld, siteBScanNew, siteAScan]);

    const { result } = renderHook(() => useDashboardData());

    // siteStats sorted ascending by latestScore => site A (65) before site B (85)
    expect(result.current.siteStats[0].url).toBe(siteAScan.url);
    expect(result.current.siteStats[1].url).toBe(siteBScanNew.url);

    // top issues sorted by count: r1 appears twice, r3 once
    expect(result.current.topIssues[0].ruleId).toBe("r1");
    expect(result.current.topIssues[1].ruleId).toBe("r3");
  });

  it("refresh function triggers recomputation", () => {
    mockLoadAllScans.mockReturnValue([baseScan]);
    const { result } = renderHook(() => useDashboardData());

    expect(result.current.totalScans).toBe(1);

    // Update mock to return different data
    const newScan = { ...baseScan, id: "s2", score: 50 };
    mockLoadAllScans.mockReturnValue([baseScan, newScan]);

    // Call refresh
    act(() => {
      result.current.refresh();
    });

    expect(result.current.totalScans).toBe(2);
  });

  it("listens for storage events and refreshes on allylab-scans key", () => {
    let storageHandler: ((e: StorageEvent) => void) | null = null;
    const addEventListenerSpy = vi.spyOn(window, "addEventListener").mockImplementation(
      (type: string, handler: EventListenerOrEventListenerObject) => {
        if (type === "storage") {
          storageHandler = handler as (e: StorageEvent) => void;
        }
      }
    );
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    mockLoadAllScans.mockReturnValue([baseScan]);
    const { result, unmount } = renderHook(() => useDashboardData());

    expect(addEventListenerSpy).toHaveBeenCalledWith("storage", expect.any(Function));

    // Update mock data
    const newScan = { ...baseScan, id: "s2" };
    mockLoadAllScans.mockReturnValue([baseScan, newScan]);

    // Trigger storage event with allylab-scans key
    act(() => {
      storageHandler?.({ key: "allylab-scans" } as StorageEvent);
    });

    expect(result.current.totalScans).toBe(2);

    // Unmount should remove listener
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("storage", expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it("listens for storage events and refreshes on null key", () => {
    let storageHandler: ((e: StorageEvent) => void) | null = null;
    const addEventListenerSpy = vi.spyOn(window, "addEventListener").mockImplementation(
      (type: string, handler: EventListenerOrEventListenerObject) => {
        if (type === "storage") {
          storageHandler = handler as (e: StorageEvent) => void;
        }
      }
    );

    mockLoadAllScans.mockReturnValue([baseScan]);
    const { result } = renderHook(() => useDashboardData());

    // Update mock data
    const newScan = { ...baseScan, id: "s2" };
    mockLoadAllScans.mockReturnValue([baseScan, newScan]);

    // Trigger storage event with null key (localStorage.clear())
    act(() => {
      storageHandler?.({ key: null } as StorageEvent);
    });

    expect(result.current.totalScans).toBe(2);

    addEventListenerSpy.mockRestore();
  });

  it("ignores storage events for other keys", () => {
    let storageHandler: ((e: StorageEvent) => void) | null = null;
    const addEventListenerSpy = vi.spyOn(window, "addEventListener").mockImplementation(
      (type: string, handler: EventListenerOrEventListenerObject) => {
        if (type === "storage") {
          storageHandler = handler as (e: StorageEvent) => void;
        }
      }
    );

    mockLoadAllScans.mockReturnValue([baseScan]);
    const { result } = renderHook(() => useDashboardData());

    const initialScans = result.current.totalScans;

    // Update mock data but don't expect refresh
    const newScan = { ...baseScan, id: "s2" };
    mockLoadAllScans.mockReturnValue([baseScan, newScan]);

    // Trigger storage event with different key
    act(() => {
      storageHandler?.({ key: "other-key" } as StorageEvent);
    });

    // Should not have refreshed
    expect(result.current.totalScans).toBe(initialScans);

    addEventListenerSpy.mockRestore();
  });
});
