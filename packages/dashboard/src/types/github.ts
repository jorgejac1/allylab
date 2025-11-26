export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string;
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

export interface GitHubConnection {
  connected: boolean;
  user?: GitHubUser;
  repos?: GitHubRepo[];
}

export interface GitHubBranch {
  name: string;
  sha: string;
}

export interface PRResult {
  success: boolean;
  prNumber?: number;
  prUrl?: string;
  branchName?: string;
  error?: string;
}