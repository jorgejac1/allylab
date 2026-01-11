// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FixGenerationList } from "../../../../components/findings/batch-pr/FixGenerationList";
import type { FindingWithFix } from "../../../../types/batch-pr";
import type { TrackedFinding } from "../../../../types";

// Mock UI components
vi.mock("../../../../components/ui", () => ({
  Button: ({ children, onClick, variant, size, disabled }: { children: React.ReactNode; onClick?: () => void; variant?: string; size?: string; disabled?: boolean }) => (
    <button onClick={onClick} data-variant={variant} data-size={size} disabled={disabled}>{children}</button>
  ),
  Spinner: ({ size }: { size?: number }) => <span data-testid="spinner" data-size={size}>⏳</span>,
}));

// Mock SeverityDot
vi.mock("../../../../components/findings/batch-pr/SeverityDot", () => ({
  SeverityDot: ({ severity }: { severity: string }) => <span data-testid={`severity-${severity}`}>●</span>,
}));

describe("batch-pr/FixGenerationList", () => {
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

  const makeCodeFix = (findingId: string) => ({
    id: `fix-${findingId}`,
    findingId,
    ruleId: "r1",
    original: { code: "", selector: "", language: "html" },
    fixes: { html: "" },
    diff: "",
    explanation: "",
    confidence: "high" as const,
    effort: "easy" as const,
    wcagCriteria: [],
    createdAt: "2024-01-01T00:00:00Z",
  });

  const makeFindingWithFix = (overrides: Partial<FindingWithFix> = {}): FindingWithFix => ({
    finding: makeFinding(),
    fix: null,
    filePath: "",
    isGenerating: false,
    error: null,
    ...overrides,
  });

  const defaultProps = {
    findings: [
      makeFindingWithFix({ finding: makeFinding({ id: "f1", ruleTitle: "Rule 1" }) }),
      makeFindingWithFix({ finding: makeFinding({ id: "f2", ruleTitle: "Rule 2" }) }),
    ],
    onGenerateFix: vi.fn(),
    onGenerateAll: vi.fn(),
    onContinue: vi.fn(),
    onCancel: vi.fn(),
  };

  it("renders description text", () => {
    render(<FixGenerationList {...defaultProps} />);
    expect(screen.getByText("Generate AI fixes for selected issues:")).toBeInTheDocument();
  });

  it("renders Generate All Fixes button", () => {
    render(<FixGenerationList {...defaultProps} />);
    expect(screen.getByText("Generate All Fixes")).toBeInTheDocument();
  });

  it("calls onGenerateAll when Generate All Fixes is clicked", () => {
    const onGenerateAll = vi.fn();
    render(<FixGenerationList {...defaultProps} onGenerateAll={onGenerateAll} />);
    fireEvent.click(screen.getByText("Generate All Fixes"));
    expect(onGenerateAll).toHaveBeenCalledTimes(1);
  });

  it("disables Generate All when some items are generating", () => {
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1" }), isGenerating: true }),
      makeFindingWithFix({ finding: makeFinding({ id: "f2" }) }),
    ];
    render(<FixGenerationList {...defaultProps} findings={findings} />);
    expect(screen.getByText(/Generating \(1\)\.\.\./)).toBeDisabled();
  });

  it("disables Generate All when all items have fixes", () => {
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1" }), fix: makeCodeFix("f1") }),
      makeFindingWithFix({ finding: makeFinding({ id: "f2" }), fix: makeCodeFix("f2") }),
    ];
    render(<FixGenerationList {...defaultProps} findings={findings} />);
    expect(screen.getByText("Generate All Fixes")).toBeDisabled();
  });

  it("displays all findings", () => {
    render(<FixGenerationList {...defaultProps} />);
    expect(screen.getByText("Rule 1")).toBeInTheDocument();
    expect(screen.getByText("Rule 2")).toBeInTheDocument();
  });

  it("displays fix count progress", () => {
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1" }), fix: makeCodeFix("f1") }),
      makeFindingWithFix({ finding: makeFinding({ id: "f2" }) }),
    ];
    render(<FixGenerationList {...defaultProps} findings={findings} />);
    expect(screen.getByText("1 of 2 fixes ready")).toBeInTheDocument();
  });

  it("renders Cancel button", () => {
    render(<FixGenerationList {...defaultProps} />);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = vi.fn();
    render(<FixGenerationList {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders Continue button", () => {
    render(<FixGenerationList {...defaultProps} />);
    expect(screen.getByText("Continue →")).toBeInTheDocument();
  });

  it("disables Continue when no fixes are ready", () => {
    render(<FixGenerationList {...defaultProps} />);
    expect(screen.getByText("Continue →")).toBeDisabled();
  });

  it("enables Continue when at least one fix is ready", () => {
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1" }), fix: makeCodeFix("f1") }),
      makeFindingWithFix({ finding: makeFinding({ id: "f2" }) }),
    ];
    render(<FixGenerationList {...defaultProps} findings={findings} />);
    expect(screen.getByText("Continue →")).not.toBeDisabled();
  });

  it("calls onContinue when Continue is clicked", () => {
    const onContinue = vi.fn();
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1" }), fix: makeCodeFix("f1") }),
    ];
    render(<FixGenerationList {...defaultProps} findings={findings} onContinue={onContinue} />);
    fireEvent.click(screen.getByText("Continue →"));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("renders Generate button for items without fix", () => {
    render(<FixGenerationList {...defaultProps} />);
    const generateButtons = screen.getAllByText("Generate");
    expect(generateButtons).toHaveLength(2);
  });

  it("calls onGenerateFix with correct index when Generate is clicked", () => {
    const onGenerateFix = vi.fn();
    render(<FixGenerationList {...defaultProps} onGenerateFix={onGenerateFix} />);
    const generateButtons = screen.getAllByText("Generate");
    fireEvent.click(generateButtons[1]);
    expect(onGenerateFix).toHaveBeenCalledWith(1);
  });

  it("displays Generating... status with spinner when isGenerating is true", () => {
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1" }), isGenerating: true }),
    ];
    render(<FixGenerationList {...defaultProps} findings={findings} />);
    expect(screen.getByText("Generating...")).toBeInTheDocument();
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("displays Fix ready status when fix is present", () => {
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1" }), fix: makeCodeFix("f1") }),
    ];
    render(<FixGenerationList {...defaultProps} findings={findings} />);
    expect(screen.getByText("✓ Fix ready")).toBeInTheDocument();
  });

  it("displays Failed status when error is present", () => {
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1" }), error: "Generation failed" }),
    ];
    render(<FixGenerationList {...defaultProps} findings={findings} />);
    expect(screen.getByText("✗ Failed")).toBeInTheDocument();
  });

  it("displays error message in title attribute when error is present", () => {
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1" }), error: "Generation failed" }),
    ];
    render(<FixGenerationList {...defaultProps} findings={findings} />);
    const failedSpan = screen.getByText("✗ Failed");
    expect(failedSpan).toHaveAttribute("title", "Generation failed");
  });

  it("renders severity dots for each finding", () => {
    render(<FixGenerationList {...defaultProps} />);
    expect(screen.getAllByTestId("severity-critical")).toHaveLength(2);
  });

  it("truncates long selectors with ellipsis", () => {
    const longSelector = "div.very-long-selector-that-exceeds-fifty-characters-and-should-be-truncated";
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1", selector: longSelector }) }),
    ];
    render(<FixGenerationList {...defaultProps} findings={findings} />);
    expect(screen.getByText(/div\.very-long-selector.*\.\.\./)).toBeInTheDocument();
  });

  it("does not truncate short selectors", () => {
    const shortSelector = "div.short";
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1", selector: shortSelector }) }),
    ];
    render(<FixGenerationList {...defaultProps} findings={findings} />);
    expect(screen.getByText("div.short")).toBeInTheDocument();
    expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
  });

  it("shows generating count in button text when generating", () => {
    const findings = [
      makeFindingWithFix({ finding: makeFinding({ id: "f1" }), isGenerating: true }),
      makeFindingWithFix({ finding: makeFinding({ id: "f2" }), isGenerating: true }),
    ];
    render(<FixGenerationList {...defaultProps} findings={findings} />);
    expect(screen.getByText("Generating (2)...")).toBeInTheDocument();
  });
});
