/**
 * GitLab Types
 *
 * Type definitions for GitLab API integration.
 */

export interface GitLabUser {
  id: number;
  username: string;
  name: string;
  avatar_url: string;
  web_url: string;
}

export interface GitLabProject {
  id: number;
  name: string;
  path_with_namespace: string;
  visibility: 'public' | 'private' | 'internal';
  default_branch?: string;
  web_url?: string;
  description?: string;
}

export interface GitLabBranch {
  name: string;
  commit: {
    id: string;
    short_id: string;
    title: string;
    created_at: string;
  };
  merged: boolean;
  protected: boolean;
  default: boolean;
}

export interface GitLabConnection {
  connected: boolean;
  provider?: 'gitlab';
  instanceUrl?: string;
  user?: GitLabUser;
  projects?: GitLabProject[];
}

export interface GitLabMRResult {
  success: boolean;
  error?: string;
  mr?: {
    id: string;
    iid: number;
    project_id: number;
    title: string;
    description: string;
    state: 'opened' | 'closed' | 'merged';
    web_url: string;
    source_branch: string;
    target_branch: string;
    author: GitLabUser;
    created_at: string;
    updated_at: string;
    merge_status: string;
    has_conflicts: boolean;
    changes_count: string;
  };
}

export interface GitLabFile {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
}

export interface GitLabCodeSearchResult {
  path: string;
  project_path: string;
  url: string;
  matchedLines: Array<{ lineNumber: number; content: string }>;
}
