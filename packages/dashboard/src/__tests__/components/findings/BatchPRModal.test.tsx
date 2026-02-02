// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BatchPRModal } from "../../../components/findings/BatchPRModal";
import type { TrackedFinding } from "../../../types";
import type { GitHubRepo, GitHubBranch } from "../../../types/github";

// Mock fetch
global.fetch = vi.fn();

// Mock hooks
const mockGetRepos = vi.fn();
const mockGetBranches = vi.fn();
const mockCreatePR = vi.fn();
const mockTrackPR = vi.fn();
const mockSearchCode = vi.fn();
const mockGetRepoTree = vi.fn();
const mockGetFileContent = vi.fn();

vi.mock("../../../hooks/useGitHub", () => ({
  useGitHub: vi.fn(() => ({
    connection: { connected: true },
    isLoading: false,
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    checkConnection: vi.fn(),
    getRepos: mockGetRepos,
    getBranches: mockGetBranches,
    createPR: mockCreatePR,
    searchCode: mockSearchCode,
    getRepoTree: mockGetRepoTree,
    getFileContent: mockGetFileContent,
  })),
}));

vi.mock("../../../hooks/usePRTracking", () => ({
  usePRTracking: vi.fn(() => ({
    trackPR: mockTrackPR,
  })),
}));

// Mock API utils
vi.mock("../../../utils/api", () => ({
  getApiBase: vi.fn(() => "http://localhost:3000/api"),
}));

// Mock batch PR description util
vi.mock("../../../utils/batchPrDescription", () => ({
  generateBatchDescription: vi.fn(() => "Generated batch description"),
  generateSmartTitle: vi.fn(() => "Fix accessibility issues"),
  generateSmartBranchName: vi.fn(() => "fix/accessibility-issues"),
}));

// Mock UI components
vi.mock("../../../components/ui", () => ({
  Modal: ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) =>
    isOpen ? (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        <button onClick={onClose} data-testid="modal-close">Close Modal</button>
        {children}
      </div>
    ) : null,
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled} data-testid="button">
      {children}
    </button>
  ),
}));

// Mock batch-pr components
vi.mock("../../../components/findings/batch-pr", () => ({
  FixGenerationList: ({ findings, onGenerateFix, onGenerateAll, onContinue, onCancel }: { findings: Array<{ finding: TrackedFinding; fix?: Record<string, unknown> }>; onGenerateFix: (index: number) => void; onGenerateAll: () => void; onContinue: () => void; onCancel: () => void }) => (
    <div data-testid="fix-generation-list">
      <button onClick={onGenerateAll} data-testid="generate-all">Generate All</button>
      {findings.map((f, i: number) => (
        <div key={i} data-testid={`finding-item-${i}`}>
          <span>{f.finding.ruleTitle}</span>
          <button onClick={() => onGenerateFix(i)} data-testid={`generate-${i}`}>Generate</button>
          {f.fix && <span data-testid={`fix-${i}`}>Fix generated</span>}
        </div>
      ))}
      <button onClick={onContinue} data-testid="continue">Continue</button>
      <button onClick={onCancel} data-testid="cancel">Cancel</button>
    </div>
  ),
  RepoSelector: ({ repos, isLoading, onSelect, onBack }: { repos: GitHubRepo[]; isLoading: boolean; onSelect: (repo: GitHubRepo) => void; onBack: () => void }) => (
    <div data-testid="repo-selector">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        repos.map((repo: GitHubRepo) => (
          <button key={repo.id} onClick={() => onSelect(repo)} data-testid={`repo-${repo.name}`}>
            {repo.full_name}
          </button>
        ))
      )}
      <button onClick={onBack} data-testid="back">Back</button>
    </div>
  ),
  FilePathMapper: ({ findings, onFilePathChange, onRemoveFinding, onSubmit, onBack, onCancel, onChangeRepo }: { findings: Array<{ filePath: string }>; onFilePathChange: (index: number, value: string) => void; onRemoveFinding?: (index: number) => void; onSubmit: () => void; onBack: () => void; onCancel: () => void; onChangeRepo?: () => void }) => (
    <div data-testid="file-path-mapper">
      {findings.map((f, i: number) => (
        <div key={i}>
          <input
            data-testid={`file-path-${i}`}
            value={f.filePath}
            onChange={(e) => onFilePathChange(i, e.target.value)}
            placeholder="Enter file path"
          />
          {onRemoveFinding && (
            <button onClick={() => onRemoveFinding(i)} data-testid={`remove-${i}`}>Remove</button>
          )}
        </div>
      ))}
      <button onClick={onSubmit} data-testid="submit">Create PR</button>
      <button onClick={onBack} data-testid="back">Back</button>
      <button onClick={onCancel} data-testid="cancel">Cancel</button>
      {onChangeRepo && <button onClick={onChangeRepo} data-testid="change-repo">Change Repo</button>}
    </div>
  ),
  PRSuccessView: ({ result, onClose }: { result: { prNumber: number; prUrl: string }; onClose: () => void }) => (
    <div data-testid="pr-success-view">
      <div>PR #{result.prNumber} created!</div>
      <a href={result.prUrl}>View PR</a>
      <button onClick={onClose} data-testid="close">Close</button>
    </div>
  ),
}));

