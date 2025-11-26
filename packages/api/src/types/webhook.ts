export type WebhookEvent = 
  | 'scan.completed' 
  | 'scan.failed' 
  | 'score.dropped' 
  | 'critical.found';

export interface Webhook {
  id: string;
  name: string;
  url: string;
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
  };
}

export interface WebhookCreateRequest {
  name: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
}

export interface WebhookUpdateRequest {
  name?: string;
  url?: string;
  events?: WebhookEvent[];
  enabled?: boolean;
  secret?: string;
}