import type { Severity } from '../../../types';

export const FIX_DIFFICULTY: Record<Severity, { label: string; time: string; color: string }> = {
  critical: { label: 'Quick Fix', time: '5-10 min', color: '#10b981' },
  serious: { label: 'Moderate', time: '15-30 min', color: '#f59e0b' },
  moderate: { label: 'Moderate', time: '10-20 min', color: '#f59e0b' },
  minor: { label: 'Simple', time: '2-5 min', color: '#10b981' },
};
