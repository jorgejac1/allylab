import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { useCustomRules } from "../../hooks/useCustomRules";
import type { CreateRuleRequest, RuleExportResponse, CustomRule } from "../../types/rules";

const mockUseLocalStorage = vi.fn<(key: string, initial: unknown) => [unknown, (value: unknown) => void] | undefined>();
vi.mock("../../hooks/useLocalStorage", () => ({
  useLocalStorage: (key: string, initial: unknown) => mockUseLocalStorage(key, initial) ?? [initial, vi.fn()],
}));

type FetchResponse = { ok?: boolean; json: () => Promise<unknown> };
const mockFetch = vi.fn(async (): Promise<FetchResponse> => ({ json: async () => ({}) }));
const mockApiBase = "http://api";
vi.mock("../../utils/api", () => ({ getApiBase: () => mockApiBase }));

describe("hooks/useCustomRules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocalStorage.mockReturnValue(["http://api", vi.fn()]);
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  it("fetches rules and handles errors", async () => {
    mockFetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({ success: true, data: { rules: [{ id: "1", enabled: true }], total: 1, enabled: 1 } }),
    });
    const { result } = renderHook(() => useCustomRules());
    await act(async () => {});
    await act(async () => {
      await result.current.fetchRules();
    });
    expect(result.current.rules.length).toBe(1);

    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: false, error: "fail" }) });
    await act(async () => {
      await result.current.fetchRules();
    });
    expect(result.current.error).toBe("fail");

    mockFetch.mockRejectedValueOnce(new Error("boom"));
    await act(async () => {
      await result.current.fetchRules();
    });
    expect(result.current.error).toBe("boom");

    mockFetch.mockRejectedValueOnce("weird");
    await act(async () => {
      await result.current.fetchRules();
    });
    expect(result.current.error).toBe("Failed to fetch rules");
  });

  it("gets, creates, updates, deletes, toggles rules", async () => {
    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: true, data: { rules: [{ id: "toggle", enabled: true }], total: 1, enabled: 1 } }) });
    const { result } = renderHook(() => useCustomRules());
    await act(async () => {});
    await act(async () => result.current.fetchRules());

    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: true, data: { id: "r1", enabled: true } }) });
    let rule: CustomRule | null = null;
    await act(async () => {
      rule = await result.current.getRule("r1");
    });
    const ruleId = (rule as CustomRule | null)?.id;
    expect(ruleId).toBe("r1");

    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: false }) });
    const missingRule = await result.current.getRule("missing");
    expect(missingRule).toBeNull();

    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: true, data: { id: "new", enabled: true } }) });
    const createPayload: CreateRuleRequest = { name: "n", description: "d", severity: "critical", selector: "a", type: "selector" };
    await act(async () => {
      await result.current.createRule(createPayload);
    });

    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: false, error: "create-fail" }) });
    await act(async () => {
      const created = await result.current.createRule(createPayload);
      expect(created).toBeNull();
    });
    expect(result.current.error).toBe("create-fail");

    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: true, data: { id: "new", enabled: false } }) });
    await act(async () => {
      await result.current.updateRule("new", { enabled: false });
    });

    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: false, error: "update-fail" }) });
    await act(async () => {
      const updated = await result.current.updateRule("new", { enabled: true });
      expect(updated).toBeNull();
    });
    expect(result.current.error).toBe("update-fail");

    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: true, data: { rules: [], total: 0, enabled: 0 } }) });
    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: true, data: {} }) });
    let deleted = false;
    await act(async () => {
      deleted = await result.current.deleteRule("new");
    });
    expect(deleted).toBe(true);

    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: false, error: "delete-fail" }) });
    let deleteFail = true;
    await act(async () => {
      deleteFail = await result.current.deleteRule("missing");
    });
    expect(deleteFail).toBe(false);
    expect(result.current.error).toBe("delete-fail");

    mockFetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({ success: true, data: { rules: [{ id: "toggle", enabled: true }], total: 1, enabled: 1 } }),
    });
    await act(async () => {
      await result.current.fetchRules();
    });

    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: true, data: { id: "toggle", enabled: false } }) });
    let toggled = false;
    await act(async () => {
      toggled = await result.current.toggleRule("toggle");
    });
    expect(toggled).toBe(true);

    const noToggle = await result.current.toggleRule("missing");
    expect(noToggle).toBe(false);
  });

  it("tests, imports, exports rules and handles failures", async () => {
    const { result } = renderHook(() => useCustomRules());
    await act(async () => {});

    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: true, data: { matches: 1, violations: [] } }) });
    const testPayload: CreateRuleRequest = { name: "n", description: "d", severity: "critical", selector: "a", type: "selector" };
    const testData = await result.current.testRule(testPayload, "<div>");
    expect(testData).not.toBeNull();

    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: false }) });
    const testFail = await result.current.testRule(testPayload, "<div>");
    expect(testFail).toBeNull();

    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: true, data: { imported: 1, total: 1 } }) });
    const importRules: CustomRule[] = [
      {
        id: "1",
        name: "Name",
        description: "Desc",
        type: "selector",
        severity: "critical",
        selector: "a",
        condition: {},
        message: "msg",
        wcagTags: [],
        enabled: true,
        createdAt: "",
        updatedAt: "",
      },
    ];
    let importRes: { imported: number; total: number } | null = null;
    await act(async () => {
      importRes = await result.current.importRules(importRules);
    });
    const importedCount = (importRes as { imported: number; total: number } | null)?.imported;
    expect(importedCount).toBe(1);

    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: false, error: "imp" }) });
    let importFail: { imported: number; total: number } | null = null;
    await act(async () => {
      importFail = await result.current.importRules([]);
    });
    expect(importFail).toBeNull();
    expect(result.current.error).toBe("imp");

    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: true, data: { rules: [{ id: "1" }] } }) });
    let exportRes: RuleExportResponse["data"] | null = null;
    await act(async () => {
      exportRes = await result.current.exportRules();
    });
    expect((exportRes as RuleExportResponse["data"] | null)?.rules?.length).toBe(1);

    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: false }) });
    let exportFail: RuleExportResponse["data"] | null = null;
    await act(async () => {
      exportFail = await result.current.exportRules();
    });
    expect(exportFail).toBeNull();

    mockFetch.mockRejectedValueOnce(new Error("export boom"));
    const exportErr = await result.current.exportRules();
    expect(exportErr).toBeNull();
  });

  it("handles import failures with thrown error", async () => {
    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: true, data: { rules: [], total: 0, enabled: 0 } }) });
    const { result } = renderHook(() => useCustomRules());
    await act(async () => {}); // allow initial fetch

    mockFetch.mockRejectedValueOnce("imp boom");
    let res: { imported: number; total: number } | null = null;
    await act(async () => {
      res = await result.current.importRules([]);
    });
    expect(res).toBeNull();
    await act(async () => {});
    expect(result.current.error).toBe("Failed to import rules");
  });

  it("uses default error messages when API omits error fields", async () => {
    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: true, data: { rules: [], total: 0, enabled: 0 } }) });
    const { result } = renderHook(() => useCustomRules());
    await act(async () => {}); // initial fetch

    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: false }) });
    const created = await result.current.createRule({ name: "n", description: "d", severity: "critical", selector: "a", type: "selector" });
    expect(created).toBeNull();
    await act(async () => {});
    expect(result.current.error).toBe("Failed to create rule");

    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: false }) });
    const updated = await result.current.updateRule("id", { enabled: true });
    expect(updated).toBeNull();
    await act(async () => {});
    expect(result.current.error).toBe("Failed to update rule");

    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: false }) });
    const deleted = await result.current.deleteRule("id");
    expect(deleted).toBe(false);
    await act(async () => {});
    expect(result.current.error).toBe("Failed to delete rule");

    mockFetch.mockRejectedValueOnce(new Error("test boom"));
    const testRes = await result.current.testRule({ name: "n", description: "d", severity: "critical", selector: "a", type: "selector" }, "<div>");
    expect(testRes).toBeNull();

    // clear error before import check
    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: true, data: { rules: [], total: 0, enabled: 0 } }) });
    await act(async () => {
      await result.current.fetchRules();
    });

    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: false }) });
    const importRes = await result.current.importRules([]);
    expect(importRes).toBeNull();
    await act(async () => {});
    expect(result.current.error).toBe("Failed to import rules");
  });

  it("handles thrown errors across get/create/update/delete rule paths", async () => {
    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: true, data: { rules: [], total: 0, enabled: 0 } }) });
    const { result } = renderHook(() => useCustomRules());
    await act(async () => {});

    mockFetch.mockRejectedValueOnce(new Error("get boom"));
    const got = await result.current.getRule("id");
    expect(got).toBeNull();

    mockFetch.mockRejectedValueOnce(new Error("create-msg"));
    const created = await result.current.createRule({ name: "n", description: "d", severity: "critical", selector: "a", type: "selector" });
    expect(created).toBeNull();
    await act(async () => {});
    expect(result.current.error).toBe("create-msg");

    mockFetch.mockRejectedValueOnce(new Error("update-msg"));
    const updated = await result.current.updateRule("id", { enabled: true });
    expect(updated).toBeNull();
    await act(async () => {});
    expect(result.current.error).toBe("update-msg");

    mockFetch.mockRejectedValueOnce(new Error("delete-msg"));
    const deleted = await result.current.deleteRule("id");
    expect(deleted).toBe(false);
    await act(async () => {});
    expect(result.current.error).toBe("delete-msg");

    mockFetch.mockRejectedValueOnce(new Error("import-msg"));
    const imported = await result.current.importRules([]);
    expect(imported).toBeNull();
    await act(async () => {});
    expect(result.current.error).toBe("import-msg");
  });

  it("uses default messages when operations throw non-Error values", async () => {
    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ success: true, data: { rules: [], total: 0, enabled: 0 } }) });
    const { result } = renderHook(() => useCustomRules());
    await act(async () => {});

    mockFetch.mockRejectedValueOnce("create-str");
    const created = await result.current.createRule({ name: "n", description: "d", severity: "critical", selector: "a", type: "selector" });
    expect(created).toBeNull();
    await act(async () => {});
    expect(result.current.error).toBe("Failed to create rule");

    mockFetch.mockRejectedValueOnce("update-str");
    const updated = await result.current.updateRule("id", { enabled: true });
    expect(updated).toBeNull();
    await act(async () => {});
    expect(result.current.error).toBe("Failed to update rule");

    mockFetch.mockRejectedValueOnce("delete-str");
    const deleted = await result.current.deleteRule("id");
    expect(deleted).toBe(false);
    await act(async () => {});
    expect(result.current.error).toBe("Failed to delete rule");
  });
});
