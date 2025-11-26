import { useState, useCallback } from 'react';
import { mapFindingToJira } from '../utils/jiraMapper';
import type {
  Finding,
  JiraConfig,
  JiraFieldMapping,
  JiraExportResult,
  BulkExportProgress,
} from '../types';

interface UseJiraExportOptions {
  config: JiraConfig;
  mapping: JiraFieldMapping;
}

export function useJiraExport({ config, mapping }: UseJiraExportOptions) {
  const [isExporting, setIsExporting] = useState(false);
  const [lastResult, setLastResult] = useState<JiraExportResult | null>(null);
  const [bulkProgress, setBulkProgress] = useState<BulkExportProgress | null>(null);

  const exportSingle = useCallback(
    async (finding: Finding, pageUrl: string): Promise<JiraExportResult> => {
      const payload = mapFindingToJira(finding, pageUrl, config, mapping);

      setIsExporting(true);

      try {
        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.authHeader ? { Authorization: config.authHeader } : {}),
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        const result: JiraExportResult = {
          success: response.ok,
          issueKey: data.key,
          issueUrl: data.self,
          request: payload,
          response: data,
          error: response.ok ? undefined : data.errorMessages?.join(', ') || 'Unknown error',
        };

        setLastResult(result);
        return result;
      } catch (error) {
        const result: JiraExportResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Network error',
          request: payload,
        };
        setLastResult(result);
        return result;
      } finally {
        setIsExporting(false);
      }
    },
    [config, mapping]
  );

  const exportBulk = useCallback(
    async (
      findings: Finding[],
      pageUrl: string,
      onProgress?: (progress: BulkExportProgress) => void
    ): Promise<BulkExportProgress> => {
      setIsExporting(true);

      const progress: BulkExportProgress = {
        total: findings.length,
        completed: 0,
        successful: 0,
        failed: 0,
        results: [],
      };

      setBulkProgress({ ...progress });

      for (const finding of findings) {
        const result = await exportSingle(finding, pageUrl);
        progress.completed++;
        progress.results.push(result);

        if (result.success) {
          progress.successful++;
        } else {
          progress.failed++;
        }

        setBulkProgress({ ...progress });
        onProgress?.({ ...progress });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setIsExporting(false);
      return progress;
    },
    [exportSingle]
  );

  const previewPayload = useCallback(
    (finding: Finding, pageUrl: string) => {
      return mapFindingToJira(finding, pageUrl, config, mapping);
    },
    [config, mapping]
  );

  const reset = useCallback(() => {
    setLastResult(null);
    setBulkProgress(null);
  }, []);

  return {
    isExporting,
    lastResult,
    bulkProgress,
    exportSingle,
    exportBulk,
    previewPayload,
    reset,
  };
}