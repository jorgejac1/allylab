/**
 * useAuditLog Hook
 *
 * Manages audit log state with filtering, pagination, and actions.
 */

import { useState, useMemo, useCallback } from 'react';
import type { AuditEntry, AuditEventType, AuditSeverity } from '../types/audit';
import {
  getAuditEntries,
  getAuditStats,
  clearOldEntries,
  clearAllEntries,
  exportAuditLog,
} from '../utils/auditLog';

export interface UseAuditLogResult {
  // Data
  entries: AuditEntry[];
  filteredEntries: AuditEntry[];
  paginatedEntries: AuditEntry[];
  stats: ReturnType<typeof getAuditStats>;

  // Filters
  eventTypeFilter: AuditEventType[];
  severityFilter: AuditSeverity[];
  searchText: string;
  setEventTypeFilter: (types: AuditEventType[]) => void;
  setSeverityFilter: (severities: AuditSeverity[]) => void;
  setSearchText: (text: string) => void;
  resetFilters: () => void;

  // Pagination
  currentPage: number;
  pageSize: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // Actions
  refresh: () => void;
  clearOld: (days: number) => number;
  clearAll: () => void;
  exportLog: (format: 'json' | 'csv') => void;
}

export function useAuditLog(): UseAuditLogResult {
  const [version, setVersion] = useState(0);
  const [eventTypeFilter, setEventTypeFilter] = useState<AuditEventType[]>([]);
  const [severityFilter, setSeverityFilter] = useState<AuditSeverity[]>([]);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const entries = useMemo(() => {
    void version;
    return getAuditEntries();
  }, [version]);

  const filteredEntries = useMemo(() => {
    void version;
    return getAuditEntries({
      eventType: eventTypeFilter.length > 0 ? eventTypeFilter : undefined,
      severity: severityFilter.length > 0 ? severityFilter : undefined,
      searchText: searchText.trim() || undefined,
    });
  }, [version, eventTypeFilter, severityFilter, searchText]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredEntries.length / pageSize)),
    [filteredEntries.length, pageSize]
  );

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, currentPage, pageSize]);

  const stats = useMemo(() => {
    void version;
    return getAuditStats();
  }, [version]);

  const resetFilters = useCallback(() => {
    setEventTypeFilter([]);
    setSeverityFilter([]);
    setSearchText('');
    setCurrentPage(1);
  }, []);

  const clearOld = useCallback(
    (days: number) => {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const removed = clearOldEntries(cutoff);
      refresh();
      return removed;
    },
    [refresh]
  );

  const handleClearAll = useCallback(() => {
    clearAllEntries();
    refresh();
  }, [refresh]);

  const handleExport = useCallback((format: 'json' | 'csv') => {
    const content = exportAuditLog(format);
    const blob = new Blob([content], {
      type: format === 'json' ? 'application/json' : 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return {
    entries,
    filteredEntries,
    paginatedEntries,
    stats,
    eventTypeFilter,
    severityFilter,
    searchText,
    setEventTypeFilter,
    setSeverityFilter,
    setSearchText,
    resetFilters,
    currentPage,
    pageSize,
    totalPages,
    setCurrentPage,
    setPageSize,
    refresh,
    clearOld,
    clearAll: handleClearAll,
    exportLog: handleExport,
  };
}
