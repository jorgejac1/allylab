import { describe, expect, it, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("utils/api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchScan returns JSON on success", async () => {
    const response = { ok: true, json: vi.fn().mockResolvedValue({ score: 1 }) };
    mockFetch.mockResolvedValueOnce(response);
    const { fetchScan } = await import("../../utils/api.js");
    const result = await fetchScan("http://api", "https://example.com", "wcag21aa", "desktop");
    expect(result).toEqual({ score: 1 });
    expect(mockFetch).toHaveBeenCalledWith(
      "http://api/scan/json",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("fetchScan throws error message from response", async () => {
    const response = { ok: false, json: vi.fn().mockResolvedValue({ error: "bad" }), statusText: "Bad" };
    mockFetch.mockResolvedValueOnce(response);
    const { fetchScan } = await import("../../utils/api.js");
    await expect(fetchScan("http://api", "https://example.com", "wcag21aa", "desktop")).rejects.toThrow("bad");
  });

  it("fetchScan falls back to status text when JSON parse fails", async () => {
    const response = { ok: false, json: vi.fn().mockRejectedValue(new Error("boom")), statusText: "Bad request", status: 400 };
    mockFetch.mockResolvedValueOnce(response);
    const { fetchScan } = await import("../../utils/api.js");
    await expect(fetchScan("http://api", "https://example.com", "wcag21aa", "desktop")).rejects.toThrow("Bad request");
  });

  it("fetchScan falls back to HTTP status when no error message returned", async () => {
    const response = { ok: false, json: vi.fn().mockResolvedValue({}), statusText: "Bad request", status: 418 };
    mockFetch.mockResolvedValueOnce(response);
    const { fetchScan } = await import("../../utils/api.js");
    await expect(fetchScan("http://api", "https://example.com", "wcag21aa", "desktop")).rejects.toThrow("HTTP 418");
  });

  it("fetchSiteScan returns parsed result on complete event", async () => {
    const encoder = new TextEncoder();
    const body = {
      getReader: vi.fn().mockReturnValue({
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encoder.encode('event: complete\ndata: {"pagesScanned":1}\n\n') })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      }),
    };
    mockFetch.mockResolvedValueOnce({ ok: true, body });
    const { fetchSiteScan } = await import("../../utils/api.js");
    const result = await fetchSiteScan("http://api", "https://example.com", 1, 1, "wcag21aa");
    expect(result).toEqual({ pagesScanned: 1 });
  });

  it("fetchSiteScan throws on error event", async () => {
    const encoder = new TextEncoder();
    const body = {
      getReader: vi.fn().mockReturnValue({
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encoder.encode('event: error\ndata: {"message":"fail"}\n\n') })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      }),
    };
    mockFetch.mockResolvedValueOnce({ ok: true, body });
    const { fetchSiteScan } = await import("../../utils/api.js");
    await expect(fetchSiteScan("http://api", "https://example.com", 1, 1, "wcag21aa")).rejects.toThrow("fail");
  });

  it("fetchSiteScan throws when body missing", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, body: null });
    const { fetchSiteScan } = await import("../../utils/api.js");
    await expect(fetchSiteScan("http://api", "https://example.com", 1, 1, "wcag21aa")).rejects.toThrow("No response body");
  });

  it("fetchSiteScan throws when no result received", async () => {
    const encoder = new TextEncoder();
    const body = {
      getReader: vi.fn().mockReturnValue({
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encoder.encode("event: progress\ndata: {}\n\n") })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      }),
    };
    mockFetch.mockResolvedValueOnce({ ok: true, body });
    const { fetchSiteScan } = await import("../../utils/api.js");
    await expect(fetchSiteScan("http://api", "https://example.com", 1, 1, "wcag21aa")).rejects.toThrow("No results received from server");
  });

  it("fetchSiteScan throws when response not ok", async () => {
    const response = { ok: false, json: vi.fn().mockResolvedValue({ error: "bad" }), statusText: "Bad", status: 500 };
    mockFetch.mockResolvedValueOnce(response);
    const { fetchSiteScan } = await import("../../utils/api.js");
    await expect(fetchSiteScan("http://api", "https://example.com", 1, 1, "wcag21aa")).rejects.toThrow("bad");
  });

  it("fetchSiteScan skips empty chunks and missing data", async () => {
    const encoder = new TextEncoder();
    const body = {
      getReader: vi.fn().mockReturnValue({
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encoder.encode("\n\n") }) // empty chunk
          .mockResolvedValueOnce({ done: false, value: encoder.encode("event: progress\n\n") }) // missing data
          .mockResolvedValueOnce({ done: false, value: encoder.encode("event: error\ndata: {\"message\":\"fail\"}\n\n") })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      }),
    };
    mockFetch.mockResolvedValueOnce({ ok: true, body });
    const { fetchSiteScan } = await import("../../utils/api.js");
    await expect(fetchSiteScan("http://api", "https://example.com", 1, 1, "wcag21aa", vi.fn())).rejects.toThrow("fail");
  });

  it("fetchSiteScan invokes onEvent and parses data lines", async () => {
    const encoder = new TextEncoder();
    const events: Array<{ type: string; data: unknown }> = [];
    const body = {
      getReader: vi.fn().mockReturnValue({
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encoder.encode("event: complete\ndata: {\"pagesScanned\":2}\n\n") })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      }),
    };
    mockFetch.mockResolvedValueOnce({ ok: true, body });
    const { fetchSiteScan } = await import("../../utils/api.js");
    const result = await fetchSiteScan("http://api", "https://example.com", 1, 1, "wcag21aa", evt => events.push(evt));
    expect(result).toEqual({ pagesScanned: 2 });
    expect(events[0]).toEqual({ type: "complete", data: { pagesScanned: 2 } });
  });

  it("fetchSiteScan ignores malformed JSON and continues", async () => {
    const encoder = new TextEncoder();
    const body = {
      getReader: vi.fn().mockReturnValue({
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encoder.encode("event: progress\ndata: {bad json}\n\n") })
          .mockResolvedValueOnce({ done: false, value: encoder.encode("event: complete\ndata: {\"pagesScanned\":3}\n\n") })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      }),
    };
    mockFetch.mockResolvedValueOnce({ ok: true, body });
    const { fetchSiteScan } = await import("../../utils/api.js");
    const result = await fetchSiteScan("http://api", "https://example.com", 1, 1, "wcag21aa");
    expect(result).toEqual({ pagesScanned: 3 });
  });

  it("fetchSiteScan throws default message when error event lacks message", async () => {
    const encoder = new TextEncoder();
    const body = {
      getReader: vi.fn().mockReturnValue({
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encoder.encode("event: error\ndata: {}\n\n") })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      }),
    };
    mockFetch.mockResolvedValueOnce({ ok: true, body });
    const { fetchSiteScan } = await import("../../utils/api.js");
    await expect(fetchSiteScan("http://api", "https://example.com", 1, 1, "wcag21aa")).rejects.toThrow("Scan failed");
  });

  it("fetchSiteScan handles chunks containing only data line (no event)", async () => {
    const encoder = new TextEncoder();
    const body = {
      getReader: vi.fn().mockReturnValue({
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encoder.encode("data: {\"noop\":true}\n\n") })
          .mockResolvedValueOnce({ done: false, value: encoder.encode("event: complete\ndata: {\"pagesScanned\":4}\n\n") })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      }),
    };
    mockFetch.mockResolvedValueOnce({ ok: true, body });
    const { fetchSiteScan } = await import("../../utils/api.js");
    const result = await fetchSiteScan("http://api", "https://example.com", 1, 1, "wcag21aa");
    expect(result).toEqual({ pagesScanned: 4 });
  });

  it("fetchSiteScan ignores non-event/data lines inside chunk", async () => {
    const encoder = new TextEncoder();
    const body = {
      getReader: vi.fn().mockReturnValue({
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encoder.encode("id: 1\nevent: complete\ndata: {\"pagesScanned\":5}\n\n") })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      }),
    };
    mockFetch.mockResolvedValueOnce({ ok: true, body });
    const { fetchSiteScan } = await import("../../utils/api.js");
    const result = await fetchSiteScan("http://api", "https://example.com", 1, 1, "wcag21aa");
    expect(result).toEqual({ pagesScanned: 5 });
  });

  it("fetchSiteScan falls back to status text when JSON parse fails", async () => {
    const response = { ok: false, json: vi.fn().mockRejectedValue(new Error("boom")), statusText: "Service down", status: 503 };
    mockFetch.mockResolvedValueOnce(response);
    const { fetchSiteScan } = await import("../../utils/api.js");
    await expect(fetchSiteScan("http://api", "https://example.com", 1, 1, "wcag21aa")).rejects.toThrow("Service down");
  });

  it("fetchSiteScan falls back to HTTP status when no error provided", async () => {
    const response = { ok: false, json: vi.fn().mockResolvedValue({}), statusText: "Service down", status: 504 };
    mockFetch.mockResolvedValueOnce(response);
    const { fetchSiteScan } = await import("../../utils/api.js");
    await expect(fetchSiteScan("http://api", "https://example.com", 1, 1, "wcag21aa")).rejects.toThrow("HTTP 504");
  });
});
