import { useCallback } from 'react';
import { extractTextContent } from '../../apply-fix/utils';
import { useFileDetection } from '../../../../hooks/useFileDetection';
import { RepoHeader } from './RepoHeader';
import { FilePathList } from './FilePathList';
import { PRFormFields } from './PRFormFields';
import { FormActions } from './FormActions';
import { ErrorMessage } from './ErrorMessage';
import type { FilePathMapperProps } from './types';

export function FilePathMapper({
  selectedRepo,
  branches,
  selectedBranch,
  findings,
  prTitle,
  prDescription,
  isLoading,
  error,
  onBranchChange,
  onFilePathChange,
  onRemoveFinding,
  onTitleChange,
  onDescriptionChange,
  onChangeRepo,
  onBack,
  onCancel,
  onSubmit,
  searchCode,
  getFileContent,
}: FilePathMapperProps) {
  const fixedFindings = findings.filter(f => f.fix);
  const withPathCount = fixedFindings.filter(f => f.filePath.trim()).length;

  // Use extracted file detection hook
  const {
    detectionStates,
    isAutoDetecting,
    detectFile,
    handleAutoDetectAll,
    togglePreview,
    getMappedWithHighConfidence,
    hasSearchCapability,
  } = useFileDetection({
    selectedRepo,
    selectedBranch,
    findings,
    onFilePathChange,
    searchCode,
    getFileContent,
  });

  // Extract text content from HTML for display - memoized to prevent child re-renders
  const getTextPreview = useCallback((html: string): string | null => {
    const text = extractTextContent(html);
    if (text && text.length > 2 && text.length < 50) {
      return text;
    }
    return null;
  }, []);

  // Count mapped with confidence
  const mappedWithHighConfidence = getMappedWithHighConfidence(fixedFindings);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <RepoHeader
        repo={selectedRepo}
        branches={branches}
        selectedBranch={selectedBranch}
        onBranchChange={onBranchChange}
        onChangeRepo={onChangeRepo}
      />

      <FilePathList
        findings={fixedFindings}
        allFindings={findings}
        withPathCount={withPathCount}
        detectionStates={detectionStates}
        isAutoDetecting={isAutoDetecting}
        onFilePathChange={onFilePathChange}
        onRemoveFinding={onRemoveFinding}
        onDetectFile={detectFile}
        onTogglePreview={togglePreview}
        onAutoDetectAll={handleAutoDetectAll}
        getTextPreview={getTextPreview}
        hasSearchCapability={hasSearchCapability}
      />

      <PRFormFields
        prTitle={prTitle}
        prDescription={prDescription}
        onTitleChange={onTitleChange}
        onDescriptionChange={onDescriptionChange}
      />

      {error && <ErrorMessage message={error} />}

      <FormActions
        isLoading={isLoading}
        withPathCount={withPathCount}
        totalCount={fixedFindings.length}
        highConfidenceCount={mappedWithHighConfidence}
        onBack={onBack}
        onCancel={onCancel}
        onSubmit={onSubmit}
      />
    </div>
  );
}
