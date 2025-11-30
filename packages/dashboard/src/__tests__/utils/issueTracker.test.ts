import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { trackFindings, getTrackingStats, getPreviousFingerprints } from "../../utils/issueTracker";
import type { Finding, SavedScan } from "../../types";

const baseFinding: Finding = {
  id: "1",
  ruleId: "r1",
  ruleTitle: "Title",
  description: "desc",
  impact: "critical",
  selector: "#a",
  html: "<div>",
  helpUrl: "",
  wcagTags: [],
};

const makeStorage = () =>
  ({
    getItem: vi.fn(),
    setItem: vi.fn(),
  } as unknown as Storage);

describe("utils/issueTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const storage = makeStorage();
    Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
    const globalWithWindow = globalThis as unknown as { window?: Window };
    if (!globalWithWindow.window) globalWithWindow.window = {} as Window;
    Object.defineProperty(globalWithWindow.window, "localStorage", { value: storage, configurable: true });
  });

  it("shares mocked localStorage between global and window", () => {
    const globalWithWindow = globalThis as unknown as { window: Window };
    expect(globalWithWindow.window.localStorage).toBe(localStorage);
  });

  it("treats missing tracker data as empty map", () => {
    (localStorage.getItem as Mock).mockReturnValueOnce(null);
    const result = trackFindings([baseFinding], "2024-01-01T00:00:00Z");
    expect(result[0].status).toBe("new");
    expect((localStorage.setItem as Mock)).toHaveBeenCalled();
  });

  it("recovers when tracker data is corrupted", () => {
    (localStorage.getItem as Mock).mockImplementationOnce(() => {
      throw new Error("parse fail");
    });
    const result = trackFindings([baseFinding], "2024-01-01T00:00:00Z");
    expect(result[0].status).toBe("new");
    expect((localStorage.setItem as Mock)).toHaveBeenCalled();
  });

  it("tracks new and recurring findings", () => {
    const first = trackFindings([baseFinding], "2024-01-01T00:00:00Z");
    expect(first[0].status).toBe("new");
    // Feed the stored data back to simulate recurring
    const stored = (localStorage.setItem as Mock).mock.calls[0][1];
    (localStorage.getItem as Mock).mockReturnValue(stored);
    const second = trackFindings([baseFinding], "2024-01-02T00:00:00Z");
    expect(second[0].status).toBe("recurring");
  });

  it("calculates tracking stats", () => {
    const stats = getTrackingStats([
      { ...baseFinding, fingerprint: "f1", status: "new" as const },
      { ...baseFinding, fingerprint: "f2", status: "recurring" as const },
      { ...baseFinding, fingerprint: "f3", status: "fixed" as const },
    ]);
    expect(stats.total).toBe(3);
    expect(stats.recurring).toBe(1);
  });

  it("gets previous fingerprints by url", () => {
    const scan: SavedScan = {
      id: "s1",
      url: "https://example.com",
      timestamp: "2024-01-01T00:00:00Z",
      score: 90,
      totalIssues: 1,
      critical: 1,
      serious: 0,
      moderate: 0,
      minor: 0,
      findings: [baseFinding],
      scanDuration: 1,
      trackedFindings: [{ ...baseFinding, fingerprint: "fp1", status: "new" }],
    };
    (localStorage.getItem as Mock).mockReturnValue(JSON.stringify([scan]));
    const fps = getPreviousFingerprints("https://example.com");
    expect(fps.has("fp1")).toBe(true);
  });

  it("ignores scans without trackedFindings", () => {
    const scan: SavedScan = {
      id: "s1",
      url: "https://example.com",
      timestamp: "2024-01-01T00:00:00Z",
      score: 90,
      totalIssues: 1,
      critical: 1,
      serious: 0,
      moderate: 0,
      minor: 0,
      findings: [baseFinding],
      scanDuration: 1,
    };
    (localStorage.getItem as Mock).mockReturnValue(JSON.stringify([scan]));
    const fps = getPreviousFingerprints("https://example.com");
    expect(fps.size).toBe(0);
  });
});
