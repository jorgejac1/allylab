import type { Settings, TabConfig } from './types';

export const DEFAULT_SETTINGS: Settings = {
  defaultStandard: 'wcag21aa',
  includeWarnings: false,
  autoSave: true,
  maxScansStored: 100,
};

export const TABS: TabConfig[] = [
  { id: 'general', label: 'General' },
  { id: 'team', label: 'Team' },
  { id: 'billing', label: 'Billing' },
  { id: 'rules', label: 'Rules' },
  { id: 'reports', label: 'Reports' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'schedules', label: 'Scheduled Scans' },
  { id: 'auth', label: 'Authentication' },
  { id: 'webhooks', label: 'Notifications' },
  { id: 'jira', label: 'JIRA' },
  { id: 'git', label: 'Git' },
  { id: 'cicd', label: 'CI/CD' },
  { id: 'api', label: 'API' },
];

export const WCAG_OPTIONS = [
  { value: 'wcag21aa', label: 'WCAG 2.1 AA (Recommended)' },
  { value: 'wcag22aa', label: 'WCAG 2.2 AA' },
  { value: 'wcag21a', label: 'WCAG 2.1 A' },
  { value: 'wcag2aa', label: 'WCAG 2.0 AA' },
  { value: 'wcag2a', label: 'WCAG 2.0 A' },
];

export const METHOD_COLORS: Record<string, string> = {
  GET: '#10b981',
  POST: '#3b82f6',
  PUT: '#f59e0b',
  DELETE: '#ef4444',
};
