import type { WCAGStandard } from '../../types';

export interface Settings {
  defaultStandard: WCAGStandard;
  includeWarnings: boolean;
  autoSave: boolean;
  maxScansStored: number;
}

export type TabId = 'general' | 'team' | 'billing' | 'rules' | 'reports' | 'alerts' | 'schedules' | 'auth' | 'webhooks' | 'jira' | 'git' | 'cicd' | 'api';

export interface TabConfig {
  id: string;
  label: string;
}

export interface EndpointRowProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  onCopy: (text: string) => void;
}

export type { WCAGStandard };
