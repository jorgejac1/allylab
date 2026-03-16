import { SEVERITY_COLORS } from './constants';
import type { SeverityBadgeProps } from './types';

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const color = SEVERITY_COLORS[severity];

  return (
    <span
      className="py-0.5 px-2 rounded text-[11px] font-semibold uppercase"
      style={{
        background: `${color}15`,
        color: color,
      }}
    >
      {severity}
    </span>
  );
}
