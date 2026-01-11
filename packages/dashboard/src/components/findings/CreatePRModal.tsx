import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Modal } from '../ui';
import { useGitHub } from '../../hooks/useGitHub';
import { usePRTracking } from '../../hooks/usePRTracking';
import type { GitHubRepo, GitHubBranch } from '../../types/github';
import type { CodeFix } from '../../types/fixes';

interface CodeSearchResult {
  path: string;
  repository: string;
  url: string;
  htmlUrl: string;
  matchedLines: Array<{
    lineNumber: number;
    content: string;
  }>;
}

interface RepoFile {
  path: string;
  type: 'file' | 'dir';
  size?: number;
}

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

// Extract text content from HTML
function extractTextContent(html: string): string | null {
  const match = html.match(/>([^<]{2,100})</);
  if (match && match[1].trim() && !match[1].match(/^[\s.]+$/)) {
    return match[1].trim();
  }
  return null;
}

// Extract meaningful class names from selector
function extractClassNames(selector: string): string[] {
  const classMatches = selector.match(/\.([a-zA-Z0-9_-]+)/g);
  if (!classMatches) return [];
  
  return classMatches
    .map(m => m.slice(1))
    .filter(c => c.length > 3 && !c.match(/^(hover|focus|active|disabled|w-|h-|p-|m-|flex|grid)/))
    .slice(0, 3);
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
  const { connection, getRepos, getBranches, createPR, searchCode, getRepoTree } = useGitHub();
  const { trackPR } = usePRTracking();
  
  const [step, setStep] = useState<'repo' | 'file' | 'confirm'>('repo');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Prevent infinite retry loops
  const hasLoadedRepos = useRef(false);
  const loadingBranchesFor = useRef<string | null>(null);
  
  // Form state
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [filePath, setFilePath] = useState('');
  const [prTitle, setPrTitle] = useState('');
  const [prDescription, setPrDescription] = useState('');
  
  // File search state
  const [showFileSearch, setShowFileSearch] = useState(false);
  const [searchMode, setSearchMode] = useState<'options' | 'results' | 'browse'>('options');
  const [searchResults, setSearchResults] = useState<CodeSearchResult[]>([]);
  const [repoFiles, setRepoFiles] = useState<RepoFile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [customSearch, setCustomSearch] = useState('');
  const [fileFilter, setFileFilter] = useState('');
  
  // PR result
  const [prResult, setPrResult] = useState<{ prUrl: string; prNumber: number } | null>(null);

  // Extract search suggestions from the finding
  const textContent = extractTextContent(fix.original.code);
  const classNames = extractClassNames(finding.selector);

  const loadRepos = useCallback(async () => {
    if (hasLoadedRepos.current || isLoading) return;
    hasLoadedRepos.current = true;
    
    setIsLoading(true);
    setError(null);
    try {
      const repoList = await getRepos();
      setRepos(repoList);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[CreatePRModal] Failed to load repos:', message);
      setError('Failed to load repositories. Please try again.');
      hasLoadedRepos.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [getRepos, isLoading]);

  const loadBranches = useCallback(async () => {
    if (!selectedRepo) return;
    
    const repoKey = `${selectedRepo.owner.login}/${selectedRepo.name}`;
    if (loadingBranchesFor.current === repoKey) return;
    loadingBranchesFor.current = repoKey;
    
    setIsLoading(true);
    setError(null);
    try {
      const branchList = await getBranches(selectedRepo.owner.login, selectedRepo.name);
      setBranches(branchList);
      setSelectedBranch(selectedRepo.default_branch);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[CreatePRModal] Failed to load branches:', message);
      setError('Failed to load branches');
      loadingBranchesFor.current = null;
    } finally {
      setIsLoading(false);
    }
  }, [getBranches, selectedRepo]);

  // Search code in repo
  const handleSearch = useCallback(async (query: string) => {
    if (!selectedRepo || !query.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    setSearchMode('results');
    
    try {
      const results = await searchCode(
        selectedRepo.owner.login,
        selectedRepo.name,
        query.trim()
      );
      
      const filteredResults = results.filter(r => 
        r.path.match(/\.(tsx?|jsx?|vue|svelte)$/) &&
        !r.path.includes('node_modules') &&
        !r.path.includes('.test.') &&
        !r.path.includes('.spec.')
      );
      
      setSearchResults(filteredResults);
      
      if (filteredResults.length === 0) {
        setSearchError(`No files found matching "${query}". The repository may still be indexing - try browsing files instead.`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      console.error('[CreatePRModal] Search failed:', message);
      setSearchError(`Search failed: ${message}. Try browsing files instead.`);
    } finally {
      setIsSearching(false);
    }
  }, [selectedRepo, searchCode]);

  // Browse all files in repo
  const handleBrowseFiles = useCallback(async () => {
    if (!selectedRepo) return;
    
    setIsSearching(true);
    setSearchError(null);
    setSearchMode('browse');
    
    try {
      const files = await getRepoTree(
        selectedRepo.owner.login,
        selectedRepo.name,
        selectedBranch || selectedRepo.default_branch
      );
      
      setRepoFiles(files);
      
      if (files.length === 0) {
        setSearchError('No component files found in repository.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load files';
      console.error('[CreatePRModal] Browse failed:', message);
      setSearchError(message);
    } finally {
      setIsSearching(false);
    }
  }, [selectedRepo, selectedBranch, getRepoTree]);

  // Reset refs when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasLoadedRepos.current = false;
      loadingBranchesFor.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && connection.connected && !hasLoadedRepos.current) {
      loadRepos();
    }
  }, [isOpen, connection.connected, loadRepos]);

  useEffect(() => {
    if (selectedRepo) {
      loadBranches();
      setPrTitle(`[AllyLab] Fix: ${finding.ruleTitle}`);
      // Reset search state when repo changes
      setShowFileSearch(false);
      setSearchMode('options');
      setSearchResults([]);
      setRepoFiles([]);
    }
  }, [selectedRepo, loadBranches, finding.ruleTitle]);

  const handleRepoSelect = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setStep('file');
  };

  const handleSelectFile = (path: string) => {
    setFilePath(path);
    setShowFileSearch(false);
    setSearchMode('options');
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
        trackPR(
          result,
          selectedRepo.owner.login,
          selectedRepo.name,
          [finding.id],
          {
            scanUrl,
            scanStandard,
            scanViewport,
          }
        );

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
    setShowFileSearch(false);
    setSearchMode('options');
    setSearchResults([]);
    setRepoFiles([]);
    setCustomSearch('');
    setFileFilter('');
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

          {/* File Path with Find Button */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6, display: 'block' }}>
              File Path *
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="src/components/Header.tsx"
                value={filePath}
                onChange={e => setFilePath(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
              <Button
                variant="secondary"
                onClick={() => setShowFileSearch(!showFileSearch)}
              >
                🔍 Find
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
              <code>{fix.original.code.slice(0, 150)}{fix.original.code.length > 150 ? '...' : ''}</code>
            </div>

            {/* File Search Panel */}
            {showFileSearch && (
              <div style={{
                marginTop: 8,
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{
                  padding: '10px 12px',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>
                    📁 Find file in {selectedRepo.name}
                  </span>
                  <button
                    onClick={() => { setShowFileSearch(false); setSearchMode('options'); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      fontSize: 18,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* Search Options */}
                {searchMode === 'options' && (
                  <div style={{ padding: 12 }}>
                    <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                      Choose how to find the file:
                    </p>
                    
                    {/* Search by text content */}
                    {textContent && (
                      <button
                        onClick={() => handleSearch(`"${textContent}"`)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          marginBottom: 8,
                          border: '1px solid #e2e8f0',
                          borderRadius: 6,
                          background: '#fff',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        <span style={{ fontSize: 16 }}>📝</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>
                            Search by text content
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                            "{textContent.slice(0, 40)}{textContent.length > 40 ? '...' : ''}"
                          </div>
                        </div>
                      </button>
                    )}
                    
                    {/* Search by class names */}
                    {classNames.length > 0 && (
                      <button
                        onClick={() => handleSearch(classNames[0])}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          marginBottom: 8,
                          border: '1px solid #e2e8f0',
                          borderRadius: 6,
                          background: '#fff',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        <span style={{ fontSize: 16 }}>🏷️</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>
                            Search by class name
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                            .{classNames.join(', .')}
                          </div>
                        </div>
                      </button>
                    )}
                    
                    {/* Custom search */}
                    <div style={{
                      padding: '10px 12px',
                      marginBottom: 8,
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      background: '#fff',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 16 }}>🔎</span>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>
                          Custom search
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          placeholder="Enter search term..."
                          value={customSearch}
                          onChange={e => setCustomSearch(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && customSearch && handleSearch(customSearch)}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            border: '1px solid #e2e8f0',
                            borderRadius: 4,
                            fontSize: 12,
                          }}
                        />
                        <Button
                          variant="secondary"
                          onClick={() => customSearch && handleSearch(customSearch)}
                          disabled={!customSearch}
                        >
                          Search
                        </Button>
                      </div>
                    </div>
                    
                    {/* Browse all files */}
                    <button
                      onClick={handleBrowseFiles}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: 6,
                        background: '#fff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <span style={{ fontSize: 16 }}>📂</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>
                          Browse all files
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          View component files in the repository
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Search Results */}
                {searchMode === 'results' && (
                  <div>
                    <div style={{ 
                      padding: '8px 12px', 
                      borderBottom: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        {isSearching ? 'Searching...' : `${searchResults.length} files found`}
                      </span>
                      <button
                        onClick={() => setSearchMode('options')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3b82f6',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        ← Back
                      </button>
                    </div>
                    
                    {isSearching ? (
                      <div style={{ padding: 16, textAlign: 'center', color: '#64748b' }}>
                        Searching repository...
                      </div>
                    ) : searchError ? (
                      <div style={{ padding: 16, color: '#dc2626', fontSize: 13 }}>
                        {searchError}
                      </div>
                    ) : (
                      <div style={{ maxHeight: 200, overflow: 'auto' }}>
                        {searchResults.map((result, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectFile(result.path)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: 'none',
                              borderBottom: idx < searchResults.length - 1 ? '1px solid #e2e8f0' : 'none',
                              background: '#fff',
                              textAlign: 'left',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4,
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                          >
                            <div style={{ 
                              fontSize: 13, 
                              fontWeight: 500,
                              color: '#0f172a',
                              fontFamily: 'monospace',
                            }}>
                              📄 {result.path}
                            </div>
                            {result.matchedLines[0] && (
                              <div style={{
                                fontSize: 11,
                                color: '#64748b',
                                fontFamily: 'monospace',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                                {result.matchedLines[0].content}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Browse Files */}
                {searchMode === 'browse' && (
                  <div>
                    <div style={{ 
                      padding: '8px 12px', 
                      borderBottom: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        {isSearching ? 'Loading...' : `${repoFiles.length} component files`}
                      </span>
                      <button
                        onClick={() => setSearchMode('options')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3b82f6',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        ← Back
                      </button>
                    </div>
                    
                    {/* Filter */}
                    {!isSearching && repoFiles.length > 0 && (
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                        <input
                          type="text"
                          placeholder="Filter files... (e.g. Header, Search, Hero)"
                          value={fileFilter}
                          onChange={e => setFileFilter(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            border: '1px solid #e2e8f0',
                            borderRadius: 4,
                            fontSize: 12,
                          }}
                        />
                      </div>
                    )}
                    
                    {isSearching ? (
                      <div style={{ padding: 16, textAlign: 'center', color: '#64748b' }}>
                        Loading files...
                      </div>
                    ) : searchError ? (
                      <div style={{ padding: 16, color: '#dc2626', fontSize: 13 }}>
                        {searchError}
                      </div>
                    ) : (
                      <div style={{ maxHeight: 250, overflow: 'auto' }}>
                        {repoFiles
                          .filter(f => !fileFilter || f.path.toLowerCase().includes(fileFilter.toLowerCase()))
                          .slice(0, 100)
                          .map((file, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelectFile(file.path)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: 'none',
                                borderBottom: '1px solid #f1f5f9',
                                background: '#fff',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontFamily: 'monospace',
                                color: '#0f172a',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                            >
                              📄 {file.path}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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