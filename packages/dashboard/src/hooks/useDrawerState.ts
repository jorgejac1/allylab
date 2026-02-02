import { useState, useCallback } from 'react';
import type { TrackedFinding } from '../types';
import type { CodeFix } from '../types/fixes';
import {
  markAsFalsePositive,
  unmarkFalsePositive,
} from '../utils/falsePositives';
import { getApiBase } from '../utils/api';

interface UseDrawerStateOptions {
  finding: TrackedFinding | null;
  onFalsePositiveChange?: () => void;
  onClose: () => void;
}

interface DrawerState {
  // False positive
  showFpForm: boolean;
  fpReason: string;
  // Copy
  copiedSelector: boolean;
  copiedHtml: boolean;
  // AI Fix
  isGeneratingFix: boolean;
  codeFix: CodeFix | null;
  fixError: string | null;
  // Apply Fix Modal
  showApplyFixModal: boolean;
}

interface DrawerActions {
  // False positive
  setShowFpForm: (show: boolean) => void;
  setFpReason: (reason: string) => void;
  handleMarkFalsePositive: () => void;
  handleUnmarkFalsePositive: () => void;
  // Copy
  handleCopy: (text: string, type: 'selector' | 'html') => Promise<void>;
  // AI Fix
  handleGenerateEnhancedFix: () => Promise<void>;
  // Apply Fix Modal
  setShowApplyFixModal: (show: boolean) => void;
  // Reset
  resetState: () => void;
}

export type UseDrawerStateReturn = DrawerState & DrawerActions;

export function useDrawerState({
  finding,
  onFalsePositiveChange,
  onClose,
}: UseDrawerStateOptions): UseDrawerStateReturn {
  // False positive state
  const [showFpForm, setShowFpForm] = useState(false);
  const [fpReason, setFpReason] = useState('');

  // Copy state
  const [copiedSelector, setCopiedSelector] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  // AI Fix state
  const [isGeneratingFix, setIsGeneratingFix] = useState(false);
  const [codeFix, setCodeFix] = useState<CodeFix | null>(null);
  const [fixError, setFixError] = useState<string | null>(null);

  // Apply Fix Modal state
  const [showApplyFixModal, setShowApplyFixModal] = useState(false);

  // Reset all state
  const resetState = useCallback(() => {
    setShowFpForm(false);
    setFpReason('');
    setCopiedSelector(false);
    setCopiedHtml(false);
    setIsGeneratingFix(false);
    setCodeFix(null);
    setFixError(null);
    setShowApplyFixModal(false);
  }, []);

  // Copy handler
  const handleCopy = useCallback(async (text: string, type: 'selector' | 'html') => {
    await navigator.clipboard.writeText(text);
    if (type === 'selector') {
      setCopiedSelector(true);
      setTimeout(() => setCopiedSelector(false), 2000);
    } else {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    }
  }, []);

  // False positive handlers
  const handleMarkFalsePositive = useCallback(() => {
    if (!finding) return;
    markAsFalsePositive(finding.fingerprint, finding.ruleId, fpReason || undefined);
    setShowFpForm(false);
    setFpReason('');
    onFalsePositiveChange?.();
    onClose();
  }, [finding, fpReason, onFalsePositiveChange, onClose]);

  const handleUnmarkFalsePositive = useCallback(() => {
    if (!finding) return;
    unmarkFalsePositive(finding.fingerprint);
    onFalsePositiveChange?.();
    onClose();
  }, [finding, onFalsePositiveChange, onClose]);

  // AI Fix handler
  const handleGenerateEnhancedFix = useCallback(async () => {
    if (!finding) return;

    setIsGeneratingFix(true);
    setFixError(null);
    setCodeFix(null);

    try {
      const response = await fetch(`${getApiBase()}/fixes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finding: {
            ruleId: finding.ruleId,
            ruleTitle: finding.ruleTitle,
            description: finding.description,
            html: finding.html,
            selector: finding.selector,
            wcagTags: finding.wcagTags,
            impact: finding.impact,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.fix) {
        setCodeFix(data.fix);
      } else {
        const errorMessage = data.error || 'Failed to generate fix';
        console.error('[useDrawerState] Fix generation failed:', errorMessage);
        setFixError(errorMessage);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      console.error('[useDrawerState] Failed to connect to AI service:', message);
      setFixError('Failed to connect to AI service');
    } finally {
      setIsGeneratingFix(false);
    }
  }, [finding]);

  return {
    // State
    showFpForm,
    fpReason,
    copiedSelector,
    copiedHtml,
    isGeneratingFix,
    codeFix,
    fixError,
    showApplyFixModal,
    // Actions
    setShowFpForm,
    setFpReason,
    handleMarkFalsePositive,
    handleUnmarkFalsePositive,
    handleCopy,
    handleGenerateEnhancedFix,
    setShowApplyFixModal,
    resetState,
  };
}
