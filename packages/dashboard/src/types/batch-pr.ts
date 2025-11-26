import type { TrackedFinding } from './index';
import type { CodeFix } from './fixes';
import type { GitHubRepo, GitHubBranch } from './github';

export interface FindingWithFix {
  finding: TrackedFinding;
  fix: CodeFix | null;
  filePath: string;
  isGenerating: boolean;
  error: string | null;
}

export interface BatchPRResult {
  prUrl: string;
  prNumber: number;
}

export interface BatchPRFormState {
  selectedRepo: GitHubRepo | null;
  selectedBranch: string;
  branches: GitHubBranch[];
  prTitle: string;
  prDescription: string;
}