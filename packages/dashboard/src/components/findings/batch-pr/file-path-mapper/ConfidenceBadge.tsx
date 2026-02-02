import { Target, CircleMinus, CircleHelp } from 'lucide-react';
import type { ConfidenceLevel } from './types';

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
}

const confidenceConfig = {
  high: {
    icon: Target,
    bg: '#dcfce7',
    color: '#166534',
    label: 'High'
  },
  medium: {
    icon: CircleMinus,
    bg: '#fef3c7',
    color: '#92400e',
    label: 'Medium'
  },
  low: {
    icon: CircleHelp,
    bg: '#fee2e2',
    color: '#991b1b',
    label: 'Low'
  },
};

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const config = confidenceConfig[confidence];
  const Icon = config.icon;

  return (
    <span style={{
      fontSize: 10,
      fontWeight: 500,
      padding: '2px 6px',
      borderRadius: 4,
      background: config.bg,
      color: config.color,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
    }}>
      <Icon size={10} aria-hidden="true" /> {config.label}
    </span>
  );
}
