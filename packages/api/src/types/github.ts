export interface GitHubConfig {
  accessToken: string;
  owner: string;
  repo: string;
  defaultBranch?: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  default_branch: string;
  private: boolean;
  html_url: string;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
  };
}

export interface CreatePRRequest {
  owner: string;
  repo: string;
  baseBranch: string;
  fixes: {
    filePath: string;
    originalContent: string;
    fixedContent: string;
    findingId: string;
    ruleTitle: string;
  }[];
  title?: string;
  description?: string;
}

export interface PRResult {
  success: boolean;
  prNumber?: number;
  prUrl?: string;
  branchName?: string;
  error?: string;
}

export interface GitHubConnection {
  connected: boolean;
  user?: {
    login: string;
    avatar_url: string;
    name: string;
  };
  repos?: GitHubRepo[];
}