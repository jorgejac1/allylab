import { act, renderHook } from "@testing-library/react";
import { StrictMode, createElement, type ReactNode } from "react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { useApiStatus } from "../../hooks/useApiStatus";

const mockGetApiBase = vi.hoisted(() => vi.fn());
vi.mock("../../utils/api", () => ({ getApiBase: mockGetApiBase }));

type HealthResp = { ok: boolean; json: () => Promise<Record<string, unknown>> };

describe("hooks/useApiStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetApiBase.mockReturnValue("http://api");
  });

  it("performs initial check and manual checkHealth success", async () => {
    const fetchMock = vi.fn(async (): Promise<HealthResp> => ({
      ok: true,
      json: vi.fn().mockResolvedValue({ status: "ok", timestamp: "t", service: "api", version: "1" }),
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useApiStatus(0));
    await act(async () => {
      await result.current.checkHealth();
    });

    expect(result.current.status).toBe("connected");
    expect(result.current.health?.status).toBe("ok");
    expect(fetchMock).toHaveBeenCalled();
  });

  it("handles health check failure and disconnected state", async () => {
    const fetchMock = vi.fn(async (): Promise<HealthResp> => ({
      ok: false,
      json: vi.fn().mockResolvedValue({}),
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useApiStatus(0));
    await act(async () => {
      await result.current.checkHealth();
    });

    expect(result.current.status).toBe("disconnected");
    expect(result.current.health).toBeNull();
  });

  it("handles fetch errors by returning disconnected state", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("network");
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useApiStatus(0));
    await act(async () => {
      await result.current.checkHealth();
    });

    expect(result.current.status).toBe("disconnected");
    expect(result.current.health).toBeNull();
  });

  it("skips state updates when unmounted during fetch", async () => {
    vi.useFakeTimers();
    let resolveFetch: (() => void) | null = null;
    globalThis.fetch = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = () =>
            resolve({
              ok: false,
              json: vi.fn().mockResolvedValue({}),
            });
        })
    ) as unknown as typeof fetch;

    const { result, unmount } = renderHook(() => useApiStatus(0));
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      result.current.checkHealth();
      unmount();
      resolveFetch?.();
      vi.runAllTimers();
    });

    expect(result.current.status).toBe("checking");
    expect(result.current.health).toBeNull();
    vi.useRealTimers();
  });

  it("runs initial check only once even in strict mode", async () => {
    const fetchMock = vi.fn(async (): Promise<HealthResp> => ({
      ok: true,
      json: vi.fn().mockResolvedValue({ status: "ok", timestamp: "t", service: "api", version: "1" }),
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const wrapper = ({ children }: { children: ReactNode }) => createElement(StrictMode, null, children);
    renderHook(() => useApiStatus(0), { wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("skips initial check when flag disabled", async () => {
    const fetchMock = vi.fn(async (): Promise<HealthResp> => ({
      ok: true,
      json: vi.fn().mockResolvedValue({ status: "ok", timestamp: "t", service: "api", version: "1" }),
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useApiStatus(0, false));
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.status).toBe("checking");
  });

  it("skips subsequent initial checks on rerender", async () => {
    const fetchMock = vi.fn(async (): Promise<HealthResp> => ({
      ok: true,
      json: vi.fn().mockResolvedValue({ status: "ok", timestamp: "t", service: "api", version: "1" }),
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { rerender } = renderHook(() => useApiStatus(0));
    await act(async () => {
      await Promise.resolve();
    });
    rerender();
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("cancels initial check when unmounted before response", async () => {
    let resolveFetch: (() => void) | null = null;
    globalThis.fetch = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = () =>
            resolve({
              ok: true,
              json: vi.fn().mockResolvedValue({ status: "ok", timestamp: "t", service: "api", version: "1" }),
            });
        })
    ) as unknown as typeof fetch;

    const { result, unmount } = renderHook(() => useApiStatus(0));
    unmount();

    await act(async () => {
      resolveFetch?.();
      await Promise.resolve();
    });

    expect(result.current.status).toBe("checking");
    expect(result.current.health).toBeNull();
  });

  it("sets checking state during manual check", async () => {
    const resolveQueue: Array<() => void> = [];
    globalThis.fetch = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveQueue.push(() =>
            resolve({
              ok: true,
              json: vi.fn().mockResolvedValue({ status: "ok", timestamp: "t", service: "api", version: "1" }),
            })
          );
        })
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useApiStatus(0));
    let promise: Promise<void> | undefined;
    await act(async () => {
      promise = result.current.checkHealth();
      expect(result.current.status).toBe("checking");
      resolveQueue.forEach((fn) => fn());
      await promise;
    });
    expect(result.current.status).toBe("connected");
  });

  it("performs periodic checks and handles disconnect", async () => {
    vi.useFakeTimers();
    const okResp: HealthResp = { ok: true, json: vi.fn().mockResolvedValue({ status: "ok", timestamp: "t", service: "api", version: "1" }) };
    const badResp: HealthResp = { ok: false, json: vi.fn().mockResolvedValue({}) };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okResp)
      .mockResolvedValueOnce(okResp)
      .mockResolvedValueOnce(badResp);
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useApiStatus(1000));
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.status).toBe("connected");

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(3); // initial + 2 intervals
    expect(result.current.status).toBe("disconnected");
    expect(result.current.health).toBeNull();
    vi.useRealTimers();
  });

  it("ignores interval callbacks after unmount", async () => {
    vi.useFakeTimers();
    const okResp: HealthResp = { ok: true, json: vi.fn().mockResolvedValue({ status: "ok", timestamp: "t", service: "api", version: "1" }) };
    const badResp: HealthResp = { ok: false, json: vi.fn().mockResolvedValue({}) };
    const fetchMock = vi.fn().mockResolvedValue(okResp);
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    let capturedInterval: (() => void) | undefined;
    const originalSetInterval = globalThis.setInterval;
    const intervalSpy = vi.spyOn(globalThis, "setInterval").mockImplementation(
      (fn: TimerHandler, timeout?: number, ...args: unknown[]): ReturnType<typeof setInterval> => {
        capturedInterval = fn as () => void;
        return originalSetInterval(fn, timeout, ...(args as [])) as unknown as ReturnType<typeof setInterval>;
      }
    );

    const { result, unmount } = renderHook(() => useApiStatus(1000));
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.status).toBe("connected");
    unmount();

    fetchMock.mockResolvedValueOnce(badResp);
    await act(async () => {
      await capturedInterval?.();
    });

    expect(result.current.status).toBe("connected");
    expect(result.current.health?.status).toBe("ok");
    intervalSpy.mockRestore();
    vi.useRealTimers();
  });
});
