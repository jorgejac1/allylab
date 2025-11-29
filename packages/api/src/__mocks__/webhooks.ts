import { vi } from 'vitest';
import type { Webhook, WebhookEvent, WebhookPayload } from '../types/webhook';

/**
 * Create a mock webhook
 */
export function createMockWebhook(overrides: Partial<Webhook> = {}): Webhook {
  return {
    id: 'webhook-123',
    name: 'Test Webhook',
    url: 'https://hooks.example.com/webhook',
    type: 'generic',
    events: ['scan.completed'],
    enabled: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock webhook payload
 */
export function createMockWebhookPayload(
  event: WebhookEvent = 'scan.completed',
  overrides: Partial<WebhookPayload['data']> = {}
): WebhookPayload {
  return {
    event,
    timestamp: new Date().toISOString(),
    data: {
      scanUrl: 'https://example.com',
      score: 75,
      totalIssues: 10,
      critical: 1,
      serious: 3,
      moderate: 4,
      minor: 2,
      ...overrides,
    },
  };
}

/**
 * Mock fetch for webhook testing
 */
export const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue({ success: true }),
});

/**
 * Mock triggerWebhooks function
 */
export const mockTriggerWebhooks = vi.fn().mockResolvedValue(undefined);