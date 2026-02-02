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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderRadius: 6,
        background: `${color}15`,
        minWidth: 40,
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
        }}
      />
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{count}</span>
    </div>
  );
});