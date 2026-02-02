import type { CodeFix } from '../../../types/fixes';

export interface ApplyFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  fix: CodeFix;
  finding: FindingInfo;
  scanUrl: string;
}

export interface FindingInfo {
  id: string;
  ruleId?: string;
  ruleTitle: string;
  selector: string;
  wcagLevel?: string;
  wcagCriteria?: string;
}

export interface PRDescriptionParams {
  ruleId?: string;
  ruleTitle: string;
  wcagLevel?: string;
  wcagCriteria?: string;
  filePath: string;
  lineStart?: number;
  lineEnd?: number;
  originalCode: string;
  fixedCode: string;
  scanUrl?: string;
}

export interface PRResult {
  prUrl: string;
  prNumber: number;
}

export type { CodeFix };
