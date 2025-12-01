import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { useCompetitors } from "../../hooks/useCompetitors";
import type { CompetitorScan, Competitor } from "../../types";

const mockGetApiBase = vi.hoisted(() => vi.fn());
vi.mock("../../utils/api", () => ({ getApiBase: mockGetApiBase }));

const makeStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((k: string) => store[k] ?? null),
    setItem: vi.fn((k: string, v: string) => {
      store[k] = v;
    }),
  } as unknown as Storage;
};

describe("hooks/useCompetitors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetApiBase.mockReturnValue("http://api");
    Object.defineProperty(globalThis, "localStorage", { value: makeStorage(), configurable: true });
  });

  it("adds, updates, removes competitors and saves to storage", () => {
    const { result } = renderHook(() => useCompetitors());

    let added: Competitor | null = null;
    act(() => {
      added = result.current.addCompetitor("https://a.com", "A");
    });
    expect(added).not.toBeNull();
    expect((added as Competitor | null)?.url).toBe("https://a.com");
    expect(localStorage.setItem).toHaveBeenCalled();

    act(() => {
      result.current.updateCompetitor(added!.id, { enabled: false, name: "AA" });
    });
    expect(result.current.competitors[0].name).toBe("AA");

    act(() => {
      result.current.removeCompetitor(added!.id);
    });
    expect(result.current.competitors.length).toBe(0);
  });

  it("scans a competitor and handles errors", async () => {
    type ScanJson = {
      score: number;
      totalIssues: number;
      critical: number;
      serious: number;
      moderate: number;
      minor: number;
    };
    type ScanResponse = { ok: boolean; json: () => Promise<ScanJson> };
    const scanResp: ScanResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        score: 80,
        totalIssues: 1,
        critical: 0,
        serious: 1,
        moderate: 0,
        minor: 0,
      }),
    };
    const fetchMock = vi.fn(async (): Promise<ScanResponse> => scanResp);
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { result } = renderHook(() => useCompetitors());
    let comp!: Competitor;
    act(() => {
      comp = result.current.addCompetitor("https://b.com");
    });
    let scanResult: CompetitorScan | null = null;
    await act(async () => {
      scanResult = await result.current.scanCompetitor(comp);
    });
    expect(scanResult).not.toBeNull();
    expect((scanResult as CompetitorScan | null)?.score).toBe(80);
    expect(result.current.scans[0]?.competitorId).toBe(comp.id);

    globalThis.fetch = vi.fn(async (): Promise<ScanResponse> => ({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: "fail" }),
    } as ScanResponse)) as unknown as typeof fetch;
    await act(async () => {
      const res = await result.current.scanCompetitor(comp);
      expect(res).toBeNull();
    });

    const respFail: ScanResponse = { ok: false, json: vi.fn().mockResolvedValue({}) };
    globalThis.fetch = vi.fn(async (): Promise<ScanResponse> => respFail) as unknown as typeof fetch;
    await act(async () => {
      const res = await result.current.scanCompetitor(comp);
      expect(res).toBeNull();
    });
  });

  it("scans all enabled competitors with delay", async () => {
    const setTimeoutSpy = vi.spyOn(global, "setTimeout").mockImplementation((cb: TimerHandler) => {
      if (typeof cb === "function") cb();
      return 0 as unknown as NodeJS.Timeout;
    });
    const compA: Competitor = { id: "c1", url: "https://c.com", name: "C", enabled: true };
    const compB: Competitor = { id: "d1", url: "https://d.com", name: "D", enabled: true };
    localStorage.setItem("allylab_competitors", JSON.stringify([compA, compB]));
    type ScanJson = {
      score: number;
      totalIssues: number;
      critical: number;
      serious: number;
      moderate: number;
      minor: number;
    };
    type ScanResponse = { ok: boolean; json: () => Promise<ScanJson> };
    const scanResp: ScanResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        score: 70,
        totalIssues: 0,
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0,
      }),
    };
    const fetchMock = vi.fn(async (): Promise<ScanResponse> => scanResp);
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useCompetitors());
    await act(async () => {});

    await act(async () => {
      await result.current.scanAll();
    });

    expect(result.current.scans.length).toBe(2);
    expect(setTimeoutSpy).toHaveBeenCalled();
    setTimeoutSpy.mockRestore();
  });

  it("removes competitor and filters stored scans", () => {
    const compRemove: Competitor = { id: "rem", url: "https://rem.com", name: "Rem", enabled: true };
    const compKeep: Competitor = { id: "keep", url: "https://keep.com", name: "Keep", enabled: true };
    const scans: CompetitorScan[] = [
      { competitorId: "rem", url: compRemove.url, name: compRemove.name, score: 80, totalIssues: 0, critical: 0, serious: 0, moderate: 0, minor: 0, scannedAt: new Date().toISOString() },
      { competitorId: "keep", url: compKeep.url, name: compKeep.name, score: 90, totalIssues: 0, critical: 0, serious: 0, moderate: 0, minor: 0, scannedAt: new Date().toISOString() },
    ];
    localStorage.setItem("allylab_competitors", JSON.stringify([compRemove, compKeep]));
    localStorage.setItem("allylab_competitor_scans", JSON.stringify(scans));

    const { result } = renderHook(() => useCompetitors());
    act(() => {
      result.current.removeCompetitor("rem");
    });
    expect(result.current.competitors.map(c => c.id)).toEqual(["keep"]);
    expect(result.current.scans.map(s => s.competitorId)).toEqual(["keep"]);
  });

  it("builds benchmark data and returns null when missing inputs", () => {
    const comp: Competitor = { id: "comp1", url: "https://a.com", name: "A", enabled: true, lastScore: 75 };
    const scan: CompetitorScan = {
      competitorId: "comp1",
      url: comp.url,
      name: comp.name,
      score: 75,
      totalIssues: 0,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
      scannedAt: new Date().toISOString(),
    };
    localStorage.setItem("allylab_competitors", JSON.stringify([comp]));
    localStorage.setItem("allylab_competitor_scans", JSON.stringify([scan]));

    const { result, rerender } = renderHook(({ url, score }) => useCompetitors(url, score), {
      initialProps: { url: undefined as string | undefined, score: undefined as number | undefined },
    });
    expect(result.current.getBenchmarkData()).toBeNull();

    act(() => {
      result.current.addCompetitor("https://a.com");
    });
    rerender({ url: "https://yoursite.com", score: 90 });
    act(() => {
      result.current.updateCompetitor(result.current.competitors[0].id, { lastScore: 80 });
    });

    const data = result.current.getBenchmarkData();
    expect(data?.yourSite.score).toBe(90);
    expect(data?.summary.totalCompetitors).toBeGreaterThanOrEqual(0);

    // no latest scans => null
    localStorage.setItem("allylab_competitor_scans", JSON.stringify([]));
    const { result: result2 } = renderHook(() => useCompetitors("https://yoursite.com", 90));
    expect(result2.current.getBenchmarkData()).toBeNull();
  });

  it("calculates grades for various scores", () => {
    // inject scans with different scores to hit grade thresholds
    const scans: CompetitorScan[] = [
      { competitorId: "c1", url: "https://a.com", name: "A", score: 95, totalIssues: 0, critical: 0, serious: 0, moderate: 0, minor: 0, scannedAt: new Date().toISOString() },
      { competitorId: "c2", url: "https://b.com", name: "B", score: 85, totalIssues: 0, critical: 0, serious: 0, moderate: 0, minor: 0, scannedAt: new Date().toISOString() },
      { competitorId: "c3", url: "https://c.com", name: "C", score: 75, totalIssues: 0, critical: 0, serious: 0, moderate: 0, minor: 0, scannedAt: new Date().toISOString() },
      { competitorId: "c4", url: "https://d.com", name: "D", score: 65, totalIssues: 0, critical: 0, serious: 0, moderate: 0, minor: 0, scannedAt: new Date().toISOString() },
      { competitorId: "c5", url: "https://f.com", name: "F", score: 50, totalIssues: 0, critical: 0, serious: 0, moderate: 0, minor: 0, scannedAt: new Date().toISOString() },
    ];
    localStorage.setItem("allylab_competitor_scans", JSON.stringify(scans));
    localStorage.setItem("allylab_competitors", JSON.stringify(scans.map(s => ({ id: s.competitorId, url: s.url, name: s.name, enabled: true, lastScore: s.score }))));

    const { result: rerendered } = renderHook(() => useCompetitors("https://yoursite.com", 90));
    const data = rerendered.current.getBenchmarkData();
    expect(data?.yourSite.grade).toBe("A");
    expect(data?.competitors.map(s => s.score)).toContain(85);
    expect(data?.summary.averageScore).toBeGreaterThan(0);
  });

  it("returns expected grades for B/C/D/F thresholds", () => {
    const competitor: Competitor = { id: "c1", url: "https://a.com", name: "A", enabled: true, lastScore: 50 };
    const scan: CompetitorScan = {
      competitorId: "c1",
      url: competitor.url,
      name: competitor.name,
      score: 50,
      totalIssues: 0,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
      scannedAt: new Date().toISOString(),
    };
    localStorage.setItem("allylab_competitors", JSON.stringify([competitor]));
    localStorage.setItem("allylab_competitor_scans", JSON.stringify([scan]));

    const { result, rerender } = renderHook(({ score }) => useCompetitors("https://yoursite.com", score), {
      initialProps: { score: 85 },
    });
    expect(result.current.getBenchmarkData()?.yourSite.grade).toBe("B");

    rerender({ score: 75 });
    expect(result.current.getBenchmarkData()?.yourSite.grade).toBe("C");

    rerender({ score: 65 });
    expect(result.current.getBenchmarkData()?.yourSite.grade).toBe("D");

    rerender({ score: 50 });
    expect(result.current.getBenchmarkData()?.yourSite.grade).toBe("F");
  });
});
