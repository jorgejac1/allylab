import { Button, Modal } from '../ui';
import {
  useCreatePRForm,
  RepoSelectionStep,
  PRConfigStep,
  PRSuccessStep,
  extractTextContent,
  extractClassNames,
} from './create-pr';
import type { CodeFix } from '../../types/fixes';
import { Link2 } from 'lucide-react';

interface CreatePRModalProps {
  isOpen: boolean;
  onClose: () => void;
  fix: CodeFix;
  finding: {
    id: string;
    ruleTitle: string;
    selector: string;
  };
  scanUrl: string;
  scanStandard?: string;
  scanViewport?: string;
}

export function CreatePRModal({
  isOpen,
  onClose,
  fix,
  finding,
  scanUrl,
  scanStandard,
  scanViewport,
}: CreatePRModalProps) {
  const form = useCreatePRForm({
    isOpen,
    fix,
    finding,
    scanUrl,
    scanStandard,
    scanViewport,
    onClose,
  });

  // Extract search suggestions from the finding
  const textContent = extractTextContent(fix.original.code);
  const classNames = extractClassNames(finding.selector);

  // Not connected state
  if (!form.isConnected) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Create Pull Request">
        <NotConnectedMessage onClose={onClose} />
      </Modal>
    );
  }

  const getTitle = () => {
    switch (form.step) {
      case 'repo': return 'Select Repository';
      case 'file': return 'Configure PR';
      case 'confirm': return 'Pull Request Created!';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={form.handleClose}
      title={getTitle()}
      size="lg"
    >
      {form.step === 'repo' && (
        <RepoSelectionStep
          repos={form.repos}
          isLoading={form.isLoading}
          onSelect={form.handleRepoSelect}
        />
      )}

      {form.step === 'file' && form.selectedRepo && (
        <PRConfigStep
          selectedRepo={form.selectedRepo}
          branches={form.branches}
          selectedBranch={form.selectedBranch}
          filePath={form.filePath}
          prTitle={form.prTitle}
          prDescription={form.prDescription}
          originalCode={fix.original.code}
          isLoading={form.isLoading}
          error={form.error}
          showFileSearch={form.showFileSearch}
          searchMode={form.searchMode}
          searchResults={form.searchResults}
          repoFiles={form.repoFiles}
          isSearching={form.isSearching}
          searchError={form.searchError}
          customSearch={form.customSearch}
          fileFilter={form.fileFilter}
          textContent={textContent}
          classNames={classNames}
          onBranchChange={form.setSelectedBranch}
          onFilePathChange={form.setFilePath}
          onTitleChange={form.setPrTitle}
          onDescriptionChange={form.setPrDescription}
          onBackToRepoStep={form.handleBackToRepoStep}
          onClose={form.handleClose}
          onCreatePR={form.handleCreatePR}
          onToggleFileSearch={form.toggleFileSearch}
          onCloseFileSearch={form.closeFileSearch}
          onBackToSearchOptions={form.backToSearchOptions}
          onSearch={form.handleSearch}
          onBrowse={form.handleBrowseFiles}
          onSelectFile={form.handleSelectFile}
          onCustomSearchChange={form.setCustomSearch}
          onFileFilterChange={form.setFileFilter}
        />
      )}

      {form.step === 'confirm' && form.prResult && (
        <PRSuccessStep
          prResult={form.prResult}
          onClose={form.handleClose}
        />
      )}
    </Modal>
  );
}

function NotConnectedMessage({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center', color: '#94a3b8' }}><Link2 size={48} /></div>
      <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>GitHub Not Connected</h3>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
        Connect your GitHub account in Settings to create Pull Requests.
      </p>
      <Button onClick={onClose}>Go to Settings</Button>
    </div>
  );
}
