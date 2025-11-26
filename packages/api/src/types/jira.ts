export interface JiraCredentials {
  baseUrl: string;
  email: string;
  apiToken: string;
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

export interface JiraCreateResponse {
  success: boolean;
  key?: string;
  id?: string;
  self?: string;
  error?: string;
}

export interface JiraBulkRequest {
  issues: JiraIssuePayload[];
}

export interface JiraBulkResponse {
  total: number;
  successful: number;
  failed: number;
  results: JiraCreateResponse[];
}

export interface JiraLinkRequest {
  findingId: string;
  issueKey: string;
  scanId: string;
}