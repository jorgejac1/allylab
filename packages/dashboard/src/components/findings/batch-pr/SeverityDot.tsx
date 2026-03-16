import { memo } from 'react';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  serious: '#f97316',
  moderate: '#eab308',
  minor: '#3b82f6',
};

interface SeverityDotProps {
  severity: string;
}

export const SeverityDot = memo(function SeverityDot({ severity }: SeverityDotProps) {
  return (
    <span
      className="w-2 h-2 rounded-full shrink-0 inline-block"
      style={{ background: SEVERITY_COLORS[severity] || '#94a3b8' }}
    />
  );
});
