import { useState, useEffect, useCallback } from 'react';
import { Button, Modal } from '../ui';
import { useGitHub } from '../../hooks/useGitHub';
import type { GitHubRepo } from '../../types/github';
import type { CodeFix } from '../../types/fixes';
import {
  CodePreview,
  RepoSelector,
  FileFinder,
  FileEditor,
  getDomainFromUrl,
  getSavedRepo,
  saveRepoForDomain,
  extractTextContent,
  extractClassNames,
} from './apply-fix';

interface ApplyFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  fix: CodeFix;
  finding: {
    id: string;
    ruleId?: string;
    ruleTitle: string;
    selector: string;
    wcagLevel?: string;
    wcagCriteria?: string;
  };
  scanUrl: string;
}

type Step = 'preview' | 'edit';

// Generate smart branch name from rule and file
function generateBranchName(ruleId: string, filePath: string | null, lineNumber?: number): string {
  // Sanitize rule ID for branch name
  const rule = ruleId.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  
  // Get file name without extension
  const fileName = filePath 
    ? filePath.split('/').pop()?.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9]/gi, '-').toLowerCase()
    : 'fix';
  
  // Create unique suffix from timestamp
  const suffix = Date.now().toString(36).slice(-4);
  
  // Include line number if available
  const lineStr = lineNumber ? `-L${lineNumber}` : '';
  
  return `fix/a11y-${rule}-${fileName}${lineStr}-${suffix}`;
}

