import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useScan } from "../../hooks/useScan";
import type { ScanResult } from "../../types";

describe("hooks/useScan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns result on successful scan", async () => {
    const responseBody: ScanResult = {
      id: "s1",
      url: "",
      timestamp: "",
      score: 0,
      totalIssues: 0,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
      findings: [],
      scanDuration: 0,
    };
    const fetchMock = vi.fn(async (): Promise<{ ok: boolean; json: () => Promise<ScanResult> }> => ({
      ok: true,
      json: vi.fn().mockResolvedValue(responseBody),
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useScan());
    let output: ScanResult | null = null;
    await act(async () => {
      output = await result.current.scan("https://example.com");
    });

    expect(output).toEqual(responseBody);
    expect(result.current.error).toBeNull();
    expect(result.current.isScanning).toBe(false);
  });

  it("captures error on failed scan", async () => {
    const fetchMock = vi.fn(async (): Promise<{ ok: boolean; json: () => Promise<{ error: string }> }> => ({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: "bad" }),
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useScan());
    let output: ScanResult | null = null;
    await act(async () => {
      output = await result.current.scan("https://bad.com");
    });

    expect(output).toBeNull();
    expect(result.current.error).toBe("bad");
    expect(result.current.isScanning).toBe(false);
  });

  it("uses default scan failed message when response has no error", async () => {
    const fetchMock = vi.fn(async (): Promise<{ ok: boolean; json: () => Promise<Record<string, never>> }> => ({
      ok: false,
      json: vi.fn().mockResolvedValue({}),
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useScan());
    let output: ScanResult | null = null;
    await act(async () => {
      output = await result.current.scan("https://example.com");
    });

    expect(output).toBeNull();
    expect(result.current.error).toBe("Scan failed");
    expect(result.current.isScanning).toBe(false);
  });

  it("sets unknown error when thrown value is not an Error", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw "boom";
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useScan());
    let output: ScanResult | null = null;
    await act(async () => {
      output = await result.current.scan("https://example.com");
    });

    expect(output).toBeNull();
    expect(result.current.error).toBe("Unknown error");
    expect(result.current.isScanning).toBe(false);
  });
});
