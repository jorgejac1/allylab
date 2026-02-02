import type { GitHubRepo, GitHubBranch } from '../../../../types/github';
import type { FindingWithFix } from '../../../../types/batch-pr';
import type { FindingDetectionState } from '../../../../hooks/useFileDetection';

export interface FilePathMapperProps {
  selectedRepo: GitHubRepo;
  branches: GitHubBranch[];
  selectedBranch: string;
  findings: FindingWithFix[];
  prTitle: string;
  prDescription: string;
  isLoading: boolean;
  error: string | null;
  onBranchChange: (branch: string) => void;
  onFilePathChange: (index: number, path: string) => void;
  onRemoveFinding: (index: number) => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onChangeRepo: () => void;
  onBack: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  searchCode?: (owner: string, repo: string, query: string) => Promise<Array<{ path: string }>>;
  getFileContent?: (owner: string, repo: string, path: string, branch: string) => Promise<string | null>;
}

export interface RepoHeaderProps {
  repo: GitHubRepo;
  branches: GitHubBranch[];
  selectedBranch: string;
  onBranchChange: (branch: string) => void;
  onChangeRepo: () => void;
}

export interface FilePathListProps {
  findings: FindingWithFix[];
  allFindings: FindingWithFix[];
  withPathCount: number;
  detectionStates: Record<string, FindingDetectionState>;
  isAutoDetecting: boolean;
  onFilePathChange: (index: number, path: string) => void;
  onRemoveFinding: (index: number) => void;
  onDetectFile: (item: FindingWithFix, index: number) => void;
  onTogglePreview: (findingId: string) => void;
  onAutoDetectAll: () => void;
  getTextPreview: (html: string) => string | null;
  hasSearchCapability: boolean;
}

export interface FilePathRowProps {
  item: FindingWithFix;
  detectionState?: FindingDetectionState;
  textPreview: string | null;
  hasSearchCapability: boolean;
  onFilePathChange: (path: string) => void;
  onRemove: () => void;
  onDetect: () => void;
  onTogglePreview: () => void;
}

export interface PRFormFieldsProps {
  prTitle: string;
  prDescription: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

export interface FormActionsProps {
  isLoading: boolean;
  withPathCount: number;
  totalCount: number;
  highConfidenceCount: number;
  onBack: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';
