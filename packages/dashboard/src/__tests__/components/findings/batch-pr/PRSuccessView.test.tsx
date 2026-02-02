// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PRSuccessView } from "../../../../components/findings/batch-pr/PRSuccessView";

// Mock UI components
vi.mock("../../../../components/ui", () => ({
  Button: ({ children, onClick, variant }: { children: React.ReactNode; onClick: () => void; variant?: string }) => (
    <button onClick={onClick} data-variant={variant}>{children}</button>
  ),
}));

describe("batch-pr/PRSuccessView", () => {
  const defaultProps = {
    result: {
      prNumber: 42,
      prUrl: "https://github.com/owner/repo/pull/42",
    },
    fixCount: 5,
    onClose: vi.fn(),
  };

  it("renders celebration icon", () => {
    render(<PRSuccessView {...defaultProps} />);
    // PartyPopper icon from lucide-react renders as an SVG
    expect(screen.getByText("Pull Request Created!")).toBeInTheDocument();
  });

  it("displays success title", () => {
    render(<PRSuccessView {...defaultProps} />);
    expect(screen.getByText("Pull Request Created!")).toBeInTheDocument();
  });

  it("displays PR number and fix count in description", () => {
    render(<PRSuccessView {...defaultProps} />);
    expect(screen.getByText(/PR #42 with 5 accessibility fixes has been created/)).toBeInTheDocument();
  });

  it("renders Close button", () => {
    render(<PRSuccessView {...defaultProps} />);
    expect(screen.getByText("Close")).toBeInTheDocument();
  });

  it("calls onClose when Close button is clicked", () => {
    const onClose = vi.fn();
    render(<PRSuccessView {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders GitHub link with correct href", () => {
    render(<PRSuccessView {...defaultProps} />);
    const link = screen.getByText("View on GitHub →");
    expect(link).toHaveAttribute("href", "https://github.com/owner/repo/pull/42");
  });

  it("renders GitHub link with security attributes", () => {
    render(<PRSuccessView {...defaultProps} />);
    const link = screen.getByText("View on GitHub →");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders with different fix count", () => {
    render(<PRSuccessView {...defaultProps} fixCount={1} />);
    expect(screen.getByText(/PR #42 with 1 accessibility fixes has been created/)).toBeInTheDocument();
  });

  it("renders with different PR number", () => {
    const props = {
      ...defaultProps,
      result: { prNumber: 123, prUrl: "https://github.com/owner/repo/pull/123" },
    };
    render(<PRSuccessView {...props} />);
    expect(screen.getByText(/PR #123/)).toBeInTheDocument();
  });
});
