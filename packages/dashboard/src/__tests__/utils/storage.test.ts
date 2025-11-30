import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

const makeStorage = (): Storage =>
  ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  } as unknown as Storage);

import {
  loadAllScans,
  saveScan,
  deleteScan,
  getScanById,
  getScannedUrls,
  getScansForUrl,
} from "../../utils/storage";
import type { SavedScan } from "../../types";

const baseScan: SavedScan = {
  id: "1",
  url: "https://example.com",
  timestamp: "2024-01-01T00:00:00.000Z",
  score: 90,
  totalIssues: 1,
  critical: 0,
  serious: 0,
  moderate: 1,
  minor: 0,
  findings: [],
  scanDuration: 1000,
};

describe("utils/storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const storage = makeStorage();
    Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
    Object.defineProperty(globalThis, "window", { value: { localStorage: storage }, configurable: true });
  });

  it("loads empty array when no data", () => {
    (window.localStorage.getItem as Mock).mockReturnValue(null);
    expect(loadAllScans()).toEqual([]);
  });

  it("loads saved scans and handles parse errors", () => {
    (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([baseScan]));
    expect(loadAllScans()[0].id).toBe("1");

    (window.localStorage.getItem as Mock).mockImplementation(() => {
      throw new Error("boom");
    });
    expect(loadAllScans()).toEqual([]);
  });

  it("saves scan, trims list, and persists", () => {
    (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify(Array(101).fill(baseScan)));
    saveScan({ ...baseScan, id: "new" });
    const saved = JSON.parse((window.localStorage.setItem as Mock).mock.calls[0][1]) as SavedScan[];
    expect(saved[0].id).toBe("new");
    expect(saved.length).toBeLessThanOrEqual(100);
  });

  it("does not trim when resulting count is at max", () => {
    const list = Array(99).fill(baseScan); // after unshift becomes 100, not trimmed
    (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify(list));
    saveScan({ ...baseScan, id: "newer" });
    const saved = JSON.parse((window.localStorage.setItem as Mock).mock.calls[0][1]) as SavedScan[];
    expect(saved.length).toBe(100);
  });

  it("deletes scan by id", () => {
    (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([baseScan, { ...baseScan, id: "2" }]));
    deleteScan("1");
    const saved = JSON.parse((window.localStorage.setItem as Mock).mock.calls[0][1]) as SavedScan[];
    expect(saved.find(s => s.id === "1")).toBeUndefined();
  });

  it("gets scan by id", () => {
    (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([baseScan, { ...baseScan, id: "2" }]));
    expect(getScanById("2")?.id).toBe("2");
  });

  it("gets scanned urls and dedupes", () => {
    (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([
      baseScan,
      { ...baseScan, id: "2", url: "https://other.com" },
      { ...baseScan, id: "3", url: "https://example.com" },
    ]));
    expect(getScannedUrls()).toEqual(["https://example.com", "https://other.com"]);
  });

  it("returns scans for a url sorted by timestamp desc", () => {
    (window.localStorage.getItem as Mock).mockReturnValue(JSON.stringify([
      { ...baseScan, id: "old", timestamp: "2024-01-01T00:00:00.000Z" },
      { ...baseScan, id: "new", timestamp: "2024-02-01T00:00:00.000Z" },
      { ...baseScan, id: "other", url: "https://other.com" },
    ]));
    const scans = getScansForUrl("https://example.com");
    expect(scans.map(s => s.id)).toEqual(["new", "old"]);
  });
});
