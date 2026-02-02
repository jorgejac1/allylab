/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  ConfidenceBadge,
  RepoHeader,
  ErrorMessage,
  FormActions,
  PRFormFields,
} from "../../../../../components/findings/batch-pr/file-path-mapper";

// Mock UI components
vi.mock("../../../../../components/ui", () => ({
  Button: ({ children, onClick, variant, disabled }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
  Spinner: ({ size }: { size?: number }) => (
    <span data-testid="spinner" data-size={size}>Loading...</span>
  ),
}));

describe("file-path-mapper/ConfidenceBadge", () => {
  it("renders high confidence badge", () => {
    render(<ConfidenceBadge confidence="high" />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("renders medium confidence badge", () => {
    render(<ConfidenceBadge confidence="medium" />);
    expect(screen.getByText("Medium")).toBeInTheDocument();
  });

  it("renders low confidence badge", () => {
    render(<ConfidenceBadge confidence="low" />);
    expect(screen.getByText("Low")).toBeInTheDocument();
  });

  it("renders with icon", () => {
    const { container } = render(<ConfidenceBadge confidence="high" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies correct styling for high confidence", () => {
    const { container } = render(<ConfidenceBadge confidence="high" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveStyle({ background: "#dcfce7" });
  });

  it("applies correct styling for medium confidence", () => {
    const { container } = render(<ConfidenceBadge confidence="medium" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveStyle({ background: "#fef3c7" });
  });

  it("applies correct styling for low confidence", () => {
    const { container } = render(<ConfidenceBadge confidence="low" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveStyle({ background: "#fee2e2" });
  });
});

describe("file-path-mapper/RepoHeader", () => {
  const defaultProps = {
    repo: {
      id: 1,
      name: "test-repo",
      full_name: "owner/test-repo",
      default_branch: "main",
      owner: {
        login: "owner",
        avatar_url: "https://example.com/avatar.png",
      },
      private: false,
      html_url: "https://github.com/owner/test-repo",
    },
    branches: [
      { name: "main", sha: "abc123" },
      { name: "develop", sha: "def456" },
    ],
    selectedBranch: "main",
    onBranchChange: vi.fn(),
    onChangeRepo: vi.fn(),
  };

  it("renders repo full name", () => {
    render(<RepoHeader {...defaultProps} />);
    expect(screen.getByText("owner/test-repo")).toBeInTheDocument();
  });

  it("renders owner avatar", () => {
    const { container } = render(<RepoHeader {...defaultProps} />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "https://example.com/avatar.png");
  });

  it("renders Change repository button", () => {
    render(<RepoHeader {...defaultProps} />);
    expect(screen.getByText("Change repository")).toBeInTheDocument();
  });

  it("calls onChangeRepo when Change repository clicked", () => {
    const onChangeRepo = vi.fn();
    render(<RepoHeader {...defaultProps} onChangeRepo={onChangeRepo} />);

    fireEvent.click(screen.getByText("Change repository"));
    expect(onChangeRepo).toHaveBeenCalledTimes(1);
  });

  it("renders branch selector with correct options", () => {
    render(<RepoHeader {...defaultProps} />);
    const select = screen.getByLabelText("Select branch");

    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "main" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "develop" })).toBeInTheDocument();
  });

  it("calls onBranchChange when branch selected", () => {
    const onBranchChange = vi.fn();
    render(<RepoHeader {...defaultProps} onBranchChange={onBranchChange} />);

    fireEvent.change(screen.getByLabelText("Select branch"), { target: { value: "develop" } });
    expect(onBranchChange).toHaveBeenCalledWith("develop");
  });

  it("shows selected branch value", () => {
    render(<RepoHeader {...defaultProps} selectedBranch="develop" />);
    const select = screen.getByLabelText("Select branch") as HTMLSelectElement;
    expect(select.value).toBe("develop");
  });
});

describe("file-path-mapper/ErrorMessage", () => {
  it("renders error message", () => {
    render(<ErrorMessage message="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("has role alert", () => {
    render(<ErrorMessage message="Error" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("applies error styling", () => {
    const { container } = render(<ErrorMessage message="Error" />);
    const errorDiv = container.firstChild as HTMLElement;
    expect(errorDiv).toHaveStyle({ background: "#fef2f2" });
  });
});

describe("file-path-mapper/FormActions", () => {
  const defaultProps = {
    isLoading: false,
    withPathCount: 3,
    totalCount: 5,
    highConfidenceCount: 2,
    onBack: vi.fn(),
    onCancel: vi.fn(),
    onSubmit: vi.fn(),
  };

  it("renders Back button", () => {
    render(<FormActions {...defaultProps} />);
    expect(screen.getByText("← Back")).toBeInTheDocument();
  });

  it("renders Cancel button", () => {
    render(<FormActions {...defaultProps} />);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("renders Create PR button with count", () => {
    render(<FormActions {...defaultProps} />);
    expect(screen.getByText(/Create PR \(3\)/)).toBeInTheDocument();
  });

  it("calls onBack when Back clicked", () => {
    const onBack = vi.fn();
    render(<FormActions {...defaultProps} onBack={onBack} />);

    fireEvent.click(screen.getByText("← Back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when Cancel clicked", () => {
    const onCancel = vi.fn();
    render(<FormActions {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onSubmit when Create PR clicked", () => {
    const onSubmit = vi.fn();
    render(<FormActions {...defaultProps} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByText(/Create PR/));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("disables Create PR when loading", () => {
    render(<FormActions {...defaultProps} isLoading={true} />);
    const button = screen.getByText(/Creating.../).closest("button");
    expect(button).toBeDisabled();
  });

  it("disables Create PR when no paths", () => {
    render(<FormActions {...defaultProps} withPathCount={0} />);
    const button = screen.getByText(/Create PR \(0\)/).closest("button");
    expect(button).toBeDisabled();
  });

  it("shows loading spinner when loading", () => {
    render(<FormActions {...defaultProps} isLoading={true} />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("shows ready count status", () => {
    render(<FormActions {...defaultProps} />);
    expect(screen.getByText(/3.*of.*5.*ready/)).toBeInTheDocument();
  });

  it("shows high confidence count when available", () => {
    render(<FormActions {...defaultProps} />);
    expect(screen.getByText(/2 high confidence/)).toBeInTheDocument();
  });

  it("does not show ready count when withPathCount is 0", () => {
    render(<FormActions {...defaultProps} withPathCount={0} />);
    expect(screen.queryByText(/of .* ready/)).not.toBeInTheDocument();
  });
});

describe("file-path-mapper/PRFormFields", () => {
  const defaultProps = {
    prTitle: "Fix accessibility issues",
    prDescription: "This PR fixes several accessibility issues",
    onTitleChange: vi.fn(),
    onDescriptionChange: vi.fn(),
  };

  it("renders PR Title label", () => {
    render(<PRFormFields {...defaultProps} />);
    expect(screen.getByLabelText("PR Title")).toBeInTheDocument();
  });

  it("renders Description label", () => {
    render(<PRFormFields {...defaultProps} />);
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
  });

  it("shows title value", () => {
    render(<PRFormFields {...defaultProps} />);
    const input = screen.getByLabelText("PR Title") as HTMLInputElement;
    expect(input.value).toBe("Fix accessibility issues");
  });

  it("shows description value", () => {
    render(<PRFormFields {...defaultProps} />);
    const textarea = screen.getByLabelText(/Description/) as HTMLTextAreaElement;
    expect(textarea.value).toBe("This PR fixes several accessibility issues");
  });

  it("calls onTitleChange when title changed", () => {
    const onTitleChange = vi.fn();
    render(<PRFormFields {...defaultProps} onTitleChange={onTitleChange} />);

    fireEvent.change(screen.getByLabelText("PR Title"), { target: { value: "New title" } });
    expect(onTitleChange).toHaveBeenCalledWith("New title");
  });

  it("calls onDescriptionChange when description changed", () => {
    const onDescriptionChange = vi.fn();
    render(<PRFormFields {...defaultProps} onDescriptionChange={onDescriptionChange} />);

    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: "New description" } });
    expect(onDescriptionChange).toHaveBeenCalledWith("New description");
  });

  it("has placeholder for description", () => {
    render(<PRFormFields {...defaultProps} prDescription="" />);
    const textarea = screen.getByLabelText(/Description/) as HTMLTextAreaElement;
    expect(textarea.placeholder).toBe("Additional context for reviewers...");
  });
});
