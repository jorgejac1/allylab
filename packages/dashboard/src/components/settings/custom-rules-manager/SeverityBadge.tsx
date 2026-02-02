import { SEVERITY_COLORS } from './constants';
import type { SeverityBadgeProps } from './types';

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const color = SEVERITY_COLORS[severity];

  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      background: `${color}15`,
      color: color,
      textTransform: 'uppercase',
    }}>
      {severity}
    </span>
  );
}
