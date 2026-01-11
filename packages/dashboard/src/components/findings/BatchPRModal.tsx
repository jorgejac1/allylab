import { useState, useEffect, useCallback, useRef } from "react";
import { Modal, Button } from "../ui";
import { useGitHub } from "../../hooks/useGitHub";
import { usePRTracking } from "../../hooks/usePRTracking";
import { getApiBase } from "../../utils/api";
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
  const { connection, getRepos, getBranches, searchCode, getFileContent, createPR } = useGitHub();
  const { trackPR } = usePRTracking();

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

  // Ref to always have access to latest findingsWithFixes
  const findingsRef = useRef<FindingWithFix[]>([]);
  findingsRef.current = findingsWithFixes;

  // Simple flag to prevent re-initialization during the same modal session
  const isInitializedRef = useRef(false);

  // Initialize findings ONCE when modal opens
  useEffect(() => {
    if (isOpen && findings.length > 0 && !isInitializedRef.current) {
      console.log('[BatchPRModal] Initializing with', findings.length, 'findings');
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

    console.log('[BatchPRModal] Generating all fixes, count:', unfixed.length);

    for (const item of unfixed) {
      await generateFix(item.index);
    }
  }, [generateFix]);

  // Load repos
  const loadRepos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const repoList = await getRepos();
      setRepos(repoList);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[BatchPRModal] Failed to load repos:", message);
      setError("Failed to load repositories");
    } finally {
      setIsLoading(false);
    }
  }, [getRepos]);

  // Load branches
  const loadBranches = useCallback(async () => {
    /* istanbul ignore if -- @preserve defensive guard, unreachable via UI */
    if (!selectedRepo) return;
    setIsLoading(true);
    try {
      const branchList = await getBranches(
        selectedRepo.owner.login,
        selectedRepo.name
      );
      setBranches(branchList);
      setSelectedBranch(selectedRepo.default_branch);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[BatchPRModal] Failed to load branches:", message);
      setError("Failed to load branches");
    } finally {
      setIsLoading(false);
    }
  }, [getBranches, selectedRepo]);

  useEffect(() => {
    if (step === "repo" && connection.connected) {
      loadRepos();
    }
  }, [step, connection.connected, loadRepos]);

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

  // Wrapper for searchCode to return simpler results
  const searchCodeWrapper = useCallback(async (
    owner: string, 
    repo: string, 
    query: string
  ): Promise<Array<{ path: string }>> => {
    try {
      const results = await searchCode(owner, repo, query);
      return results.map(r => ({ path: r.path }));
    } catch (err) {
      console.error('[BatchPRModal] Search failed:', err);
      return [];
    }
  }, [searchCode]);

  // Wrapper for getFileContent
  const getFileContentWrapper = useCallback(async (
    owner: string,
    repo: string,
    path: string,
    branch: string
  ): Promise<string | null> => {
    return getFileContent(owner, repo, path, branch);
  }, [getFileContent]);

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

      const result = await createPR(
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[BatchPRModal] Failed to create PR:", message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    console.log('[BatchPRModal] Closing modal');
    setStep("fixes");
    setSelectedRepo(null);
    setSelectedBranch("");
    setFindingsWithFixes([]);
    setPrTitle("");
    setPrDescription("");
    setPrResult(null);
    setError(null);
    // Reset flag so next open will reinitialize
    isInitializedRef.current = false;
    onClose();
  };

  const fixedCount = findingsWithFixes.filter((f) => f.fix).length;
  const withPathCount = findingsWithFixes.filter(
    (f) => f.fix && f.filePath.trim()
  ).length;

  if (!connection.connected) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Create Batch Pull Request"
      >
        <div style={{ textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
          <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>
            GitHub Not Connected
          </h3>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 16 }}>
            Connect your GitHub account in Settings to create Pull Requests.
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
        return "Configure Files & PR";
      case "confirm":
        return "🎉 Pull Request Created!";
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
        <RepoSelector
          repos={repos}
          isLoading={isLoading}
          fixCount={fixedCount}
          onSelect={handleRepoSelect}
          onBack={() => setStep("fixes")}
        />
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
        />
      )}
    </Modal>
  );
}