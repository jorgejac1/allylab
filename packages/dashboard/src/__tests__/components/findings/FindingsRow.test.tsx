// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FindingsRow } from "../../../components/findings/FindingsRow";
import type { TrackedFinding } from "../../../types";

// Mock UI components
vi.mock("../../../components/ui", () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock("../../../components/findings/SeverityBadge", () => ({
  SeverityBadge: ({ severity }: { severity: string }) => <span data-testid="severity-badge">{severity}</span>,
}));

vi.mock("../../../components/findings/IssueStatus", () => ({
  IssueStatus: ({ status }: { status: string }) => <span data-testid="status-badge">{status}</span>,
}));

vi.mock("../../../components/findings/SourceBadge", () => ({
  SourceBadge: ({ source }: { source: string }) => <span data-testid="source-badge">{source}</span>,
}));

vi.mock("../../../components/findings/JiraCell", () => ({
  JiraCell: ({ issueKey, isLinking }: { issueKey?: string; isLinking: boolean }) => (
    <div data-testid="jira-cell">
      {isLinking ? "linking" : issueKey || "no-link"}
    </div>
  ),
}));

describe("findings/FindingsRow", () => {
  const renderRow = (props: React.ComponentProps<typeof FindingsRow>) => render(<table><tbody><FindingsRow {...props} /></tbody></table>);
  const baseFinding: TrackedFinding = {
    id: "f1",
    ruleId: "r1",
    ruleTitle: "Test Rule",
    description: "This is a test description",
    impact: "critical",
    selector: "div.test",
    html: "<div/>",
    helpUrl: "https://test.com",
    wcagTags: ["wcag2a", "wcag21aa"],
    source: "axe-core",
    status: "new",
    firstSeen: "2024-01-01T00:00:00Z",
    fingerprint: "fp1",
  };

  const defaultProps = {
    finding: baseFinding,
    isSelected: false,
    isLinkingJira: false,
    jiraLinkInput: "",
    onToggleSelect: vi.fn(),
    onToggleFalsePositive: vi.fn(),
    onViewDetails: vi.fn(),
    onJiraLinkInputChange: vi.fn(),
    onStartJiraLink: vi.fn(),
    onSaveJiraLink: vi.fn(),
    onCancelJiraLink: vi.fn(),
    onRemoveJiraLink: vi.fn(),
    renderPRStatus: vi.fn(() => <span>—</span>),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders severity badge", () => {
    renderRow(defaultProps);
    expect(screen.getByTestId("severity-badge")).toHaveTextContent("critical");
  });

  it("renders status badge", () => {
    renderRow(defaultProps);
    expect(screen.getByTestId("status-badge")).toHaveTextContent("new");
  });

  it("renders source badge", () => {
    renderRow(defaultProps);
    expect(screen.getByTestId("source-badge")).toHaveTextContent("axe-core");
  });

  it("renders rule title and description", () => {
    renderRow(defaultProps);
    expect(screen.getByText("Test Rule")).toBeInTheDocument();
    expect(screen.getByText("This is a test description")).toBeInTheDocument();
  });

  it("truncates long description", () => {
    const longDescription = "a".repeat(100);
    renderRow({ ...defaultProps, finding: { ...baseFinding, description: longDescription } });
    expect(screen.getByText(/a{80}\.\.\./)).toBeInTheDocument();
  });

  it("does not truncate short description", () => {
    const shortDescription = "Short text";
    renderRow({ ...defaultProps, finding: { ...baseFinding, description: shortDescription } });
    expect(screen.getByText("Short text")).toBeInTheDocument();
  });

  it("renders checkbox", () => {
    renderRow(defaultProps);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it("renders checked checkbox when selected", () => {
    renderRow({ ...defaultProps, isSelected: true });
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("calls onToggleSelect with finding id when checkbox is clicked", () => {
    const onToggleSelect = vi.fn();
    renderRow({ ...defaultProps, onToggleSelect });
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(onToggleSelect).toHaveBeenCalledWith("f1");
  });

  it("renders WCAG tags", () => {
    renderRow(defaultProps);
    expect(screen.getByText("2a")).toBeInTheDocument();
    expect(screen.getByText("21aa")).toBeInTheDocument();
  });

  it("limits WCAG tags to 2 and shows count", () => {
    const finding = { ...baseFinding, wcagTags: ["wcag2a", "wcag21aa", "wcag111", "wcag412"] };
    renderRow({ ...defaultProps, finding });
    expect(screen.getByText("2a")).toBeInTheDocument();
    expect(screen.getByText("21aa")).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("renders JiraCell component", () => {
    renderRow(defaultProps);
    expect(screen.getByTestId("jira-cell")).toBeInTheDocument();
  });

  it("passes jiraIssueKey to JiraCell", () => {
    renderRow({ ...defaultProps, jiraIssueKey: "PROJ-123" });
    expect(screen.getByTestId("jira-cell")).toHaveTextContent("PROJ-123");
  });

  it("passes isLinkingJira to JiraCell", () => {
    renderRow({ ...defaultProps, isLinkingJira: true });
    expect(screen.getByTestId("jira-cell")).toHaveTextContent("linking");
  });

  it("renders PR status from renderPRStatus function", () => {
    const renderPRStatus = vi.fn(() => <span>PR Status</span>);
    renderRow({ ...defaultProps, renderPRStatus });
    expect(screen.getByText("PR Status")).toBeInTheDocument();
    expect(renderPRStatus).toHaveBeenCalledWith("f1");
  });

  it("renders result from default renderPRStatus", () => {
    renderRow(defaultProps);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders Details button", () => {
    renderRow(defaultProps);
    expect(screen.getByText("Details")).toBeInTheDocument();
  });

  it("calls onViewDetails with finding when Details button is clicked", () => {
    const onViewDetails = vi.fn();
    renderRow({ ...defaultProps, onViewDetails });
    fireEvent.click(screen.getByText("Details"));
    expect(onViewDetails).toHaveBeenCalledWith(baseFinding);
  });

  it("renders Ignore button for non-false-positive findings", () => {
    renderRow(defaultProps);
    expect(screen.getByRole("button", { name: /Mark as false positive/i })).toBeInTheDocument();
  });

  it("calls onToggleFalsePositive with finding when Ignore button is clicked", () => {
    const onToggleFalsePositive = vi.fn();
    renderRow({ ...defaultProps, onToggleFalsePositive });
    fireEvent.click(screen.getByRole("button", { name: /Mark as false positive/i }));
    expect(onToggleFalsePositive).toHaveBeenCalledWith(baseFinding);
  });

  it("renders false positive badge when marked as false positive", () => {
    const finding = { ...baseFinding, falsePositive: true };
    renderRow({ ...defaultProps, finding });
    expect(screen.getByText("False Positive")).toBeInTheDocument();
  });

  it("renders Restore button for false positive findings", () => {
    const finding = { ...baseFinding, falsePositive: true };
    renderRow({ ...defaultProps, finding });
    expect(screen.getByRole("button", { name: /Restore/ })).toBeInTheDocument();
  });

  it("applies strikethrough to title when false positive", () => {
    const finding = { ...baseFinding, falsePositive: true };
    const { container } = renderRow({ ...defaultProps, finding });
    const title = container.querySelector('div[style*="line-through"]');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent("Test Rule");
  });

  it("applies selected background when selected", () => {
    const { container } = renderRow({ ...defaultProps, isSelected: true });
    const row = container.querySelector("tr");
    expect(row).toHaveStyle({ background: "rgb(240, 249, 255)" });
  });

  it("applies false positive background when marked as false positive", () => {
    const finding = { ...baseFinding, falsePositive: true };
    const { container } = renderRow({ ...defaultProps, finding });
    const row = container.querySelector("tr");
    expect(row).toHaveStyle({ background: "rgb(250, 250, 250)" });
  });

  it("applies reduced opacity for false positive findings", () => {
    const finding = { ...baseFinding, falsePositive: true };
    const { container } = renderRow({ ...defaultProps, finding });
    const row = container.querySelector("tr");
    expect(row).toHaveStyle({ opacity: 0.6 });
  });

  it("applies normal opacity for regular findings", () => {
    const { container } = renderRow(defaultProps);
    const row = container.querySelector("tr");
    expect(row).toHaveStyle({ opacity: 1 });
  });

  it("changes button style on mouse over for regular finding", () => {
    renderRow(defaultProps);
    const ignoreBtn = screen.getByRole("button", { name: /Mark as false positive/i });

    fireEvent.mouseOver(ignoreBtn);
    expect(ignoreBtn).toHaveStyle({ background: "#fef2f2", color: "#dc2626" });

    fireEvent.mouseOut(ignoreBtn);
    expect(ignoreBtn).toHaveStyle({ background: "none", color: "#94a3b8" });
  });

  it("changes button style on mouse over for false positive finding", () => {
    const finding = { ...baseFinding, falsePositive: true };
    renderRow({ ...defaultProps, finding });
    const restoreBtn = screen.getByRole("button", { name: /Restore/ });

    fireEvent.mouseOver(restoreBtn);
    expect(restoreBtn).toHaveStyle({ background: "#f0fdf4", color: "#15803d" });

    fireEvent.mouseOut(restoreBtn);
    expect(restoreBtn).toHaveStyle({ background: "none", color: "#15803d" });
  });
});
