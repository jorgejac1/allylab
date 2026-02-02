import { Button } from '../../ui';
import { FileSearchPanel } from './FileSearchPanel';
import type { GitHubRepo, GitHubBranch } from '../../../types/github';
import type { CodeSearchResult, RepoFile } from './useCreatePRForm';
import { Rocket, Search } from 'lucide-react';

interface PRConfigStepProps {
  selectedRepo: GitHubRepo;
  branches: GitHubBranch[];
  selectedBranch: string;
  filePath: string;
  prTitle: string;
  prDescription: string;
  originalCode: string;
  isLoading: boolean;
  error: string | null;
  // File search props
  showFileSearch: boolean;
  searchMode: 'options' | 'results' | 'browse';
  searchResults: CodeSearchResult[];
  repoFiles: RepoFile[];
  isSearching: boolean;
  searchError: string | null;
  customSearch: string;
  fileFilter: string;
  textContent: string | null;
  classNames: string[];
  // Handlers
  onBranchChange: (branch: string) => void;
  onFilePathChange: (path: string) => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onBackToRepoStep: () => void;
  onClose: () => void;
  onCreatePR: () => void;
  onToggleFileSearch: () => void;
  onCloseFileSearch: () => void;
  onBackToSearchOptions: () => void;
  onSearch: (query: string) => void;
  onBrowse: () => void;
  onSelectFile: (path: string) => void;
  onCustomSearchChange: (value: string) => void;
  onFileFilterChange: (value: string) => void;
}

export function PRConfigStep({
  selectedRepo,
  branches,
  selectedBranch,
  filePath,
  prTitle,
  prDescription,
  originalCode,
  isLoading,
  error,
  showFileSearch,
  searchMode,
  searchResults,
  repoFiles,
  isSearching,
  searchError,
  customSearch,
  fileFilter,
  textContent,
  classNames,
  onBranchChange,
  onFilePathChange,
  onTitleChange,
  onDescriptionChange,
  onBackToRepoStep,
  onClose,
  onCreatePR,
  onToggleFileSearch,
  onCloseFileSearch,
  onBackToSearchOptions,
  onSearch,
  onBrowse,
  onSelectFile,
  onCustomSearchChange,
  onFileFilterChange,
}: PRConfigStepProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Selected Repo Header */}
      <SelectedRepoHeader
        repo={selectedRepo}
        onChangeRepo={onBackToRepoStep}
      />

      {/* Branch Selection */}
      <BranchSelector
        branches={branches}
        selectedBranch={selectedBranch}
        defaultBranch={selectedRepo.default_branch}
        onChange={onBranchChange}
      />

      {/* File Path Input */}
      <FilePathInput
        filePath={filePath}
        originalCode={originalCode}
        showFileSearch={showFileSearch}
        repoName={selectedRepo.name}
        searchMode={searchMode}
        searchResults={searchResults}
        repoFiles={repoFiles}
        isSearching={isSearching}
        searchError={searchError}
        customSearch={customSearch}
        fileFilter={fileFilter}
        textContent={textContent}
        classNames={classNames}
        onChange={onFilePathChange}
        onToggleSearch={onToggleFileSearch}
        onCloseSearch={onCloseFileSearch}
        onBackToOptions={onBackToSearchOptions}
        onSearch={onSearch}
        onBrowse={onBrowse}
        onSelectFile={onSelectFile}
        onCustomSearchChange={onCustomSearchChange}
        onFileFilterChange={onFileFilterChange}
      />

      {/* PR Title */}
      <FormField label="PR Title">
        <input
          type="text"
          value={prTitle}
          onChange={e => onTitleChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: 14,
          }}
        />
      </FormField>

      {/* PR Description */}
      <FormField label="Description (optional)">
        <textarea
          placeholder="Additional context for reviewers..."
          value={prDescription}
          onChange={e => onDescriptionChange(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: 14,
            resize: 'vertical',
          }}
        />
      </FormField>

      {/* Error */}
      {error && <ErrorMessage message={error} />}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onCreatePR}
          disabled={isLoading || !filePath}
        >
          {isLoading ? 'Creating PR...' : <><Rocket size={14} style={{ marginRight: 6 }} /> Create Pull Request</>}
        </Button>
      </div>
    </div>
  );
}

