import { useReducer, useCallback, useEffect } from 'react';
import type { GitHubRepo } from '../types/github';

type Step = 'preview' | 'edit';

interface WorkflowState {
  // Step
  step: Step;
  // Repo
  repos: GitHubRepo[];
  selectedRepo: GitHubRepo | null;
  showRepoSelector: boolean;
  isLoadingRepos: boolean;
  // File
  filePath: string | null;
  showFileFinder: boolean;
  fileContent: string | null;
  isLoadingFile: boolean;
  selectedLineNumber: number | null;
  // PR
  isCreatingPR: boolean;
  prError: string | null;
  prResult: { prUrl: string; prNumber: number } | null;
  // UI
  copied: boolean;
}

type WorkflowAction =
  | { type: 'SET_STEP'; step: Step }
  | { type: 'SET_REPOS'; repos: GitHubRepo[] }
  | { type: 'SELECT_REPO'; repo: GitHubRepo }
  | { type: 'SHOW_REPO_SELECTOR' }
  | { type: 'SET_LOADING_REPOS'; loading: boolean }
  | { type: 'SET_FILE_PATH'; path: string | null }
  | { type: 'SHOW_FILE_FINDER' }
  | { type: 'HIDE_FILE_FINDER' }
  | { type: 'SET_FILE_CONTENT'; content: string | null }
  | { type: 'SET_LOADING_FILE'; loading: boolean }
  | { type: 'SET_LINE_NUMBER'; lineNumber: number | null }
  | { type: 'SET_CREATING_PR'; creating: boolean }
  | { type: 'SET_PR_ERROR'; error: string | null }
  | { type: 'SET_PR_RESULT'; result: { prUrl: string; prNumber: number } | null }
  | { type: 'SET_COPIED'; copied: boolean }
  | { type: 'RESET' }
  | { type: 'BACK_TO_PREVIEW' };

const initialState: WorkflowState = {
  step: 'preview',
  repos: [],
  selectedRepo: null,
  showRepoSelector: false,
  isLoadingRepos: false,
  filePath: null,
  showFileFinder: false,
  fileContent: null,
  isLoadingFile: false,
  selectedLineNumber: null,
  isCreatingPR: false,
  prError: null,
  prResult: null,
  copied: false,
};

function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'SET_REPOS':
      return { ...state, repos: action.repos };
    case 'SELECT_REPO':
      return {
        ...state,
        selectedRepo: action.repo,
        showRepoSelector: false,
        filePath: null,
        fileContent: null,
      };
    case 'SHOW_REPO_SELECTOR':
      return { ...state, showRepoSelector: true };
    case 'SET_LOADING_REPOS':
      return { ...state, isLoadingRepos: action.loading };
    case 'SET_FILE_PATH':
      return { ...state, filePath: action.path, showFileFinder: false, fileContent: null };
    case 'SHOW_FILE_FINDER':
      return { ...state, showFileFinder: true };
    case 'HIDE_FILE_FINDER':
      return { ...state, showFileFinder: false };
    case 'SET_FILE_CONTENT':
      return { ...state, fileContent: action.content };
    case 'SET_LOADING_FILE':
      return { ...state, isLoadingFile: action.loading };
    case 'SET_LINE_NUMBER':
      return { ...state, selectedLineNumber: action.lineNumber };
    case 'SET_CREATING_PR':
      return { ...state, isCreatingPR: action.creating };
    case 'SET_PR_ERROR':
      return { ...state, prError: action.error };
    case 'SET_PR_RESULT':
      return { ...state, prResult: action.result };
    case 'SET_COPIED':
      return { ...state, copied: action.copied };
    case 'RESET':
      return {
        ...initialState,
        repos: state.repos,
        selectedRepo: state.selectedRepo,
      };
    case 'BACK_TO_PREVIEW':
      return {
        ...state,
        step: 'preview',
        fileContent: null,
        prError: null,
      };
    default:
      return state;
  }
}

interface UseApplyFixWorkflowOptions {
  isOpen: boolean;
  isConnected: boolean;
  domain: string;
  getRepos: () => Promise<GitHubRepo[]>;
  getSavedRepo: (domain: string) => { owner: string; repo: string } | null;
  saveRepoForDomain: (domain: string, owner: string, repo: string) => void;
}