export function ApplyFixModal({
  isOpen,
  onClose,
  fix,
  finding,
  scanUrl,
}: ApplyFixModalProps) {
  const { connection, getRepos, searchCode, getRepoTree, getFileContent, createPR } = useGitHub();
  
  // Step state
  const [step, setStep] = useState<Step>('preview');
  
  // Repo state
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  
  // File state
  const [filePath, setFilePath] = useState<string | null>(null);
  const [showFileFinder, setShowFileFinder] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [selectedLineNumber, setSelectedLineNumber] = useState<number | null>(null);
  
  // PR state
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [prError, setPrError] = useState<string | null>(null);
  const [prResult, setPrResult] = useState<{ prUrl: string; prNumber: number } | null>(null);
  
  // UI state
  const [copied, setCopied] = useState(false);
  
  // Derived values
  const domain = getDomainFromUrl(scanUrl);
  const textContent = extractTextContent(fix.original.code);
  const classNames = extractClassNames(finding.selector);

  // Load repos on mount
  useEffect(() => {
    if (!isOpen || !connection.connected) return;
    
    const loadRepos = async () => {
      setIsLoadingRepos(true);
      try {
        const repoList = await getRepos();
        setRepos(repoList);
        
        const saved = getSavedRepo(domain);
        if (saved) {
          const found = repoList.find(
            r => r.owner.login === saved.owner && r.name === saved.repo
          );
          if (found) setSelectedRepo(found);
        }
      } catch (err) {
        console.error('[ApplyFixModal] Failed to load repos:', err);
      } finally {
        setIsLoadingRepos(false);
      }
    };
    
    loadRepos();
  }, [isOpen, connection.connected, getRepos, domain]);

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
  const handleRepoSelect = useCallback((repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setShowRepoSelector(false);
    setFilePath(null);
    setFileContent(null);
    saveRepoForDomain(domain, repo.owner.login, repo.name);
  }, [domain]);

  const handleFileSelect = useCallback((path: string) => {
    setFilePath(path);
    setShowFileFinder(false);
    setFileContent(null);
  }, []);

  const handleCopyFix = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fix.fixes.html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[ApplyFixModal] Failed to copy:', err);
    }
  }, [fix.fixes.html]);

  const handleOpenOnGitHub = useCallback(() => {
    if (!selectedRepo) return;
    let url = `https://github.com/${selectedRepo.owner.login}/${selectedRepo.name}`;
    if (filePath) {
      url += `/blob/${selectedRepo.default_branch}/${filePath}`;
      // Add line number anchor if available
      if (selectedLineNumber) {
        url += `#L${selectedLineNumber}`;
      }
    }
    window.open(url, '_blank');
  }, [selectedRepo, filePath, selectedLineNumber]);

  // Load file content and go to edit step
  const handleEditAndCreatePR = useCallback(async () => {
    if (!selectedRepo || !filePath) return;
    
    setIsLoadingFile(true);
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
      setIsLoadingFile(false);
    }
  }, [selectedRepo, filePath, getFileContent]);

  // Create PR with updated content
  const handleCreatePR = useCallback(async (updatedContent: string, lineStart?: number, lineEnd?: number) => {
    if (!selectedRepo || !filePath) return;
    
    setIsCreatingPR(true);
    setPrError(null);
    
    // Store line number for Open on GitHub
    if (lineStart) {
      setSelectedLineNumber(lineStart);
    }
    
    // Generate smart branch name
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
      setIsCreatingPR(false);
    }
  }, [selectedRepo, filePath, fileContent, finding, fix, scanUrl, createPR]);

  const handleClose = () => {
    setStep('preview');
    setShowRepoSelector(false);
    setShowFileFinder(false);
    setFileContent(null);
    setSelectedLineNumber(null);
    setPrError(null);
    setPrResult(null);
    setCopied(false);
    onClose();
  };

  const handleBackToPreview = () => {
    setStep('preview');
    setFileContent(null);
    setPrError(null);
  };

  // Not connected state
  if (!connection.connected) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Apply Fix">
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>GitHub Not Connected</h3>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
            Connect your GitHub account in Settings to use this feature.
          </p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </Modal>
    );
  }

  // PR Success state
  if (prResult) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="🎉 Pull Request Created!" size="lg">
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🚀</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>PR #{prResult.prNumber} Created!</h3>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
            Your accessibility fix has been submitted for review.
          </p>
          
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <a
              href={prResult.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: '#0f172a',
                color: '#fff',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              View on GitHub →
            </a>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="🔧 Apply Fix" size="lg">
      {step === 'preview' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Issue Summary */}
          <div style={{
            padding: '10px 12px',
            background: '#fef3c7',
            borderRadius: 8,
            fontSize: 13,
            color: '#92400e',
          }}>
            <strong>Issue:</strong> {finding.ruleTitle}
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
              onClick={handleCopyFix}
            >
              {copied ? '✓ Copied!' : '📋 Copy Fixed Code'}
            </Button>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />

          {/* Repo Selector */}
          <RepoSelector
            repos={repos}
            selectedRepo={selectedRepo}
            isLoading={isLoadingRepos}
            showSelector={showRepoSelector}
            onSelect={handleRepoSelect}
            onShowSelector={() => setShowRepoSelector(true)}
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
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>
                  📄 File Path
                </label>
                {filePath && !showFileFinder && (
                  <button
                    onClick={() => setShowFileFinder(true)}
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
                  getFileContent={getFileContentForFinder}
                  onSelect={handleFileSelect}
                  onSkip={() => setShowFileFinder(false)}
                  onAutoSelect={async (path: string) => {
                    // Auto-select: set file and immediately go to edit
                    setFilePath(path);
                    setShowFileFinder(false);
                    
                    // Load file content and go to edit step
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
                      // Fall back to normal selection
                    }
                  }}
                />
              ) : (
                <div style={{
                  padding: '10px 12px',
                  background: '#f0fdf4',
                  borderRadius: 6,
                  fontSize: 13,
                  fontFamily: 'monospace',
                  color: '#166534',
                }}>
                  📄 {filePath}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {prError && (
            <div style={{
              padding: 12,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              color: '#dc2626',
              fontSize: 13,
            }}>
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
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button
              variant="secondary"
              onClick={handleOpenOnGitHub}
              disabled={!selectedRepo}
            >
              📂 Open on GitHub
            </Button>
            <Button
              variant="primary"
              onClick={handleEditAndCreatePR}
              disabled={!selectedRepo || !filePath || isLoadingFile}
            >
              {isLoadingFile ? '⏳ Loading...' : '✨ Edit & Create PR'}
            </Button>
          </div>

          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, textAlign: 'center' }}>
            Select a file to create a PR, or open on GitHub to apply manually.
          </p>
        </div>
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

// ============================================
// PR Description Generator
// ============================================

interface PRDescriptionParams {
  ruleId?: string;
  ruleTitle: string;
  wcagLevel?: string;
  wcagCriteria?: string;
  filePath: string;
  lineStart?: number;
  lineEnd?: number;
  originalCode: string;
  fixedCode: string;
  scanUrl?: string;
}

function generatePRDescription(params: PRDescriptionParams): string {
  const {
    ruleId,
    ruleTitle,
    wcagLevel,
    wcagCriteria,
    filePath,
    lineStart,
    lineEnd,
    originalCode,
    fixedCode,
    scanUrl,
  } = params;
  
  const lineInfo = lineStart 
    ? lineEnd && lineEnd !== lineStart 
      ? `Lines ${lineStart}-${lineEnd}`
      : `Line ${lineStart}`
    : '';
  
  const wcagInfo = wcagLevel || wcagCriteria
    ? `\n**WCAG:** ${wcagCriteria || ''} ${wcagLevel ? `(Level ${wcagLevel.toUpperCase()})` : ''}`
    : '';
  
  return `## ♿ Accessibility Fix

This PR fixes an accessibility issue detected by [AllyLab](https://allylab.io).

### 🔍 Issue Details
**Rule:** ${ruleId || 'accessibility'} - ${ruleTitle}${wcagInfo}

### 📁 Changes
**File:** \`${filePath}\`${lineInfo ? `\n**Location:** ${lineInfo}` : ''}

<details>
<summary>View code changes</summary>

**Before:**
\`\`\`html
${originalCode}
\`\`\`

**After:**
\`\`\`html
${fixedCode}
\`\`\`

</details>

### ✅ Review Checklist
- [ ] Visual appearance is correct
- [ ] Screen reader announces content properly
- [ ] Keyboard navigation works as expected
- [ ] Color contrast meets WCAG requirements
- [ ] No new accessibility issues introduced

### 🔗 References
${scanUrl ? `- [View scan results](${scanUrl})\n` : ''}- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
${ruleId ? `- [${ruleId} rule documentation](https://dequeuniversity.com/rules/axe/4.4/${ruleId})` : ''}

---
*🤖 Generated by [AllyLab](https://allylab.io) • Powered by Claude AI*`;
}