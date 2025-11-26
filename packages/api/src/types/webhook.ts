export type WebhookEvent = 
  | 'scan.completed' 
  | 'scan.failed' 
  | 'score.dropped' 
  | 'critical.found';

export type WebhookType = 'generic' | 'slack' | 'teams';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  type: WebhookType;
  events: WebhookEvent[];
  enabled: boolean;
  secret?: string;
  createdAt: string;
  lastTriggered?: string;
  lastStatus?: 'success' | 'failed';
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: {
    scanUrl?: string;
    score?: number;
    previousScore?: number;
    totalIssues?: number;
    critical?: number;
    serious?: number;
    moderate?: number;
    minor?: number;
    error?: string;
    pagesScanned?: number;
    duration?: number;
  };
}

export interface WebhookCreateRequest {
  name: string;
  url: string;
  type?: WebhookType;
  events: WebhookEvent[];
  secret?: string;
}

export interface WebhookUpdateRequest {
  name?: string;
  url?: string;
  type?: WebhookType;
  events?: WebhookEvent[];
  enabled?: boolean;
  secret?: string;
}

// ============================================
// Slack Block Kit Types (simplified)
// ============================================

// Use Record types for flexibility with Slack's complex nested structures
export type SlackBlock = Record<string, unknown>;

export interface SlackAttachment {
  color: string;
  blocks?: SlackBlock[];
}

export interface SlackPayload {
  text: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
}

// ============================================
// Teams Adaptive Card Types (simplified)
// ============================================

export type TeamsElement = Record<string, unknown>;

export interface TeamsAdaptiveCard {
  $schema: string;
  type: 'AdaptiveCard';
  version: string;
  body: TeamsElement[];
  actions?: Record<string, unknown>[];
}

export interface TeamsAttachment {
  contentType: 'application/vnd.microsoft.card.adaptive';
  content: TeamsAdaptiveCard;
}

export interface TeamsPayload {
  type: 'message';
  attachments: TeamsAttachment[];
}