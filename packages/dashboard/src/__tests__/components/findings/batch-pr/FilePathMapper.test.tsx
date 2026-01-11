// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FilePathMapper } from "../../../../components/findings/batch-pr/FilePathMapper";
import type { FindingWithFix } from "../../../../types/batch-pr";
import type { TrackedFinding } from "../../../../types";
import type { GitHubRepo, GitHubBranch } from "../../../../types/github";

// Mock UI components
vi.mock("../../../../components/ui", () => ({
  Button: ({ children, onClick, variant, disabled }: { children: React.ReactNode; onClick?: () => void; variant?: string; disabled?: boolean }) => (
    <button onClick={onClick} data-variant={variant} disabled={disabled}>{children}</button>
  ),
}));

// Mock SeverityDot
vi.mock("../../../../components/findings/batch-pr/SeverityDot", () => ({
  SeverityDot: ({ severity }: { severity: string }) => <span data-testid={`severity-${severity}`}>●</span>,
}));

describe("batch-pr/FilePathMapper", () => {
  const makeFinding = (overrides: Partial<TrackedFinding> = {}): TrackedFinding => ({
    id: "f1",
    ruleId: "r1",
    ruleTitle: "Test Rule",
    description: "Test description",
    impact: "critical",
    selector: "div.test-selector",
    html: "<div/>",
    helpUrl: "https://test.com",
    wcagTags: ["wcag2a"],
    source: "axe-core",
    status: "new",
    firstSeen: "2024-01-01T00:00:00Z",
    fingerprint: "fp1",
    ...overrides,
  });

  const makeFindingWithFix = (overrides: Partial<FindingWithFix> = {}): FindingWithFix => ({
    finding: makeFinding(),
    fix: {
      id: "fix1",
      findingId: "f1",
      ruleId: "rule1",
      original: { code: "", selector: "", language: "html" },
      fixes: { html: "" },
      diff: "",
      explanation: "",
      confidence: "high",
      effort: "easy",
      wcagCriteria: [],
      createdAt: "2024-01-01T00:00:00Z",
    },
    filePath: "",
    isGenerating: false,
    error: null,
    ...overrides,
  });

  const mockRepo: GitHubRepo = {
    id: 1,
    name: "test-repo",
    full_name: "owner/test-repo",
    owner: { login: "owner", avatar_url: "https://avatar.url" },
    private: false,
    default_branch: "main",
    html_url: "https://github.com/owner/test-repo",
  };

  const mockBranches: GitHubBranch[] = [
    { name: "main", sha: "abc123" },
    { name: "develop", sha: "def456" },
  ];

  const defaultProps = {
    selectedRepo: mockRepo,
    branches: mockBranches,
    selectedBranch: "main",
    findings: [
      makeFindingWithFix({ finding: makeFinding({ id: "f1", ruleTitle: "Rule 1" }) }),
      makeFindingWithFix({ finding: makeFinding({ id: "f2", ruleTitle: "Rule 2" }) }),
    ],
    prTitle: "[AllyLab] Fix 2 accessibility issues",
    prDescription: "",
    isLoading: false,
    error: null,
    onBranchChange: vi.fn(),
    onFilePathChange: vi.fn(),
    onRemoveFinding: vi.fn(),
    onTitleChange: vi.fn(),
    onDescriptionChange: vi.fn(),
    onChangeRepo: vi.fn(),
    onBack: vi.fn(),
    onCancel: vi.fn(),
    onSubmit: vi.fn(),
  };

  // RepoHeader tests
  it("displays repo full name", () => {
    render(<FilePathMapper {...defaultProps} />);
    expect(screen.getByText("owner/test-repo")).toBeInTheDocument();
  });

  it("displays repo avatar", () => {
    const { container } = render(<FilePathMapper {...defaultProps} />);
    const avatar = container.querySelector("img");
    expect(avatar).toHaveAttribute("src", "https://avatar.url");
  });

  it("renders Change repository button", () => {
    render(<FilePathMapper {...defaultProps} />);
    expect(screen.getByText("Change repository")).toBeInTheDocument();
  });

  it("calls onChangeRepo when Change repository is clicked", () => {
    const onChangeRepo = vi.fn();
    render(<FilePathMapper {...defaultProps} onChangeRepo={onChangeRepo} />);
    fireEvent.click(screen.getByText("Change repository"));
    expect(onChangeRepo).toHaveBeenCalledTimes(1);
  });

  it("renders branch dropdown with correct options", () => {
    render(<FilePathMapper {...defaultProps} />);
    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("main");
    expect(screen.getByText("main")).toBeInTheDocument();
    expect(screen.getByText("develop")).toBeInTheDocument();
  });

  it("calls onBranchChange when branch selection changes", () => {
    const onBranchChange = vi.fn();
    render(<FilePathMapper {...defaultProps} onBranchChange={onBranchChange} />);
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "develop" } });
    expect(onBranchChange).toHaveBeenCalledWith("develop");
  });

  // FilePathList tests
  it("displays file paths mapping count", () => {
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1" }), filePath: "src/file1.tsx" }),
      makeFindingWithFix({ finding: makeFinding({ id: "f2" }), filePath: "" }),
    ];
    render(<FilePathMapper {...defaultProps} findings={findings} />);
    expect(screen.getByText(/File Paths \(1\/2 mapped\)/)).toBeInTheDocument();
  });

  it("renders file path inputs for fixed findings", () => {
    render(<FilePathMapper {...defaultProps} />);
    const inputs = screen.getAllByPlaceholderText("src/components/Example.tsx");
    expect(inputs).toHaveLength(2);
  });

  it("calls onFilePathChange with correct index when file path is changed", () => {
    const onFilePathChange = vi.fn();
    render(<FilePathMapper {...defaultProps} onFilePathChange={onFilePathChange} />);
    const inputs = screen.getAllByPlaceholderText("src/components/Example.tsx");
    fireEvent.change(inputs[0], { target: { value: "src/test.tsx" } });
    expect(onFilePathChange).toHaveBeenCalledWith(0, "src/test.tsx");
  });

  it("renders remove button for each finding", () => {
    render(<FilePathMapper {...defaultProps} />);
    const removeButtons = screen.getAllByTitle("Remove from PR");
    expect(removeButtons).toHaveLength(2);
  });

  it("calls onRemoveFinding with correct index when remove is clicked", () => {
    const onRemoveFinding = vi.fn();
    render(<FilePathMapper {...defaultProps} onRemoveFinding={onRemoveFinding} />);
    const removeButtons = screen.getAllByTitle("Remove from PR");
    fireEvent.click(removeButtons[1]);
    expect(onRemoveFinding).toHaveBeenCalledWith(1);
  });

  it("renders severity dots for fixed findings", () => {
    render(<FilePathMapper {...defaultProps} />);
    expect(screen.getAllByTestId("severity-critical")).toHaveLength(2);
  });

  // PRFormFields tests
  it("displays PR Title label and input", () => {
    render(<FilePathMapper {...defaultProps} />);
    expect(screen.getByText("PR Title")).toBeInTheDocument();
    expect(screen.getByDisplayValue("[AllyLab] Fix 2 accessibility issues")).toBeInTheDocument();
  });

  it("calls onTitleChange when PR title is changed", () => {
    const onTitleChange = vi.fn();
    render(<FilePathMapper {...defaultProps} onTitleChange={onTitleChange} />);
    const titleInput = screen.getByDisplayValue("[AllyLab] Fix 2 accessibility issues");
    fireEvent.change(titleInput, { target: { value: "New Title" } });
    expect(onTitleChange).toHaveBeenCalledWith("New Title");
  });

  it("displays Description label and textarea", () => {
    render(<FilePathMapper {...defaultProps} />);
    expect(screen.getByText("Description (optional)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Additional context for reviewers...")).toBeInTheDocument();
  });

  it("calls onDescriptionChange when description is changed", () => {
    const onDescriptionChange = vi.fn();
    render(<FilePathMapper {...defaultProps} onDescriptionChange={onDescriptionChange} />);
    const textarea = screen.getByPlaceholderText("Additional context for reviewers...");
    fireEvent.change(textarea, { target: { value: "New description" } });
    expect(onDescriptionChange).toHaveBeenCalledWith("New description");
  });

  // ErrorMessage tests
  it("does not display error when error is null", () => {
    render(<FilePathMapper {...defaultProps} error={null} />);
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it("displays error message when error is present", () => {
    render(<FilePathMapper {...defaultProps} error="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  // FormActions tests
  it("renders Back button", () => {
    render(<FilePathMapper {...defaultProps} />);
    expect(screen.getByText("← Back")).toBeInTheDocument();
  });

  it("calls onBack when Back button is clicked", () => {
    const onBack = vi.fn();
    render(<FilePathMapper {...defaultProps} onBack={onBack} />);
    fireEvent.click(screen.getByText("← Back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders Cancel button", () => {
    render(<FilePathMapper {...defaultProps} />);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("calls onCancel when Cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(<FilePathMapper {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders Create PR button with fix count", () => {
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1" }), filePath: "src/file1.tsx" }),
      makeFindingWithFix({ finding: makeFinding({ id: "f2" }), filePath: "src/file2.tsx" }),
    ];
    render(<FilePathMapper {...defaultProps} findings={findings} />);
    expect(screen.getByText("🚀 Create PR (2 fixes)")).toBeInTheDocument();
  });

  it("disables Create PR when no file paths are provided", () => {
    render(<FilePathMapper {...defaultProps} />);
    expect(screen.getByText("🚀 Create PR (0 fixes)")).toBeDisabled();
  });

  it("enables Create PR when at least one file path is provided", () => {
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1" }), filePath: "src/file1.tsx" }),
      makeFindingWithFix({ finding: makeFinding({ id: "f2" }), filePath: "" }),
    ];
    render(<FilePathMapper {...defaultProps} findings={findings} />);
    expect(screen.getByText("🚀 Create PR (1 fixes)")).not.toBeDisabled();
  });

  it("disables Create PR when isLoading is true", () => {
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1" }), filePath: "src/file1.tsx" }),
    ];
    render(<FilePathMapper {...defaultProps} findings={findings} isLoading={true} />);
    expect(screen.getByText("Creating PR...")).toBeDisabled();
  });

  it("shows Creating PR... text when isLoading is true", () => {
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1" }), filePath: "src/file1.tsx" }),
    ];
    render(<FilePathMapper {...defaultProps} findings={findings} isLoading={true} />);
    expect(screen.getByText("Creating PR...")).toBeInTheDocument();
  });

  it("calls onSubmit when Create PR button is clicked", () => {
    const onSubmit = vi.fn();
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1" }), filePath: "src/file1.tsx" }),
    ];
    render(<FilePathMapper {...defaultProps} findings={findings} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText("🚀 Create PR (1 fixes)"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  // Edge cases
  it("only shows fixed findings in the file path list", () => {
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1", ruleTitle: "Fixed Rule" }) }),
      { ...makeFindingWithFix({ finding: makeFinding({ id: "f2", ruleTitle: "Not Fixed Rule" }) }), fix: null },
    ];
    render(<FilePathMapper {...defaultProps} findings={findings} />);
    expect(screen.getByText("Fixed Rule")).toBeInTheDocument();
    expect(screen.queryByText("Not Fixed Rule")).not.toBeInTheDocument();
  });

  it("counts only file paths with non-empty trimmed values", () => {
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1" }), filePath: "src/file1.tsx" }),
      makeFindingWithFix({ finding: makeFinding({ id: "f2" }), filePath: "   " }), // whitespace only
      makeFindingWithFix({ finding: makeFinding({ id: "f3" }), filePath: "" }),
    ];
    render(<FilePathMapper {...defaultProps} findings={findings} />);
    expect(screen.getByText(/File Paths \(1\/3 mapped\)/)).toBeInTheDocument();
  });

  it("renders finding rule title in file path row", () => {
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1", ruleTitle: "Custom Rule Title" }) }),
    ];
    render(<FilePathMapper {...defaultProps} findings={findings} />);
    expect(screen.getByText("Custom Rule Title")).toBeInTheDocument();
  });

  it("populates file path input with existing value", () => {
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1" }), filePath: "src/existing/path.tsx" }),
    ];
    render(<FilePathMapper {...defaultProps} findings={findings} />);
    expect(screen.getByDisplayValue("src/existing/path.tsx")).toBeInTheDocument();
  });

  it("populates PR description textarea with existing value", () => {
    render(<FilePathMapper {...defaultProps} prDescription="Existing description" />);
    expect(screen.getByDisplayValue("Existing description")).toBeInTheDocument();
  });
});
