import { memo } from 'react';
import type { IssueStatus as IssueStatusType } from '../../types';
import type { ReactNode } from 'react';
import { BadgePlus, RefreshCw, CheckCircle } from 'lucide-react';

interface IssueStatusProps {
  status: IssueStatusType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const STATUS_CONFIG: Record<IssueStatusType, { icon: ReactNode; color: string; bg: string; label: string }> = {
  new: { icon: <BadgePlus size={14} />, color: '#1d4ed8', bg: '#dbeafe', label: 'New' },
  recurring: { icon: <RefreshCw size={14} />, color: '#b45309', bg: '#fef3c7', label: 'Recurring' },
  fixed: { icon: <CheckCircle size={14} />, color: '#15803d', bg: '#dcfce7', label: 'Fixed' },
};

export const IssueStatus = memo(function IssueStatus({ status, size = 'md', showLabel = true }: IssueStatusProps) {
  const config = STATUS_CONFIG[status];

  const sizeClasses = {
    sm: 'py-0.5 px-1.5 text-[10px]',
    md: 'py-1 px-2.5 text-xs',
    lg: 'py-1.5 px-3.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClasses[size]}`}
      style={{ background: config.bg, color: config.color }}
    >
      <span className="inline-flex items-center">{config.icon}</span>
      {showLabel && config.label}
    </span>
  );
});

// Summary component for displaying all status counts
interface IssueStatusSummaryProps {
  newCount: number;
  recurringCount: number;
  fixedCount: number;
}

export const IssueStatusSummary = memo(function IssueStatusSummary({ newCount, recurringCount, fixedCount }: IssueStatusSummaryProps) {
  const total = newCount + recurringCount + fixedCount;

  return (
    <div className="flex gap-4 py-3 px-4 bg-slate-50 rounded-lg border border-slate-200 items-center">
      <StatusItem status="new" count={newCount} />
      <StatusItem status="recurring" count={recurringCount} />
      <StatusItem status="fixed" count={fixedCount} />
      <div className="ml-auto flex items-center gap-2">
        <span className="font-bold">{total}</span>
        <span className="text-[13px] text-slate-500">Total Tracked</span>
      </div>
    </div>
  );
});

function StatusItem({ status, count }: { status: IssueStatusType; count: number }) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center">{config.icon}</span>
      <span className="font-bold" style={{ color: config.color }}>{count}</span>
      <span className="text-[13px] text-slate-500">{config.label}</span>
    </div>
  );
}
