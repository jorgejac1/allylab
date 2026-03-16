/**
 * Audit Log Storage Utilities
 *
 * Manages audit log entries in localStorage with filtering,
 * retention cleanup, and export capabilities.
 */

import { STORAGE_KEYS } from '../config';
import type { AuditEntry, AuditEventType, AuditFilters, AuditSeverity } from '../types/audit';

const MAX_ENTRIES = 5000;

function loadEntries(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOG);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: AuditEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(entries));
}

export function addAuditEntry(
  entry: Omit<AuditEntry, 'id' | 'timestamp'>
): AuditEntry {
  const entries = loadEntries();
  const newEntry: AuditEntry = {
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };

  entries.unshift(newEntry);

  // Cap at MAX_ENTRIES
  if (entries.length > MAX_ENTRIES) {
    entries.length = MAX_ENTRIES;
  }

  saveEntries(entries);
  return newEntry;
}

export function getAuditEntries(
  filters?: AuditFilters,
  limit?: number
): AuditEntry[] {
  let entries = loadEntries();

  if (filters) {
    if (filters.eventType && filters.eventType.length > 0) {
      const types = new Set<AuditEventType>(filters.eventType);
      entries = entries.filter((e) => types.has(e.eventType));
    }

    if (filters.severity && filters.severity.length > 0) {
      const sevs = new Set<AuditSeverity>(filters.severity);
      entries = entries.filter((e) => sevs.has(e.severity));
    }

    if (filters.dateRange) {
      const start = new Date(filters.dateRange.start).getTime();
      const end = new Date(filters.dateRange.end).getTime();
      entries = entries.filter((e) => {
        const t = new Date(e.timestamp).getTime();
        return t >= start && t <= end;
      });
    }

    if (filters.searchText) {
      const q = filters.searchText.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.action.toLowerCase().includes(q) ||
          e.resourceType.toLowerCase().includes(q) ||
          e.resourceId.toLowerCase().includes(q) ||
          (e.userName && e.userName.toLowerCase().includes(q)) ||
          e.eventType.toLowerCase().includes(q)
      );
    }
  }

  if (limit && limit > 0) {
    entries = entries.slice(0, limit);
  }

  return entries;
}

export function clearOldEntries(beforeDate: Date): number {
  const entries = loadEntries();
  const cutoff = beforeDate.getTime();
  const kept = entries.filter(
    (e) => new Date(e.timestamp).getTime() >= cutoff
  );
  const removed = entries.length - kept.length;
  saveEntries(kept);
  return removed;
}

export function clearAllEntries(): void {
  saveEntries([]);
}

export function exportAuditLog(format: 'json' | 'csv'): string {
  const entries = loadEntries();

  if (format === 'json') {
    return JSON.stringify(entries, null, 2);
  }

  // CSV
  const headers = [
    'Timestamp',
    'Event Type',
    'Severity',
    'Action',
    'Resource Type',
    'Resource ID',
    'User',
    'Success',
    'Error',
  ];
  const rows = entries.map((e) => [
    e.timestamp,
    e.eventType,
    e.severity,
    `"${e.action.replace(/"/g, '""')}"`,
    e.resourceType,
    e.resourceId,
    e.userName || '',
    String(e.success),
    e.errorMessage || '',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function getAuditStats() {
  const entries = loadEntries();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const last24h = entries.filter(
    (e) => now - new Date(e.timestamp).getTime() < dayMs
  ).length;
  const last7d = entries.filter(
    (e) => now - new Date(e.timestamp).getTime() < 7 * dayMs
  ).length;

  const byType: Partial<Record<AuditEventType, number>> = {};
  const bySeverity: Record<AuditSeverity, number> = {
    info: 0,
    warning: 0,
    critical: 0,
  };

  for (const e of entries) {
    byType[e.eventType] = (byType[e.eventType] || 0) + 1;
    bySeverity[e.severity]++;
  }

  return {
    total: entries.length,
    last24h,
    last7d,
    byType,
    bySeverity,
    failures: entries.filter((e) => !e.success).length,
  };
}
