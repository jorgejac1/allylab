import { useState, useEffect, useCallback, useRef } from 'react';
import { useGitHub } from '../../../hooks/useGitHub';
import { usePRTracking } from '../../../hooks/usePRTracking';
import type { GitHubRepo, GitHubBranch } from '../../../types/github';
import type { CodeFix } from '../../../types/fixes';

export type PRStep = 'repo' | 'file' | 'confirm';

export interface CodeSearchResult {
  path: string;
  repository: string;
  url: string;
  htmlUrl: string;
  matchedLines: Array<{
    lineNumber: number;
    content: string;
  }>;
}

export interface RepoFile {
  path: string;
  type: 'file' | 'dir';
  size?: number;
}

export interface PRResult {
  prUrl: string;
  prNumber: number;
}

interface UseCreatePRFormProps {
  isOpen: boolean;
  fix: CodeFix;
  finding: {
    id: string;
    ruleTitle: string;
    selector: string;
  };
  scanUrl: string;
  scanStandard?: string;
  scanViewport?: string;
  onClose: () => void;
}

export function useCreatePRForm({
  isOpen,
  fix,
  finding,
  scanUrl,
  scanStandard,
  scanViewport,
  onClose,
}: UseCreatePRFormProps) {
  const { connection, getRepos, getBranches, createPR, searchCode, getRepoTree } = useGitHub();
  const { trackPR } = usePRTracking();

  // Step state
  const [step, setStep] = useState<PRStep>('repo');

  // Repo state
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
  const [prResult, setPrResult] = useState<PRResult | null>(null);

  // Load repos
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

  // Load branches
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

  // Load repos when modal opens
  useEffect(() => {
    if (isOpen && connection.connected && !hasLoadedRepos.current) {
      loadRepos();
    }
  }, [isOpen, connection.connected, loadRepos]);

  // Load branches when repo is selected
  useEffect(() => {
    if (selectedRepo) {
      loadBranches();
      setPrTitle(`[AllyLab] Fix: ${finding.ruleTitle}`);
      setShowFileSearch(false);
      setSearchMode('options');
      setSearchResults([]);
      setRepoFiles([]);
    }
  }, [selectedRepo, loadBranches, finding.ruleTitle]);

  // Handlers
  const handleRepoSelect = useCallback((repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setStep('file');
  }, []);

  const handleSelectFile = useCallback((path: string) => {
    setFilePath(path);
    setShowFileSearch(false);
    setSearchMode('options');
  }, []);

  const handleCreatePR = useCallback(async () => {
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
  }, [selectedRepo, filePath, selectedBranch, fix, finding, prTitle, prDescription, createPR, trackPR, scanUrl, scanStandard, scanViewport]);

  const handleClose = useCallback(() => {
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
  }, [onClose]);

  const handleBackToRepoStep = useCallback(() => {
    setStep('repo');
  }, []);

  const toggleFileSearch = useCallback(() => {
    setShowFileSearch(prev => !prev);
  }, []);

  const closeFileSearch = useCallback(() => {
    setShowFileSearch(false);
    setSearchMode('options');
  }, []);

  const backToSearchOptions = useCallback(() => {
    setSearchMode('options');
  }, []);

  return {
    // Connection state
    isConnected: connection.connected,

    // Step state
    step,
    setStep,

    // Repo state
    repos,
    branches,
    selectedRepo,
    selectedBranch,
    setSelectedBranch,
    isLoading,
    error,

    // Form state
    filePath,
    setFilePath,
    prTitle,
    setPrTitle,
    prDescription,
    setPrDescription,

    // File search state
    showFileSearch,
    searchMode,
    searchResults,
    repoFiles,
    isSearching,
    searchError,
    customSearch,
    setCustomSearch,
    fileFilter,
    setFileFilter,

    // PR result
    prResult,

    // Handlers
    handleRepoSelect,
    handleSelectFile,
    handleCreatePR,
    handleClose,
    handleBackToRepoStep,
    handleSearch,
    handleBrowseFiles,
    toggleFileSearch,
    closeFileSearch,
    backToSearchOptions,
  };
}
