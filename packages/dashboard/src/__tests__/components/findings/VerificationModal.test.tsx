// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { VerificationModal } from "../../../components/findings/VerificationModal";
import type { VerificationResult } from "../../../types/github";

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

describe("components/findings/VerificationModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    result: null,
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when closed", () => {
    render(<VerificationModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  it("renders with correct title", () => {
    render(<VerificationModal {...defaultProps} />);
    expect(screen.getByTestId("modal-title")).toHaveTextContent("Fix Verification");
  });

  it("displays loading state", () => {
    render(<VerificationModal {...defaultProps} isLoading={true} />);
    expect(screen.getByText("🔍")).toBeInTheDocument();
    expect(screen.getByText("Re-scanning page to verify fixes...")).toBeInTheDocument();
  });

  it("displays error state", () => {
    const errorMessage = "Failed to verify fixes";
    render(<VerificationModal {...defaultProps} error={errorMessage} />);

    expect(screen.getByText("❌")).toBeInTheDocument();
    expect(screen.getByText("Verification Failed")).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("calls onClose when close button clicked in error state", () => {
    const onClose = vi.fn();
    render(<VerificationModal {...defaultProps} error="Error" onClose={onClose} />);

    const closeButton = screen.getByTestId("button");
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("displays success state when all fixes verified", () => {
    const result: VerificationResult = {
      success: true,
      prNumber: 1,
      allFixed: true,
      findingsVerified: [
        { findingId: "f1", ruleId: "rule-1", stillPresent: false },
        { findingId: "f2", ruleId: "rule-2", stillPresent: false },
      ],
      scanScore: 95,
      scanTimestamp: "2024-01-01T00:00:00Z",
    };

    render(<VerificationModal {...defaultProps} result={result} />);

    expect(screen.getByText("🎉")).toBeInTheDocument();
    expect(screen.getByText("All Fixes Verified!")).toBeInTheDocument();
    expect(screen.getByText(/All 2 issues have been successfully fixed/)).toBeInTheDocument();
  });

  it("displays partial success state when some issues still present", () => {
    const result: VerificationResult = {
      success: true,
      prNumber: 1,
      allFixed: false,
      findingsVerified: [
        { findingId: "f1", ruleId: "rule-1", stillPresent: false },
        { findingId: "f2", ruleId: "rule-2", stillPresent: true },
        { findingId: "f3", ruleId: "rule-3", stillPresent: true },
      ],
      scanScore: 60,
      scanTimestamp: "2024-01-01T00:00:00Z",
    };

    render(<VerificationModal {...defaultProps} result={result} />);

    expect(screen.getByText("⚠️")).toBeInTheDocument();
    expect(screen.getByText("Some Issues Still Present")).toBeInTheDocument();
    expect(screen.getByText(/2 of 3 issues are still present/)).toBeInTheDocument();
  });

  it("renders results table with fixed status", () => {
    const result: VerificationResult = {
      success: true,
      prNumber: 1,
      allFixed: false,
      findingsVerified: [
        { findingId: "f1", ruleId: "button-name", stillPresent: false },
        { findingId: "f2", ruleId: "image-alt", stillPresent: true },
      ],
      scanScore: 75,
      scanTimestamp: "2024-01-01T00:00:00Z",
    };

    render(<VerificationModal {...defaultProps} result={result} />);

    expect(screen.getByText("button-name")).toBeInTheDocument();
    expect(screen.getByText("image-alt")).toBeInTheDocument();
    expect(screen.getByText("✓ Fixed")).toBeInTheDocument();
    expect(screen.getByText("✗ Still Present")).toBeInTheDocument();
  });

  it("displays scan score and timestamp", () => {
    const result: VerificationResult = {
      success: true,
      prNumber: 1,
      allFixed: true,
      findingsVerified: [{ findingId: "f1", ruleId: "rule-1", stillPresent: false }],
      scanScore: 88,
      scanTimestamp: "2024-01-15T12:30:00Z",
    };

    render(<VerificationModal {...defaultProps} result={result} />);

    expect(screen.getByText(/New Score:/)).toBeInTheDocument();
    expect(screen.getByText(/88\/100/)).toBeInTheDocument();
    expect(screen.getByText(/Scanned:/)).toBeInTheDocument();
  });

  it("calls onClose when close button clicked in success state", () => {
    const onClose = vi.fn();
    const result: VerificationResult = {
      success: true,
      prNumber: 1,
      allFixed: true,
      findingsVerified: [{ findingId: "f1", ruleId: "rule-1", stillPresent: false }],
      scanScore: 95,
      scanTimestamp: "2024-01-01T00:00:00Z",
    };

    render(<VerificationModal {...defaultProps} result={result} onClose={onClose} />);

    const closeButton = screen.getByTestId("button");
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not display result when loading", () => {
    const result: VerificationResult = {
      success: true,
      prNumber: 1,
      allFixed: true,
      findingsVerified: [{ findingId: "f1", ruleId: "rule-1", stillPresent: false }],
      scanScore: 95,
      scanTimestamp: "2024-01-01T00:00:00Z",
    };

    render(<VerificationModal {...defaultProps} result={result} isLoading={true} />);

    expect(screen.queryByText("All Fixes Verified!")).not.toBeInTheDocument();
    expect(screen.getByText("Re-scanning page to verify fixes...")).toBeInTheDocument();
  });

  it("does not display result when error present", () => {
    const result: VerificationResult = {
      success: true,
      prNumber: 1,
      allFixed: true,
      findingsVerified: [{ findingId: "f1", ruleId: "rule-1", stillPresent: false }],
      scanScore: 95,
      scanTimestamp: "2024-01-01T00:00:00Z",
    };

    render(<VerificationModal {...defaultProps} result={result} error="Network error" />);

    expect(screen.queryByText("All Fixes Verified!")).not.toBeInTheDocument();
    expect(screen.getByText("Verification Failed")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    const result: VerificationResult = {
      success: true,
      prNumber: 1,
      allFixed: true,
      findingsVerified: [{ findingId: "f1", ruleId: "rule-1", stillPresent: false }],
      scanScore: 95,
      scanTimestamp: "2024-01-01T00:00:00Z",
    };

    render(<VerificationModal {...defaultProps} result={result} />);

    expect(screen.getByText("Rule")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("handles empty findings array", () => {
    const result: VerificationResult = {
      success: true,
      prNumber: 1,
      allFixed: true,
      findingsVerified: [],
      scanScore: 100,
      scanTimestamp: "2024-01-01T00:00:00Z",
    };

    render(<VerificationModal {...defaultProps} result={result} />);

    expect(screen.getByText(/All 0 issues have been successfully fixed/)).toBeInTheDocument();
  });

  it("calls onClose when modal backdrop is closed", () => {
    const onClose = vi.fn();
    render(<VerificationModal {...defaultProps} onClose={onClose} />);

    const modalCloseBtn = screen.getByTestId("modal-close");
    fireEvent.click(modalCloseBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("displays multiple findings in results table", () => {
    const result: VerificationResult = {
      success: true,
      prNumber: 1,
      allFixed: false,
      findingsVerified: [
        { findingId: "f1", ruleId: "rule-1", stillPresent: false },
        { findingId: "f2", ruleId: "rule-2", stillPresent: false },
        { findingId: "f3", ruleId: "rule-3", stillPresent: true },
        { findingId: "f4", ruleId: "rule-4", stillPresent: true },
      ],
      scanScore: 50,
      scanTimestamp: "2024-01-01T00:00:00Z",
    };

    render(<VerificationModal {...defaultProps} result={result} />);

    expect(screen.getAllByText("✓ Fixed")).toHaveLength(2);
    expect(screen.getAllByText("✗ Still Present")).toHaveLength(2);
  });

  it("displays correct count of still present issues", () => {
    const result: VerificationResult = {
      success: true,
      prNumber: 1,
      allFixed: false,
      findingsVerified: [
        { findingId: "f1", ruleId: "rule-1", stillPresent: false },
        { findingId: "f2", ruleId: "rule-2", stillPresent: true },
        { findingId: "f3", ruleId: "rule-3", stillPresent: true },
        { findingId: "f4", ruleId: "rule-4", stillPresent: true },
      ],
      scanScore: 40,
      scanTimestamp: "2024-01-01T00:00:00Z",
    };

    render(<VerificationModal {...defaultProps} result={result} />);

    expect(screen.getByText(/3 of 4 issues are still present/)).toBeInTheDocument();
  });
});
