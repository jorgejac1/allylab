import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { useWebhooks } from "../../hooks/useWebhooks";

const mockGetApiBase = vi.hoisted(() => vi.fn());
vi.mock("../../utils/api", () => ({ getApiBase: mockGetApiBase }));

describe("hooks/useWebhooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetApiBase.mockReturnValue("http://api");
  });

  it("fetches, creates, updates, deletes, and tests webhooks", async () => {
    type WebhookJson = { id: string; name: string };
    type WebhookResp = { ok: boolean; json: () => Promise<WebhookJson | WebhookJson[]> };

    const initialFetch = vi.fn(async (): Promise<WebhookResp> => ({
      ok: true,
      json: vi.fn().mockResolvedValue([{ id: "1", name: "wh1" }]),
    } as WebhookResp));
    globalThis.fetch = initialFetch as unknown as typeof fetch;

    const { result } = renderHook(() => useWebhooks());
    await act(async () => {});
    expect(result.current.webhooks.length).toBe(1);

    globalThis.fetch = vi.fn(async (): Promise<WebhookResp> => ({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: "2", name: "created" }),
    } as WebhookResp)) as unknown as typeof fetch;
    await act(async () => {
      const created = await result.current.createWebhook("n", "u", [], "s", "slack");
      expect(created?.id).toBe("2");
    });
    await act(async () => {});
    expect(result.current.webhooks.find((w) => w.id === "2")).toBeDefined();

    globalThis.fetch = vi.fn(async (): Promise<WebhookResp> => ({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: "1", name: "updated" }),
    } as WebhookResp)) as unknown as typeof fetch;
    await act(async () => {
      const updated = await result.current.updateWebhook("1", { name: "updated" });
      expect(updated).toBe(true);
    });
    await act(async () => {});
    expect(result.current.webhooks.find((w) => w.id === "1")?.name).toBe("updated");

    globalThis.fetch = vi.fn(async (): Promise<{ ok: boolean }> => ({ ok: true })) as unknown as typeof fetch;
    await act(async () => {
      const deleted = await result.current.deleteWebhook("1");
      expect(deleted).toBe(true);
    });
    await act(async () => {});
    expect(result.current.webhooks.find((w) => w.id === "1")).toBeUndefined();

    globalThis.fetch = vi.fn(async (): Promise<WebhookResp> => ({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    } as WebhookResp)) as unknown as typeof fetch;
    const testResult = await result.current.testWebhook("1");
    expect(testResult.success).toBe(true);
  });

  it("sets error on fetch failure", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("fail");
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useWebhooks());
    await act(async () => {});
    expect(result.current.error).toBe("Failed to fetch webhooks");
  });

  it("handles non-ok responses for CRUD helpers", async () => {
    type WebhookResp = { ok: boolean; json: () => Promise<unknown> };
    globalThis.fetch = vi.fn(async (): Promise<WebhookResp> => ({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: "bad" }),
    })) as unknown as typeof fetch;
    const { result } = renderHook(() => useWebhooks());

    await act(async () => {
      const created = await result.current.createWebhook("n", "u", []);
      expect(created).toBeNull();
    });

    await act(async () => {
      const updated = await result.current.updateWebhook("1", { name: "x" });
      expect(updated).toBe(false);
    });

    await act(async () => {
      const deleted = await result.current.deleteWebhook("1");
      expect(deleted).toBe(false);
    });
  });

  it("handles create/update/delete failures", async () => {
    type WebhookJson = { id: string; name: string };
    type WebhookResp = { ok: boolean; json: () => Promise<WebhookJson | WebhookJson[]> };
    const initialFetch = vi.fn(async (): Promise<WebhookResp> => ({
      ok: true,
      json: vi.fn().mockResolvedValue([{ id: "1", name: "wh1" }]),
    } as WebhookResp));
    globalThis.fetch = initialFetch as unknown as typeof fetch;
    const { result } = renderHook(() => useWebhooks());
    await act(async () => {});

    globalThis.fetch = vi.fn(async () => {
      throw new Error("create fail");
    }) as unknown as typeof fetch;
    await act(async () => {
      const created = await result.current.createWebhook("n", "u", []);
      expect(created).toBeNull();
    });
    expect(result.current.error).toBe("Failed to create webhook");

    globalThis.fetch = vi.fn(async () => {
      throw new Error("update fail");
    }) as unknown as typeof fetch;
    await act(async () => {
      const updated = await result.current.updateWebhook("1", { name: "x" });
      expect(updated).toBe(false);
    });
    expect(result.current.error).toBe("Failed to update webhook");

    globalThis.fetch = vi.fn(async () => {
      throw new Error("delete fail");
    }) as unknown as typeof fetch;
    await act(async () => {
      const removed = await result.current.deleteWebhook("1");
      expect(removed).toBe(false);
    });
    expect(result.current.error).toBe("Failed to delete webhook");

    globalThis.fetch = vi.fn(async () => {
      throw new Error("net");
    }) as unknown as typeof fetch;
    const testRes = await result.current.testWebhook("1");
    expect(testRes.success).toBe(false);
    expect(testRes.error).toBe("Network error");
  });
});
