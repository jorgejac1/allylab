import type { DevTimeEstimate, Severity } from '../types';
import { DEV_TIME_PER_ISSUE, HOURS_PER_SPRINT, HOURS_PER_WEEK } from './constants';

type SeverityCounts = Record<Severity, number>;

export function calculateDevTime(counts: SeverityCounts): DevTimeEstimate {
  const bySeverity: Record<Severity, number> = {
    critical: counts.critical * DEV_TIME_PER_ISSUE.critical,
    serious: counts.serious * DEV_TIME_PER_ISSUE.serious,
    moderate: counts.moderate * DEV_TIME_PER_ISSUE.moderate,
    minor: counts.minor * DEV_TIME_PER_ISSUE.minor,
  };

  const totalHours = Object.values(bySeverity).reduce((a, b) => a + b, 0);

  return {
    totalHours: Math.round(totalHours),
    devWeeks: Math.round((totalHours / HOURS_PER_WEEK) * 10) / 10,
    sprints: Math.ceil(totalHours / HOURS_PER_SPRINT),
    bySeverity,
  };
}

export function getRiskAssessment(critical: number, serious: number) {
  if (critical > 50) {
    return { level: 'critical' as const, label: 'CRITICAL', description: 'Severe exposure - immediate action required' };
  }
  if (critical > 20 || serious > 100) {
    return { level: 'high' as const, label: 'HIGH', description: 'Significant risk - prioritize remediation' };
  }
  if (critical > 0 || serious > 50) {
    return { level: 'medium' as const, label: 'MEDIUM', description: 'Moderate risk - plan remediation' };
  }
  return { level: 'low' as const, label: 'LOW', description: 'Low risk - maintain monitoring' };
}