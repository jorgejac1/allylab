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

  const sizes = {
    sm: { padding: '2px 6px', fontSize: 10, iconSize: 12 },
    md: { padding: '4px 10px', fontSize: 12, iconSize: 14 },
    lg: { padding: '6px 14px', fontSize: 14, iconSize: 18 },
  };

  const sizeStyle = sizes[size];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: sizeStyle.padding,
        borderRadius: 20,
        background: config.bg,
        color: config.color,
        fontSize: sizeStyle.fontSize,
        fontWeight: 600,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>{config.icon}</span>
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
    <div
      style={{
        display: 'flex',
        gap: 16,
        padding: '12px 16px',
        background: '#f8fafc',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        alignItems: 'center',
      }}
    >
      <StatusItem status="new" count={newCount} />
      <StatusItem status="recurring" count={recurringCount} />
      <StatusItem status="fixed" count={fixedCount} />
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 700 }}>{total}</span>
        <span style={{ fontSize: 13, color: '#64748b' }}>Total Tracked</span>
      </div>
    </div>
  );
});

function StatusItem({ status, count }: { status: IssueStatusType; count: number }) {
  const config = STATUS_CONFIG[status];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>{config.icon}</span>
      <span style={{ fontWeight: 700, color: config.color }}>{count}</span>
      <span style={{ fontSize: 13, color: '#64748b' }}>{config.label}</span>
    </div>
  );
}