describe("components/findings/BatchPRModal", () => {
  const makeFinding = (overrides: Partial<TrackedFinding> = {}): TrackedFinding => ({
    id: "f1",
    ruleId: "r1",
    ruleTitle: "Test Rule",
    description: "Test description",
    impact: "critical",
    selector: "div",
    html: "<div/>",
    helpUrl: "https://test.com",
    wcagTags: ["wcag2a"],
    source: "axe-core",
    status: "new",
    firstSeen: "2024-01-01T00:00:00Z",
    fingerprint: "fp1",
    falsePositive: false,
    ...overrides,
  });

  const mockRepos: GitHubRepo[] = [
    {
      id: 1,
      name: "test-repo",
      full_name: "owner/test-repo",
      owner: { login: "owner", avatar_url: "https://avatar.url" },
      private: false,
      default_branch: "main",
      html_url: "https://github.com/owner/test-repo",
    },
  ];

  const mockBranches: GitHubBranch[] = [
    { name: "main", sha: "abc123" },
    { name: "develop", sha: "def456" },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    findings: [
      makeFinding({ id: "f1", ruleTitle: "Rule 1" }),
      makeFinding({ id: "f2", ruleTitle: "Rule 2" }),
    ],
    scanUrl: "https://test.com",
    scanStandard: "WCAG2AA",
    scanViewport: "desktop",
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset the useGitHub mock to default connected state
    const hooks = await import("../../../hooks/useGitHub");
    vi.mocked(hooks.useGitHub).mockReturnValue({
      connection: { connected: true },
      isLoading: false,
      error: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      checkConnection: vi.fn(),
      getRepos: mockGetRepos,
      getBranches: mockGetBranches,
      createPR: mockCreatePR,
      searchCode: mockSearchCode,
      getRepoTree: mockGetRepoTree,
      getFileContent: mockGetFileContent,
    });

    mockGetRepos.mockResolvedValue(mockRepos);
    mockGetBranches.mockResolvedValue(mockBranches);
    mockCreatePR.mockResolvedValue({
      success: true,
      prUrl: "https://github.com/owner/test-repo/pull/1",
      prNumber: 1,
    });

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        fix: {
          findingId: "f1",
          framework: "html",
          original: { code: "<div/>" },
          fixes: { html: "<div aria-label='test'/>" },
        },
      }),
    } as Response);
  });

  afterEach(() => {
    cleanup();
  });

  it("does not render when closed", () => {
    render(<BatchPRModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  it("displays not connected message when GitHub not connected", async () => {
    const hooks = await import("../../../hooks/useGitHub");
    vi.mocked(hooks.useGitHub).mockReturnValue({
      connection: { connected: false },
      isLoading: false,
      error: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      checkConnection: vi.fn(),
      getRepos: mockGetRepos,
      getBranches: mockGetBranches,
      createPR: mockCreatePR,
      searchCode: mockSearchCode,
      getRepoTree: mockGetRepoTree,
      getFileContent: mockGetFileContent,
    });

    render(<BatchPRModal {...defaultProps} />);

    expect(screen.getByText("GitHub Not Connected")).toBeInTheDocument();
  });

  it("starts on fixes step", () => {
    render(<BatchPRModal {...defaultProps} />);
    expect(screen.getByTestId("modal-title")).toHaveTextContent("Generate Fixes (2 issues)");
    expect(screen.getByTestId("fix-generation-list")).toBeInTheDocument();
  });

  it("displays all findings in fix generation list", () => {
    render(<BatchPRModal {...defaultProps} />);
    expect(screen.getByText("Rule 1")).toBeInTheDocument();
    expect(screen.getByText("Rule 2")).toBeInTheDocument();
  });

  it("generates fix for single finding", async () => {
    render(<BatchPRModal {...defaultProps} />);

    const generateBtn = screen.getByTestId("generate-0");
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/fixes/generate",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });
  });

  it("displays fix after generation", async () => {
    render(<BatchPRModal {...defaultProps} />);

    const generateBtn = screen.getByTestId("generate-0");
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByTestId("fix-0")).toBeInTheDocument();
    });
  });

  it("handles generate all fixes", async () => {
    render(<BatchPRModal {...defaultProps} />);

    const generateAllBtn = screen.getByTestId("generate-all");
    fireEvent.click(generateAllBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it("continues to repo selection step", async () => {
    render(<BatchPRModal {...defaultProps} />);

    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByTestId("modal-title")).toHaveTextContent("Select Repository");
      expect(screen.getByTestId("repo-selector")).toBeInTheDocument();
    });
  });

  it("loads repos when reaching repo step", async () => {
    render(<BatchPRModal {...defaultProps} />);

    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(mockGetRepos).toHaveBeenCalled();
    });
  });

  it("displays repos in selector", async () => {
    render(<BatchPRModal {...defaultProps} />);

    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByTestId("repo-test-repo")).toBeInTheDocument();
    });
  });

  it("selects repo and moves to files step", async () => {
    render(<BatchPRModal {...defaultProps} />);

    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByTestId("repo-test-repo")).toBeInTheDocument();
    });

    const repoBtn = screen.getByTestId("repo-test-repo");
    fireEvent.click(repoBtn);

    await waitFor(() => {
      expect(screen.getByTestId("modal-title")).toHaveTextContent("Configure Files & PR");
      expect(screen.getByTestId("file-path-mapper")).toBeInTheDocument();
    });
  });

  it("loads branches when repo selected", async () => {
    render(<BatchPRModal {...defaultProps} />);

    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByTestId("repo-test-repo")).toBeInTheDocument();
    });

    const repoBtn = screen.getByTestId("repo-test-repo");
    fireEvent.click(repoBtn);

    await waitFor(() => {
      expect(mockGetBranches).toHaveBeenCalledWith("owner", "test-repo");
    });
  });

  it("allows entering file paths", async () => {
    render(<BatchPRModal {...defaultProps} />);

    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByTestId("repo-test-repo")).toBeInTheDocument();
    });

    const repoBtn = screen.getByTestId("repo-test-repo");
    fireEvent.click(repoBtn);

    await waitFor(() => {
      expect(screen.getByTestId("file-path-0")).toBeInTheDocument();
    });

    const fileInput = screen.getByTestId("file-path-0");
    fireEvent.change(fileInput, { target: { value: "src/component.tsx" } });
    expect(fileInput).toHaveValue("src/component.tsx");
  });

  it("creates PR with fixes", async () => {
    render(<BatchPRModal {...defaultProps} />);

    // Generate fixes
    const generateAllBtn = screen.getByTestId("generate-all");
    fireEvent.click(generateAllBtn);

    await waitFor(() => {
      expect(screen.getByTestId("fix-0")).toBeInTheDocument();
    });

    // Continue to repo
    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    // Select repo
    await waitFor(() => {
      expect(screen.getByTestId("repo-test-repo")).toBeInTheDocument();
    });

    const repoBtn = screen.getByTestId("repo-test-repo");
    fireEvent.click(repoBtn);

    // Enter file paths
    await waitFor(() => {
      expect(screen.getByTestId("file-path-0")).toBeInTheDocument();
    });

    const fileInput0 = screen.getByTestId("file-path-0");
    const fileInput1 = screen.getByTestId("file-path-1");
    fireEvent.change(fileInput0, { target: { value: "src/file1.tsx" } });
    fireEvent.change(fileInput1, { target: { value: "src/file2.tsx" } });

    // Submit
    const submitBtn = screen.getByTestId("submit");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreatePR).toHaveBeenCalled();
    });
  });

  it("tracks PR after creation", async () => {
    render(<BatchPRModal {...defaultProps} />);

    // Generate fixes
    const generateAllBtn = screen.getByTestId("generate-all");
    fireEvent.click(generateAllBtn);

    await waitFor(() => {
      expect(screen.getByTestId("fix-0")).toBeInTheDocument();
    });

    // Continue to repo
    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    // Select repo
    await waitFor(() => {
      expect(screen.getByTestId("repo-test-repo")).toBeInTheDocument();
    });

    const repoBtn = screen.getByTestId("repo-test-repo");
    fireEvent.click(repoBtn);

    // Enter file paths
    await waitFor(() => {
      expect(screen.getByTestId("file-path-0")).toBeInTheDocument();
    });

    const fileInput0 = screen.getByTestId("file-path-0");
    const fileInput1 = screen.getByTestId("file-path-1");
    fireEvent.change(fileInput0, { target: { value: "src/file1.tsx" } });
    fireEvent.change(fileInput1, { target: { value: "src/file2.tsx" } });

    // Submit
    const submitBtn = screen.getByTestId("submit");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockTrackPR).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          prUrl: "https://github.com/owner/test-repo/pull/1",
          prNumber: 1,
        }),
        "owner",
        "test-repo",
        ["f1", "f2"],
        expect.objectContaining({
          scanUrl: "https://test.com",
          scanStandard: "WCAG2AA",
          scanViewport: "desktop",
        })
      );
    });
  });

  it("displays success view after PR created", async () => {
    render(<BatchPRModal {...defaultProps} />);

    // Generate fixes
    const generateAllBtn = screen.getByTestId("generate-all");
    fireEvent.click(generateAllBtn);

    await waitFor(() => {
      expect(screen.getByTestId("fix-0")).toBeInTheDocument();
    });

    // Continue to repo
    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    // Select repo
    await waitFor(() => {
      expect(screen.getByTestId("repo-test-repo")).toBeInTheDocument();
    });

    const repoBtn = screen.getByTestId("repo-test-repo");
    fireEvent.click(repoBtn);

    // Enter file paths
    await waitFor(() => {
      expect(screen.getByTestId("file-path-0")).toBeInTheDocument();
    });

    const fileInput0 = screen.getByTestId("file-path-0");
    fireEvent.change(fileInput0, { target: { value: "src/file1.tsx" } });

    // Submit
    const submitBtn = screen.getByTestId("submit");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("pr-success-view")).toBeInTheDocument();
      expect(screen.getByText(/PR #1 created!/)).toBeInTheDocument();
    });
  });

  it("allows going back from repo to fixes", async () => {
    render(<BatchPRModal {...defaultProps} />);

    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByTestId("repo-selector")).toBeInTheDocument();
    });

    const backButtons = screen.getAllByTestId("back");
    fireEvent.click(backButtons[0]);

    expect(screen.getByTestId("fix-generation-list")).toBeInTheDocument();
  });

  it("allows going back from files to repo", async () => {
    render(<BatchPRModal {...defaultProps} />);

    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByTestId("repo-test-repo")).toBeInTheDocument();
    });

    const repoBtn = screen.getByTestId("repo-test-repo");
    fireEvent.click(repoBtn);

    await waitFor(() => {
      expect(screen.getByTestId("file-path-mapper")).toBeInTheDocument();
    });

    const backButtons = screen.getAllByTestId("back");
    fireEvent.click(backButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("modal-title")).toHaveTextContent("Select Repository");
    });
  });

  it("closes modal and resets state", () => {
    const onClose = vi.fn();
    render(<BatchPRModal {...defaultProps} onClose={onClose} />);

    const cancelBtn = screen.getByTestId("cancel");
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it("handles fix generation error", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: "Generation failed" }),
    } as Response);

    render(<BatchPRModal {...defaultProps} />);

    const generateBtn = screen.getByTestId("generate-0");
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  // Test for line 106: throw new Error("No fix generated") - when response.ok and success but no fix
  it("handles missing fix in successful response", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        // No fix property - this triggers line 106
      }),
    } as Response);

    render(<BatchPRModal {...defaultProps} />);

    const generateBtn = screen.getByTestId("generate-0");
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[BatchPRModal] Failed to generate fix:",
        "No fix generated"
      );
    });

    consoleErrorSpy.mockRestore();
  });

  // Test for lines 146-148: loadRepos catch block
  it("handles loadRepos error with console.error and setError", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetRepos.mockRejectedValueOnce(new Error("Network error"));

    render(<BatchPRModal {...defaultProps} />);

    // Move to repo step to trigger loadRepos
    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[BatchPRModal] Failed to load repos:",
        "Network error"
      );
    });

    consoleErrorSpy.mockRestore();
  });

  // Test for lines 166-168: loadBranches catch block
  it("handles loadBranches error with console.error and setError", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetBranches.mockRejectedValueOnce(new Error("Branch fetch failed"));

    render(<BatchPRModal {...defaultProps} />);

    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByTestId("repo-test-repo")).toBeInTheDocument();
    });

    const repoBtn = screen.getByTestId("repo-test-repo");
    fireEvent.click(repoBtn);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[BatchPRModal] Failed to load branches:",
        "Branch fetch failed"
      );
    });

    consoleErrorSpy.mockRestore();
  });

  // Test for line 204: handleRemoveFinding
  it("removes a finding from the list", async () => {
    render(<BatchPRModal {...defaultProps} />);

    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByTestId("repo-test-repo")).toBeInTheDocument();
    });

    const repoBtn = screen.getByTestId("repo-test-repo");
    fireEvent.click(repoBtn);

    await waitFor(() => {
      expect(screen.getByTestId("file-path-mapper")).toBeInTheDocument();
      expect(screen.getByTestId("remove-0")).toBeInTheDocument();
      expect(screen.getByTestId("remove-1")).toBeInTheDocument();
    });

    // Remove the first finding
    const removeBtn = screen.getByTestId("remove-0");
    fireEvent.click(removeBtn);

    await waitFor(() => {
      // Now there should only be one finding left
      expect(screen.queryByTestId("remove-1")).not.toBeInTheDocument();
    });
  });

  // Test for lines 209-210: validation error when selectedBranch is empty
  it("shows validation error when selectedBranch is empty", async () => {
    // Mock a repo that has empty default_branch
    const reposWithEmptyBranch: GitHubRepo[] = [
      {
        id: 3,
        name: "empty-branch-repo",
        full_name: "owner/empty-branch-repo",
        owner: {
          login: "owner",
          avatar_url: "https://avatar.url",
        },
        private: false,
        default_branch: "", // Empty default branch - this makes selectedBranch stay empty
        html_url: "https://github.com/owner/empty-branch-repo",
      },
    ];
    mockGetRepos.mockResolvedValueOnce(reposWithEmptyBranch);
    mockGetBranches.mockResolvedValueOnce([]); // No branches available

    render(<BatchPRModal {...defaultProps} />);

    // Generate fixes first (need fixes to proceed)
    const generateAllBtn = screen.getByTestId("generate-all");
    fireEvent.click(generateAllBtn);

    await waitFor(() => {
      expect(screen.getByTestId("fix-0")).toBeInTheDocument();
    });

    // Move to repo selection
    fireEvent.click(screen.getByTestId("continue"));

    await waitFor(() => {
      expect(screen.getByTestId("repo-empty-branch-repo")).toBeInTheDocument();
    });

    // Select the repo with empty default_branch
    const repoBtn = screen.getByTestId("repo-empty-branch-repo");
    fireEvent.click(repoBtn);

    await waitFor(() => {
      expect(screen.getByTestId("file-path-mapper")).toBeInTheDocument();
    });

    // Add a file path
    const fileInput = screen.getByTestId("file-path-0");
    fireEvent.change(fileInput, { target: { value: "src/file.tsx" } });

    // Submit (selectedBranch is empty string from empty default_branch)
    const submitBtn = screen.getByTestId("submit");
    fireEvent.click(submitBtn);

    // createPR should not be called because validation fails (selectedBranch is empty)
    await waitFor(() => {
      expect(mockCreatePR).not.toHaveBeenCalled();
    });
  });

  // Test for lines 218-219: validation error when no file paths provided
  it("shows error when submitting without file paths", async () => {
    render(<BatchPRModal {...defaultProps} />);

    // Generate fixes first
    const generateAllBtn = screen.getByTestId("generate-all");
    fireEvent.click(generateAllBtn);

    await waitFor(() => {
      expect(screen.getByTestId("fix-0")).toBeInTheDocument();
    });

    // Continue to repo
    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    // Select repo
    await waitFor(() => {
      expect(screen.getByTestId("repo-test-repo")).toBeInTheDocument();
    });

    const repoBtn = screen.getByTestId("repo-test-repo");
    fireEvent.click(repoBtn);

    await waitFor(() => {
      expect(screen.getByTestId("file-path-mapper")).toBeInTheDocument();
    });

    // Don't enter any file paths - just submit
    const submitBtn = screen.getByTestId("submit");
    fireEvent.click(submitBtn);

    // createPR should not be called because validation fails
    await waitFor(() => {
      expect(mockCreatePR).not.toHaveBeenCalled();
    });
  });

  // Test for lines 265-267: handleCreatePR catch block
  it("handles createPR exception and shows error", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreatePR.mockRejectedValueOnce(new Error("Network failure"));

    render(<BatchPRModal {...defaultProps} />);

    // Generate fixes
    const generateAllBtn = screen.getByTestId("generate-all");
    fireEvent.click(generateAllBtn);

    await waitFor(() => {
      expect(screen.getByTestId("fix-0")).toBeInTheDocument();
    });

    // Continue to repo
    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    // Select repo
    await waitFor(() => {
      expect(screen.getByTestId("repo-test-repo")).toBeInTheDocument();
    });

    const repoBtn = screen.getByTestId("repo-test-repo");
    fireEvent.click(repoBtn);

    // Enter file paths
    await waitFor(() => {
      expect(screen.getByTestId("file-path-0")).toBeInTheDocument();
    });

    const fileInput0 = screen.getByTestId("file-path-0");
    fireEvent.change(fileInput0, { target: { value: "src/file1.tsx" } });

    // Submit
    const submitBtn = screen.getByTestId("submit");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[BatchPRModal] Failed to create PR:",
        "Network failure"
      );
    });

    consoleErrorSpy.mockRestore();
  });

  // Test for line 361: onChangeRepo callback
  it("allows changing repo from file step", async () => {
    render(<BatchPRModal {...defaultProps} />);

    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByTestId("repo-test-repo")).toBeInTheDocument();
    });

    const repoBtn = screen.getByTestId("repo-test-repo");
    fireEvent.click(repoBtn);

    await waitFor(() => {
      expect(screen.getByTestId("file-path-mapper")).toBeInTheDocument();
    });

    // Click the change repo button
    const changeRepoBtn = screen.getByTestId("change-repo");
    fireEvent.click(changeRepoBtn);

    // Should go back to repo selection
    await waitFor(() => {
      expect(screen.getByTestId("modal-title")).toHaveTextContent("Select Repository");
    });
  });

  it("handles PR creation error", async () => {
    mockCreatePR.mockResolvedValue({
      success: false,
      error: "Failed to create PR",
    });

    render(<BatchPRModal {...defaultProps} />);

    // Generate fixes
    const generateAllBtn = screen.getByTestId("generate-all");
    fireEvent.click(generateAllBtn);

    await waitFor(() => {
      expect(screen.getByTestId("fix-0")).toBeInTheDocument();
    });

    // Continue to repo
    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    // Select repo
    await waitFor(() => {
      expect(screen.getByTestId("repo-test-repo")).toBeInTheDocument();
    });

    const repoBtn = screen.getByTestId("repo-test-repo");
    fireEvent.click(repoBtn);

    // Enter file paths
    await waitFor(() => {
      expect(screen.getByTestId("file-path-0")).toBeInTheDocument();
    });

    const fileInput0 = screen.getByTestId("file-path-0");
    fireEvent.change(fileInput0, { target: { value: "src/file1.tsx" } });

    // Submit
    const submitBtn = screen.getByTestId("submit");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreatePR).toHaveBeenCalled();
    });
  });

  it("initializes findings with fix state on open", () => {
    const { rerender } = render(<BatchPRModal {...defaultProps} isOpen={false} />);

    rerender(<BatchPRModal {...defaultProps} isOpen={true} />);

    expect(screen.getByTestId("finding-item-0")).toBeInTheDocument();
    expect(screen.getByTestId("finding-item-1")).toBeInTheDocument();
  });

  it("uses generated description if custom description not provided", async () => {
    render(<BatchPRModal {...defaultProps} />);

    // Generate fixes
    const generateAllBtn = screen.getByTestId("generate-all");
    fireEvent.click(generateAllBtn);

    await waitFor(() => {
      expect(screen.getByTestId("fix-0")).toBeInTheDocument();
    });

    // Continue to repo
    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    // Select repo
    await waitFor(() => {
      expect(screen.getByTestId("repo-test-repo")).toBeInTheDocument();
    });

    const repoBtn = screen.getByTestId("repo-test-repo");
    fireEvent.click(repoBtn);

    // Enter file paths
    await waitFor(() => {
      expect(screen.getByTestId("file-path-0")).toBeInTheDocument();
    });

    const fileInput0 = screen.getByTestId("file-path-0");
    fireEvent.change(fileInput0, { target: { value: "src/file1.tsx" } });

    // Submit
    const submitBtn = screen.getByTestId("submit");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreatePR).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        "Generated batch description",
        expect.anything()
      );
    });
  });


  // Test for line 102: throw new Error with HTTP status when data.error is falsy
  it("throws error with HTTP status when response not ok and no data.error", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({
        success: false,
        // No error property - will use HTTP status fallback
      }),
    } as Response);

    render(<BatchPRModal {...defaultProps} />);

    const generateBtn = screen.getByTestId("generate-0");
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[BatchPRModal] Failed to generate fix:",
        "HTTP 503"
      );
    });

    consoleErrorSpy.mockRestore();
  });

  // Test for line 115: non-Error exception in generateFix catch block
  it("handles non-Error exception in generateFix with Unknown error message", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(global.fetch).mockRejectedValueOnce("String error"); // Not an Error instance

    render(<BatchPRModal {...defaultProps} />);

    const generateBtn = screen.getByTestId("generate-0");
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[BatchPRModal] Failed to generate fix:",
        "Unknown error"
      );
    });

    consoleErrorSpy.mockRestore();
  });

  // Test for line 146: non-Error exception in loadRepos catch block
  it("handles non-Error exception in loadRepos with Unknown error message", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetRepos.mockRejectedValueOnce("String error"); // Not an Error instance

    render(<BatchPRModal {...defaultProps} />);

    // Move to repo step to trigger loadRepos
    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[BatchPRModal] Failed to load repos:",
        "Unknown error"
      );
    });

    consoleErrorSpy.mockRestore();
  });

  // Test for line 166: non-Error exception in loadBranches catch block
  it("handles non-Error exception in loadBranches with Unknown error message", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetBranches.mockRejectedValueOnce("String error"); // Not an Error instance

    render(<BatchPRModal {...defaultProps} />);

    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByTestId("repo-test-repo")).toBeInTheDocument();
    });

    const repoBtn = screen.getByTestId("repo-test-repo");
    fireEvent.click(repoBtn);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[BatchPRModal] Failed to load branches:",
        "Unknown error"
      );
    });

    consoleErrorSpy.mockRestore();
  });

  // Test for lines 261-262: PR creation failure with result.error
  it("shows error from result.error when PR creation fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreatePR.mockResolvedValueOnce({
      success: false,
      error: "Custom PR creation error",
    });

    render(<BatchPRModal {...defaultProps} />);

    // Generate fixes
    const generateAllBtn = screen.getByTestId("generate-all");
    fireEvent.click(generateAllBtn);

    await waitFor(() => {
      expect(screen.getByTestId("fix-0")).toBeInTheDocument();
    });

    // Continue to repo
    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    // Select repo
    await waitFor(() => {
      expect(screen.getByTestId("repo-test-repo")).toBeInTheDocument();
    });

    const repoBtn = screen.getByTestId("repo-test-repo");
    fireEvent.click(repoBtn);

    // Enter file paths
    await waitFor(() => {
      expect(screen.getByTestId("file-path-0")).toBeInTheDocument();
    });

    const fileInput0 = screen.getByTestId("file-path-0");
    fireEvent.change(fileInput0, { target: { value: "src/file1.tsx" } });

    // Submit
    const submitBtn = screen.getByTestId("submit");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[BatchPRModal] PR creation failed:",
        "Custom PR creation error"
      );
    });

    consoleErrorSpy.mockRestore();
  });

  // Test for line 262: PR creation failure without result.error (fallback message)
  it("shows fallback error when PR creation fails without error message", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreatePR.mockResolvedValueOnce({
      success: false,
      // No error property - will use fallback "Failed to create PR"
    });

    render(<BatchPRModal {...defaultProps} />);

    // Generate fixes
    const generateAllBtn = screen.getByTestId("generate-all");
    fireEvent.click(generateAllBtn);

    await waitFor(() => {
      expect(screen.getByTestId("fix-0")).toBeInTheDocument();
    });

    // Continue to repo
    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    // Select repo
    await waitFor(() => {
      expect(screen.getByTestId("repo-test-repo")).toBeInTheDocument();
    });

    const repoBtn = screen.getByTestId("repo-test-repo");
    fireEvent.click(repoBtn);

    // Enter file paths
    await waitFor(() => {
      expect(screen.getByTestId("file-path-0")).toBeInTheDocument();
    });

    const fileInput0 = screen.getByTestId("file-path-0");
    fireEvent.change(fileInput0, { target: { value: "src/file1.tsx" } });

    // Submit
    const submitBtn = screen.getByTestId("submit");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[BatchPRModal] PR creation failed:",
        undefined
      );
    });

    consoleErrorSpy.mockRestore();
  });

  // Test for line 265: non-Error exception in handleCreatePR catch block
  it("handles non-Error exception in handleCreatePR with Unknown error message", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreatePR.mockRejectedValueOnce("String error"); // Not an Error instance

    render(<BatchPRModal {...defaultProps} />);

    // Generate fixes
    const generateAllBtn = screen.getByTestId("generate-all");
    fireEvent.click(generateAllBtn);

    await waitFor(() => {
      expect(screen.getByTestId("fix-0")).toBeInTheDocument();
    });

    // Continue to repo
    const continueBtn = screen.getByTestId("continue");
    fireEvent.click(continueBtn);

    // Select repo
    await waitFor(() => {
      expect(screen.getByTestId("repo-test-repo")).toBeInTheDocument();
    });

    const repoBtn = screen.getByTestId("repo-test-repo");
    fireEvent.click(repoBtn);

    // Enter file paths
    await waitFor(() => {
      expect(screen.getByTestId("file-path-0")).toBeInTheDocument();
    });

    const fileInput0 = screen.getByTestId("file-path-0");
    fireEvent.change(fileInput0, { target: { value: "src/file1.tsx" } });

    // Submit
    const submitBtn = screen.getByTestId("submit");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[BatchPRModal] Failed to create PR:",
        "Unknown error"
      );
    });

    consoleErrorSpy.mockRestore();
  });
});
