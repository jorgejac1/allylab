import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { useSiteScan } from "../../hooks/useSiteScan";

const encoder = new TextEncoder();

describe("hooks/useSiteScan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("processes site scan SSE events", async () => {
    const events =
      "\n\n" + // blank chunk
      "event:status\ndata:{\"phase\":\"crawl\"}\n\n" +
      "event:crawl-complete\ndata:{\"urls\":[\"a\"],\"totalFound\":1}\n\n" +
      "event:page-start\ndata:{\"index\":1}\n\n" +
      "event:page-complete\ndata:{\"url\":\"a\",\"score\":90,\"totalIssues\":0,\"critical\":0,\"serious\":0,\"moderate\":0,\"minor\":0,\"scanTime\":1}\n\n" +
      "event:status\ndata:{\"phase\":\"scan\"}\n\n" +
      "event:error\ndata:{\"message\":\"oh no\"}\n\n" +
      "event:complete\ndata:{\"pagesScanned\":1,\"averageScore\":90,\"totalIssues\":0,\"critical\":0,\"serious\":0,\"moderate\":0,\"minor\":0,\"results\":[]}\n\n";
    const reader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({ done: false, value: encoder.encode(events) })
        .mockResolvedValueOnce({ done: true, value: undefined }),
    };
    type Reader = { read: () => Promise<{ done: boolean; value?: Uint8Array }> };
    type FetchResp = { ok: boolean; body: { getReader: () => Reader } };
    globalThis.fetch = vi.fn(async (): Promise<FetchResp> => ({
      ok: true,
      body: { getReader: () => reader },
    } as FetchResp)) as unknown as typeof fetch;

    const { result } = renderHook(() => useSiteScan());
    await act(async () => {
      await result.current.startScan("https://example.com");
    });

    expect(result.current.phase).toBe("complete");
    expect(result.current.discoveredUrls.length).toBe(1);
    expect(result.current.results.length).toBe(1);
    expect(result.current.summary?.averageScore).toBe(90);
    expect(result.current.error).toBe("oh no");
    expect(result.current.isScanning).toBe(false);
    // status "scan" toggles scanning phase when in progress
    expect(result.current.phase).toBe("complete");
  });

  it("skips incomplete chunks and logs unknown events", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const events =
      "event:status\n\n" + // missing data should be skipped
      "data:{\"orphan\":true}\n\n" + // data without event should be skipped
      "event:page-start\ndata:{}\n\n" + // missing index falls back to 0
      "event:error\ndata:{}\n\n" + // missing message -> Unknown error
      "event:crawl-complete\ndata:{}\n\n" + // missing fields should fallback to defaults
      "foo:bar\n" + // line that matches neither event nor data
      "data:{\"abc\":1}\n\n" +
      "event:unknown\ndata:{\"foo\":1}\n\n" + // unknown but valid
      "event:unknown\ndata:{broken}\n\n"; // malformed JSON to hit parse error
    const reader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({ done: false, value: encoder.encode(events) })
        .mockResolvedValueOnce({ done: true, value: undefined }),
    };
    type Reader = { read: () => Promise<{ done: boolean; value?: Uint8Array }> };
    type FetchResp = { ok: boolean; body: { getReader: () => Reader } };
    globalThis.fetch = vi.fn(async (): Promise<FetchResp> => ({
      ok: true,
      body: { getReader: () => reader },
    } as FetchResp)) as unknown as typeof fetch;

    const { result } = renderHook(() => useSiteScan());
    await act(async () => {
      await result.current.startScan("https://example.com");
    });

    expect(consoleSpy).toHaveBeenCalledWith("[useSiteScan] Skipping incomplete chunk:", "event:status");
    expect(consoleSpy).toHaveBeenCalledWith("[useSiteScan] Skipping incomplete chunk:", 'data:{"orphan":true}');
    expect(result.current.discoveredUrls).toEqual([]); // fallback for missing urls
    expect(result.current.totalPages).toBe(0); // fallback for missing totalFound
    expect(result.current.currentPage).toBe(0); // fallback for missing index
    expect(consoleSpy).toHaveBeenCalledWith("[useSiteScan] Unknown event type:", "unknown");
    expect(errorSpy).toHaveBeenCalled(); // malformed JSON hits parse error path
    // unknown error event sets phase to error and assigns default message
    expect(result.current.phase).toBe("error");
    expect(result.current.error).toBe("Unknown error");
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("handles scan errors and reset", async () => {
    globalThis.fetch = vi.fn(async (): Promise<{ ok: boolean; status: number }> => ({ ok: false, status: 500 })) as unknown as typeof fetch;
    const { result } = renderHook(() => useSiteScan());
    await act(async () => {
      await result.current.startScan("https://bad.com");
    });
    await waitFor(() => expect(result.current.phase).toBe("error"));
    expect(result.current.error).toBeDefined();

    act(() => result.current.reset());
    expect(result.current.phase).toBe("idle");
    expect(result.current.results.length).toBe(0);
    expect(result.current.error).toBeNull();

    // trigger unexpected parse, it should log but not crash
    const parseErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    globalThis.fetch = vi.fn(async (): Promise<{ ok: boolean; body: { getReader: () => { read: () => Promise<{ done: boolean; value: Uint8Array }> } } }> => {
      const reader = { read: vi.fn().mockResolvedValueOnce({ done: false, value: encoder.encode("event:status\ndata:{malformed}") }).mockResolvedValueOnce({ done: true, value: undefined }) };
      return { ok: true, body: { getReader: () => reader } };
    }) as unknown as typeof fetch;
    await act(async () => {
      await result.current.startScan("https://example.com");
    });
    expect(result.current.phase).toBe("crawling");
    expect(result.current.error).toBeNull();
    parseErrorSpy.mockRestore();
  });

  it("handles missing response body", async () => {
    const fetchErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    globalThis.fetch = vi.fn(async (): Promise<{ ok: boolean; body?: undefined }> => ({ ok: true })) as unknown as typeof fetch;
    const { result } = renderHook(() => useSiteScan());
    await act(async () => {
      await result.current.startScan("https://example.com");
    });
    await waitFor(() => expect(result.current.phase).toBe("error"));
    expect(result.current.error).toBe("No response body");
    expect(fetchErrorSpy).toHaveBeenCalledWith("[useSiteScan] Scan failed:", "No response body");
    fetchErrorSpy.mockRestore();
  });

  it("handles non-Error thrown values", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    globalThis.fetch = vi.fn(async () => {
      // Force a throw that is not an Error instance
      throw "string failure";
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useSiteScan());
    await act(async () => {
      await result.current.startScan("https://example.com");
    });
    expect(result.current.phase).toBe("error");
    expect(result.current.error).toBe("Scan failed");
    expect(errorSpy).toHaveBeenCalledWith("[useSiteScan] Scan failed:", "Scan failed");
    errorSpy.mockRestore();
  });

  it("skips data-only chunks without event type", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const reader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({ done: false, value: encoder.encode('data:{"only":true}\n\n') })
        .mockResolvedValueOnce({ done: true, value: undefined }),
    };
    type Reader = { read: () => Promise<{ done: boolean; value?: Uint8Array }> };
    type FetchResp = { ok: boolean; body: { getReader: () => Reader } };
    globalThis.fetch = vi.fn(async (): Promise<FetchResp> => ({
      ok: true,
      body: { getReader: () => reader },
    } as FetchResp)) as unknown as typeof fetch;

    const { result } = renderHook(() => useSiteScan());
    await act(async () => {
      await result.current.startScan("https://example.com");
    });

    expect(logSpy).toHaveBeenCalledWith("[useSiteScan] Skipping incomplete chunk:", 'data:{"only":true}');
    expect(result.current.phase).toBe("crawling");
    logSpy.mockRestore();
  });
});
