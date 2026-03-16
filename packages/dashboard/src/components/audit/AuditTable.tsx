import { useState } from 'react';
import { Pagination } from '../ui';
import type { AuditEntry } from '../../types/audit';
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Info,
  AlertOctagon,
} from 'lucide-react';

const SEVERITY_STYLES = {
  info: 'bg-blue-50 text-blue-700',
  warning: 'bg-amber-50 text-amber-700',
  critical: 'bg-red-50 text-red-700',
};

const SEVERITY_ICONS = {
  info: <Info size={12} />,
  warning: <AlertTriangle size={12} />,
  critical: <AlertOctagon size={12} />,
};

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function formatEventType(type: string): string {
  return type.replace(':', ' › ').replace(/-/g, ' ');
}

interface AuditTableProps {
  entries: AuditEntry[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function AuditTable({
  entries,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: AuditTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <div className="p-10 text-center text-slate-500">
        No audit entries found
      </div>
    );
  }

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left">
            <th className="py-2.5 px-3 font-medium text-slate-500 w-8" />
            <th className="py-2.5 px-3 font-medium text-slate-500">Time</th>
            <th className="py-2.5 px-3 font-medium text-slate-500">Event</th>
            <th className="py-2.5 px-3 font-medium text-slate-500">Action</th>
            <th className="py-2.5 px-3 font-medium text-slate-500">Severity</th>
            <th className="py-2.5 px-3 font-medium text-slate-500">Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const hasDetails =
              entry.changes || entry.errorMessage || entry.userName;

            return (
              <tr key={entry.id} className="group">
                <td colSpan={6} className="p-0">
                  <div
                    className={`flex items-center border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${
                      isExpanded ? 'bg-slate-50' : ''
                    }`}
                    onClick={() =>
                      hasDetails &&
                      setExpandedId(isExpanded ? null : entry.id)
                    }
                  >
                    <div className="py-2.5 px-3 w-8 text-slate-400">
                      {hasDetails &&
                        (isExpanded ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        ))}
                    </div>
                    <div className="py-2.5 px-3 text-slate-500 whitespace-nowrap min-w-[100px]">
                      {formatTimestamp(entry.timestamp)}
                    </div>
                    <div className="py-2.5 px-3 min-w-[140px]">
                      <span className="text-xs font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {formatEventType(entry.eventType)}
                      </span>
                    </div>
                    <div className="py-2.5 px-3 flex-1 text-slate-800">
                      {entry.action}
                    </div>
                    <div className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          SEVERITY_STYLES[entry.severity]
                        }`}
                      >
                        {SEVERITY_ICONS[entry.severity]}
                        {entry.severity}
                      </span>
                    </div>
                    <div className="py-2.5 px-3">
                      {entry.success ? (
                        <CheckCircle
                          size={16}
                          className="text-emerald-500"
                        />
                      ) : (
                        <XCircle size={16} className="text-red-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && hasDetails && (
                    <div className="px-12 py-3 bg-slate-50 border-b border-slate-200 text-xs space-y-2">
                      {entry.userName && (
                        <div>
                          <span className="font-medium text-slate-500">
                            User:
                          </span>{' '}
                          <span className="text-slate-700">
                            {entry.userName}
                          </span>
                        </div>
                      )}
                      {entry.resourceType && (
                        <div>
                          <span className="font-medium text-slate-500">
                            Resource:
                          </span>{' '}
                          <span className="text-slate-700">
                            {entry.resourceType} / {entry.resourceId}
                          </span>
                        </div>
                      )}
                      {entry.errorMessage && (
                        <div className="text-red-600 bg-red-50 px-2 py-1 rounded">
                          Error: {entry.errorMessage}
                        </div>
                      )}
                      {entry.changes && (
                        <div>
                          <span className="font-medium text-slate-500 block mb-1">
                            Changes:
                          </span>
                          <div className="bg-white rounded border border-slate-200 p-2 font-mono">
                            {Object.entries(entry.changes).map(
                              ([key, change]) => (
                                <div key={key} className="flex gap-2">
                                  <span className="text-slate-500">
                                    {key}:
                                  </span>
                                  {change.before !== undefined && (
                                    <span className="text-red-500 line-through">
                                      {JSON.stringify(change.before)}
                                    </span>
                                  )}
                                  <span className="text-emerald-600">
                                    {JSON.stringify(change.after)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                      <div className="text-slate-400">
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      )}
    </div>
  );
}
