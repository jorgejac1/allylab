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