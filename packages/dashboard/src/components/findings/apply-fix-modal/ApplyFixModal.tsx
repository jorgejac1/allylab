import { useCallback } from 'react';
import { Wrench } from 'lucide-react';
import { Modal } from '../../ui';
import { useGitHub } from '../../../hooks/useGitHub';
import { useApplyFixWorkflow } from '../../../hooks/useApplyFixWorkflow';
import {
  FileEditor,
  getDomainFromUrl,
  getSavedRepo,
  saveRepoForDomain,
  extractTextContent,
  extractClassNames,
} from '../apply-fix';
import { NotConnectedView } from './NotConnectedView';
import { SuccessView } from './SuccessView';
import { PreviewStep } from './PreviewStep';
import { generateBranchName, generatePRDescription } from './utils';
import type { ApplyFixModalProps } from './types';

export function ApplyFixModal({
  isOpen,
  onClose,
  fix,
  finding,
  scanUrl,
}: ApplyFixModalProps) {
  const { connection, getRepos, searchCode, getRepoTree, getFileContent, createPR } = useGitHub();

  // Derived values
  const domain = getDomainFromUrl(scanUrl);
  const textContent = extractTextContent(fix.original.code);
  const classNames = extractClassNames(finding.selector);

  // Use consolidated workflow state hook
  const {
    state,
    setStep,
    selectRepo,
    showRepoSelector: openRepoSelector,
    setFilePath,
    showFileFinder: openFileFinder,
    hideFileFinder,
    setFileContent,
    setLoadingFile,
    setLineNumber,
    setCreatingPR,
    setPrError,
    setPrResult,
    setCopied,
    reset,
    backToPreview,
  } = useApplyFixWorkflow({
    isOpen,
    isConnected: connection.connected,
    domain,
    getRepos,
    getSavedRepo,
    saveRepoForDomain,
  });

  // Destructure state for easier access
  const {
    step,
    repos,
    selectedRepo,
    showRepoSelector,
    isLoadingRepos,
    filePath,
    showFileFinder,
    fileContent,
    isLoadingFile,
    selectedLineNumber,
    isCreatingPR,
    prError,
    prResult,
    copied,
  } = state;

  // Wrapper for getFileContent that returns just the content string
  const getFileContentForFinder = useCallback(async (
    owner: string,
    repo: string,
    path: string,
    branch: string
  ): Promise<string | null> => {
    return getFileContent(owner, repo, path, branch);
  }, [getFileContent]);

  // Handlers
  const handleFileSelect = useCallback((path: string) => {
    setFilePath(path);
  }, [setFilePath]);

  const handleCopyFix = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fix.fixes.html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[ApplyFixModal] Failed to copy:', err);
    }
  }, [fix.fixes.html, setCopied]);

  const handleOpenOnGitHub = useCallback(() => {
    if (!selectedRepo) return;
    let url = `https://github.com/${selectedRepo.owner.login}/${selectedRepo.name}`;
    if (filePath) {
      url += `/blob/${selectedRepo.default_branch}/${filePath}`;
      if (selectedLineNumber) {
        url += `#L${selectedLineNumber}`;
      }
    }
    window.open(url, '_blank');
  }, [selectedRepo, filePath, selectedLineNumber]);

  // Load file content and go to edit step
  const handleEditAndCreatePR = useCallback(async () => {
    if (!selectedRepo || !filePath) return;

    setLoadingFile(true);
    setPrError(null);

    try {
      const content = await getFileContent(
        selectedRepo.owner.login,
        selectedRepo.name,
        filePath,
        selectedRepo.default_branch
      );

      if (content) {
        setFileContent(content);
        setStep('edit');
      } else {
        setPrError('File not found or could not be loaded.');
      }
    } catch (err) {
      console.error('[ApplyFixModal] Failed to load file:', err);
      setPrError('Failed to load file content.');
    } finally {
      setLoadingFile(false);
    }
  }, [selectedRepo, filePath, getFileContent, setLoadingFile, setPrError, setFileContent, setStep]);

  // Auto-select handler for FileFinder
  const handleAutoSelectFile = useCallback(async (path: string) => {
    if (!selectedRepo) return;

    setFilePath(path);

    try {
      const content = await getFileContent(
        selectedRepo.owner.login,
        selectedRepo.name,
        path,
        selectedRepo.default_branch
      );
      if (content) {
        setFileContent(content);
        setStep('edit');
      }
    } catch (err) {
      console.error('[ApplyFixModal] Auto-select failed:', err);
    }
  }, [selectedRepo, getFileContent, setFilePath, setFileContent, setStep]);

  // Create PR with updated content
  const handleCreatePR = useCallback(async (updatedContent: string, lineStart?: number, lineEnd?: number) => {
    if (!selectedRepo || !filePath) return;

    setCreatingPR(true);
    setPrError(null);

    if (lineStart) {
      setLineNumber(lineStart);
    }

    const branchName = generateBranchName(finding.ruleId || 'accessibility', filePath, lineStart);

    try {
      const result = await createPR(
        selectedRepo.owner.login,
        selectedRepo.name,
        selectedRepo.default_branch,
        [{
          filePath,
          originalContent: fileContent || '',
          fixedContent: updatedContent,
          findingId: finding.id,
          ruleTitle: finding.ruleTitle,
        }],
        `♿ Fix: ${finding.ruleTitle}`,
        generatePRDescription({
          ruleId: finding.ruleId,
          ruleTitle: finding.ruleTitle,
          wcagLevel: finding.wcagLevel,
          wcagCriteria: finding.wcagCriteria,
          filePath,
          lineStart,
          lineEnd,
          originalCode: fix.original.code,
          fixedCode: fix.fixes.html,
          scanUrl,
        }),
        branchName
      );

      if (result.success && result.prUrl && result.prNumber) {
        setPrResult({ prUrl: result.prUrl, prNumber: result.prNumber });
      } else {
        setPrError(result.error || 'Failed to create PR');
      }
    } catch (err) {
      console.error('[ApplyFixModal] Failed to create PR:', err);
      setPrError('Failed to create PR. Please try again.');
    } finally {
      setCreatingPR(false);
    }
  }, [selectedRepo, filePath, fileContent, finding, fix, scanUrl, createPR, setCreatingPR, setPrError, setLineNumber, setPrResult]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleBackToPreview = useCallback(() => {
    backToPreview();
  }, [backToPreview]);

  // Not connected state
  if (!connection.connected) {
    return <NotConnectedView isOpen={isOpen} onClose={onClose} />;
  }

  // PR Success state
  if (prResult) {
    return <SuccessView isOpen={isOpen} onClose={handleClose} prResult={prResult} />;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wrench size={18} aria-hidden="true" />Apply Fix
        </span>
      }
      size="lg"
    >
      {step === 'preview' ? (
        <PreviewStep
          fix={fix}
          findingRuleTitle={finding.ruleTitle}
          scanUrl={scanUrl}
          textContent={textContent}
          classNames={classNames}
          repos={repos}
          selectedRepo={selectedRepo}
          isLoadingRepos={isLoadingRepos}
          showRepoSelector={showRepoSelector}
          filePath={filePath}
          showFileFinder={showFileFinder}
          isLoadingFile={isLoadingFile}
          prError={prError}
          copied={copied}
          onCopyFix={handleCopyFix}
          onSelectRepo={selectRepo}
          onShowRepoSelector={openRepoSelector}
          onFileSelect={handleFileSelect}
          onOpenFileFinder={openFileFinder}
          onHideFileFinder={hideFileFinder}
          onAutoSelectFile={handleAutoSelectFile}
          onOpenOnGitHub={handleOpenOnGitHub}
          onEditAndCreatePR={handleEditAndCreatePR}
          onClose={handleClose}
          searchCode={searchCode}
          getRepoTree={getRepoTree}
          getFileContent={getFileContentForFinder}
        />
      ) : (
        <FileEditor
          filePath={filePath || ''}
          fileContent={fileContent || ''}
          originalCode={fix.original.code}
          fixedCode={fix.fixes.html}
          isLoading={isLoadingFile}
          isCreatingPR={isCreatingPR}
          error={prError}
          onBack={handleBackToPreview}
          onCreatePR={handleCreatePR}
        />
      )}
    </Modal>
  );
}
