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

// New types for PR tracking and verification
export interface PRStatus {
  number: number;
  state: 'open' | 'closed';
  merged: boolean;
  merged_at: string | null;
  html_url: string;
  title: string;
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
}

export interface PRTrackingInfo {
  id: string;
  prNumber: number;
  prUrl: string;
  owner: string;
  repo: string;
  branchName: string;
  findingIds: string[];
  createdAt: string;
  status: 'open' | 'merged' | 'closed';
  mergedAt?: string;
  verificationStatus?: 'pending' | 'verified' | 'failed';
  verifiedAt?: string;
}

export interface VerifyFixRequest {
  url: string;
  findingIds: string[];
  prNumber: number;
  owner: string;
  repo: string;
  standard?: 'wcag21aa' | 'wcag22aa' | 'wcag21a' | 'wcag2aa' | 'wcag2a';
  viewport?: 'desktop' | 'tablet' | 'mobile';
}

export interface VerificationResult {
  success: boolean;
  prNumber: number;
  findingsVerified: {
    findingId: string;
    ruleId: string;
    stillPresent: boolean;
  }[];
  allFixed: boolean;
  scanScore: number;
  scanTimestamp: string;
  error?: string;
}