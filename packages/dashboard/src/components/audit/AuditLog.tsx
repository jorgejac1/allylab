import { Card, Button } from '../ui';
import { useAuditLog } from '../../hooks/useAuditLog';
import { AuditFilterBar } from './AuditFilterBar';
import { AuditTable } from './AuditTable';
import { AuditExportButton } from './AuditExportButton';
import { Activity, Clock, AlertTriangle, XCircle, Trash2, RefreshCw } from 'lucide-react';

export function AuditLog() {
  const audit = useAuditLog();

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatMini
          icon={<Activity size={16} />}
          label="Total Events"
          value={audit.stats.total}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatMini
          icon={<Clock size={16} />}
          label="Last 24h"
          value={audit.stats.last24h}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatMini
          icon={<AlertTriangle size={16} />}
          label="Warnings"
          value={audit.stats.bySeverity.warning}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        <StatMini
          icon={<XCircle size={16} />}
          label="Failures"
          value={audit.stats.failures}
          color="text-red-600"
          bgColor="bg-red-50"
        />
      </div>

      {/* Filters */}
      <AuditFilterBar
        eventTypeFilter={audit.eventTypeFilter}
        severityFilter={audit.severityFilter}
        searchText={audit.searchText}
        onEventTypeChange={audit.setEventTypeFilter}
        onSeverityChange={audit.setSeverityFilter}
        onSearchChange={audit.setSearchText}
        onReset={audit.resetFilters}
      />

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">
          {audit.filteredEntries.length} entries
          {audit.filteredEntries.length !== audit.entries.length &&
            ` (filtered from ${audit.entries.length})`}
        </span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={audit.refresh}
            className="inline-flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Refresh
          </Button>
          <AuditExportButton onExport={audit.exportLog} />
          {audit.entries.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm('Clear entries older than 90 days?')) {
                  audit.clearOld(90);
                }
              }}
              className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700"
            >
              <Trash2 size={14} /> Clean Up
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <AuditTable
          entries={audit.paginatedEntries}
          currentPage={audit.currentPage}
          totalPages={audit.totalPages}
          pageSize={audit.pageSize}
          onPageChange={audit.setCurrentPage}
          onPageSizeChange={audit.setPageSize}
        />
      </Card>
    </div>
  );
}

function StatMini({
  icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg ${bgColor} ${color} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <div className="text-lg font-semibold text-slate-800">{value.toLocaleString()}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </Card>
  );
}

export default AuditLog;
