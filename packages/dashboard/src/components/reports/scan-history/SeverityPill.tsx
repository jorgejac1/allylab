import { memo } from 'react';
import { SEVERITY_COLORS } from '../../../utils/constants';

interface SeverityPillProps {
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  count: number;
}

export const SeverityPill = memo(function SeverityPill({ severity, count }: SeverityPillProps) {
  if (count === 0) return null;

  const color = SEVERITY_COLORS[severity];

  return (
    <div
      className="flex items-center gap-1 py-1 px-2 rounded-md min-w-[40px] justify-center"
      style={{ background: `${color}15` }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      <span className="text-xs font-semibold" style={{ color }}>{count}</span>
    </div>
  );
});
