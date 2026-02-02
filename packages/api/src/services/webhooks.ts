import crypto from 'crypto';
import type {
  Webhook,
  WebhookEvent,
  WebhookPayload,
  WebhookCreateRequest,
  WebhookUpdateRequest,
  WebhookType,
  SlackPayload,
  TeamsPayload,
} from '../types/webhook';
import { webhookLogger } from '../utils/logger.js';

// In-memory storage (replace with DB later)
const webhooks = new Map<string, Webhook>();

// ============================================
// Retry Configuration
// ============================================

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelayMs: 1000,      // 1 second
  maxDelayMs: 60000,      // 1 minute max
  backoffMultiplier: 2,   // Double delay each retry
};

/**
 * Calculate delay for exponential backoff with jitter
 */
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  // Add jitter (±10%) to prevent thundering herd
  const jitter = cappedDelay * 0.1 * (Math.random() * 2 - 1);
  return Math.floor(cappedDelay + jitter);
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(statusCode: number): boolean {
  // Retry on server errors (5xx) and rate limiting (429)
  // Don't retry on client errors (4xx except 429) as they won't succeed
  return statusCode >= 500 || statusCode === 429;
}

interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  attempts: number;
  error?: string;
}

function generateId(): string {
  return `wh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// ============================================
// Platform-Specific Payload Formatters
// ============================================

function getScoreEmoji(score: number): string {
  if (score >= 90) return '🟢';
  if (score >= 70) return '🟡';
  if (score >= 50) return '🟠';
  return '🔴';
}

function getEventTitle(event: WebhookEvent): string {
  switch (event) {
    case 'scan.completed': return 'Accessibility Scan Completed';
    case 'scan.failed': return 'Accessibility Scan Failed';
    case 'score.dropped': return '⚠️ Accessibility Score Dropped';
    case 'critical.found': return '🚨 Critical Issues Detected';
    default: return 'AllyLab Notification';
  }
}

function formatSlackPayload(payload: WebhookPayload): SlackPayload {
  const { event, data, timestamp } = payload;
  const title = getEventTitle(event);
  
  if (event === 'scan.failed') {
    return {
      text: `${title}: ${data.scanUrl}`,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '❌ Scan Failed', emoji: true }
        },
        {
          type: 'section',
          text: { 
            type: 'mrkdwn', 
            text: `*URL:* <${data.scanUrl}|${data.scanUrl}>\n*Error:* ${data.error || 'Unknown error'}` 
          }
        },
        {
          type: 'context',
          elements: [{ type: 'mrkdwn', text: `🕐 ${new Date(timestamp).toLocaleString()}` }]
        }
      ]
    };
  }

  const scoreEmoji = getScoreEmoji(data.score || 0);
  const scoreDiff = data.previousScore !== undefined 
    ? ` (${data.score! >= data.previousScore ? '+' : ''}${data.score! - data.previousScore})`
    : '';

  const blocks: SlackPayload['blocks'] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: title, emoji: true }
    },
    {
      type: 'section',
      text: { 
        type: 'mrkdwn', 
        text: `*URL:* <${data.scanUrl}|${data.scanUrl}>` 
      }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Score*\n${scoreEmoji} ${data.score}/100${scoreDiff}` },
        { type: 'mrkdwn', text: `*Total Issues*\n${data.totalIssues || 0}` },
      ]
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*🔴 Critical*\n${data.critical || 0}` },
        { type: 'mrkdwn', text: `*🟠 Serious*\n${data.serious || 0}` },
        { type: 'mrkdwn', text: `*🟡 Moderate*\n${data.moderate || 0}` },
        { type: 'mrkdwn', text: `*🔵 Minor*\n${data.minor || 0}` },
      ]
    },
  ];

  // Add pages scanned if available
  if (data.pagesScanned) {
    blocks.push({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `📄 ${data.pagesScanned} pages scanned` }]
    });
  }

  // Add action button
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: '📊 View Full Report', emoji: true },
        url: data.scanUrl,
        style: 'primary'
      }
    ]
  });

  // Add timestamp
  blocks.push({
    type: 'context',
    elements: [{ type: 'mrkdwn', text: `🕐 ${new Date(timestamp).toLocaleString()} • AllyLab` }]
  });

  // Color-coded attachment based on event
  const color = event === 'critical.found' ? '#dc2626' 
    : event === 'score.dropped' ? '#f59e0b'
    : (data.score || 0) >= 70 ? '#10b981' : '#f59e0b';

  return {
    text: `${title}: ${data.scanUrl} - Score: ${data.score}/100`,
    attachments: [{ color, blocks }]
  };
}

function formatTeamsPayload(payload: WebhookPayload): TeamsPayload {
  const { event, data, timestamp } = payload;
  const title = getEventTitle(event);
  
  const themeColor = event === 'critical.found' ? 'attention'
    : event === 'score.dropped' ? 'warning'
    : event === 'scan.failed' ? 'attention'
    : 'good';

  if (event === 'scan.failed') {
    return {
      type: 'message',
      attachments: [{
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'TextBlock',
              text: '❌ Accessibility Scan Failed',
              size: 'Large',
              weight: 'Bolder',
              color: 'Attention'
            },
            {
              type: 'FactSet',
              facts: [
                { title: 'URL', value: data.scanUrl || 'N/A' },
                { title: 'Error', value: data.error || 'Unknown error' },
                { title: 'Time', value: new Date(timestamp).toLocaleString() }
              ]
            }
          ]
        }
      }]
    };
  }

  const scoreEmoji = getScoreEmoji(data.score || 0);
  const scoreDiff = data.previousScore !== undefined 
    ? ` (${data.score! >= data.previousScore ? '+' : ''}${data.score! - data.previousScore})`
    : '';

  return {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        body: [
          {
            type: 'TextBlock',
            text: title,
            size: 'Large',
            weight: 'Bolder',
            color: themeColor === 'good' ? 'Good' : themeColor === 'warning' ? 'Warning' : 'Attention'
          },
          {
            type: 'TextBlock',
            text: data.scanUrl || '',
            wrap: true,
            color: 'Accent'
          },
          {
            type: 'ColumnSet',
            columns: [
              {
                type: 'Column',
                width: 'auto',
                items: [
                  {
                    type: 'TextBlock',
                    text: `${scoreEmoji} Score`,
                    weight: 'Bolder'
                  },
                  {
                    type: 'TextBlock',
                    text: `${data.score}/100${scoreDiff}`,
                    size: 'ExtraLarge',
                    weight: 'Bolder'
                  }
                ]
              },
              {
                type: 'Column',
                width: 'stretch',
                items: [
                  {
                    type: 'FactSet',
                    facts: [
                      { title: '🔴 Critical', value: String(data.critical || 0) },
                      { title: '🟠 Serious', value: String(data.serious || 0) },
                      { title: '🟡 Moderate', value: String(data.moderate || 0) },
                      { title: '🔵 Minor', value: String(data.minor || 0) }
                    ]
                  }
                ]
              }
            ]
          },
          {
            type: 'TextBlock',
            text: `Total Issues: ${data.totalIssues || 0}${data.pagesScanned ? ` • ${data.pagesScanned} pages scanned` : ''}`,
            spacing: 'Medium',
            color: 'Default'
          },
          {
            type: 'TextBlock',
            text: `🕐 ${new Date(timestamp).toLocaleString()}`,
            size: 'Small',
            color: 'Default',
            spacing: 'Small'
          }
        ],
        actions: [
          {
            type: 'Action.OpenUrl',
            title: '📊 View Full Report',
            url: data.scanUrl || '#'
          }
        ]
      }
    }]
  };
}

function formatPayloadForPlatform(
  type: WebhookType, 
  payload: WebhookPayload
): { body: string; contentType: string } {
  switch (type) {
    case 'slack':
      return {
        body: JSON.stringify(formatSlackPayload(payload)),
        contentType: 'application/json'
      };
    case 'teams':
      return {
        body: JSON.stringify(formatTeamsPayload(payload)),
        contentType: 'application/json'
      };
    case 'generic':
    default:
      return {
        body: JSON.stringify(payload),
        contentType: 'application/json'
      };
  }
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
  // Auto-detect type from URL if not specified
  let type: WebhookType = data.type || 'generic';
  if (!data.type) {
    if (data.url.includes('hooks.slack.com')) {
      type = 'slack';
    } else if (data.url.includes('webhook.office.com') || data.url.includes('outlook.office.com')) {
      type = 'teams';
    }
  }

  const webhook: Webhook = {
    id: generateId(),
    name: data.name,
    url: data.url,
    type,
    events: data.events,
    enabled: true,
    secret: data.secret,
    createdAt: new Date().toISOString(),
  };

  webhooks.set(webhook.id, webhook);
  webhookLogger.info({ msg: 'Webhook created', type, name: webhook.name, id: webhook.id });
  return webhook;
}

export function updateWebhook(id: string, updates: WebhookUpdateRequest): Webhook | null {
  const webhook = webhooks.get(id);
  if (!webhook) return null;

  if (updates.name !== undefined) webhook.name = updates.name;
  if (updates.url !== undefined) {
    webhook.url = updates.url;
    // Re-detect type if URL changed and type not explicitly set
    if (updates.type === undefined) {
      if (updates.url.includes('hooks.slack.com')) {
        webhook.type = 'slack';
      } else if (updates.url.includes('webhook.office.com') || updates.url.includes('outlook.office.com')) {
        webhook.type = 'teams';
      }
    }
  }
  if (updates.type !== undefined) webhook.type = updates.type;
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
// Webhook Delivery with Retry
// ============================================

/**
 * Deliver a webhook with retry logic
 */
async function deliverWebhook(
  webhook: Webhook,
  payload: WebhookPayload,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<WebhookDeliveryResult> {
  const { body, contentType } = formatPayloadForPlatform(webhook.type, payload);

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'User-Agent': 'AllyLab-Webhook/1.0',
  };

  // Only add custom headers for generic webhooks (Slack/Teams don't need them)
  if (webhook.type === 'generic') {
    headers['X-AllyLab-Event'] = payload.event;
    headers['X-AllyLab-Delivery'] = `${Date.now()}`;

    if (webhook.secret) {
      headers['X-AllyLab-Signature'] = `sha256=${generateSignature(body, webhook.secret)}`;
    }
  }

  let lastError: string | undefined;
  let lastStatusCode: number | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Wait before retry (skip for first attempt)
      if (attempt > 0) {
        const delay = calculateBackoffDelay(attempt - 1, config);
        webhookLogger.debug({
          msg: 'Retrying webhook delivery',
          webhookId: webhook.id,
          attempt,
          delayMs: delay,
        });
        await sleep(delay);
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
      });

      lastStatusCode = response.status;

      if (response.ok) {
        if (attempt > 0) {
          webhookLogger.info({
            msg: 'Webhook delivered after retry',
            webhookId: webhook.id,
            name: webhook.name,
            attempts: attempt + 1,
            statusCode: response.status,
          });
        }
        return {
          success: true,
          statusCode: response.status,
          attempts: attempt + 1,
        };
      }

      // Check if we should retry
      if (!isRetryableError(response.status)) {
        webhookLogger.warn({
          msg: 'Webhook delivery failed with non-retryable error',
          webhookId: webhook.id,
          name: webhook.name,
          statusCode: response.status,
        });
        return {
          success: false,
          statusCode: response.status,
          attempts: attempt + 1,
          error: `HTTP ${response.status}`,
        };
      }

      lastError = `HTTP ${response.status}`;
      webhookLogger.warn({
        msg: 'Webhook delivery failed, will retry',
        webhookId: webhook.id,
        attempt: attempt + 1,
        maxRetries: config.maxRetries,
        statusCode: response.status,
      });
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Network error';
      webhookLogger.warn({
        msg: 'Webhook delivery error, will retry',
        webhookId: webhook.id,
        attempt: attempt + 1,
        maxRetries: config.maxRetries,
        error: lastError,
      });
    }
  }

  // All retries exhausted
  webhookLogger.error({
    msg: 'Webhook delivery failed after all retries',
    webhookId: webhook.id,
    name: webhook.name,
    attempts: config.maxRetries + 1,
    lastError,
  });

  return {
    success: false,
    statusCode: lastStatusCode,
    attempts: config.maxRetries + 1,
    error: lastError,
  };
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

  webhookLogger.info({
    msg: 'Triggering webhooks',
    event,
    webhookCount: relevantWebhooks.length,
  });

  // Deliver all webhooks concurrently
  const deliveryPromises = relevantWebhooks.map(async (webhook) => {
    const result = await deliverWebhook(webhook, payload);

    // Update webhook status
    webhook.lastTriggered = new Date().toISOString();
    webhook.lastStatus = result.success ? 'success' : 'failed';
    webhooks.set(webhook.id, webhook);

    webhookLogger.info({
      msg: 'Webhook delivery completed',
      webhookId: webhook.id,
      name: webhook.name,
      type: webhook.type,
      success: result.success,
      attempts: result.attempts,
      statusCode: result.statusCode,
    });

    return { webhook, result };
  });

  await Promise.all(deliveryPromises);
}

// Test a webhook (no retries for testing)
export async function testWebhook(id: string): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const webhook = webhooks.get(id);
  if (!webhook) return { success: false, error: 'Webhook not found' };

  // Use 'test' as the event type for testing
  const testPayload: WebhookPayload = {
    event: 'test' as WebhookEvent,
    timestamp: new Date().toISOString(),
    data: {
      scanUrl: 'https://example.com',
      score: 85,
      totalIssues: 12,
      critical: 0,
      serious: 3,
      moderate: 5,
      minor: 4,
      pagesScanned: 5,
    },
  };

  webhookLogger.info({ msg: 'Testing webhook', webhookId: id, name: webhook.name });

  // Use delivery function with no retries for testing
  const result = await deliverWebhook(webhook, testPayload, {
    maxRetries: 0,
    baseDelayMs: 0,
    maxDelayMs: 0,
    backoffMultiplier: 1,
  });

  return {
    success: result.success,
    statusCode: result.statusCode,
    error: result.error,
  };
}

// Export retry config for testing
export { DEFAULT_RETRY_CONFIG, calculateBackoffDelay, isRetryableError };