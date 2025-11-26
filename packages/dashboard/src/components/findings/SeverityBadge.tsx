import type { Severity } from '../../types';

const SEVERITY_CONFIG: Record<Severity, { color: string; background: string; label: string }> = {
  critical: { color: '#fff', background: '#dc2626', label: 'Critical' },
  serious: { color: '#fff', background: '#ea580c', label: 'Serious' },
  moderate: { color: '#fff', background: '#ca8a04', label: 'Moderate' },
  minor: { color: '#fff', background: '#65a30d', label: 'Minor' },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const config = SEVERITY_CONFIG[severity];

  return (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        color: config.color,
        background: config.background,
        textTransform: 'capitalize',
      }}
    >
      {config.label}
    </span>
  );
}