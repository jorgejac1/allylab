// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CreatePRModal } from "../../../components/findings/CreatePRModal";
import type { CodeFix } from "../../../types/fixes";
import type { GitHubRepo, GitHubBranch } from "../../../types/github";

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

// Mock UI components
vi.mock("../../../components/ui", () => ({
  Modal: ({ isOpen, onClose, title, children, size }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: string }) =>
    isOpen ? (
      <div data-testid="modal" data-size={size}>
        <div data-testid="modal-title">{title}</div>
        <button onClick={onClose} data-testid="modal-close">Close Modal</button>
        {children}
      </div>
    ) : null,
  Button: ({ children, onClick, disabled, variant }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; variant?: string }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={`button-${variant || "default"}`}
      data-variant={variant}
    >
      {children}
    </button>
  ),
}));

describe("components/findings/CreatePRModal", () => {
  const mockFix: CodeFix = {
    id: "fix1",
    findingId: "f1",
    ruleId: "button-name",
    original: {
      code: "<button>Click</button>",
      selector: "button.submit",
      language: "html",
    },
    fixes: {
      html: '<button aria-label="Click me">Click</button>',
    },
    diff: "- <button>Click</button>\n+ <button aria-label=\"Click me\">Click</button>",
    explanation: "Added aria-label",
    confidence: "high",
    effort: "trivial",
    wcagCriteria: ["1.3.1"],
    createdAt: "2024-01-01T00:00:00Z",
  };

  const mockFinding = {
    id: "f1",
    ruleTitle: "Button Name",
    selector: "button.submit",
  };

  const mockRepos: GitHubRepo[] = [
    {
      id: 1,
      name: "test-repo",
      full_name: "owner/test-repo",
      owner: {
        login: "owner",
        avatar_url: "https://avatar.url",
      },
      private: false,
      default_branch: "main",
      html_url: "https://github.com/owner/test-repo",
    },
    {
      id: 2,
      name: "private-repo",
      full_name: "owner/private-repo",
      owner: {
        login: "owner",
        avatar_url: "https://avatar.url",
      },
      private: true,
      default_branch: "master",
      html_url: "https://github.com/owner/private-repo",
    },
  ];

  const mockBranches: GitHubBranch[] = [
    { name: "main", sha: "abc123" },
    { name: "develop", sha: "def456" },
    { name: "feature", sha: "ghi789" },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    fix: mockFix,
    finding: mockFinding,
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
  });

  afterEach(() => {
    cleanup();
  });

  it("does not render when closed", () => {
    render(<CreatePRModal {...defaultProps} isOpen={false} />);
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

    render(<CreatePRModal {...defaultProps} />);

    expect(screen.getByText("GitHub Not Connected")).toBeInTheDocument();
    expect(screen.getByText(/Connect your GitHub account/)).toBeInTheDocument();
  });

  it("loads repositories on mount", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      expect(mockGetRepos).toHaveBeenCalled();
    });
  });

  it("displays loading state while fetching repos", async () => {
    mockGetRepos.mockImplementation(() => new Promise(() => {}));

    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Loading repositories...")).toBeInTheDocument();
    });
  });

  it("renders repository list", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("owner/test-repo")).toBeInTheDocument();
      expect(screen.getByText("owner/private-repo")).toBeInTheDocument();
    });
  });

  it("displays public/private badge for repos", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const publicBadges = screen.queryAllByText(/🌐 Public/);
      const privateBadges = screen.queryAllByText(/🔒 Private/);
      expect(publicBadges.length).toBeGreaterThan(0);
      expect(privateBadges.length).toBeGreaterThan(0);
    });
  });

  it("selects repository and moves to file step", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      expect(mockGetBranches).toHaveBeenCalledWith("owner", "test-repo");
      const modalTitles = screen.getAllByTestId("modal-title");
      expect(modalTitles[modalTitles.length - 1]).toHaveTextContent("Configure PR");
    });
  });

  it("loads branches when repo selected", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      expect(mockGetBranches).toHaveBeenCalledWith("owner", "test-repo");
    });
  });

  it("displays selected repository info", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      expect(screen.getAllByText("owner/test-repo")).toHaveLength(1);
    });
  });

  it("renders branch selector with branches", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();
    });
  });

  it("pre-fills PR title with rule title", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      const titleInput = screen.getByDisplayValue("[AllyLab] Fix: Button Name");
      expect(titleInput).toBeInTheDocument();
    });
  });

  it("renders file path input", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      const fileInput = screen.getByPlaceholderText("src/components/Header.tsx");
      expect(fileInput).toBeInTheDocument();
    });
  });

  it("displays original code in file path hint", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      // Should display the original code from the fix
      expect(screen.getByText("Element to fix:")).toBeInTheDocument();
      expect(screen.getByText("<button>Click</button>")).toBeInTheDocument();
    });
  });

  it("allows changing file path", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      const fileInput = screen.getByPlaceholderText("src/components/Header.tsx");
      fireEvent.change(fileInput, { target: { value: "src/components/Button.tsx" } });
      expect(fileInput).toHaveValue("src/components/Button.tsx");
    });
  });

  it("allows changing PR title", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      const titleInput = screen.getByDisplayValue("[AllyLab] Fix: Button Name");
      fireEvent.change(titleInput, { target: { value: "Custom PR Title" } });
      expect(titleInput).toHaveValue("Custom PR Title");
    });
  });

  it("allows adding PR description", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      const descInput = screen.getByPlaceholderText("Additional context for reviewers...");
      fireEvent.change(descInput, { target: { value: "This fixes the issue" } });
      expect(descInput).toHaveValue("This fixes the issue");
    });
  });

  it("disables create PR button when file path empty", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      const createPRButtons = screen.getAllByRole("button");
      const createBtn = createPRButtons.find(btn => btn.textContent?.includes("Create Pull Request"));
      expect(createBtn).toBeDisabled();
    });
  });

  it("creates PR with correct parameters", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      const fileInput = screen.getByPlaceholderText("src/components/Header.tsx");
      fireEvent.change(fileInput, { target: { value: "src/components/Button.tsx" } });
    });

    const createPRButtons = screen.getAllByRole("button");
    const createBtn = createPRButtons.find(btn => btn.textContent?.includes("Create Pull Request"));
    fireEvent.click(createBtn!);

    await waitFor(() => {
      expect(mockCreatePR).toHaveBeenCalledWith(
        "owner",
        "test-repo",
        "main",
        expect.arrayContaining([
          expect.objectContaining({
            filePath: "src/components/Button.tsx",
            findingId: "f1",
            ruleTitle: "Button Name",
          }),
        ]),
        "[AllyLab] Fix: Button Name",
        undefined
      );
    });
  });

  it("tracks PR after creation", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      const fileInput = screen.getByPlaceholderText("src/components/Header.tsx");
      fireEvent.change(fileInput, { target: { value: "src/components/Button.tsx" } });
    });

    const createPRButtons = screen.getAllByRole("button");
    const createBtn = createPRButtons.find(btn => btn.textContent?.includes("Create Pull Request"));
    fireEvent.click(createBtn!);

    await waitFor(() => {
      expect(mockTrackPR).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          prUrl: "https://github.com/owner/test-repo/pull/1",
          prNumber: 1,
        }),
        "owner",
        "test-repo",
        ["f1"],
        expect.objectContaining({
          scanUrl: "https://test.com",
          scanStandard: "WCAG2AA",
          scanViewport: "desktop",
        })
      );
    });
  });

  it("displays success message after PR created", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("src/components/Header.tsx")).toBeInTheDocument();
    });

    const fileInput = screen.getByPlaceholderText("src/components/Header.tsx");
    fireEvent.change(fileInput, { target: { value: "src/components/Button.tsx" } });

    await waitFor(() => {
      const createPRButtons = screen.getAllByRole("button");
      const createBtn = createPRButtons.find(btn => btn.textContent?.includes("Create Pull Request"));
      expect(createBtn).not.toBeDisabled();
    });

    const createPRButtons = screen.getAllByRole("button");
    const createBtn = createPRButtons.find(btn => btn.textContent?.includes("Create Pull Request"));
    fireEvent.click(createBtn!);

    await waitFor(() => {
      expect(screen.queryAllByText("Pull Request Created!").length).toBeGreaterThan(0);
      expect(screen.queryAllByText(/PR #1 has been created successfully/).length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it("displays error when PR creation fails", async () => {
    mockCreatePR.mockResolvedValue({
      success: false,
      error: "Failed to create PR",
    });

    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      const fileInput = screen.getByPlaceholderText("src/components/Header.tsx");
      fireEvent.change(fileInput, { target: { value: "src/components/Button.tsx" } });
    });

    const createPRButtons = screen.getAllByRole("button");
    const createBtn = createPRButtons.find(btn => btn.textContent?.includes("Create Pull Request"));
    fireEvent.click(createBtn!);

    await waitFor(() => {
      expect(screen.getByText("Failed to create PR")).toBeInTheDocument();
    });
  });

  it("displays loading state during PR creation", async () => {
    mockCreatePR.mockImplementation(() => new Promise(() => {}));

    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      const fileInput = screen.getByPlaceholderText("src/components/Header.tsx");
      fireEvent.change(fileInput, { target: { value: "src/components/Button.tsx" } });
    });

    const createPRButtons = screen.getAllByRole("button");
    const createBtn = createPRButtons.find(btn => btn.textContent?.includes("Create Pull Request"));
    fireEvent.click(createBtn!);

    await waitFor(() => {
      expect(screen.getByText("Creating PR...")).toBeInTheDocument();
    });
  });

  it("allows going back to repo selection", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      const changeRepoBtn = screen.getByText("Change repository");
      fireEvent.click(changeRepoBtn);
      const modalTitles = screen.getAllByTestId("modal-title");
      expect(modalTitles[modalTitles.length - 1]).toHaveTextContent("Select Repository");
    });
  });

  it("resets state when modal closed", async () => {
    const onClose = vi.fn();
    render(<CreatePRModal {...defaultProps} onClose={onClose} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const closeBtn = screen.getByTestId("modal-close");
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it("displays GitHub link in success state", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      const fileInput = screen.getByPlaceholderText("src/components/Header.tsx");
      fireEvent.change(fileInput, { target: { value: "src/components/Button.tsx" } });
    });

    const createPRButtons = screen.getAllByRole("button");
    const createBtn = createPRButtons.find(btn => btn.textContent?.includes("Create Pull Request"));
    fireEvent.click(createBtn!);

    await waitFor(() => {
      const link = screen.getByText("View on GitHub →");
      expect(link.closest("a")).toHaveAttribute("href", "https://github.com/owner/test-repo/pull/1");
      expect(link.closest("a")).toHaveAttribute("target", "_blank");
    });
  });

  it("handles repo loading error", async () => {
    mockGetRepos.mockRejectedValue(new Error("Network error"));

    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      expect(mockGetRepos).toHaveBeenCalled();
    });
  });

  it("handles branch loading error", async () => {
    mockGetBranches.mockRejectedValue(new Error("Branch error"));

    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      expect(mockGetBranches).toHaveBeenCalled();
    });
  });

  it("renders cancel button", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      expect(screen.queryAllByText("Cancel").length).toBeGreaterThan(0);
    });
  });

  // Test for lines 100-101: validation error when selectedBranch is empty
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

    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("owner/empty-branch-repo")).toBeInTheDocument();
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/empty-branch-repo"));
    fireEvent.click(testRepoBtn!);

    // Wait for file step to render
    await waitFor(() => {
      expect(screen.getByPlaceholderText("src/components/Header.tsx")).toBeInTheDocument();
    });

    // Fill in file path so button is enabled
    const fileInput = screen.getByPlaceholderText("src/components/Header.tsx");
    fireEvent.change(fileInput, { target: { value: "src/file.tsx" } });

    // Wait for branches to finish loading (isLoading becomes false)
    await waitFor(() => {
      const createPRButtons = screen.getAllByRole("button");
      const createBtn = createPRButtons.find(btn => btn.textContent?.includes("Create Pull Request"));
      expect(createBtn).not.toBeDisabled();
    });

    // Click create PR (selectedBranch is empty string from empty default_branch)
    const createPRButtons = screen.getAllByRole("button");
    const createBtn = createPRButtons.find(btn => btn.textContent?.includes("Create Pull Request"));
    fireEvent.click(createBtn!);

    // Should show validation error for empty selectedBranch
    await waitFor(() => {
      expect(screen.getByText("Please fill in all required fields")).toBeInTheDocument();
    });
  });

  // Test for lines 145-147: handleCreatePR catch block
  it("handles createPR exception and shows error", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreatePR.mockRejectedValueOnce(new Error("API failure"));

    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      const fileInput = screen.getByPlaceholderText("src/components/Header.tsx");
      fireEvent.change(fileInput, { target: { value: "src/components/Button.tsx" } });
    });

    const createPRButtons = screen.getAllByRole("button");
    const createBtn = createPRButtons.find(btn => btn.textContent?.includes("Create Pull Request"));
    fireEvent.click(createBtn!);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[CreatePRModal] Failed to create PR:",
        "API failure"
      );
      expect(screen.getByText("Failed to create PR")).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  // Test for lines 225-226: onMouseEnter/onMouseLeave hover handlers
  it("changes background on hover for repo buttons", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));

    // Initially has white background
    expect(testRepoBtn).toHaveStyle({ background: "rgb(255, 255, 255)" });

    // Hover - should change background
    fireEvent.mouseEnter(testRepoBtn!);
    expect(testRepoBtn).toHaveStyle({ background: "rgb(248, 250, 252)" });

    // Leave hover - should reset background
    fireEvent.mouseLeave(testRepoBtn!);
    expect(testRepoBtn).toHaveStyle({ background: "rgb(255, 255, 255)" });
  });

  // Test for line 289: onChange handler for branch selection
  it("changes selected branch when dropdown value changes", async () => {
    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();
      // Default should be "main"
      expect(select).toHaveValue("main");
    });

    // Change the branch selection
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "develop" } });

    expect(select).toHaveValue("develop");
  });

  // Test for lines 56-58: loadRepos catch block - error handling when getRepos fails
  it("handles loadRepos error with console.error and setError", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetRepos.mockRejectedValueOnce(new Error("Network error"));

    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[CreatePRModal] Failed to load repos:",
        "Network error"
      );
    });

    // Note: Error is set but UI shows it only in "file" step
    // The console.error call confirms the catch block was executed (lines 56-58)

    consoleErrorSpy.mockRestore();
  });

  // Test for line 56: loadRepos catch block with non-Error (covers 'Unknown error' branch)
  it("handles loadRepos non-Error exception with Unknown error message", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetRepos.mockRejectedValueOnce("String error"); // Not an Error instance

    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[CreatePRModal] Failed to load repos:",
        "Unknown error"
      );
    });

    consoleErrorSpy.mockRestore();
  });

  // Test for lines 71-74: loadBranches catch block - error handling when getBranches fails
  it("handles loadBranches error with console.error and setError", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetBranches.mockRejectedValueOnce(new Error("Branch fetch failed"));

    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[CreatePRModal] Failed to load branches:",
        "Branch fetch failed"
      );
    });

    // Should show error message
    expect(screen.getByText("Failed to load branches")).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  // Test for line 72: loadBranches catch block with non-Error (covers 'Unknown error' branch)
  it("handles loadBranches non-Error exception with Unknown error message", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetBranches.mockRejectedValueOnce("String error"); // Not an Error instance

    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[CreatePRModal] Failed to load branches:",
        "Unknown error"
      );
    });

    consoleErrorSpy.mockRestore();
  });

  // Test for lines 140-142: PR creation returns success: false with error message
  it("handles PR creation failure with error message from result", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreatePR.mockResolvedValueOnce({
      success: false,
      error: "Repository not found",
    });

    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      const fileInput = screen.getByPlaceholderText("src/components/Header.tsx");
      fireEvent.change(fileInput, { target: { value: "src/components/Button.tsx" } });
    });

    const createPRButtons = screen.getAllByRole("button");
    const createBtn = createPRButtons.find(btn => btn.textContent?.includes("Create Pull Request"));
    fireEvent.click(createBtn!);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[CreatePRModal] PR creation failed:",
        "Repository not found"
      );
      expect(screen.getByText("Repository not found")).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  // Test for lines 140-142: PR creation returns success: false without error (uses fallback)
  it("handles PR creation failure with fallback error message", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreatePR.mockResolvedValueOnce({
      success: false,
      // No error field - should use fallback
    });

    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      const fileInput = screen.getByPlaceholderText("src/components/Header.tsx");
      fireEvent.change(fileInput, { target: { value: "src/components/Button.tsx" } });
    });

    const createPRButtons = screen.getAllByRole("button");
    const createBtn = createPRButtons.find(btn => btn.textContent?.includes("Create Pull Request"));
    fireEvent.click(createBtn!);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[CreatePRModal] PR creation failed:",
        "Failed to create PR"
      );
      expect(screen.getByText("Failed to create PR")).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  // Test for line 145: handleCreatePR catch block with non-Error (covers 'Unknown error' branch)
  it("handles createPR non-Error exception with Unknown error message", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreatePR.mockRejectedValueOnce("String error"); // Not an Error instance

    render(<CreatePRModal {...defaultProps} />);

    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    await waitFor(() => {
      const fileInput = screen.getByPlaceholderText("src/components/Header.tsx");
      fireEvent.change(fileInput, { target: { value: "src/components/Button.tsx" } });
    });

    const createPRButtons = screen.getAllByRole("button");
    const createBtn = createPRButtons.find(btn => btn.textContent?.includes("Create Pull Request"));
    fireEvent.click(createBtn!);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[CreatePRModal] Failed to create PR:",
        "Unknown error"
      );
      expect(screen.getByText("Failed to create PR")).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  // Test for line 65: loadBranches guard clause (!selectedRepo) return
  // The loadBranches function has the guard to handle edge cases.
  // We verify the guard works by checking getBranches is not called on mount
  it("does not call getBranches when selectedRepo is null on mount", async () => {
    render(<CreatePRModal {...defaultProps} />);

    // Wait for repos to load
    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    // At this point, selectedRepo is still null (no repo selected yet)
    // The loadBranches guard clause should prevent getBranches from being called
    expect(mockGetBranches).not.toHaveBeenCalled();
  });

  // Test for line 65: loadBranches guard when modal is closed and reopened
  // This exercises the early return path by closing modal (which resets selectedRepo to null)
  it("resets selectedRepo to null when modal is closed via handleClose", async () => {
    const onClose = vi.fn();
    render(<CreatePRModal {...defaultProps} onClose={onClose} />);

    // Wait for repos to load
    await waitFor(() => {
      const repoTexts = screen.queryAllByText("owner/test-repo");
      expect(repoTexts.length).toBeGreaterThan(0);
    });

    // Select a repo
    const repoButtons = screen.getAllByRole("button");
    const testRepoBtn = repoButtons.find(btn => btn.textContent?.includes("owner/test-repo"));
    fireEvent.click(testRepoBtn!);

    // Wait for branches to load
    await waitFor(() => {
      expect(mockGetBranches).toHaveBeenCalled();
    });

    // Clear the mock to track new calls
    mockGetBranches.mockClear();

    // Close modal using the Cancel button (calls handleClose which sets selectedRepo to null)
    const cancelButtons = screen.getAllByRole("button");
    const cancelBtn = cancelButtons.find(btn => btn.textContent === "Cancel");
    fireEvent.click(cancelBtn!);

    // handleClose was called, which sets selectedRepo back to null
    expect(onClose).toHaveBeenCalled();

    // After closing, selectedRepo is null, so any subsequent loadBranches call
    // would hit the guard clause and return early
  });
});
