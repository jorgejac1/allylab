import type { CodeLocation } from '../utils';

export interface FileEditorProps {
  filePath: string;
  fileContent: string;
  originalCode: string;
  fixedCode: string;
  isLoading: boolean;
  isCreatingPR: boolean;
  error: string | null;
  onBack: () => void;
  onCreatePR: (updatedContent: string, lineStart?: number, lineEnd?: number) => void;
}

export interface SelectedLines {
  start: number;
  end: number;
}

export type { CodeLocation };
