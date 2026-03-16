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
    <div className="flex flex-col gap-4">
      {/* Issue Summary */}
      <div className="py-2.5 px-3 bg-amber-100 rounded-lg text-[13px] text-amber-800">
        <strong>Issue:</strong> {findingRuleTitle}
      </div>

      {/* Code Preview */}
      <CodePreview
        original={fix.original.code}
        fixed={fix.fixes.html}
      />

      {/* Copy Button */}
      <div className="flex justify-end">
        <Button
          variant={copied ? 'primary' : 'secondary'}
          onClick={onCopyFix}
        >
          {copied ? (
            <><Check size={14} aria-hidden="true" className="mr-1.5" />Copied!</>
          ) : (
            <><Clipboard size={14} aria-hidden="true" className="mr-1.5" />Copy Fixed Code</>
          )}
        </Button>
      </div>

      <hr className="border-none border-t border-slate-200 my-1" />

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
          <div className="flex justify-between items-center mb-2">
            <label className="text-[13px] font-medium text-slate-600 flex items-center gap-1.5">
              <FileText size={14} aria-hidden="true" />File Path
            </label>
            {filePath && !showFileFinder && (
              <button
                onClick={onOpenFileFinder}
                className="bg-none border-none text-blue-500 text-xs cursor-pointer"
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
            <div className="py-2.5 px-3 bg-green-50 rounded-md text-[13px] font-mono text-green-800 flex items-center gap-2">
              <FileText size={14} aria-hidden="true" />{filePath}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {prError && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[13px]"
        >
          {prError}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2 border-t border-slate-200">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="secondary"
          onClick={onOpenOnGitHub}
          disabled={!selectedRepo}
        >
          <FolderOpen size={14} aria-hidden="true" className="mr-1.5" />Open on GitHub
        </Button>
        <Button
          variant="primary"
          onClick={onEditAndCreatePR}
          disabled={!selectedRepo || !filePath || isLoadingFile}
        >
          {isLoadingFile ? (
            <><Loader2 size={14} aria-hidden="true" className="mr-1.5" style={{ animation: 'spin 1s linear infinite' }} />Loading...</>
          ) : (
            <><Sparkles size={14} aria-hidden="true" className="mr-1.5" />Edit & Create PR</>
          )}
        </Button>
      </div>

      <p className="text-xs text-slate-400 m-0 text-center">
        Select a file to create a PR, or open on GitHub to apply manually.
      </p>
    </div>
  );
}
