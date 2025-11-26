import type { Severity, IssueStatus } from '../../types';
import { SEVERITY_COLORS, STATUS_ICONS } from '../../utils/constants';

interface SeverityBadgeProps {
  severity: Severity;
  count?: number;
}

export function SeverityBadge({ severity, count }: SeverityBadgeProps) {
  return (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        color: '#fff',
        background: SEVERITY_COLORS[severity],
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
      {count !== undefined && <span>({count})</span>}
    </span>
  );
}

interface StatusBadgeProps {
  status: IssueStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors: Record<IssueStatus, { bg: string; text: string }> = {
    new: { bg: '#dbeafe', text: '#1d4ed8' },
    recurring: { bg: '#fef3c7', text: '#b45309' },
    fixed: { bg: '#dcfce7', text: '#15803d' },
  };

  return (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        color: colors[status].text,
        background: colors[status].bg,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {STATUS_ICONS[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}