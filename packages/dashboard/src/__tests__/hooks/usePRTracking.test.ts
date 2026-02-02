/**
 * @vitest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { usePRTracking } from "../../hooks/usePRTracking";
import type { PRResult, PRTrackingInfo, VerificationResult } from "../../types/github";

const makeStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((k: string) => store[k] ?? null),
    setItem: vi.fn((k: string, v: string) => {
      store[k] = v;
    }),
  } as unknown as Storage;
};

const mockGetApiBase = vi.hoisted(() => vi.fn());
vi.mock("../../utils/api", () => ({ getApiBase: mockGetApiBase }));

describe("hooks/usePRTracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetApiBase.mockReturnValue("http://api");
    Object.defineProperty(globalThis, "localStorage", { value: makeStorage(), configurable: true });
  });

  it("tracks PRs and ignores invalid results", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => usePRTracking());

    act(() => {
      const invalid: PRResult = { success: false };
      result.current.trackPR(invalid, "o", "r", [], { scanUrl: "u" });
    });
    expect(consoleSpy).toHaveBeenCalled();

    act(() => {
      result.current.trackPR(
        { success: true, prNumber: 1, prUrl: "url", branchName: "b" },
        "o",
        "r",
        ["f1"],
        { scanUrl: "u", scanStandard: "wcag", scanViewport: "desktop" }
      );
    });
    expect(result.current.trackedPRs.length).toBe(1);
    consoleSpy.mockRestore();
  });

  it("checks PR status and refreshes all", async () => {
    type StatusResponse = { ok: boolean; json: () => Promise<{ merged: boolean; state: string }> };
    const statusResp: StatusResponse = { ok: true, json: vi.fn().mockResolvedValue({ merged: true, state: "closed" }) };
    globalThis.fetch = vi.fn(async (): Promise<StatusResponse> => statusResp) as unknown as typeof fetch;
    const tracked: PRTrackingInfo[] = [
      {
        id: "id1",
        prNumber: 1,
        prUrl: "url",
        owner: "o",
        repo: "r",
        branchName: "b",
        findingIds: [],
        createdAt: "now",
        status: "open",
        scanUrl: "u",
      },
    ];
    localStorage.setItem("allylab_tracked_prs", JSON.stringify(tracked));
    const { result } = renderHook(() => usePRTracking());

    const status = await result.current.checkPRStatus("o", "r", 1);
    expect(status?.merged).toBe(true);

    await act(async () => {
      await result.current.refreshAllStatuses();
    });
    expect(result.current.trackedPRs[0].status).toBe("merged");
  });

  it("handles failed PR status responses and unknown errors", async () => {
    type StatusResponse = { ok: boolean; json: () => Promise<{ error?: string }> };
    // non-ok response triggers error message
    globalThis.fetch = vi.fn(async (): Promise<StatusResponse> => ({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: "nope" }),
    })) as unknown as typeof fetch;
    const { result } = renderHook(() => usePRTracking());
    const status = await result.current.checkPRStatus("o", "r", 2);
    expect(status).toBeNull();

    // throw non-Error to hit unknown error branch
    globalThis.fetch = vi.fn(async () => {
      throw "boom";
    }) as unknown as typeof fetch;
    const status2 = await result.current.checkPRStatus("o", "r", 3);
    expect(status2).toBeNull();
  });

  it("uses default status error when response has no error message", async () => {
    type StatusResponse = { ok: boolean; json: () => Promise<Record<string, never>> };
    globalThis.fetch = vi.fn(async (): Promise<StatusResponse> => ({
      ok: false,
      json: vi.fn().mockResolvedValue({}),
    })) as unknown as typeof fetch;
    const { result } = renderHook(() => usePRTracking());
    const status = await result.current.checkPRStatus("o", "r", 4);
    expect(status).toBeNull();
  });

  it("keeps existing status when checkPRStatus returns null", async () => {
    const tracked: PRTrackingInfo[] = [
      {
        id: "id2",
        prNumber: 2,
        prUrl: "url2",
        owner: "o",
        repo: "r",
        branchName: "b",
        findingIds: [],
        createdAt: "now",
        status: "open",
        scanUrl: "u",
      },
    ];
    localStorage.setItem("allylab_tracked_prs", JSON.stringify(tracked));
    globalThis.fetch = vi.fn(async () => {
      throw new Error("bad");
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => usePRTracking());

    await act(async () => {
      await result.current.refreshAllStatuses();
    });
    expect(result.current.trackedPRs[0].status).toBe("open");
  });

  it("maps closed status when PR not merged", async () => {
    type StatusResponse = { ok: boolean; json: () => Promise<{ merged: boolean; state: string }> };
    globalThis.fetch = vi.fn(async (): Promise<StatusResponse> => ({
      ok: true,
      json: vi.fn().mockResolvedValue({ merged: false, state: "closed" }),
    })) as unknown as typeof fetch;
    const tracked: PRTrackingInfo[] = [{
      id: "id4",
      prNumber: 4,
      prUrl: "url4",
      owner: "o",
      repo: "r",
      branchName: "b",
      findingIds: [],
      createdAt: "now",
      status: "open",
      scanUrl: "u",
    }];
    localStorage.setItem("allylab_tracked_prs", JSON.stringify(tracked));
    const { result } = renderHook(() => usePRTracking());

    await act(async () => {
      await result.current.refreshAllStatuses();
    });

    expect(result.current.trackedPRs[0].status).toBe("closed");
  });

  it("maps open status when PR remains open", async () => {
    type StatusResponse = { ok: boolean; json: () => Promise<{ merged: boolean; state: string }> };
    globalThis.fetch = vi.fn(async (): Promise<StatusResponse> => ({
      ok: true,
      json: vi.fn().mockResolvedValue({ merged: false, state: "open" }),
    })) as unknown as typeof fetch;
    const tracked: PRTrackingInfo[] = [{
      id: "idOpen",
      prNumber: 7,
      prUrl: "url7",
      owner: "o",
      repo: "r",
      branchName: "b",
      findingIds: [],
      createdAt: "now",
      status: "closed",
      scanUrl: "u",
    }];
    localStorage.setItem("allylab_tracked_prs", JSON.stringify(tracked));
    const { result } = renderHook(() => usePRTracking());

    await act(async () => {
      await result.current.refreshAllStatuses();
    });

    expect(result.current.trackedPRs[0].status).toBe("open");
  });

  it("sets error when refreshAllStatuses throws", async () => {
    const origAll = Promise.all;
    // Force Promise.all rejection
    Promise.all = vi.fn().mockRejectedValue(new Error("refresh boom"));

    const tracked: PRTrackingInfo[] = [
      {
        id: "id3",
        prNumber: 3,
        prUrl: "url3",
        owner: "o",
        repo: "r",
        branchName: "b",
        findingIds: [],
        createdAt: "now",
        status: "open",
        scanUrl: "u",
      },
    ];
    localStorage.setItem("allylab_tracked_prs", JSON.stringify(tracked));
    const { result } = renderHook(() => usePRTracking());

    await act(async () => {
      await result.current.refreshAllStatuses();
    });
    expect(result.current.error).toBe("refresh boom");
    // restore
    Promise.all = origAll;
  });

  it("sets unknown error when refreshAllStatuses throws non-Error", async () => {
    const origAll = Promise.all;
    try {
      // Force Promise.all rejection with non-Error
      Promise.all = vi.fn().mockRejectedValue("weird");

      const tracked: PRTrackingInfo[] = [
        {
          id: "idUnknown",
          prNumber: 8,
          prUrl: "url8",
          owner: "o",
          repo: "r",
          branchName: "b",
          findingIds: [],
          createdAt: "now",
          status: "open",
          scanUrl: "u",
        },
      ];
      localStorage.setItem("allylab_tracked_prs", JSON.stringify(tracked));
      const { result } = renderHook(() => usePRTracking());

      await act(async () => {
        await result.current.refreshAllStatuses();
      });
      expect(result.current.error).toBe("Unknown error");
    } finally {
      Promise.all = origAll;
    }
  });

  it("verifies fixes and handles errors/missing PR", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => usePRTracking());

    const missing = await result.current.verifyFixes("missing");
    expect(missing).toBeNull();

    act(() => {
      result.current.trackPR(
        { success: true, prNumber: 1, prUrl: "url", branchName: "b" },
        "o",
        "r",
        ["f1"],
        { scanUrl: "u" }
      );
    });
    type VerifyResponse = { ok: boolean; json: () => Promise<{ success: boolean; allFixed?: boolean; error?: string }> };
    globalThis.fetch = vi.fn(async (): Promise<VerifyResponse> => ({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, allFixed: true }),
    } as VerifyResponse)) as unknown as typeof fetch;
    const prId = result.current.trackedPRs[0].id;
    let verified: VerificationResult | null = null;
    await act(async () => {
      verified = await result.current.verifyFixes(prId);
    });
    expect(verified).not.toBeNull();
    expect(result.current.trackedPRs[0].verificationStatus).toBe("verified");

    globalThis.fetch = vi.fn(async (): Promise<VerifyResponse> => ({
      ok: false,
      json: vi.fn().mockResolvedValue({ success: false, error: "bad" }),
    } as VerifyResponse)) as unknown as typeof fetch;
    let failed: VerificationResult | null = null;
    await act(async () => {
      failed = await result.current.verifyFixes(prId);
    });
    expect(failed).toBeNull();
    expect(result.current.error).toBe("bad");
    consoleSpy.mockRestore();
  });

  it("leaves non-target PRs unchanged when verifying fixes", async () => {
    const { result } = renderHook(() => usePRTracking());
    act(() => {
      result.current.trackPR({ success: true, prNumber: 10, prUrl: "url10", branchName: "b10" }, "o", "r", ["f10"], { scanUrl: "u" });
      result.current.trackPR({ success: true, prNumber: 11, prUrl: "url11", branchName: "b11" }, "o", "r", ["f11"], { scanUrl: "u" });
    });
    const targetId = result.current.trackedPRs[0].id;
    type VerifyResponse = { ok: boolean; json: () => Promise<{ success: boolean; allFixed?: boolean; error?: string }> };
    globalThis.fetch = vi.fn(async (): Promise<VerifyResponse> => ({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, allFixed: false }),
    } as VerifyResponse)) as unknown as typeof fetch;

    await act(async () => {
      await result.current.verifyFixes(targetId);
    });

    expect(result.current.trackedPRs[0].verificationStatus).toBe("failed");
    expect(result.current.trackedPRs[1].verificationStatus).toBeUndefined();
  });

  it("uses default verification error when response lacks message", async () => {
    const { result } = renderHook(() => usePRTracking());
    act(() => {
      result.current.trackPR({ success: true, prNumber: 5, prUrl: "url5", branchName: "b5" }, "o", "r", ["f5"], { scanUrl: "u" });
    });
    const prId = result.current.trackedPRs[0].id;
    type VerifyResponse = { ok: boolean; json: () => Promise<{ success: boolean; error?: string }> };
    globalThis.fetch = vi.fn(async (): Promise<VerifyResponse> => ({
      ok: false,
      json: vi.fn().mockResolvedValue({ success: false }),
    } as VerifyResponse)) as unknown as typeof fetch;

    await act(async () => {
      const res = await result.current.verifyFixes(prId);
      expect(res).toBeNull();
    });
    expect(result.current.error).toBe("Verification failed");
  });

  it("handles verifyFixes thrown non-Error as unknown error", async () => {
    const { result } = renderHook(() => usePRTracking());
    act(() => {
      result.current.trackPR({ success: true, prNumber: 6, prUrl: "url6", branchName: "b6" }, "o", "r", ["f6"], { scanUrl: "u" });
    });
    const prId = result.current.trackedPRs[0].id;
    globalThis.fetch = vi.fn(async () => {
      throw "boom";
    }) as unknown as typeof fetch;

    await act(async () => {
      const res = await result.current.verifyFixes(prId);
      expect(res).toBeNull();
    });
    expect(result.current.error).toBe("Unknown error");
  });

  it("filters, removes, and clears tracked PRs", () => {
    const { result } = renderHook(() => usePRTracking());
    act(() => {
      result.current.trackPR(
        { success: true, prNumber: 2, prUrl: "url2", branchName: "b2" },
        "o",
        "r",
        ["f2"],
        { scanUrl: "u" }
      );
    });
    const prId = result.current.trackedPRs[0].id;
    expect(result.current.getPRsForFinding("f2").length).toBe(1);
    act(() => result.current.removePR(prId));
    expect(result.current.trackedPRs.length).toBe(0);
    act(() => result.current.clearAll());
    expect(result.current.trackedPRs.length).toBe(0);
  });
});
