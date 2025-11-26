import crypto from 'crypto';
import type { Webhook, WebhookEvent, WebhookPayload, WebhookCreateRequest, WebhookUpdateRequest } from '../types/webhook';

// In-memory storage (replace with DB later)
const webhooks = new Map<string, Webhook>();

function generateId(): string {
  return `wh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// ============================================
// CRUD Operations
// ============================================

export function getAllWebhooks(): Webhook[] {
  return Array.from(webhooks.values());
}

export function getWebhookById(id: string): Webhook | undefined {
  return webhooks.get(id);
}

export function createWebhook(data: WebhookCreateRequest): Webhook {
  const webhook: Webhook = {
    id: generateId(),
    name: data.name,
    url: data.url,
    events: data.events,
    enabled: true,
    secret: data.secret,
    createdAt: new Date().toISOString(),
  };

  webhooks.set(webhook.id, webhook);
  console.log(`[Webhooks] Created webhook: ${webhook.name} (${webhook.id})`);
  return webhook;
}

export function updateWebhook(id: string, updates: WebhookUpdateRequest): Webhook | null {
  const webhook = webhooks.get(id);
  if (!webhook) return null;

  if (updates.name !== undefined) webhook.name = updates.name;
  if (updates.url !== undefined) webhook.url = updates.url;
  if (updates.events !== undefined) webhook.events = updates.events;
  if (updates.enabled !== undefined) webhook.enabled = updates.enabled;
  if (updates.secret !== undefined) webhook.secret = updates.secret;

  webhooks.set(id, webhook);
  return webhook;
}

export function deleteWebhook(id: string): boolean {
  return webhooks.delete(id);
}

// ============================================
// Trigger Webhooks
// ============================================

export async function triggerWebhooks(event: WebhookEvent, data: WebhookPayload['data']): Promise<void> {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const relevantWebhooks = Array.from(webhooks.values()).filter(
    wh => wh.enabled && wh.events.includes(event)
  );

  console.log(`[Webhooks] Triggering ${relevantWebhooks.length} webhooks for event: ${event}`);

  for (const webhook of relevantWebhooks) {
    try {
      const payloadString = JSON.stringify(payload);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'AllyLab-Webhook/1.0',
        'X-AllyLab-Event': event,
        'X-AllyLab-Delivery': `${Date.now()}`,
      };

      // Add signature if secret is set
      if (webhook.secret) {
        headers['X-AllyLab-Signature'] = `sha256=${generateSignature(payloadString, webhook.secret)}`;
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payloadString,
      });

      webhook.lastTriggered = new Date().toISOString();
      webhook.lastStatus = response.ok ? 'success' : 'failed';
      webhooks.set(webhook.id, webhook);

      console.log(`[Webhooks] ${webhook.name}: ${response.ok ? 'SUCCESS' : 'FAILED'} (${response.status})`);
    } catch (error) {
      webhook.lastTriggered = new Date().toISOString();
      webhook.lastStatus = 'failed';
      webhooks.set(webhook.id, webhook);
      
      console.error(`[Webhooks] ${webhook.name}: ERROR`, error);
    }
  }
}

// Test a webhook
export async function testWebhook(id: string): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const webhook = webhooks.get(id);
  if (!webhook) return { success: false, error: 'Webhook not found' };

  const testPayload: WebhookPayload = {
    event: 'scan.completed',
    timestamp: new Date().toISOString(),
    data: {
      scanUrl: 'https://example.com',
      score: 85,
      totalIssues: 12,
      critical: 0,
      serious: 3,
      moderate: 5,
      minor: 4,
    },
  };

  try {
    const payloadString = JSON.stringify(testPayload);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'AllyLab-Webhook/1.0',
      'X-AllyLab-Event': 'test',
      'X-AllyLab-Delivery': `${Date.now()}`,
    };

    if (webhook.secret) {
      headers['X-AllyLab-Signature'] = `sha256=${generateSignature(payloadString, webhook.secret)}`;
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: payloadString,
    });

    return { 
      success: response.ok, 
      statusCode: response.status 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}