// Subcomponents

function SelectedRepoHeader({ repo, onChangeRepo }: { repo: GitHubRepo; onChangeRepo: () => void }) {
  return (
    <div style={{
      padding: 12,
      background: '#f8fafc',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <img
        src={repo.owner.avatar_url}
        alt=""
        style={{ width: 32, height: 32, borderRadius: 6 }}
      />
      <div>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{repo.full_name}</div>
        <button
          onClick={onChangeRepo}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            fontSize: 12,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Change repository
        </button>
      </div>
    </div>
  );
}

function BranchSelector({
  branches,
  selectedBranch,
  defaultBranch,
  onChange,
}: {
  branches: GitHubBranch[];
  selectedBranch: string;
  defaultBranch: string;
  onChange: (branch: string) => void;
}) {
  return (
    <FormField label="Base Branch">
      <select
        value={selectedBranch}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid #e2e8f0',
          borderRadius: 6,
          fontSize: 14,
        }}
      >
        {branches.map(branch => (
          <option key={branch.name} value={branch.name}>
            {branch.name} {branch.name === defaultBranch ? '(default)' : ''}
          </option>
        ))}
      </select>
    </FormField>
  );
}

interface FilePathInputProps {
  filePath: string;
  originalCode: string;
  showFileSearch: boolean;
  repoName: string;
  searchMode: 'options' | 'results' | 'browse';
  searchResults: CodeSearchResult[];
  repoFiles: RepoFile[];
  isSearching: boolean;
  searchError: string | null;
  customSearch: string;
  fileFilter: string;
  textContent: string | null;
  classNames: string[];
  onChange: (path: string) => void;
  onToggleSearch: () => void;
  onCloseSearch: () => void;
  onBackToOptions: () => void;
  onSearch: (query: string) => void;
  onBrowse: () => void;
  onSelectFile: (path: string) => void;
  onCustomSearchChange: (value: string) => void;
  onFileFilterChange: (value: string) => void;
}

function FilePathInput({
  filePath,
  originalCode,
  showFileSearch,
  repoName,
  searchMode,
  searchResults,
  repoFiles,
  isSearching,
  searchError,
  customSearch,
  fileFilter,
  textContent,
  classNames,
  onChange,
  onToggleSearch,
  onCloseSearch,
  onBackToOptions,
  onSearch,
  onBrowse,
  onSelectFile,
  onCustomSearchChange,
  onFileFilterChange,
}: FilePathInputProps) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6, display: 'block' }}>
        File Path *
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="src/components/Header.tsx"
          value={filePath}
          onChange={e => onChange(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: 14,
          }}
        />
        <Button variant="secondary" onClick={onToggleSearch} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Search size={14} /> Find
        </Button>
      </div>

      {/* Original HTML preview */}
      <div style={{
        marginTop: 8,
        padding: 8,
        background: '#f8fafc',
        borderRadius: 6,
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#475569',
        overflow: 'auto',
      }}>
        <div style={{ color: '#94a3b8', marginBottom: 4 }}>Element to fix:</div>
        <code>{originalCode.slice(0, 150)}{originalCode.length > 150 ? '...' : ''}</code>
      </div>

      {/* File Search Panel */}
      {showFileSearch && (
        <FileSearchPanel
          repoName={repoName}
          searchMode={searchMode}
          searchResults={searchResults}
          repoFiles={repoFiles}
          isSearching={isSearching}
          searchError={searchError}
          customSearch={customSearch}
          fileFilter={fileFilter}
          textContent={textContent}
          classNames={classNames}
          onSearch={onSearch}
          onBrowse={onBrowse}
          onSelectFile={onSelectFile}
          onClose={onCloseSearch}
          onBackToOptions={onBackToOptions}
          onCustomSearchChange={onCustomSearchChange}
          onFileFilterChange={onFileFilterChange}
        />
      )}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6, display: 'block' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div style={{
      padding: 12,
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: 8,
      color: '#dc2626',
      fontSize: 13,
    }}>
      {message}
    </div>
  );
}
