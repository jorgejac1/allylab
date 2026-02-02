import type { MatchConfidence } from '../utils';

export interface RankedFile {
  path: string;
  preview?: string;
  confidence: MatchConfidence;
  isBestMatch: boolean;
}

export interface CodeSearchResult {
  path: string;
  repository?: string;
  url?: string;
  htmlUrl?: string;
  matchedLines: Array<{ lineNumber?: number; content: string }>;
}

export interface RepoFile {
  path: string;
  type?: 'file' | 'dir';
  size?: number;
}

export type Mode = 'options' | 'search' | 'browse';
export type SearchType = 'text' | 'class' | 'selector' | 'custom' | 'browse';

export interface FileFinderProps {
  repoOwner: string;
  repoName: string;
  branch: string;
  textContent: string | null;
  classNames: string[];
  originalHtml: string;
  scanUrl?: string;
  searchCode: (owner: string, repo: string, query: string) => Promise<CodeSearchResult[]>;
  getRepoTree: (owner: string, repo: string, branch?: string) => Promise<RepoFile[]>;
  getFileContent?: (owner: string, repo: string, path: string, branch: string) => Promise<string | null>;
  onSelect: (path: string) => void;
  onSkip: () => void;
  onAutoSelect?: (path: string) => void;
}
