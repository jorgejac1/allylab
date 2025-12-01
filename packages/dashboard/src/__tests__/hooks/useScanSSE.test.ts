import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useScanSSE } from "../../hooks/useScanSSE";

const encoder = new TextEncoder();

describe("hooks/useScanSSE", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("processes SSE events and invokes callbacks", async () => {
    const onProgress = vi.fn();
    const onComplete = vi.fn();
    const onFinding = vi.fn();
    const lines =
      "event:status\n" +
      'data:{"message":"Starting"}\n\n' +
      "event:progress\n" +
      'data:{"percent":50,"message":"Half"}\n\n' +
      "event:finding\n" +
      'data:{"id":"f1","ruleId":"r1"}\n\n' +
      "event:complete\n" +
      'data:{"id":"s1","url":"","timestamp":"","score":90,"totalIssues":0,"critical":0,"serious":0,"moderate":0,"minor":0,"findings":[],"scanDuration":0}\n\n';
    const reader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({ done: false, value: encoder.encode(lines) })
        .mockResolvedValueOnce({ done: true, value: undefined }),
    };
    type Reader = { read: () => Promise<{ done: boolean; value?: Uint8Array }> };
    type FetchResp = { ok: boolean; body: { getReader: () => Reader } };
    const fetchMock = vi.fn(async (): Promise<FetchResp> => ({
      ok: true,
      body: { getReader: () => reader },
    } as FetchResp));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useScanSSE({ onProgress, onComplete, onFinding }));

    await act(async () => {
      await result.current.startScan("https://example.com");
    });

    expect(onFinding).toHaveBeenCalledWith(expect.objectContaining({ id: "f1" }));
    expect(onComplete).toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalled();
    expect(result.current.progress.status).toBe("complete");
    expect(result.current.findings.length).toBe(1);
    expect(result.current.result?.score).toBe(90);
  });

  it("handles cancel, error, and reset states", async () => {
    const fetchMock = vi.fn(async (): Promise<{ ok: boolean; json: () => Promise<{ error: string }> }> => ({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: "fail" }),
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const onError = vi.fn();

    const { result } = renderHook(() => useScanSSE({ onError }));

    await act(async () => {
      await result.current.startScan("https://bad.com");
    });
    expect(onError).toHaveBeenCalled();
    expect(result.current.error).toBe("fail");

    act(() => result.current.cancelScan());
    expect(result.current.progress.status).toBe("cancelled");

    act(() => result.current.reset());
    expect(result.current.progress.status).toBe("idle");
    expect(result.current.findings.length).toBe(0);
  });

  it("handles SSE error events and ignores malformed JSON chunks", async () => {
    const onError = vi.fn();
    const lines =
      "event:status\n" +
      'data:{"message":"Scanning"}\n\n' +
      "event:finding\n" +
      "data:not-json\n\n" + // malformed; should be ignored
      "event:error\n" +
      'data:"oops"\n\n';

    const reader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({ done: false, value: encoder.encode(lines) })
        .mockResolvedValueOnce({ done: true, value: undefined }),
    };
    type Reader = { read: () => Promise<{ done: boolean; value?: Uint8Array }> };
    type FetchResp = { ok: boolean; body: { getReader: () => Reader } };
    globalThis.fetch = vi.fn(async (): Promise<FetchResp> => ({
      ok: true,
      body: { getReader: () => reader },
    })) as unknown as typeof fetch;

    const { result } = renderHook(() => useScanSSE({ onError }));

    await act(async () => {
      await result.current.startScan("https://example.com");
    });

    await waitFor(() => expect(onError).toHaveBeenCalledWith("oops"));
    expect(result.current.error).toBe("oops");
    expect(result.current.progress.status).toBe("error");
    // malformed finding should not have been added
    expect(result.current.findings.length).toBe(0);
  });

  it("uses response error body when request fails", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: "bad request" }),
    })) as unknown as typeof fetch;
    const onError = vi.fn();

    const { result } = renderHook(() => useScanSSE({ onError }));
    await act(async () => {
      await result.current.startScan("https://example.com");
    });

    expect(result.current.error).toBe("bad request");
    expect(onError).toHaveBeenCalledWith("bad request");
  });

  it("uses HTTP status when response error body is empty", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 503,
      json: vi.fn().mockResolvedValue({}),
    })) as unknown as typeof fetch;
    const onError = vi.fn();

    const { result } = renderHook(() => useScanSSE({ onError }));
    await act(async () => {
      await result.current.startScan("https://example.com");
    });

    expect(result.current.error).toBe("HTTP 503");
    expect(onError).toHaveBeenCalledWith("HTTP 503");
  });

  it("parses progress data events and updates progress state", async () => {
    const lines =
      "event:progress\n" +
      'data:{"percent":25,"message":"quarter"}\n\n' +
      "event:progress\n" +
      'data:{"percent":75,"message":"almost"}\n\n';
    const reader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({ done: false, value: encoder.encode(lines) })
        .mockResolvedValueOnce({ done: true, value: undefined }),
    };
    type Reader = { read: () => Promise<{ done: boolean; value?: Uint8Array }> };
    type FetchResp = { ok: boolean; body: { getReader: () => Reader } };
    globalThis.fetch = vi.fn(async (): Promise<FetchResp> => ({
      ok: true,
      body: { getReader: () => reader },
    })) as unknown as typeof fetch;

    const { result } = renderHook(() => useScanSSE());
    await act(async () => {
      await result.current.startScan("https://example.com");
    });

    expect(result.current.progress.percent).toBe(75);
    expect(result.current.progress.status).toBe("scanning");
  });

  it("ignores empty data chunks", async () => {
    const onProgress = vi.fn();
    const lines =
      "event:progress\n" +
      "data:   \n\n"; // empty after trim; should be skipped
    const reader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({ done: false, value: encoder.encode(lines) })
        .mockResolvedValueOnce({ done: true, value: undefined }),
    };
    type Reader = { read: () => Promise<{ done: boolean; value?: Uint8Array }> };
    type FetchResp = { ok: boolean; body: { getReader: () => Reader } };
    globalThis.fetch = vi.fn(async (): Promise<FetchResp> => ({
      ok: true,
      body: { getReader: () => reader },
    })) as unknown as typeof fetch;

    const { result } = renderHook(() => useScanSSE({ onProgress }));
    await act(async () => {
      await result.current.startScan("https://example.com");
    });

    // Only initial progress updates (connecting + scanning)
    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(result.current.progress.percent).toBe(10);
    expect(result.current.progress.status).toBe("scanning");
  });

  it("sets error when response lacks body", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      body: null,
    })) as unknown as typeof fetch;
    const onError = vi.fn();

    const { result } = renderHook(() => useScanSSE({ onError }));
    await act(async () => {
      await result.current.startScan("https://example.com");
    });

    expect(result.current.error).toBe("No response body");
    expect(onError).toHaveBeenCalledWith("No response body");
    expect(result.current.progress.status).toBe("error");
  });

  it("defaults error event message when payload lacks message", async () => {
    const lines =
      "event:error\n" +
      "data:{}\n\n";
    const reader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({ done: false, value: encoder.encode(lines) })
        .mockResolvedValueOnce({ done: true, value: undefined }),
    };
    type Reader = { read: () => Promise<{ done: boolean; value?: Uint8Array }> };
    type FetchResp = { ok: boolean; body: { getReader: () => Reader } };
    const onError = vi.fn();
    globalThis.fetch = vi.fn(async (): Promise<FetchResp> => ({
      ok: true,
      body: { getReader: () => reader },
    })) as unknown as typeof fetch;

    const { result } = renderHook(() => useScanSSE({ onError }));
    await act(async () => {
      await result.current.startScan("https://example.com");
    });

    expect(result.current.error).toBe("Unknown error");
    expect(onError).toHaveBeenCalledWith("Unknown error");
  });

  it("handles fetch rejection with non-Error value", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw "boom";
    }) as unknown as typeof fetch;
    const onError = vi.fn();

    const { result } = renderHook(() => useScanSSE({ onError }));
    await act(async () => {
      await result.current.startScan("https://example.com");
    });

    expect(result.current.error).toBe("Unknown error");
    expect(onError).toHaveBeenCalledWith("Unknown error");
  });

  it("falls back to generic message when response json fails", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      json: vi.fn().mockRejectedValue(new Error("bad json")),
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const onError = vi.fn();

    const { result } = renderHook(() => useScanSSE({ onError }));
    await act(async () => {
      await result.current.startScan("https://example.com");
    });

    expect(result.current.error).toBe("Scan failed");
    expect(onError).toHaveBeenCalledWith("Scan failed");
  });

  it("aborts in-flight scan without raising errors", async () => {
    const abortMock = vi.fn();
    class MockAbortController {
      signal = {} as AbortSignal;
      abort = abortMock;
    }
    vi.stubGlobal("AbortController", MockAbortController as unknown as typeof AbortController);

    let rejectRead: (reason?: unknown) => void = () => {};
    const reader = {
      read: vi.fn(() => new Promise<never>((_resolve, reject) => { rejectRead = reject; })),
    };
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      body: { getReader: () => reader },
    })) as unknown as typeof fetch;

    const { result } = renderHook(() => useScanSSE());

    await act(async () => {
      const promise = result.current.startScan("https://example.com");
      await Promise.resolve();
      result.current.cancelScan();
      expect(abortMock).toHaveBeenCalled();
      const abortErr = new Error("aborted");
      abortErr.name = "AbortError";
      rejectRead(abortErr);
      await promise;
    });
    expect(result.current.error).toBeNull();
    expect(result.current.progress.status).toBe("cancelled");

    vi.unstubAllGlobals();
  });
});
