import type { Severity } from './index';

// ============================================
// JIRA Configuration Types
// ============================================

export interface JiraConfig {
  enabled: boolean;
  endpoint: string;
  projectKey: string;
  issueType: string;
  // Auth can be handled by user's proxy
  authHeader?: string;
}

export interface JiraFieldMapping {
  // AllyLab field → JIRA field
  severity: {
    field: string; // e.g., "priority"
    values: Record<Severity, string>; // e.g., { critical: "Highest", serious: "High" }
  };
  wcagTags: {
    field: string; // e.g., "labels"
    prefix?: string; // e.g., "wcag-"
  };
  ruleId: {
    field: string; // e.g., "labels" or "customfield_10001"
  };
  selector: {
    field: string; // e.g., "description" or "customfield_10002"
  };
  url: {
    field: string; // e.g., "customfield_10003" or include in description
  };
  // Custom fields mapping
  customFields: Array<{
    allyLabField: string;
    jiraField: string;
    transform?: 'direct' | 'label' | 'array';
  }>;
}

export interface JiraIssuePayload {
  fields: {
    project: { key: string };
    issuetype: { name: string };
    summary: string;
    description: string;
    priority?: { name: string };
    labels?: string[];
    [key: string]: unknown;
  };
}

export interface JiraExportResult {
  success: boolean;
  issueKey?: string;
  issueUrl?: string;
  error?: string;
  request: JiraIssuePayload;
  response?: unknown;
}

export interface BulkExportProgress {
  total: number;
  completed: number;
  successful: number;
  failed: number;
  results: JiraExportResult[];
}

// ============================================
// Default Configuration
// ============================================

export const DEFAULT_JIRA_CONFIG: JiraConfig = {
  enabled: false,
  endpoint: 'http://localhost:3001/jira/create',
  projectKey: 'A11Y',
  issueType: 'Bug',
};

export const DEFAULT_FIELD_MAPPING: JiraFieldMapping = {
  severity: {
    field: 'priority',
    values: {
      critical: 'Highest',
      serious: 'High',
      moderate: 'Medium',
      minor: 'Low',
    },
  },
  wcagTags: {
    field: 'labels',
    prefix: 'wcag-',
  },
  ruleId: {
    field: 'labels',
  },
  selector: {
    field: 'description',
  },
  url: {
    field: 'description',
  },
  customFields: [],
};