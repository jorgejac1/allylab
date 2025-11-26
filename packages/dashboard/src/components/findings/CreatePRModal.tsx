import { useState, useEffect, useCallback } from 'react';
import { Button, Modal } from '../ui';
import { useGitHub } from '../../hooks/useGitHub';
import type { GitHubRepo, GitHubBranch } from '../../types/github';
import type { CodeFix } from '../../types/fixes';

interface CreatePRModalProps {
  isOpen: boolean;
  onClose: () => void;
  fix: CodeFix;
  finding: {
    ruleTitle: string;
    selector: string;
  };
}

export function CreatePRModal({ isOpen, onClose, fix, finding }: CreatePRModalProps) {
  const { connection, getRepos, getBranches, createPR } = useGitHub();
  
  const [step, setStep] = useState<'repo' | 'file' | 'confirm'>('repo');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [filePath, setFilePath] = useState('');
  const [prTitle, setPrTitle] = useState('');
  const [prDescription, setPrDescription] = useState('');
  
  // PR result
  const [prResult, setPrResult] = useState<{ prUrl: string; prNumber: number } | null>(null);

  const loadRepos = useCallback(async () => {
    setIsLoading(true);
    try {
      const repoList = await getRepos();
      setRepos(repoList);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[CreatePRModal] Failed to load repos:', message);
      setError('Failed to load repositories');
    } finally {
      setIsLoading(false);
    }
  }, [getRepos]);

  const loadBranches = useCallback(async () => {
    if (!selectedRepo) return;
    setIsLoading(true);
    try {
      const branchList = await getBranches(selectedRepo.owner.login, selectedRepo.name);
      setBranches(branchList);
      setSelectedBranch(selectedRepo.default_branch);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[CreatePRModal] Failed to load branches:', message);
      setError('Failed to load branches');
    } finally {
      setIsLoading(false);
    }
  }, [getBranches, selectedRepo]);

  useEffect(() => {
    if (isOpen && connection.connected) {
      loadRepos();
    }
  }, [isOpen, connection.connected, loadRepos]);

  useEffect(() => {
    if (selectedRepo) {
      loadBranches();
      setPrTitle(`[AllyLab] Fix: ${finding.ruleTitle}`);
    }
  }, [selectedRepo, loadBranches, finding.ruleTitle]);

  const handleRepoSelect = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setStep('file');
  };

  const handleCreatePR = async () => {
    if (!selectedRepo || !filePath || !selectedBranch) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createPR(
        selectedRepo.owner.login,
        selectedRepo.name,
        selectedBranch,
        [{
          filePath,
          originalContent: fix.original.code,
          fixedContent: fix.fixes.html,
          findingId: fix.findingId,
          ruleTitle: finding.ruleTitle,
        }],
        prTitle,
        prDescription || undefined
      );

      if (result.success && result.prUrl && result.prNumber) {
        setPrResult({ prUrl: result.prUrl, prNumber: result.prNumber });
        setStep('confirm');
      } else {
        const errorMessage = result.error || 'Failed to create PR';
        console.error('[CreatePRModal] PR creation failed:', errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[CreatePRModal] Failed to create PR:', message);
      setError('Failed to create PR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('repo');
    setSelectedRepo(null);
    setSelectedBranch('');
    setFilePath('');
    setPrTitle('');
    setPrDescription('');
    setPrResult(null);
    setError(null);
    onClose();
  };

  if (!connection.connected) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Create Pull Request">
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>GitHub Not Connected</h3>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
            Connect your GitHub account in Settings to create Pull Requests.
          </p>
          <Button onClick={onClose}>Go to Settings</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={
        step === 'repo' ? 'Select Repository' :
        step === 'file' ? 'Configure PR' :
        'Pull Request Created!'
      }
      size="lg"
    >
      {/* Step 1: Select Repository */}
      {step === 'repo' && (
        <div>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
            Select the repository where you want to apply this fix:
          </p>
          
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
              Loading repositories...
            </div>
          ) : (
            <div style={{ 
              maxHeight: 400, 
              overflow: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
            }}>
              {repos.map(repo => (
                <button
                  key={repo.id}
                  onClick={() => handleRepoSelect(repo)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    borderBottom: '1px solid #e2e8f0',
                    background: '#fff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <img
                    src={repo.owner.avatar_url}
                    alt=""
                    style={{ width: 24, height: 24, borderRadius: 4 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{repo.full_name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {repo.private ? '🔒 Private' : '🌐 Public'} • {repo.default_branch}
                    </div>
                  </div>
                  <span style={{ color: '#94a3b8' }}>→</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Configure PR */}
      {step === 'file' && selectedRepo && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Selected Repo */}
          <div style={{
            padding: 12,
            background: '#f8fafc',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <img
              src={selectedRepo.owner.avatar_url}
              alt=""
              style={{ width: 32, height: 32, borderRadius: 6 }}
            />
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{selectedRepo.full_name}</div>
              <button
                onClick={() => setStep('repo')}
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

          {/* Branch Selection */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6, display: 'block' }}>
              Base Branch
            </label>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
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
                  {branch.name} {branch.name === selectedRepo.default_branch ? '(default)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* File Path */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6, display: 'block' }}>
              File Path *
            </label>
            <input
              type="text"
              placeholder="src/components/Hero.tsx"
              value={filePath}
              onChange={e => setFilePath(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: 14,
              }}
            />
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              Path to the file containing the element: <code>{finding.selector}</code>
            </p>
          </div>

          {/* PR Title */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6, display: 'block' }}>
              PR Title
            </label>
            <input
              type="text"
              value={prTitle}
              onChange={e => setPrTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>

          {/* PR Description */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6, display: 'block' }}>
              Description (optional)
            </label>
            <textarea
              placeholder="Additional context for reviewers..."
              value={prDescription}
              onChange={e => setPrDescription(e.target.value)}
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
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: 12,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              color: '#dc2626',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleCreatePR}
              disabled={isLoading || !filePath}
            >
              {isLoading ? 'Creating PR...' : '🚀 Create Pull Request'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 'confirm' && prResult && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Pull Request Created!</h3>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
            PR #{prResult.prNumber} has been created successfully.
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
      )}
    </Modal>
  );
}