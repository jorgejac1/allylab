import { useState, useEffect, useCallback, useRef } from "react";
import { Modal, Button } from "../ui";
import { Link2, PartyPopper } from "lucide-react";
import { useGitHub } from "../../hooks/useGitHub";
import { useGitLabMR } from "../../hooks/useGitLabMR";
import { usePRTracking } from "../../hooks/usePRTracking";
import { getApiBase } from "../../utils/api";
import { GitPlatformSelector } from "./GitPlatformSelector";
import {
  FixGenerationList,
  RepoSelector,
  FilePathMapper,
  PRSuccessView,
} from "./batch-pr";
import { generateBatchDescription, generateSmartBranchName, generateSmartTitle } from "../../utils/batchPrDescription";
import type { TrackedFinding } from "../../types";
import type { FindingWithFix, BatchPRResult } from "../../types/batch-pr";
import type { GitHubRepo, GitHubBranch } from "../../types/github";

interface BatchPRModalProps {
  isOpen: boolean;
  onClose: () => void;
  findings: TrackedFinding[];
  scanUrl: string;
  scanStandard?: string;
  scanViewport?: string;
}

type Step = "fixes" | "repo" | "files" | "confirm";

export function BatchPRModal({
  isOpen,
  onClose,
  findings,
  scanUrl,
  scanStandard,
  scanViewport,
}: BatchPRModalProps) {
  const github = useGitHub();
  const gitlab = useGitLabMR();
  const { trackPR } = usePRTracking();

  const [platform, setPlatform] = useState<'github' | 'gitlab'>('github');
  const [step, setStep] = useState<Step>("fixes");
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [findingsWithFixes, setFindingsWithFixes] = useState<FindingWithFix[]>(
    []
  );
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [prTitle, setPrTitle] = useState("");
  const [prDescription, setPrDescription] = useState("");
  const [prResult, setPrResult] = useState<BatchPRResult | null>(null);
  // Track the original GitLab project path for MR creation
  const [gitlabProjectPath, setGitlabProjectPath] = useState<string>("");

  // Ref to always have access to latest findingsWithFixes
  const findingsRef = useRef<FindingWithFix[]>([]);
  findingsRef.current = findingsWithFixes;

  // Simple flag to prevent re-initialization during the same modal session
  const isInitializedRef = useRef(false);

  // Determine if any platform is connected
  const isConnected = platform === 'github'
    ? github.connection.connected
    : gitlab.connection.connected;

  // Initialize findings ONCE when modal opens
  useEffect(() => {
    if (isOpen && findings.length > 0 && !isInitializedRef.current) {
      isInitializedRef.current = true;

      setFindingsWithFixes(
        findings.map((f) => ({
          finding: f,
          fix: null,
          filePath: "",
          isGenerating: false,
          error: null,
        }))
      );
      setStep("fixes");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // ONLY depend on isOpen - intentionally ignore findings changes after init

  // Reset flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      isInitializedRef.current = false;
    }
  }, [isOpen]);

  // Generate fix for single finding
  const generateFix = useCallback(
    async (index: number) => {
      // Get the current item from ref (always latest state)
      const item = findingsRef.current[index];
      if (!item) return;

      setFindingsWithFixes((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, isGenerating: true, error: null } : f
        )
      );

      try {
        const response = await fetch(`${getApiBase()}/fixes/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            finding: {
              ruleId: item.finding.ruleId,
              ruleTitle: item.finding.ruleTitle,
              description: item.finding.description,
              html: item.finding.html,
              selector: item.finding.selector,
              wcagTags: item.finding.wcagTags,
              impact: item.finding.impact,
            },
            framework: "html",
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        if (!data.fix) {
          throw new Error("No fix generated");
        }

        setFindingsWithFixes((prev) =>
          prev.map((f, i) =>
            i === index ? { ...f, fix: data.fix, isGenerating: false } : f
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[BatchPRModal] Failed to generate fix:", message);
        setFindingsWithFixes((prev) =>
          prev.map((f, i) =>
            i === index ? { ...f, isGenerating: false, error: message } : f
          )
        );
      }
    },
    [] // No dependencies - we use the ref
  );

  // Generate all fixes
  const generateAllFixes = useCallback(async () => {
    // Use ref to get current state without stale closure issues
    const currentFindings = findingsRef.current;

    const unfixed = currentFindings
      .map((f, i) => ({ ...f, index: i }))
      .filter((f) => !f.fix && !f.isGenerating);

    for (const item of unfixed) {
      await generateFix(item.index);
    }
  }, [generateFix]);

  // Load repos (platform-aware)
  const loadRepos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (platform === 'gitlab') {
        const projects = await gitlab.getProjects();
        // Map GitLab projects to GitHubRepo shape for the RepoSelector component
        const mapped: GitHubRepo[] = projects.map((p) => ({
          id: p.id,
          name: p.name,
          full_name: p.path_with_namespace,
          owner: {
            login: p.path_with_namespace.split('/')[0] || p.name,
            avatar_url: '',
          },
          default_branch: p.default_branch || 'main',
          private: p.visibility === 'private',
          html_url: p.web_url || '',
        }));
        setRepos(mapped);
      } else {
        const repoList = await github.getRepos();
        setRepos(repoList);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[BatchPRModal] Failed to load repos:", message);
      setError("Failed to load repositories");
    } finally {
      setIsLoading(false);
    }
  }, [platform, github, gitlab]);

  // Load branches (platform-aware)
  const loadBranches = useCallback(async () => {
    /* istanbul ignore if -- @preserve defensive guard, unreachable via UI */
    if (!selectedRepo) return;
    setIsLoading(true);
    try {
      if (platform === 'gitlab') {
        const glBranches = await gitlab.getBranches(selectedRepo.full_name);
        // Map GitLab branches to GitHubBranch shape
        const mapped: GitHubBranch[] = glBranches.map((b) => ({
          name: b.name,
          sha: b.commit.id,
        }));
        setBranches(mapped);
      } else {
        const branchList = await github.getBranches(
          selectedRepo.owner.login,
          selectedRepo.name
        );
        setBranches(branchList);
      }
      setSelectedBranch(selectedRepo.default_branch);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[BatchPRModal] Failed to load branches:", message);
      setError("Failed to load branches");
    } finally {
      setIsLoading(false);
    }
  }, [platform, github, gitlab, selectedRepo]);

  useEffect(() => {
    if (step === "repo" && isConnected) {
      loadRepos();
    }
  }, [step, isConnected, loadRepos]);

  useEffect(() => {
    if (selectedRepo) {
      loadBranches();
      // Generate smart title based on fixes
      const fixedItems = findingsWithFixes.filter((f) => f.fix);
      setPrTitle(generateSmartTitle(fixedItems));
    }
  }, [selectedRepo, loadBranches, findingsWithFixes]);

  const handleRepoSelect = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    // Store the GitLab project path (full_name maps to path_with_namespace)
    if (platform === 'gitlab') {
      setGitlabProjectPath(repo.full_name);
    }
    setStep("files");
  };

  const handleFilePathChange = (index: number, path: string) => {
    setFindingsWithFixes((prev) =>
      prev.map((f, i) => (i === index ? { ...f, filePath: path } : f))
    );
  };

  const handleRemoveFinding = (index: number) => {
    setFindingsWithFixes((prev) => prev.filter((_, i) => i !== index));
  };

  // Wrapper for searchCode to return simpler results (platform-aware)
  const searchCodeWrapper = useCallback(async (
    owner: string,
    repo: string,
    query: string
  ): Promise<Array<{ path: string }>> => {
    try {
      if (platform === 'gitlab') {
        // For GitLab, the "full_name" is path_with_namespace
        const projectPath = `${owner}/${repo}`;
        const results = await gitlab.searchCode(projectPath, query);
        return results.map(r => ({ path: r.path }));
      } else {
        const results = await github.searchCode(owner, repo, query);
        return results.map(r => ({ path: r.path }));
      }
    } catch (err) {
      console.error('[BatchPRModal] Search failed:', err);
      return [];
    }
  }, [platform, github, gitlab]);

  // Wrapper for getFileContent (platform-aware)
  const getFileContentWrapper = useCallback(async (
    owner: string,
    repo: string,
    path: string,
    branch: string
  ): Promise<string | null> => {
    if (platform === 'gitlab') {
      const projectPath = `${owner}/${repo}`;
      return gitlab.getFileContent(projectPath, path, branch);
    }
    return github.getFileContent(owner, repo, path, branch);
  }, [platform, github, gitlab]);

  const handleCreatePR = async () => {
    if (!selectedRepo || !selectedBranch) {
      setError("Please select a repository and branch");
      return;
    }

    const fixesWithPaths = findingsWithFixes.filter(
      (f) => f.fix && f.filePath.trim()
    );

    if (fixesWithPaths.length === 0) {
      setError("Please provide file paths for at least one fix");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fixes = fixesWithPaths.map((f) => ({
        filePath: f.filePath.trim(),
        originalContent: f.fix!.original.code,
        fixedContent: f.fix!.fixes.html,
        findingId: f.finding.id,
        ruleTitle: f.finding.ruleTitle,
      }));

      // Generate smart branch name
      const branchName = generateSmartBranchName(fixesWithPaths);

      if (platform === 'gitlab') {
        const result = await gitlab.createTrackedMR(
          gitlabProjectPath,
          selectedBranch,
          fixes,
          prTitle,
          prDescription || generateBatchDescription(fixesWithPaths, scanUrl),
          branchName
        );

        if (result.success && result.mr) {
          setPrResult({ prUrl: result.mr.web_url, prNumber: result.mr.iid });
          setStep("confirm");
        } else {
          console.error("[BatchPRModal] MR creation failed:", result.error);
          setError(result.error || "Failed to create MR");
        }
      } else {
        const result = await github.createPR(
          selectedRepo.owner.login,
          selectedRepo.name,
          selectedBranch,
          fixes,
          prTitle,
          prDescription || generateBatchDescription(fixesWithPaths, scanUrl),
          branchName
        );

        if (result.success && result.prUrl && result.prNumber) {
          // Track the PR with all finding IDs for verification
          const findingIds = fixesWithPaths.map((f) => f.finding.id);
          trackPR(
            result,
            selectedRepo.owner.login,
            selectedRepo.name,
            findingIds,
            {
              scanUrl,
              scanStandard,
              scanViewport,
            }
          );

          setPrResult({ prUrl: result.prUrl, prNumber: result.prNumber });
          setStep("confirm");
        } else {
          console.error("[BatchPRModal] PR creation failed:", result.error);
          setError(result.error || "Failed to create PR");
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[BatchPRModal] Failed to create PR/MR:", message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep("fixes");
    setPlatform("github");
    setSelectedRepo(null);
    setSelectedBranch("");
    setFindingsWithFixes([]);
    setPrTitle("");
    setPrDescription("");
    setPrResult(null);
    setError(null);
    setGitlabProjectPath("");
    // Reset flag so next open will reinitialize
    isInitializedRef.current = false;
    onClose();
  };

  // When platform changes, reset repo selection
  const handlePlatformChange = (newPlatform: 'github' | 'gitlab') => {
    setPlatform(newPlatform);
    setSelectedRepo(null);
    setSelectedBranch("");
    setRepos([]);
    setBranches([]);
    setGitlabProjectPath("");
    setError(null);
    // If we're on the repo step, reload repos for the new platform
    if (step === "repo") {
      // loadRepos will be triggered by the useEffect
    }
  };

  const fixedCount = findingsWithFixes.filter((f) => f.fix).length;
  const withPathCount = findingsWithFixes.filter(
    (f) => f.fix && f.filePath.trim()
  ).length;

  const isGitLab = platform === 'gitlab';
  const prOrMr = isGitLab ? 'Merge Request' : 'Pull Request';

  if (!github.connection.connected && !gitlab.connection.connected) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Create Batch Pull Request"
      >
        <div className="text-center p-5">
          <div className="mb-4 flex justify-center"><Link2 size={48} className="text-slate-500" /></div>
          <h3 className="m-0 mb-2 text-base">
            Git Not Connected
          </h3>
          <p className="text-slate-500 text-sm mb-4">
            Connect your GitHub or GitLab account in Settings to create Pull Requests or Merge Requests.
          </p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </Modal>
    );
  }

  const getTitle = () => {
    switch (step) {
      case "fixes":
        return `Generate Fixes (${findings.length} issues)`;
      case "repo":
        return "Select Repository";
      case "files":
        return isGitLab ? "Configure Files & MR" : "Configure Files & PR";
      case "confirm":
        return <span className="inline-flex items-center gap-2"><PartyPopper size={20} /> {prOrMr} Created!</span>;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={getTitle()} size="lg">
      {step === "fixes" && (
        <FixGenerationList
          findings={findingsWithFixes}
          onGenerateFix={generateFix}
          onGenerateAll={generateAllFixes}
          onContinue={() => setStep("repo")}
          onCancel={handleClose}
        />
      )}

      {step === "repo" && (
        <>
          <GitPlatformSelector
            value={platform}
            onChange={handlePlatformChange}
            githubConnected={github.connection.connected}
            gitlabConnected={gitlab.connection.connected}
          />
          {!isConnected ? (
            <div className="text-center p-5">
              <p className="text-slate-500 text-sm">
                {isGitLab ? 'GitLab' : 'GitHub'} is not connected. Connect in Settings or select the other platform.
              </p>
            </div>
          ) : (
            <RepoSelector
              repos={repos}
              isLoading={isLoading}
              fixCount={fixedCount}
              onSelect={handleRepoSelect}
              onBack={() => setStep("fixes")}
            />
          )}
        </>
      )}

      {step === "files" && selectedRepo && (
        <FilePathMapper
          selectedRepo={selectedRepo}
          branches={branches}
          selectedBranch={selectedBranch}
          findings={findingsWithFixes}
          prTitle={prTitle}
          prDescription={prDescription}
          isLoading={isLoading}
          error={error}
          onBranchChange={setSelectedBranch}
          onFilePathChange={handleFilePathChange}
          onRemoveFinding={handleRemoveFinding}
          onTitleChange={setPrTitle}
          onDescriptionChange={setPrDescription}
          onChangeRepo={() => setStep("repo")}
          onBack={() => setStep("repo")}
          onCancel={handleClose}
          onSubmit={handleCreatePR}
          searchCode={searchCodeWrapper}
          getFileContent={getFileContentWrapper}
        />
      )}

      {step === "confirm" && prResult && (
        <PRSuccessView
          result={prResult}
          fixCount={withPathCount}
          onClose={handleClose}
          platform={platform}
        />
      )}
    </Modal>
  );
}
