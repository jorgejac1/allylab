import type { ReactNode } from 'react';
import type { TrackedFinding } from '../../../types';

export interface FindingDetailsProps {
  finding: TrackedFinding;
  similarCount?: number;
  onClose: () => void;
  onGenerateFix?: (finding: TrackedFinding) => void;
  isGeneratingFix?: boolean;
}

export interface SectionProps {
  title: ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export interface AISuggestionProps {
  rank: number;
  type: 'RECOMMENDED' | 'ALTERNATIVE' | 'ADVANCED';
  color: string;
  text: string;
}

export interface FindingDetailsDrawerProps extends FindingDetailsProps {
  isOpen: boolean;
}
