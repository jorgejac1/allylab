import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getAllWebhooks,
  getWebhookById,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  triggerWebhooks,
  testWebhook,
  DEFAULT_RETRY_CONFIG,
  calculateBackoffDelay,
  isRetryableError,
} from "../../services/webhooks";
import type { WebhookEvent } from "../../types/webhook";

// Mock logger
vi.mock("../../utils/logger.js", () => ({
  webhookLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("services/webhooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();

    // Clear all webhooks before each test
    const webhooks = getAllWebhooks();
    webhooks.forEach((wh) => deleteWebhook(wh.id));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createWebhook", () => {
    it("creates a generic webhook with required fields", () => {
      const webhook = createWebhook({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      expect(webhook).toMatchObject({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        type: "generic",
        events: ["scan.completed"],
        enabled: true,
      });
      expect(webhook.id).toMatch(/^wh_/);
      expect(webhook.createdAt).toBeDefined();
    });

    it("auto-detects Slack webhook type from URL", () => {
      const webhook = createWebhook({
        name: "Slack Webhook",
        url: "https://hooks.slack.com/services/T00/B00/xxx",
        events: ["scan.completed"],
      });

      expect(webhook.type).toBe("slack");
    });

    it("auto-detects Teams webhook type from office.com URL", () => {
      const webhook = createWebhook({
        name: "Teams Webhook",
        url: "https://outlook.office.com/webhook/xxx",
        events: ["scan.completed"],
      });

      expect(webhook.type).toBe("teams");
    });

    it("auto-detects Teams webhook type from webhook.office.com URL", () => {
      const webhook = createWebhook({
        name: "Teams Webhook",
        url: "https://webhook.office.com/webhookb2/xxx",
        events: ["scan.completed"],
      });

      expect(webhook.type).toBe("teams");
    });

    it("uses explicit type when provided", () => {
      const webhook = createWebhook({
        name: "Custom Type",
        url: "https://hooks.slack.com/services/xxx",
        type: "generic",
        events: ["scan.completed"],
      });

      expect(webhook.type).toBe("generic");
    });

    it("stores secret when provided", () => {
      const webhook = createWebhook({
        name: "Secure Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
        secret: "my-secret-key",
      });

      expect(webhook.secret).toBe("my-secret-key");
    });

    it("supports multiple events", () => {
      const webhook = createWebhook({
        name: "Multi-event Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed", "scan.failed", "critical.found"],
      });

      expect(webhook.events).toHaveLength(3);
      expect(webhook.events).toContain("scan.completed");
      expect(webhook.events).toContain("scan.failed");
      expect(webhook.events).toContain("critical.found");
    });
  });

  describe("getAllWebhooks", () => {
    it("returns empty array when no webhooks exist", () => {
      const webhooks = getAllWebhooks();
      expect(webhooks).toEqual([]);
    });

    it("returns all created webhooks", () => {
      createWebhook({
        name: "Webhook 1",
        url: "https://example.com/1",
        events: ["scan.completed"],
      });
      createWebhook({
        name: "Webhook 2",
        url: "https://example.com/2",
        events: ["scan.failed"],
      });
      createWebhook({
        name: "Webhook 3",
        url: "https://example.com/3",
        events: ["critical.found"],
      });

      const webhooks = getAllWebhooks();
      expect(webhooks).toHaveLength(3);
    });
  });

  describe("getWebhookById", () => {
    it("returns webhook when it exists", () => {
      const created = createWebhook({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      const found = getWebhookById(created.id);
      expect(found).toEqual(created);
    });

    it("returns undefined for non-existent id", () => {
      const found = getWebhookById("non-existent-id");
      expect(found).toBeUndefined();
    });
  });

  describe("updateWebhook", () => {
    it("updates webhook name", () => {
      const webhook = createWebhook({
        name: "Original Name",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      const updated = updateWebhook(webhook.id, { name: "Updated Name" });

      expect(updated?.name).toBe("Updated Name");
      expect(updated?.url).toBe("https://example.com/webhook");
    });

    it("updates webhook URL and re-detects type", () => {
      const webhook = createWebhook({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      expect(webhook.type).toBe("generic");

      const updated = updateWebhook(webhook.id, {
        url: "https://hooks.slack.com/services/xxx",
      });

      expect(updated?.url).toBe("https://hooks.slack.com/services/xxx");
      expect(updated?.type).toBe("slack");
    });

    it("updates webhook URL and re-detects Teams type", () => {
      const webhook = createWebhook({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      expect(webhook.type).toBe("generic");

      const updated = updateWebhook(webhook.id, {
        url: "https://outlook.office.com/webhook/abc",
      });

      expect(updated?.type).toBe("teams");
    });

    it("re-detects Teams type for webhook.office.com URL", () => {
      const webhook = createWebhook({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      const updated = updateWebhook(webhook.id, {
        url: "https://webhook.office.com/webhookb2/xyz",
      });

      expect(updated?.type).toBe("teams");
    });

    it("re-detects Teams type for outlook.office.com URL", () => {
      const webhook = createWebhook({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      const updated = updateWebhook(webhook.id, {
        url: "https://outlook.office.com/webhook/def",
      });

      expect(updated?.type).toBe("teams");
    });

    it("keeps existing type when URL change is neither Slack nor Teams", () => {
      const webhook = createWebhook({
        name: "Generic Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      expect(webhook.type).toBe("generic");

      const updated = updateWebhook(webhook.id, {
        url: "https://not-slack-or-teams.com/webhook",
      });

      expect(updated?.type).toBe("generic");
    });

    it("respects explicitly provided type on update", () => {
      const webhook = createWebhook({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      const updated = updateWebhook(webhook.id, {
        url: "https://hooks.slack.com/services/xxx",
        type: "generic",
      });

      expect(updated?.type).toBe("generic");
    });

    it("updates secret when provided", () => {
      const webhook = createWebhook({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      expect(webhook.secret).toBeUndefined();

      const updated = updateWebhook(webhook.id, { secret: "new-secret" });

      expect(updated?.secret).toBe("new-secret");
    });

    it("updates webhook events", () => {
      const webhook = createWebhook({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      const updated = updateWebhook(webhook.id, {
        events: ["scan.completed", "scan.failed"],
      });

      expect(updated?.events).toHaveLength(2);
    });

    it("updates webhook enabled status", () => {
      const webhook = createWebhook({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      expect(webhook.enabled).toBe(true);

      const updated = updateWebhook(webhook.id, { enabled: false });

      expect(updated?.enabled).toBe(false);
    });

    it("returns null for non-existent webhook", () => {
      const result = updateWebhook("non-existent-id", { name: "New Name" });
      expect(result).toBeNull();
    });
  });

  describe("deleteWebhook", () => {
    it("deletes existing webhook and returns true", () => {
      const webhook = createWebhook({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      const result = deleteWebhook(webhook.id);

      expect(result).toBe(true);
      expect(getWebhookById(webhook.id)).toBeUndefined();
    });

    it("returns false for non-existent webhook", () => {
      const result = deleteWebhook("non-existent-id");
      expect(result).toBe(false);
    });
  });

  describe("triggerWebhooks", () => {
    it("triggers webhooks that subscribe to the event", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Scan Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      await triggerWebhooks("scan.completed", {
        scanUrl: "https://test.com",
        score: 85,
        totalIssues: 10,
        critical: 1,
        serious: 3,
        moderate: 4,
        minor: 2,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://example.com/webhook",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("does not trigger webhooks for unsubscribed events", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Scan Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      await triggerWebhooks("scan.failed", {
        scanUrl: "https://test.com",
        error: "Connection timeout",
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("does not trigger disabled webhooks", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      const webhook = createWebhook({
        name: "Disabled Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      updateWebhook(webhook.id, { enabled: false });

      await triggerWebhooks("scan.completed", {
        scanUrl: "https://test.com",
        score: 85,
        totalIssues: 10,
        critical: 0,
        serious: 0,
        moderate: 5,
        minor: 5,
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("triggers multiple webhooks for same event", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Webhook 1",
        url: "https://example1.com/webhook",
        events: ["scan.completed"],
      });

      createWebhook({
        name: "Webhook 2",
        url: "https://example2.com/webhook",
        events: ["scan.completed"],
      });

      await triggerWebhooks("scan.completed", {
        scanUrl: "https://test.com",
        score: 85,
        totalIssues: 10,
        critical: 0,
        serious: 0,
        moderate: 5,
        minor: 5,
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("updates lastTriggered and lastStatus on success", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      const webhook = createWebhook({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      await triggerWebhooks("scan.completed", {
        scanUrl: "https://test.com",
        score: 85,
        totalIssues: 10,
        critical: 0,
        serious: 0,
        moderate: 5,
        minor: 5,
      });

      const updated = getWebhookById(webhook.id);
      expect(updated?.lastTriggered).toBeDefined();
      expect(updated?.lastStatus).toBe("success");
    });

    it("updates lastStatus to failed on HTTP error", async () => {
      vi.useFakeTimers();
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      const webhook = createWebhook({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      const triggerPromise = triggerWebhooks("scan.completed", {
        scanUrl: "https://test.com",
        score: 85,
        totalIssues: 10,
        critical: 0,
        serious: 0,
        moderate: 5,
        minor: 5,
      });

      await vi.runAllTimersAsync();
      await triggerPromise;

      const updated = getWebhookById(webhook.id);
      expect(updated?.lastStatus).toBe("failed");
      vi.useRealTimers();
    });

    it("updates lastStatus to failed on network error", async () => {
      vi.useFakeTimers();
      mockFetch.mockRejectedValue(new Error("Network error"));

      const webhook = createWebhook({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      const triggerPromise = triggerWebhooks("scan.completed", {
        scanUrl: "https://test.com",
        score: 85,
        totalIssues: 10,
        critical: 0,
        serious: 0,
        moderate: 5,
        minor: 5,
      });

      await vi.runAllTimersAsync();
      await triggerPromise;

      const updated = getWebhookById(webhook.id);
      expect(updated?.lastStatus).toBe("failed");
      vi.useRealTimers();
    });

    it("includes signature header for generic webhooks with secret", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Secure Webhook",
        url: "https://example.com/webhook",
        type: "generic",
        events: ["scan.completed"],
        secret: "my-secret",
      });

      await triggerWebhooks("scan.completed", {
        scanUrl: "https://test.com",
        score: 85,
        totalIssues: 10,
        critical: 0,
        serious: 0,
        moderate: 5,
        minor: 5,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://example.com/webhook",
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-AllyLab-Signature": expect.stringMatching(/^sha256=/),
          }),
        })
      );
    });
  });

  describe("testWebhook", () => {
    it("returns success true when webhook responds OK", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      const webhook = createWebhook({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      const result = await testWebhook(webhook.id);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
    });

    it("returns success false when webhook responds with error", async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 });

      const webhook = createWebhook({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      const result = await testWebhook(webhook.id);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
    });

    it("returns error for non-existent webhook", async () => {
      const result = await testWebhook("non-existent-id");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Webhook not found");
    });

    it("returns error on network failure", async () => {
      mockFetch.mockRejectedValue(new Error("Connection refused"));

      const webhook = createWebhook({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      const result = await testWebhook(webhook.id);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Connection refused");
    });

    it("sends generic webhook test headers without signature when secret missing", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      const webhook = createWebhook({
        name: "Generic Test Webhook",
        url: "https://example.com/generic",
        events: ["scan.completed"],
        type: "generic",
      });

      await testWebhook(webhook.id);

      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers as Record<string, string>;

      expect(headers["X-AllyLab-Event"]).toBe("test");
      expect(headers["X-AllyLab-Delivery"]).toBeDefined();
      expect(headers["X-AllyLab-Signature"]).toBeUndefined();
    });

    it("includes signature header for generic webhook test when secret provided", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      const webhook = createWebhook({
        name: "Generic Secure Test Webhook",
        url: "https://example.com/generic",
        events: ["scan.completed"],
        type: "generic",
        secret: "super-secret",
      });

      await testWebhook(webhook.id);

      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers as Record<string, string>;

      expect(headers["X-AllyLab-Event"]).toBe("test");
      expect(headers["X-AllyLab-Delivery"]).toBeDefined();
      expect(headers["X-AllyLab-Signature"]).toMatch(/^sha256=/);
    });

    it("does not add generic headers for non-generic webhook test", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      const webhook = createWebhook({
        name: "Slack Test Webhook",
        url: "https://hooks.slack.com/services/xxx",
        events: ["scan.completed"],
        type: "slack",
      });

      await testWebhook(webhook.id);

      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers as Record<string, string>;

      expect(headers["X-AllyLab-Event"]).toBeUndefined();
      expect(headers["X-AllyLab-Delivery"]).toBeUndefined();
      expect(headers["X-AllyLab-Signature"]).toBeUndefined();
    });

    it("returns default Network error string when thrown value is not Error", async () => {
      mockFetch.mockRejectedValue("boom");

      const webhook = createWebhook({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      const result = await testWebhook(webhook.id);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });

    it("sends test payload with sample data", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      const webhook = createWebhook({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        events: ["scan.completed"],
      });

      await testWebhook(webhook.id);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://example.com/webhook",
        expect.objectContaining({
          body: expect.stringContaining("example.com"),
        })
      );
    });
  });

  describe("Slack formatting", () => {
    it("formats Slack payload with blocks", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Slack Webhook",
        url: "https://hooks.slack.com/services/xxx",
        events: ["scan.completed"],
      });

      await triggerWebhooks("scan.completed", {
        scanUrl: "https://test.com",
        score: 85,
        totalIssues: 10,
        critical: 1,
        serious: 3,
        moderate: 4,
        minor: 2,
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);

      expect(body.text).toBeDefined();
      expect(body.attachments).toBeDefined();
    });

    it("formats Slack payload for failed scan", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Slack Webhook",
        url: "https://hooks.slack.com/services/xxx",
        events: ["scan.failed"],
      });

      await triggerWebhooks("scan.failed", {
        scanUrl: "https://test.com",
        error: "Connection timeout",
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);

      expect(body.text).toContain("Failed");
      expect(body.blocks).toBeDefined();
    });

    it("uses green emoji for scores >= 90 in Slack payload", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Slack High Score",
        url: "https://hooks.slack.com/services/xxx",
        events: ["scan.completed"],
      });

      await triggerWebhooks("scan.completed", {
        scanUrl: "https://high-score.com",
        score: 95,
        totalIssues: 1,
        critical: 0,
        serious: 0,
        moderate: 1,
        minor: 0,
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body as string);

      expect(JSON.stringify(body)).toContain("🟢");
    });

    it("uses orange emoji for scores between 50 and 69 in Slack payload", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Slack Medium Score",
        url: "https://hooks.slack.com/services/xxx",
        events: ["scan.completed"],
      });

      await triggerWebhooks("scan.completed", {
        scanUrl: "https://medium-score.com",
        score: 60,
        totalIssues: 5,
        critical: 0,
        serious: 1,
        moderate: 2,
        minor: 2,
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body as string);

      expect(JSON.stringify(body)).toContain("🟠");
    });

    it("uses score dropped title for score.dropped event in Slack payload", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Slack Score Dropped",
        url: "https://hooks.slack.com/services/xxx",
        events: ["score.dropped"],
      });

      await triggerWebhooks("score.dropped", {
        scanUrl: "https://score-dropped.com",
        previousScore: 90,
        score: 70,
        totalIssues: 10,
        critical: 1,
        serious: 3,
        moderate: 4,
        minor: 2,
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body as string);

      expect(JSON.stringify(body)).toContain("Accessibility Score Dropped");
    });

    it("uses red emoji for scores below 50 in Slack payload", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Slack Low Score",
        url: "https://hooks.slack.com/services/xxx",
        events: ["scan.completed"],
      });

      await triggerWebhooks("scan.completed", {
        scanUrl: "https://low-score.com",
        score: 40,
        totalIssues: 20,
        critical: 5,
        serious: 5,
        moderate: 5,
        minor: 5,
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body as string);

      expect(JSON.stringify(body)).toContain("🔴");
    });

    it("uses 'Unknown error' when error is missing in failed Slack scan", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Slack Failed Webhook",
        url: "https://hooks.slack.com/services/xxx",
        events: ["scan.failed"],
      });

      await triggerWebhooks("scan.failed", {
        scanUrl: "https://test.com",
        // no error field on purpose to hit `data.error || 'Unknown error'`
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body as string);

      const sectionText = body.blocks[1].text.text as string;

      expect(sectionText).toContain("Unknown error");
    });

    it("falls back to score 0 when score is missing in Slack payload", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Slack No Score",
        url: "https://hooks.slack.com/services/xxx",
        events: ["scan.completed"],
      });

      await triggerWebhooks("scan.completed", {
        scanUrl: "https://no-score.com",
        // score intentionally omitted to trigger (score || 0)
        totalIssues: 5,
        critical: 1,
        serious: 2,
        moderate: 1,
        minor: 1,
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body as string);

      expect(JSON.stringify(body)).toContain("🔴");
    });

    it("includes a plus sign when score increased in Slack payload", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Slack Score Increase",
        url: "https://hooks.slack.com/services/xxx",
        events: ["scan.completed"],
      });

      await triggerWebhooks("scan.completed", {
        scanUrl: "https://score-up.com",
        score: 85,
        previousScore: 80,
        totalIssues: 5,
        critical: 1,
        serious: 2,
        moderate: 1,
        minor: 1,
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body as string);

      expect(JSON.stringify(body)).toContain("(+5)");
    });

    it("falls back to 0 when totalIssues is missing in Slack payload", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Slack Missing Total Issues",
        url: "https://hooks.slack.com/services/xxx",
        events: ["scan.completed"],
      });

      await triggerWebhooks("scan.completed", {
        scanUrl: "https://missing-total.com",
        score: 75,
        // totalIssues intentionally omitted → fallback to 0
        critical: 1,
        serious: 1,
        moderate: 2,
        minor: 2,
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body as string);

      const totalIssuesField = JSON.stringify(body);

      expect(totalIssuesField).toContain("*Total Issues*");
      expect(totalIssuesField).toContain("0");
    });

    it("falls back to 0 when moderate is missing in Slack payload", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Slack Missing Moderate",
        url: "https://hooks.slack.com/services/xxx",
        events: ["scan.completed"],
      });

      await triggerWebhooks("scan.completed", {
        scanUrl: "https://missing-moderate.com",
        score: 72,
        totalIssues: 10,
        critical: 1,
        serious: 2,
        // moderate omitted → fallback 0
        minor: 3,
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body as string);

      const moderateField = JSON.stringify(body);

      expect(moderateField).toContain("🟡 Moderate");
      expect(moderateField).toContain("0");
    });

    it("includes pages scanned section when pagesScanned is provided", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Slack Pages Scanned",
        url: "https://hooks.slack.com/services/xxx",
        events: ["scan.completed"],
      });

      await triggerWebhooks("scan.completed", {
        scanUrl: "https://with-pages.com",
        score: 80,
        totalIssues: 5,
        critical: 0,
        serious: 1,
        moderate: 2,
        minor: 2,
        pagesScanned: 12,
      });

      const call = mockFetch.mock.calls[0];
      const parsed = JSON.parse(call[1].body as string);

      const attachments = parsed.attachments as Array<{
        blocks: Array<{ type: string; elements?: Array<{ text: string }> }>;
      }>;

      const blocks = attachments[0].blocks;

      const contextBlock = blocks.find(
        (block: { type: string }): boolean => block.type === "context"
      );

      expect(JSON.stringify(contextBlock)).toContain("12 pages scanned");
    });

    it("uses red (#dc2626) color for Slack critical.found event", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Slack Critical",
        url: "https://hooks.slack.com/services/xxx",
        events: ["critical.found"],
      });

      await triggerWebhooks("critical.found", {
        scanUrl: "https://critical.com",
        score: 40,
        totalIssues: 20,
        critical: 5,
        serious: 5,
        moderate: 5,
        minor: 5,
      });

      const call = mockFetch.mock.calls[0];
      const parsed = JSON.parse(call[1].body as string);

      const attachments = parsed.attachments as Array<{ color: string }>;

      expect(attachments[0].color).toBe("#dc2626");
    });

    it("uses themeColor 'warning' for Teams score.dropped event", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Teams Score Dropped",
        url: "https://outlook.office.com/webhook/xxx",
        events: ["score.dropped"],
      });

      await triggerWebhooks("score.dropped", {
        scanUrl: "https://drop.com",
        previousScore: 90,
        score: 70,
        totalIssues: 10,
        critical: 1,
        serious: 2,
        moderate: 3,
        minor: 4,
      });

      const call = mockFetch.mock.calls[0];
      const parsed = JSON.parse(call[1].body as string);

      const attachments = parsed.attachments as Array<{
        content: {
          body: Array<{ color?: string }>;
        };
      }>;

      const cardBody = attachments[0].content.body;

      const titleBlock = cardBody[0];

      expect(titleBlock.color).toBe("Warning");
    });
  });

  describe("Teams formatting", () => {
    it("formats Teams payload with adaptive card", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Teams Webhook",
        url: "https://outlook.office.com/webhook/xxx",
        events: ["scan.completed"],
      });

      await triggerWebhooks("scan.completed", {
        scanUrl: "https://test.com",
        score: 85,
        totalIssues: 10,
        critical: 1,
        serious: 3,
        moderate: 4,
        minor: 2,
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);

      expect(body.type).toBe("message");
      expect(body.attachments).toBeDefined();
      expect(body.attachments[0].contentType).toBe(
        "application/vnd.microsoft.card.adaptive"
      );
    });

    it("formats Teams payload for failed scan", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Teams Webhook",
        url: "https://outlook.office.com/webhook/xxx",
        events: ["scan.failed"],
      });

      await triggerWebhooks("scan.failed", {
        scanUrl: "https://test.com",
        error: "Connection timeout",
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);

      expect(body.type).toBe("message");
      expect(body.attachments[0].content.body[0].text).toContain("Failed");
    });

    it("falls back to 'N/A' for missing scanUrl in Teams failed payload", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Teams Missing URL",
        url: "https://outlook.office.com/webhook/xxx",
        events: ["scan.failed"],
      });

      await triggerWebhooks("scan.failed", {
        // scanUrl intentionally omitted to trigger fallback
        error: "Some failure",
      });

      const call = mockFetch.mock.calls[0];
      const parsed = JSON.parse(call[1].body as string);

      const attachments = parsed.attachments as Array<{
        content: {
          body: Array<{
            facts?: Array<{ title: string; value: string }>;
          }>;
        };
      }>;

      const factSet = attachments[0].content.body.find(
        (b) => Array.isArray(b.facts)
      );

      const urlFact = factSet?.facts?.find((f) => f.title === "URL");

      expect(urlFact?.value).toBe("N/A");
    });

    it("falls back to 'Unknown error' when error is missing in Teams failed payload", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Teams Missing Error",
        url: "https://outlook.office.com/webhook/xxx",
        events: ["scan.failed"],
      });

      await triggerWebhooks("scan.failed", {
        scanUrl: "https://no-error.com",
        // error intentionally omitted → triggers fallback
      });

      const call = mockFetch.mock.calls[0];
      const parsed = JSON.parse(call[1].body as string);

      const attachments = parsed.attachments as Array<{
        content: {
          body: Array<{
            facts?: Array<{ title: string; value: string }>;
          }>;
        };
      }>;

      const factSet = attachments[0].content.body.find(
        (b) => Array.isArray(b.facts)
      );

      const errorFact = factSet?.facts?.find((f) => f.title === "Error");

      expect(errorFact?.value).toBe("Unknown error");
    });

    it("uses red score emoji when score is missing in Teams payload", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Teams No Score",
        url: "https://outlook.office.com/webhook/xxx",
        events: ["scan.completed"],
      });

      await triggerWebhooks("scan.completed", {
        scanUrl: "https://no-score-teams.com",
        totalIssues: 5,
        critical: 1,
        serious: 2,
        moderate: 1,
        minor: 1,
      });

      const call = mockFetch.mock.calls[0];
      const parsed = JSON.parse(call[1].body as string);

      const attachments = parsed.attachments as Array<{
        content: { body: unknown[] };
      }>;

      const bodyString = JSON.stringify(attachments[0].content.body);

      expect(bodyString).toContain("🔴");
    });

    it("shows +diff in Teams score when score increased", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Teams Score Increased",
        url: "https://outlook.office.com/webhook/xxx",
        events: ["scan.completed"],
      });

      await triggerWebhooks("scan.completed", {
        scanUrl: "https://score-up-teams.com",
        score: 85,
        previousScore: 80,
        totalIssues: 5,
        critical: 1,
        serious: 1,
        moderate: 2,
        minor: 1,
      });

      const call = mockFetch.mock.calls[0];
      const parsed = JSON.parse(call[1].body as string);

      const attachments = parsed.attachments as Array<{
        content: { body: unknown[] };
      }>;

      const bodyString = JSON.stringify(attachments[0].content.body);

      expect(bodyString).toContain("(+5)");
    });

    it("falls back to empty string when scanUrl is missing in Teams payload", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Teams Missing URL Card",
        url: "https://outlook.office.com/webhook/xxx",
        events: ["scan.completed"],
      });

      await triggerWebhooks("scan.completed", {
        // scanUrl intentionally omitted to trigger data.scanUrl || ''
        score: 75,
        totalIssues: 3,
        critical: 0,
        serious: 1,
        moderate: 1,
        minor: 1,
      });

      const call = mockFetch.mock.calls[0];
      const parsed = JSON.parse(call[1].body as string);

      const attachments = parsed.attachments as Array<{
        content: {
          body: Array<{ type: string; text?: string }>;
        };
      }>;

      const bodyBlocks = attachments[0].content.body;

      const urlBlock = bodyBlocks[1];

      expect(urlBlock.type).toBe("TextBlock");
      expect(urlBlock.text).toBe("");
    });

    it("falls back to 0 for missing serious/moderate/minor in Teams payload", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Teams Missing Severities",
        url: "https://outlook.office.com/webhook/xxx",
        events: ["scan.completed"],
      });

      await triggerWebhooks("scan.completed", {
        scanUrl: "https://missing-severities.com",
        score: 70,
        totalIssues: 3,
        critical: 1,
        // serious/moderate/minor intentionally omitted to hit || 0 fallbacks
      });

      const call = mockFetch.mock.calls[0];
      const parsed = JSON.parse(call[1].body as string);

      const attachments = parsed.attachments as Array<{
        content: {
          body: Array<{
            type?: string;
            columns?: Array<{ items?: Array<{ facts?: Array<{ title: string; value: string }> }> }>;
          }>;
        };
      }>;

      const body = attachments[0].content.body;
      const columnSet = body.find((b) => b.type === "ColumnSet");
      const facts =
        columnSet?.columns?.[1]?.items?.find((item) => Array.isArray(item.facts))
          ?.facts ?? [];

      expect(facts.length).toBeGreaterThan(0);

      const serious = facts.find((f) => f.title === "🟠 Serious");
      const moderate = facts.find((f) => f.title === "🟡 Moderate");
      const minor = facts.find((f) => f.title === "🔵 Minor");

      expect(serious?.value).toBe("0");
      expect(moderate?.value).toBe("0");
      expect(minor?.value).toBe("0");
    });

    it("falls back to 0 when totalIssues is missing in Teams payload", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Teams Missing Total Issues",
        url: "https://outlook.office.com/webhook/xxx",
        events: ["scan.completed"],
      });

      await triggerWebhooks("scan.completed", {
        scanUrl: "https://teams-total-issues.com",
        score: 75,
        // totalIssues intentionally omitted to trigger || 0
        critical: 0,
        serious: 0,
        moderate: 1,
        minor: 1,
      });

      const call = mockFetch.mock.calls[0];
      const parsed = JSON.parse(call[1].body as string);

      const attachments = parsed.attachments as Array<{
        content: {
          body: Array<{ type: string; text?: string }>;
        };
      }>;

      const bodyBlocks = attachments[0].content.body;
      const totalIssuesBlock = bodyBlocks.find(
        (block) => block.type === "TextBlock" && block.text?.startsWith("Total Issues:")
      );

      expect(totalIssuesBlock?.text).toContain("Total Issues: 0");
      expect(totalIssuesBlock?.text).not.toContain("pages scanned");
    });

    it("includes pages scanned text when pagesScanned is provided in Teams payload", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Teams Pages Scanned",
        url: "https://outlook.office.com/webhook/xxx",
        events: ["scan.completed"],
      });

      await triggerWebhooks("scan.completed", {
        scanUrl: "https://teams-pages.com",
        score: 82,
        totalIssues: 4,
        critical: 0,
        serious: 1,
        moderate: 2,
        minor: 1,
        pagesScanned: 9,
      });

      const call = mockFetch.mock.calls[0];
      const parsed = JSON.parse(call[1].body as string);

      const attachments = parsed.attachments as Array<{
        content: {
          body: Array<{ type: string; text?: string }>;
        };
      }>;

      const bodyBlocks = attachments[0].content.body;
      const totalIssuesBlock = bodyBlocks.find(
        (block) => block.type === "TextBlock" && block.text?.startsWith("Total Issues:")
      );

      expect(totalIssuesBlock?.text).toContain("Total Issues: 4");
      expect(totalIssuesBlock?.text).toContain("9 pages scanned");
    });
  });

  describe("edge cases", () => {
    it("handles webhook with empty events array", () => {
      const webhook = createWebhook({
        name: "Empty Events",
        url: "https://example.com/webhook",
        events: [],
      });

      expect(webhook.events).toEqual([]);
    });

    it("handles score.dropped event", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Score Webhook",
        url: "https://example.com/webhook",
        events: ["score.dropped"],
      });

      await triggerWebhooks("score.dropped", {
        scanUrl: "https://test.com",
        previousScore: 90,
        score: 70,
        totalIssues: 10,
        critical: 1,
        serious: 3,
        moderate: 4,
        minor: 2,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("handles critical.found event for Teams", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      createWebhook({
        name: "Teams Critical",
        url: "https://outlook.office.com/webhook/xxx",
        events: ["critical.found"],
      });

      await triggerWebhooks("critical.found", {
        scanUrl: "https://test.com",
        score: 60,
        totalIssues: 15,
        critical: 5,
        serious: 3,
        moderate: 4,
        minor: 3,
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.type).toBe("message");
    });

    it("uses default AllyLab Notification title for unknown event", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      const unknownEvent = "unknown.event" as WebhookEvent;

      createWebhook({
        name: "Slack Unknown Event",
        url: "https://hooks.slack.com/services/xxx",
        events: [unknownEvent],
      });

      await triggerWebhooks(unknownEvent, {
        scanUrl: "https://unknown-event.com",
        score: 80,
        totalIssues: 3,
        critical: 0,
        serious: 1,
        moderate: 1,
        minor: 1,
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body as string);

      expect(JSON.stringify(body)).toContain("AllyLab Notification");
    });
  });

  describe("event types", () => {
    const events: WebhookEvent[] = [
      "scan.completed",
      "scan.failed",
      "score.dropped",
      "critical.found",
    ];

    events.forEach((event) => {
      it(`handles ${event} event`, async () => {
        mockFetch.mockResolvedValue({ ok: true, status: 200 });

        createWebhook({
          name: `${event} Webhook`,
          url: "https://example.com/webhook",
          events: [event],
        });

        const data =
          event === "scan.failed"
            ? { scanUrl: "https://test.com", error: "Test error" }
            : {
                scanUrl: "https://test.com",
                score: 85,
                totalIssues: 10,
                critical: 1,
                serious: 3,
                moderate: 4,
                minor: 2,
              };

        await triggerWebhooks(event, data);

        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("retry logic", () => {
    describe("DEFAULT_RETRY_CONFIG", () => {
      it("has expected default values", () => {
        expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(5);
        expect(DEFAULT_RETRY_CONFIG.baseDelayMs).toBe(1000);
        expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBe(60000);
        expect(DEFAULT_RETRY_CONFIG.backoffMultiplier).toBe(2);
      });
    });

    describe("calculateBackoffDelay", () => {
      it("calculates exponential delay for first retry", () => {
        const delay = calculateBackoffDelay(0, DEFAULT_RETRY_CONFIG);
        // Base delay is 1000ms, jitter adds ±10%
        expect(delay).toBeGreaterThanOrEqual(900);
        expect(delay).toBeLessThanOrEqual(1100);
      });

      it("calculates exponential delay for second retry", () => {
        const delay = calculateBackoffDelay(1, DEFAULT_RETRY_CONFIG);
        // 1000 * 2^1 = 2000ms, jitter adds ±10%
        expect(delay).toBeGreaterThanOrEqual(1800);
        expect(delay).toBeLessThanOrEqual(2200);
      });

      it("caps delay at maxDelayMs", () => {
        const config = { ...DEFAULT_RETRY_CONFIG, maxDelayMs: 5000 };
        const delay = calculateBackoffDelay(10, config);
        // Should be capped at 5000ms + jitter
        expect(delay).toBeLessThanOrEqual(5500);
      });
    });

    describe("isRetryableError", () => {
      it("returns true for 500 status codes", () => {
        expect(isRetryableError(500)).toBe(true);
        expect(isRetryableError(502)).toBe(true);
        expect(isRetryableError(503)).toBe(true);
        expect(isRetryableError(504)).toBe(true);
      });

      it("returns true for 429 (rate limited)", () => {
        expect(isRetryableError(429)).toBe(true);
      });

      it("returns false for 4xx errors (except 429)", () => {
        expect(isRetryableError(400)).toBe(false);
        expect(isRetryableError(401)).toBe(false);
        expect(isRetryableError(403)).toBe(false);
        expect(isRetryableError(404)).toBe(false);
      });

      it("returns false for success codes", () => {
        expect(isRetryableError(200)).toBe(false);
        expect(isRetryableError(201)).toBe(false);
        expect(isRetryableError(204)).toBe(false);
      });
    });

    describe("retry behavior in triggerWebhooks", () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it("retries on 500 error and succeeds", async () => {
        mockFetch
          .mockResolvedValueOnce({ ok: false, status: 500 })
          .mockResolvedValueOnce({ ok: false, status: 500 })
          .mockResolvedValueOnce({ ok: true, status: 200 });

        const webhook = createWebhook({
          name: "Retry Webhook",
          url: "https://example.com/webhook",
          events: ["scan.completed"],
        });

        const triggerPromise = triggerWebhooks("scan.completed", {
          scanUrl: "https://test.com",
          score: 85,
          totalIssues: 5,
          critical: 0,
          serious: 1,
          moderate: 2,
          minor: 2,
        });

        // Advance timers to process all retries
        await vi.runAllTimersAsync();
        await triggerPromise;

        // Should have retried twice before success
        expect(mockFetch).toHaveBeenCalledTimes(3);

        const updated = getWebhookById(webhook.id);
        expect(updated?.lastStatus).toBe("success");
      });

      it("does not retry on 404 error", async () => {
        mockFetch.mockResolvedValue({ ok: false, status: 404 });

        const webhook = createWebhook({
          name: "No Retry Webhook",
          url: "https://example.com/webhook",
          events: ["scan.completed"],
        });

        const triggerPromise = triggerWebhooks("scan.completed", {
          scanUrl: "https://test.com",
          score: 85,
          totalIssues: 5,
          critical: 0,
          serious: 1,
          moderate: 2,
          minor: 2,
        });

        await vi.runAllTimersAsync();
        await triggerPromise;

        // Should not retry on 404
        expect(mockFetch).toHaveBeenCalledTimes(1);

        const updated = getWebhookById(webhook.id);
        expect(updated?.lastStatus).toBe("failed");
      });

      it("fails after max retries on persistent 500 error", async () => {
        // Always return 500
        mockFetch.mockResolvedValue({ ok: false, status: 500 });

        const webhook = createWebhook({
          name: "Persistent Failure",
          url: "https://example.com/webhook",
          events: ["scan.completed"],
        });

        const triggerPromise = triggerWebhooks("scan.completed", {
          scanUrl: "https://test.com",
          score: 85,
          totalIssues: 5,
          critical: 0,
          serious: 1,
          moderate: 2,
          minor: 2,
        });

        await vi.runAllTimersAsync();
        await triggerPromise;

        // Should have made 6 attempts (1 initial + 5 retries)
        expect(mockFetch).toHaveBeenCalledTimes(6);

        const updated = getWebhookById(webhook.id);
        expect(updated?.lastStatus).toBe("failed");
      });

      it("retries on network errors", async () => {
        mockFetch
          .mockRejectedValueOnce(new Error("Network error"))
          .mockRejectedValueOnce(new Error("Connection refused"))
          .mockResolvedValueOnce({ ok: true, status: 200 });

        const webhook = createWebhook({
          name: "Network Error Retry",
          url: "https://example.com/webhook",
          events: ["scan.completed"],
        });

        const triggerPromise = triggerWebhooks("scan.completed", {
          scanUrl: "https://test.com",
          score: 85,
          totalIssues: 5,
          critical: 0,
          serious: 1,
          moderate: 2,
          minor: 2,
        });

        await vi.runAllTimersAsync();
        await triggerPromise;

        // Should have retried twice before success
        expect(mockFetch).toHaveBeenCalledTimes(3);

        const updated = getWebhookById(webhook.id);
        expect(updated?.lastStatus).toBe("success");
      });

      it("retries on 429 rate limit", async () => {
        mockFetch
          .mockResolvedValueOnce({ ok: false, status: 429 })
          .mockResolvedValueOnce({ ok: true, status: 200 });

        const webhook = createWebhook({
          name: "Rate Limited Webhook",
          url: "https://example.com/webhook",
          events: ["scan.completed"],
        });

        const triggerPromise = triggerWebhooks("scan.completed", {
          scanUrl: "https://test.com",
          score: 85,
          totalIssues: 5,
          critical: 0,
          serious: 1,
          moderate: 2,
          minor: 2,
        });

        await vi.runAllTimersAsync();
        await triggerPromise;

        expect(mockFetch).toHaveBeenCalledTimes(2);

        const updated = getWebhookById(webhook.id);
        expect(updated?.lastStatus).toBe("success");
      });
    });
  });
});
