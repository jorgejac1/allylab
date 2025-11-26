import type { Severity } from '../types';

export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: '#dc2626',
  serious: '#ea580c',
  moderate: '#ca8a04',
  minor: '#65a30d',
};

export const SEVERITY_BG: Record<Severity, string> = {
  critical: '#fef2f2',
  serious: '#fff7ed',
  moderate: '#fefce8',
  minor: '#f0fdf4',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
};

export const STATUS_ICONS: Record<string, string> = {
  new: '🆕',
  recurring: '🔄',
  fixed: '✅',
};

export const DEV_TIME_PER_ISSUE: Record<Severity, number> = {
  critical: 4,    // 4 hours per critical issue
  serious: 2,     // 2 hours per serious issue
  moderate: 1,    // 1 hour per moderate issue
  minor: 0.5,     // 30 min per minor issue
};

export const HOURS_PER_SPRINT = 80;
export const HOURS_PER_WEEK = 40;