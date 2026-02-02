/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  NotConnectedView,
  SuccessView,
  generateBranchName,
  generatePRDescription,
} from "../../../../components/findings/apply-fix-modal";

// Mock UI components
vi.mock("../../../../components/ui", () => ({
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
  Modal: ({ children, isOpen, onClose, title, size }: {
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    size?: string;
  }) => isOpen ? (
    <div data-testid="modal" data-size={size}>
      <div data-testid="modal-title">{title}</div>
      <button onClick={onClose} data-testid="modal-close">×</button>
      {children}
    </div>
  ) : null,
}));

describe("apply-fix-modal/NotConnectedView", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  it("renders when isOpen is true", () => {
    render(<NotConnectedView {...defaultProps} />);
    expect(screen.getByTestId("modal")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    render(<NotConnectedView {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  it("displays GitHub Not Connected message", () => {
    render(<NotConnectedView {...defaultProps} />);
    expect(screen.getByText("GitHub Not Connected")).toBeInTheDocument();
  });

  it("displays instruction to connect GitHub", () => {
    render(<NotConnectedView {...defaultProps} />);
    expect(screen.getByText(/Connect your GitHub account in Settings/)).toBeInTheDocument();
  });

  it("renders Close button", () => {
    render(<NotConnectedView {...defaultProps} />);
    expect(screen.getByText("Close")).toBeInTheDocument();
  });

  it("calls onClose when Close button is clicked", () => {
    const onClose = vi.fn();
    render(<NotConnectedView {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders link icon", () => {
    const { container } = render(<NotConnectedView {...defaultProps} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

describe("apply-fix-modal/SuccessView", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    prResult: {
      prUrl: "https://github.com/owner/repo/pull/123",
      prNumber: 123,
    },
  };

  it("renders when isOpen is true", () => {
    render(<SuccessView {...defaultProps} />);
    expect(screen.getByTestId("modal")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    render(<SuccessView {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  it("displays PR number in title", () => {
    render(<SuccessView {...defaultProps} />);
    expect(screen.getByText(/Pull Request Created!/)).toBeInTheDocument();
  });

  it("displays PR number in content", () => {
    render(<SuccessView {...defaultProps} />);
    expect(screen.getByText(/PR #123 Created!/)).toBeInTheDocument();
  });

  it("displays success message", () => {
    render(<SuccessView {...defaultProps} />);
    expect(screen.getByText(/Your accessibility fix has been submitted for review/)).toBeInTheDocument();
  });

  it("renders Close button", () => {
    render(<SuccessView {...defaultProps} />);
    expect(screen.getByText("Close")).toBeInTheDocument();
  });

  it("calls onClose when Close button is clicked", () => {
    const onClose = vi.fn();
    render(<SuccessView {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders View on GitHub link with correct href", () => {
    render(<SuccessView {...defaultProps} />);

    const link = screen.getByText("View on GitHub →");
    expect(link).toHaveAttribute("href", "https://github.com/owner/repo/pull/123");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders rocket icon", () => {
    const { container } = render(<SuccessView {...defaultProps} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders with lg size modal", () => {
    render(<SuccessView {...defaultProps} />);
    expect(screen.getByTestId("modal")).toHaveAttribute("data-size", "lg");
  });
});

describe("apply-fix-modal/generateBranchName", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(1706547200000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates branch name with rule and file", () => {
    const result = generateBranchName("image-alt", "src/components/Button.tsx");
    expect(result).toMatch(/^fix\/a11y-image-alt-button-/);
  });

  it("sanitizes rule ID for branch name", () => {
    const result = generateBranchName("color-contrast@2.0", "file.tsx");
    expect(result).toMatch(/^fix\/a11y-color-contrast-2-0-/);
  });

  it("sanitizes file name for branch name", () => {
    const result = generateBranchName("rule", "src/My Component.tsx");
    expect(result).toMatch(/^fix\/a11y-rule-my-component-/);
  });

  it("handles null file path", () => {
    const result = generateBranchName("rule", null);
    expect(result).toMatch(/^fix\/a11y-rule-fix-/);
  });

  it("includes line number when provided", () => {
    const result = generateBranchName("rule", "file.tsx", 42);
    expect(result).toContain("-L42-");
  });

  it("does not include line number when not provided", () => {
    const result = generateBranchName("rule", "file.tsx");
    expect(result).not.toContain("-L");
  });

  it("includes unique suffix from timestamp", () => {
    const result = generateBranchName("rule", "file.tsx");
    // Should end with a 4-character alphanumeric suffix
    expect(result).toMatch(/-[a-z0-9]{4}$/);
  });

  it("converts to lowercase", () => {
    const result = generateBranchName("IMAGE-ALT", "src/Button.TSX");
    expect(result).toBe(result.toLowerCase());
  });
});

describe("apply-fix-modal/generatePRDescription", () => {
  const defaultParams = {
    ruleId: "image-alt",
    ruleTitle: "Images must have alternate text",
    filePath: "src/components/Image.tsx",
    originalCode: '<img src="test.jpg">',
    fixedCode: '<img src="test.jpg" alt="Test image">',
  };

  it("generates PR description with required fields", () => {
    const result = generatePRDescription(defaultParams);

    expect(result).toContain("## ♿ Accessibility Fix");
    expect(result).toContain("image-alt - Images must have alternate text");
    expect(result).toContain("`src/components/Image.tsx`");
    expect(result).toContain(defaultParams.originalCode);
    expect(result).toContain(defaultParams.fixedCode);
  });

  it("includes WCAG level when provided", () => {
    const result = generatePRDescription({
      ...defaultParams,
      wcagLevel: "A",
    });

    expect(result).toContain("(Level A)");
  });

  it("includes WCAG criteria when provided", () => {
    const result = generatePRDescription({
      ...defaultParams,
      wcagCriteria: "1.1.1",
    });

    expect(result).toContain("1.1.1");
  });

  it("includes both WCAG level and criteria when provided", () => {
    const result = generatePRDescription({
      ...defaultParams,
      wcagLevel: "AA",
      wcagCriteria: "1.4.3",
    });

    expect(result).toContain("**WCAG:** 1.4.3 (Level AA)");
  });

  it("includes line start when provided", () => {
    const result = generatePRDescription({
      ...defaultParams,
      lineStart: 42,
    });

    expect(result).toContain("**Location:** Line 42");
  });

  it("includes line range when both start and end provided", () => {
    const result = generatePRDescription({
      ...defaultParams,
      lineStart: 42,
      lineEnd: 50,
    });

    expect(result).toContain("**Location:** Lines 42-50");
  });

  it("uses single line when start equals end", () => {
    const result = generatePRDescription({
      ...defaultParams,
      lineStart: 42,
      lineEnd: 42,
    });

    expect(result).toContain("**Location:** Line 42");
  });

  it("includes scan URL when provided", () => {
    const result = generatePRDescription({
      ...defaultParams,
      scanUrl: "https://allylab.io/scans/123",
    });

    expect(result).toContain("[View scan results](https://allylab.io/scans/123)");
  });

  it("does not include scan URL link when not provided", () => {
    const result = generatePRDescription(defaultParams);

    expect(result).not.toContain("View scan results");
  });

  it("includes rule documentation link when ruleId provided", () => {
    const result = generatePRDescription(defaultParams);

    expect(result).toContain("[image-alt rule documentation](https://dequeuniversity.com/rules/axe/4.4/image-alt)");
  });

  it("handles missing ruleId", () => {
    const result = generatePRDescription({
      ...defaultParams,
      ruleId: undefined,
    });

    expect(result).toContain("accessibility - Images must have alternate text");
    expect(result).not.toContain("rule documentation");
  });

  it("includes review checklist", () => {
    const result = generatePRDescription(defaultParams);

    expect(result).toContain("### ✅ Review Checklist");
    expect(result).toContain("Visual appearance is correct");
    expect(result).toContain("Screen reader announces content properly");
    expect(result).toContain("Keyboard navigation works as expected");
    expect(result).toContain("Color contrast meets WCAG requirements");
    expect(result).toContain("No new accessibility issues introduced");
  });

  it("includes WCAG Guidelines link", () => {
    const result = generatePRDescription(defaultParams);

    expect(result).toContain("[WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)");
  });

  it("includes AllyLab attribution", () => {
    const result = generatePRDescription(defaultParams);

    expect(result).toContain("Generated by [AllyLab](https://allylab.io)");
    expect(result).toContain("Powered by Claude AI");
  });

  it("includes code diff in collapsible section", () => {
    const result = generatePRDescription(defaultParams);

    expect(result).toContain("<details>");
    expect(result).toContain("<summary>View code changes</summary>");
    expect(result).toContain("**Before:**");
    expect(result).toContain("**After:**");
    expect(result).toContain("</details>");
  });
});