export interface ApplyFixWorkflowResult {
  state: WorkflowState;
  // Actions
  setStep: (step: Step) => void;
  selectRepo: (repo: GitHubRepo) => void;
  showRepoSelector: () => void;
  setFilePath: (path: string | null) => void;
  showFileFinder: () => void;
  hideFileFinder: () => void;
  setFileContent: (content: string | null) => void;
  setLoadingFile: (loading: boolean) => void;
  setLineNumber: (lineNumber: number | null) => void;
  setCreatingPR: (creating: boolean) => void;
  setPrError: (error: string | null) => void;
  setPrResult: (result: { prUrl: string; prNumber: number } | null) => void;
  setCopied: (copied: boolean) => void;
  reset: () => void;
  backToPreview: () => void;
}

export function useApplyFixWorkflow({
  isOpen,
  isConnected,
  domain,
  getRepos,
  getSavedRepo,
  saveRepoForDomain,
}: UseApplyFixWorkflowOptions): ApplyFixWorkflowResult {
  const [state, dispatch] = useReducer(workflowReducer, initialState);

  // Load repos on mount
  useEffect(() => {
    if (!isOpen || !isConnected) return;

    const loadRepos = async () => {
      dispatch({ type: 'SET_LOADING_REPOS', loading: true });
      try {
        const repoList = await getRepos();
        dispatch({ type: 'SET_REPOS', repos: repoList });

        const saved = getSavedRepo(domain);
        if (saved) {
          const found = repoList.find(
            (r) => r.owner.login === saved.owner && r.name === saved.repo
          );
          if (found) {
            dispatch({ type: 'SELECT_REPO', repo: found });
          }
        }
      } catch (err) {
        console.error('[useApplyFixWorkflow] Failed to load repos:', err);
      } finally {
        dispatch({ type: 'SET_LOADING_REPOS', loading: false });
      }
    };

    loadRepos();
  }, [isOpen, isConnected, getRepos, getSavedRepo, domain]);

  // Action creators
  const setStep = useCallback((step: Step) => {
    dispatch({ type: 'SET_STEP', step });
  }, []);

  const selectRepo = useCallback((repo: GitHubRepo) => {
    dispatch({ type: 'SELECT_REPO', repo });
    saveRepoForDomain(domain, repo.owner.login, repo.name);
  }, [domain, saveRepoForDomain]);

  const showRepoSelectorAction = useCallback(() => {
    dispatch({ type: 'SHOW_REPO_SELECTOR' });
  }, []);

  const setFilePath = useCallback((path: string | null) => {
    dispatch({ type: 'SET_FILE_PATH', path });
  }, []);

  const showFileFinderAction = useCallback(() => {
    dispatch({ type: 'SHOW_FILE_FINDER' });
  }, []);

  const hideFileFinder = useCallback(() => {
    dispatch({ type: 'HIDE_FILE_FINDER' });
  }, []);

  const setFileContent = useCallback((content: string | null) => {
    dispatch({ type: 'SET_FILE_CONTENT', content });
  }, []);

  const setLoadingFile = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING_FILE', loading });
  }, []);

  const setLineNumber = useCallback((lineNumber: number | null) => {
    dispatch({ type: 'SET_LINE_NUMBER', lineNumber });
  }, []);

  const setCreatingPR = useCallback((creating: boolean) => {
    dispatch({ type: 'SET_CREATING_PR', creating });
  }, []);

  const setPrError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_PR_ERROR', error });
  }, []);

  const setPrResult = useCallback((result: { prUrl: string; prNumber: number } | null) => {
    dispatch({ type: 'SET_PR_RESULT', result });
  }, []);

  const setCopied = useCallback((copied: boolean) => {
    dispatch({ type: 'SET_COPIED', copied });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const backToPreview = useCallback(() => {
    dispatch({ type: 'BACK_TO_PREVIEW' });
  }, []);

  return {
    state,
    setStep,
    selectRepo,
    showRepoSelector: showRepoSelectorAction,
    setFilePath,
    showFileFinder: showFileFinderAction,
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
  };
}
