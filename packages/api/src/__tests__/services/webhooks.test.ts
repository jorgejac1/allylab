import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getAllWebhooks,
  getWebhookById,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  triggerWebhooks,
  testWebhook,
} from "../../services/webhooks";
import type { WebhookEvent } from "../../types/webhook";

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
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

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
      expect(updated?.lastStatus).toBe("failed");
    });

    it("updates lastStatus to failed on network error", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

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
      expect(updated?.lastStatus).toBe("failed");
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
});
