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