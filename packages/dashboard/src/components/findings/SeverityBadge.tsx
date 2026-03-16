import { memo } from 'react';
import type { Severity } from '../../types';

const SEVERITY_CONFIG: Record<Severity, { color: string; background: string; label: string }> = {
  critical: { color: '#fff', background: '#dc2626', label: 'Critical' },
  serious: { color: '#fff', background: '#ea580c', label: 'Serious' },
  moderate: { color: '#fff', background: '#ca8a04', label: 'Moderate' },
  minor: { color: '#fff', background: '#65a30d', label: 'Minor' },
};

export const SeverityBadge = memo(function SeverityBadge({ severity }: { severity: Severity }) {
  const config = SEVERITY_CONFIG[severity];

  return (
    <span
      className="py-1 px-2.5 rounded-full text-xs font-semibold capitalize"
      style={{ color: config.color, background: config.background }}
    >
      {config.label}
    </span>
  );
});
