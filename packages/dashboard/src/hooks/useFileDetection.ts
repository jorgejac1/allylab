import { useState, useCallback } from 'react';
import { findCodeInJsx, extractTextContent } from '../components/findings/apply-fix/utils';
import type { GitHubRepo } from '../types/github';
import type { FindingWithFix } from '../types/batch-pr';

export interface FileDetectionResult {
  path: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  lineStart?: number;
}

export interface FindingDetectionState {
  isDetecting: boolean;
  result: FileDetectionResult | null;
  showSearch: boolean;
  showPreview: boolean;
}

interface UseFileDetectionOptions {
  selectedRepo: GitHubRepo;
  selectedBranch: string;
  findings: FindingWithFix[];
  onFilePathChange: (index: number, path: string) => void;
  searchCode?: (owner: string, repo: string, query: string) => Promise<Array<{ path: string }>>;
  getFileContent?: (owner: string, repo: string, path: string, branch: string) => Promise<string | null>;
}

export interface FileDetectionResult2 {
  detectionStates: Record<string, FindingDetectionState>;
  isAutoDetecting: boolean;
  detectFile: (item: FindingWithFix, index: number) => Promise<void>;
  handleAutoDetectAll: () => Promise<void>;
  togglePreview: (findingId: string) => void;
  getMappedWithHighConfidence: (fixedFindings: FindingWithFix[]) => number;
  hasSearchCapability: boolean;
}

export function useFileDetection({
  selectedRepo,
  selectedBranch,
  findings,
  onFilePathChange,
  searchCode,
  getFileContent,
}: UseFileDetectionOptions): FileDetectionResult2 {
  const [detectionStates, setDetectionStates] = useState<Record<string, FindingDetectionState>>({});
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  const hasSearchCapability = !!searchCode && !!getFileContent;

  // Detect file for a single finding
  const detectFile = useCallback(async (item: FindingWithFix, index: number) => {
    if (!searchCode || !getFileContent || !item.fix) return;

    const findingId = item.finding.id;
    setDetectionStates(prev => ({
      ...prev,
      [findingId]: { ...prev[findingId], isDetecting: true, result: null }
    }));

    try {
      const originalHtml = item.fix.original.code;
      const textContent = extractTextContent(originalHtml);

      // Build search queries
      const queries: string[] = [];

      // Try text content first
      if (textContent && textContent.length > 3) {
        queries.push(textContent);
      }

      // Try selector classes
      const classMatch = item.finding.selector.match(/\.([a-zA-Z][\w-]+)/g);
      if (classMatch) {
        const significantClasses = classMatch
          .map(c => c.slice(1))
          .filter(c => c.length > 5 && !c.match(/^(sm:|md:|lg:|xl:|hover:|focus:)/))
          .slice(0, 2);
        if (significantClasses.length > 0) {
          queries.push(significantClasses.join(' '));
        }
      }

      if (queries.length === 0) {
        setDetectionStates(prev => ({
          ...prev,
          [findingId]: {
            isDetecting: false,
            result: { path: '', confidence: 'low', reason: 'No searchable content found' },
            showSearch: false,
            showPreview: false
          }
        }));
        return;
      }

      // Search for files
      let bestMatch: FileDetectionResult | null = null;

      for (const query of queries) {
        try {
          const results = await searchCode(
            selectedRepo.owner.login,
            selectedRepo.name,
            query
          );

          if (results.length > 0) {
            // Filter to component files
            const componentFiles = results.filter(r =>
              r.path.match(/\.(tsx?|jsx?)$/) &&
              !r.path.includes('node_modules') &&
              !r.path.includes('.test.') &&
              !r.path.includes('.spec.')
            );

            if (componentFiles.length > 0) {
              const topResult = componentFiles[0];

              // Verify match by loading file content
              const content = await getFileContent(
                selectedRepo.owner.login,
                selectedRepo.name,
                topResult.path,
                selectedBranch
              );

              if (content) {
                const match = findCodeInJsx(content, originalHtml, textContent);

                if (match) {
                  bestMatch = {
                    path: topResult.path,
                    confidence: match.confidence,
                    reason: match.reason,
                    lineStart: match.lineStart,
                  };
                  break;
                } else {
                  // File found but no exact match
                  bestMatch = {
                    path: topResult.path,
                    confidence: 'low',
                    reason: 'File found, but exact code location unclear',
                  };
                }
              }
            }
          }
        } catch (err) {
          console.error('[useFileDetection] Search error:', err);
        }
      }

      if (bestMatch) {
        // Auto-fill the path
        onFilePathChange(index, bestMatch.path);
        setDetectionStates(prev => ({
          ...prev,
          [findingId]: {
            isDetecting: false,
            result: bestMatch,
            showSearch: false,
            showPreview: false
          }
        }));
      } else {
        setDetectionStates(prev => ({
          ...prev,
          [findingId]: {
            isDetecting: false,
            result: { path: '', confidence: 'low', reason: 'No matching files found' },
            showSearch: false,
            showPreview: false
          }
        }));
      }
    } catch (err) {
      console.error('[useFileDetection] Detection error:', err);
      setDetectionStates(prev => ({
        ...prev,
        [findingId]: {
          isDetecting: false,
          result: null,
          showSearch: false,
          showPreview: false
        }
      }));
    }
  }, [searchCode, getFileContent, selectedRepo, selectedBranch, onFilePathChange]);

  // Auto-detect all files
  const handleAutoDetectAll = useCallback(async () => {
    setIsAutoDetecting(true);

    for (let i = 0; i < findings.length; i++) {
      const item = findings[i];
      if (item.fix && !item.filePath.trim()) {
        await detectFile(item, i);
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    setIsAutoDetecting(false);
  }, [findings, detectFile]);

  // Toggle preview for a finding
  const togglePreview = useCallback((findingId: string) => {
    setDetectionStates(prev => ({
      ...prev,
      [findingId]: {
        ...prev[findingId],
        showPreview: !prev[findingId]?.showPreview
      }
    }));
  }, []);

  // Get count of mapped findings with high confidence
  const getMappedWithHighConfidence = useCallback((fixedFindings: FindingWithFix[]) => {
    return fixedFindings.filter(f => {
      const state = detectionStates[f.finding.id];
      return f.filePath.trim() && state?.result?.confidence === 'high';
    }).length;
  }, [detectionStates]);

  return {
    detectionStates,
    isAutoDetecting,
    detectFile,
    handleAutoDetectAll,
    togglePreview,
    getMappedWithHighConfidence,
    hasSearchCapability,
  };
}
