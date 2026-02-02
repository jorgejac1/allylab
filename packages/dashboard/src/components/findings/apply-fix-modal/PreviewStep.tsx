import { Check, Clipboard, FileText, FolderOpen, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../../ui';
import { CodePreview, RepoSelector, FileFinder } from '../apply-fix';
import type { CodeFix } from '../../../types/fixes';
import type { GitHubRepo } from '../../../types/github';
import type { CodeSearchResult, RepoFile } from '../apply-fix/file-finder/types';

interface PreviewStepProps {
  fix: CodeFix;
  findingRuleTitle: string;
  scanUrl: string;
  textContent: string | null;
  classNames: string[];
  repos: GitHubRepo[];
  selectedRepo: GitHubRepo | null;
  isLoadingRepos: boolean;
  showRepoSelector: boolean;
  filePath: string | null;
  showFileFinder: boolean;
  isLoadingFile: boolean;
  prError: string | null;
  copied: boolean;
  onCopyFix: () => void;
  onSelectRepo: (repo: GitHubRepo) => void;
  onShowRepoSelector: () => void;
  onFileSelect: (path: string) => void;
  onOpenFileFinder: () => void;
  onHideFileFinder: () => void;
  onAutoSelectFile: (path: string) => Promise<void>;
  onOpenOnGitHub: () => void;
  onEditAndCreatePR: () => void;
  onClose: () => void;
  searchCode: (owner: string, repo: string, query: string) => Promise<CodeSearchResult[]>;
  getRepoTree: (owner: string, repo: string, branch?: string) => Promise<RepoFile[]>;
  getFileContent: (owner: string, repo: string, path: string, branch: string) => Promise<string | null>;
}

export function PreviewStep({
  fix,
  findingRuleTitle,
  scanUrl,
  textContent,
  classNames,
  repos,
  selectedRepo,
  isLoadingRepos,
  showRepoSelector,
  filePath,
  showFileFinder,
  isLoadingFile,
  prError,
  copied,
  onCopyFix,
  onSelectRepo,
  onShowRepoSelector,
  onFileSelect,
  onOpenFileFinder,
  onHideFileFinder,
  onAutoSelectFile,
  onOpenOnGitHub,
  onEditAndCreatePR,
  onClose,
  searchCode,
  getRepoTree,
  getFileContent,
}: PreviewStepProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Issue Summary */}
      <div style={{
        padding: '10px 12px',
        background: '#fef3c7',
        borderRadius: 8,
        fontSize: 13,
        color: '#92400e',
      }}>
        <strong>Issue:</strong> {findingRuleTitle}
      </div>

      {/* Code Preview */}
      <CodePreview
        original={fix.original.code}
        fixed={fix.fixes.html}
      />

      {/* Copy Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant={copied ? 'primary' : 'secondary'}
          onClick={onCopyFix}
        >
          {copied ? (
            <><Check size={14} aria-hidden="true" style={{ marginRight: 6 }} />Copied!</>
          ) : (
            <><Clipboard size={14} aria-hidden="true" style={{ marginRight: 6 }} />Copy Fixed Code</>
          )}
        </Button>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />

      {/* Repo Selector */}
      <RepoSelector
        repos={repos}
        selectedRepo={selectedRepo}
        isLoading={isLoadingRepos}
        showSelector={showRepoSelector}
        onSelect={onSelectRepo}
        onShowSelector={onShowRepoSelector}
      />

      {/* File Finder */}
      {selectedRepo && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={14} aria-hidden="true" />File Path
            </label>
            {filePath && !showFileFinder && (
              <button
                onClick={onOpenFileFinder}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Change
              </button>
            )}
          </div>

          {showFileFinder || !filePath ? (
            <FileFinder
              repoOwner={selectedRepo.owner.login}
              repoName={selectedRepo.name}
              branch={selectedRepo.default_branch}
              textContent={textContent}
              classNames={classNames}
              originalHtml={fix.original.code}
              scanUrl={scanUrl}
              searchCode={searchCode}
              getRepoTree={getRepoTree}
              getFileContent={getFileContent}
              onSelect={onFileSelect}
              onSkip={onHideFileFinder}
              onAutoSelect={onAutoSelectFile}
            />
          ) : (
            <div style={{
              padding: '10px 12px',
              background: '#f0fdf4',
              borderRadius: 6,
              fontSize: 13,
              fontFamily: 'monospace',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <FileText size={14} aria-hidden="true" />{filePath}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {prError && (
        <div
          role="alert"
          style={{
            padding: 12,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            color: '#dc2626',
            fontSize: 13,
          }}
        >
          {prError}
        </div>
      )}

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: 12,
        justifyContent: 'flex-end',
        paddingTop: 8,
        borderTop: '1px solid #e2e8f0',
      }}>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="secondary"
          onClick={onOpenOnGitHub}
          disabled={!selectedRepo}
        >
          <FolderOpen size={14} aria-hidden="true" style={{ marginRight: 6 }} />Open on GitHub
        </Button>
        <Button
          variant="primary"
          onClick={onEditAndCreatePR}
          disabled={!selectedRepo || !filePath || isLoadingFile}
        >
          {isLoadingFile ? (
            <><Loader2 size={14} aria-hidden="true" style={{ marginRight: 6, animation: 'spin 1s linear infinite' }} />Loading...</>
          ) : (
            <><Sparkles size={14} aria-hidden="true" style={{ marginRight: 6 }} />Edit & Create PR</>
          )}
        </Button>
      </div>

      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, textAlign: 'center' }}>
        Select a file to create a PR, or open on GitHub to apply manually.
      </p>
    </div>
  );
}
