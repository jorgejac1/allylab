/**
 * Audit Log Types
 *
 * Type definitions for the audit logging system that tracks
 * user actions across the dashboard.
 */

export type AuditEventType =
  | 'scan:run'
  | 'scan:deleted'
  | 'finding:marked-fp'
  | 'finding:unmarked-fp'
  | 'pr:created'
  | 'mr:created'
  | 'pr:verified'
  | 'settings:updated'
  | 'rule:created'
  | 'rule:updated'
  | 'rule:deleted'
  | 'integration:connected'
  | 'integration:disconnected'
  | 'webhook:triggered'
  | 'export:created'
  | 'preset:saved'
  | 'preset:deleted'
  | 'dashboard:customized'
  | 'user:invited'
  | 'user:role-changed';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditEntry {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  action: string;
  resourceType: string;
  resourceId: string;
  userName?: string;
  changes?: Record<string, { before?: unknown; after?: unknown }>;
  success: boolean;
  errorMessage?: string;
}

export interface AuditFilters {
  eventType?: AuditEventType[];
  severity?: AuditSeverity[];
  dateRange?: { start: string; end: string };
  searchText?: string;
}
