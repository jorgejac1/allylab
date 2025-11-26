const SEVERITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  serious: '#f97316',
  moderate: '#eab308',
  minor: '#3b82f6',
};

interface SeverityDotProps {
  severity: string;
}

export function SeverityDot({ severity }: SeverityDotProps) {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: SEVERITY_COLORS[severity] || '#94a3b8',
        flexShrink: 0,
        display: 'inline-block',
      }}
    />
  );
}