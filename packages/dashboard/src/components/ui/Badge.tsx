import type { Severity, IssueStatus } from '../../types';
import { SEVERITY_COLORS, STATUS_ICONS } from '../../utils/constants';

interface SeverityBadgeProps {
  severity: Severity;
  count?: number;
}

export function SeverityBadge({ severity, count }: SeverityBadgeProps) {
  return (
    <span
      className="py-1 px-2.5 rounded-full text-xs/[normal] font-semibold text-white inline-flex items-center gap-1"
      style={{ background: SEVERITY_COLORS[severity] }}
    >
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
      {count !== undefined && <span>({count})</span>}
    </span>
  );
}

interface StatusBadgeProps {
  status: IssueStatus;
}

const statusColors: Record<IssueStatus, { bg: string; text: string }> = {
  new: { bg: 'bg-blue-100', text: 'text-blue-700' },
  recurring: { bg: 'bg-amber-100', text: 'text-amber-700' },
  fixed: { bg: 'bg-green-100', text: 'text-green-700' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { bg, text } = statusColors[status];

  return (
    <span
      className={`py-1 px-2.5 rounded-full text-xs/[normal] font-semibold inline-flex items-center gap-1 ${bg} ${text}`}
    >
      {STATUS_ICONS[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
