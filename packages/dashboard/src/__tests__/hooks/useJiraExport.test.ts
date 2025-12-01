import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { useJiraExport } from "../../hooks/useJiraExport";
import type { Finding, JiraConfig, JiraFieldMapping } from "../../types";
import type { JiraExportResult, BulkExportProgress } from "../../types/jira";

const mapping: JiraFieldMapping = {
  severity: { field: "priority", values: { critical: "High", serious: "Med", moderate: "Low", minor: "Low" } },
  wcagTags: { field: "labels", prefix: "wcag-" },
  ruleId: { field: "labels" },
  selector: { field: "description" },
  url: { field: "labels" },
  customFields: [],
};

const config: JiraConfig = {
  enabled: true,
  endpoint: "http://jira",
  projectKey: "PRJ",
  issueType: "Bug",
};

const finding: Finding = {
  id: "1",
  ruleId: "r1",
  ruleTitle: "title",
  description: "d",
  impact: "critical",
  selector: "#a",
  html: "<div>",
  helpUrl: "",
  wcagTags: ["1.1.1"],
};

describe("hooks/useJiraExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports a single finding and handles errors", async () => {
    type JiraResp = { ok: boolean; json: () => Promise<unknown> };
    globalThis.fetch = vi.fn(async (): Promise<JiraResp> => ({
      ok: true,
      json: vi.fn().mockResolvedValue({ key: "J-1", self: "url" }),
    } as JiraResp)) as unknown as typeof fetch;
    const { result } = renderHook(() => useJiraExport({ config, mapping }));

    let exported: JiraExportResult | null = null;
    await act(async () => {
      exported = await result.current.exportSingle(finding, "https://example.com");
    });
    expect(exported).not.toBeNull();
    expect(result.current.lastResult?.issueKey).toBe("J-1");

    globalThis.fetch = vi.fn(async (): Promise<JiraResp> => ({
      ok: false,
      json: vi.fn().mockResolvedValue({ errorMessages: ["bad"] }),
    } as JiraResp)) as unknown as typeof fetch;
    await act(async () => {
      exported = await result.current.exportSingle(finding, "https://example.com");
    });
    expect(exported).not.toBeNull();
  });

  it("handles unknown error message and network failure", async () => {
    type JiraResp = { ok: boolean; json: () => Promise<unknown> };
    // Missing errorMessages -> Unknown error
    globalThis.fetch = vi.fn(async (): Promise<JiraResp> => ({
      ok: false,
      json: vi.fn().mockResolvedValue({}),
    } as JiraResp)) as unknown as typeof fetch;
    const { result } = renderHook(() => useJiraExport({ config, mapping }));
    const res = await result.current.exportSingle(finding, "https://example.com");
    expect(res.error).toBe("Unknown error");

    // Network exception path
    globalThis.fetch = vi.fn(async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    const res2 = await result.current.exportSingle(finding, "https://example.com");
    expect(res2.success).toBe(false);
    expect(res2.error).toBe("offline");
  });

  it("sends auth header when provided", async () => {
    type JiraResp = { ok: boolean; json: () => Promise<unknown> };
    const fetchMock = vi.fn(async (..._args: [RequestInfo | URL, RequestInit?]): Promise<JiraResp> => ({
      ok: true,
      json: vi.fn().mockResolvedValue({ key: "J-1", self: "url" }),
    } as JiraResp));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { result } = renderHook(() =>
      useJiraExport({ config: { ...config, authHeader: "Bearer token" }, mapping })
    );

    await act(async () => {
      await result.current.exportSingle(finding, "https://example.com");
    });

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string> | undefined;
    expect(headers?.Authorization).toBe("Bearer token");
  });

  it("falls back to network error when thrown non-Error", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw "boom";
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useJiraExport({ config, mapping }));
    const res = await result.current.exportSingle(finding, "https://example.com");
    expect(res.error).toBe("Network error");
    expect(res.success).toBe(false);
  });

  it("exports in bulk and tracks progress", async () => {
    type JiraResp = { ok: boolean; json: () => Promise<unknown> };
    globalThis.fetch = vi.fn()
      // first success
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ key: "J-1", self: "url" }),
      } as JiraResp)
      // second failure to exercise failed counter
      .mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({ errorMessages: ["fail"] }),
      } as JiraResp);
    const progressSpy = vi.fn();
    const { result } = renderHook(() => useJiraExport({ config, mapping }));

    let progress: BulkExportProgress | null = null;
    await act(async () => {
      progress = await result.current.exportBulk([finding, finding], "https://example.com", progressSpy);
    });
    expect(progress).not.toBeNull();
    expect(result.current.bulkProgress?.completed).toBe(2);
    expect(result.current.bulkProgress?.successful).toBe(1);
    expect(result.current.bulkProgress?.failed).toBe(1);
    expect(progressSpy).toHaveBeenCalled();

    act(() => result.current.reset());
    expect(result.current.lastResult).toBeNull();
    expect(result.current.bulkProgress).toBeNull();
  });

  it("previews payload", () => {
    const { result } = renderHook(() => useJiraExport({ config, mapping }));
    const payload = result.current.previewPayload(finding, "https://example.com");
    expect(payload.fields.project.key).toBe("PRJ");
  });
});
