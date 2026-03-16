import { Search } from 'lucide-react';
import type { AuditEventType, AuditSeverity } from '../../types/audit';

const EVENT_GROUPS: { label: string; types: AuditEventType[] }[] = [
  { label: 'Scans', types: ['scan:run', 'scan:deleted'] },
  { label: 'Findings', types: ['finding:marked-fp', 'finding:unmarked-fp'] },
  { label: 'PRs/MRs', types: ['pr:created', 'mr:created', 'pr:verified'] },
  { label: 'Rules', types: ['rule:created', 'rule:updated', 'rule:deleted'] },
  { label: 'Settings', types: ['settings:updated', 'integration:connected', 'integration:disconnected'] },
  { label: 'Other', types: ['webhook:triggered', 'export:created', 'preset:saved', 'preset:deleted', 'dashboard:customized', 'user:invited', 'user:role-changed'] },
];

const SEVERITY_OPTIONS: { value: AuditSeverity; label: string; color: string }[] = [
  { value: 'info', label: 'Info', color: 'bg-blue-100 text-blue-700' },
  { value: 'warning', label: 'Warning', color: 'bg-amber-100 text-amber-700' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
];

interface AuditFilterBarProps {
  eventTypeFilter: AuditEventType[];
  severityFilter: AuditSeverity[];
  searchText: string;
  onEventTypeChange: (types: AuditEventType[]) => void;
  onSeverityChange: (severities: AuditSeverity[]) => void;
  onSearchChange: (text: string) => void;
  onReset: () => void;
}

export function AuditFilterBar({
  eventTypeFilter,
  severityFilter,
  searchText,
  onEventTypeChange,
  onSeverityChange,
  onSearchChange,
  onReset,
}: AuditFilterBarProps) {
  const hasFilters =
    eventTypeFilter.length > 0 ||
    severityFilter.length > 0 ||
    searchText.trim().length > 0;

  const toggleEventGroup = (types: AuditEventType[]) => {
    const allSelected = types.every((t) => eventTypeFilter.includes(t));
    if (allSelected) {
      onEventTypeChange(eventTypeFilter.filter((t) => !types.includes(t)));
    } else {
      const merged = new Set([...eventTypeFilter, ...types]);
      onEventTypeChange([...merged]);
    }
  };

  const toggleSeverity = (sev: AuditSeverity) => {
    if (severityFilter.includes(sev)) {
      onSeverityChange(severityFilter.filter((s) => s !== sev));
    } else {
      onSeverityChange([...severityFilter, sev]);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search audit log..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {/* Event type groups */}
        <span className="text-xs font-medium text-slate-500 mr-1">Events:</span>
        {EVENT_GROUPS.map((group) => {
          const active = group.types.every((t) => eventTypeFilter.includes(t));
          return (
            <button
              key={group.label}
              onClick={() => toggleEventGroup(group.types)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {group.label}
            </button>
          );
        })}

        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Severity */}
        <span className="text-xs font-medium text-slate-500 mr-1">Severity:</span>
        {SEVERITY_OPTIONS.map((opt) => {
          const active = severityFilter.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggleSeverity(opt.value)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                active
                  ? opt.color
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </button>
          );
        })}

        {hasFilters && (
          <>
            <div className="flex-1" />
            <button
              onClick={onReset}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear filters
            </button>
          </>
        )}
      </div>
    </div>
  );
}
