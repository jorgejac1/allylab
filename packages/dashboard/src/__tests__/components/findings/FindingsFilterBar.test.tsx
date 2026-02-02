// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FindingsFilterBar } from "../../../components/findings/FindingsFilterBar";
import type { TrackedFinding } from "../../../types";

// Mock UI components
vi.mock("../../../components/ui", () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock("../../../components/findings/FilterButton", () => ({
  FilterButton: ({ label, onClick, active }: { label: string; onClick: () => void; active: boolean }) => (
    <button onClick={onClick} data-active={active}>{label}</button>
  ),
  PillButton: ({ label, onClick, active }: { label: string; onClick: () => void; active: boolean }) => (
    <button onClick={onClick} data-active={active}>{label}</button>
  ),
  Divider: () => <div data-testid="divider" />,
}));

vi.mock("../../../components/findings/ExportDropdown", () => ({
  ExportDropdown: () => <div data-testid="export-dropdown" />,
}));

vi.mock("../../../components/findings/SourceFilter", () => ({
  SourceFilter: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <div data-testid="source-filter" onClick={() => onChange("custom-rule")}>
      Source Filter: {value}
    </div>
  ),
}));

describe("findings/FindingsFilterBar", () => {
  const mockFindings: TrackedFinding[] = [
    {
      id: "f1",
      ruleId: "r1",
      ruleTitle: "Test Rule",
      description: "Test",
      impact: "critical",
      selector: "div",
      html: "<div/>",
      helpUrl: "https://test.com",
      wcagTags: [],
      source: "axe-core",
      status: "new",
      firstSeen: "2024-01-01T00:00:00Z",
      fingerprint: "fp1",
    },
  ];

  const defaultProps = {
    activeCount: 10,
    fpCount: 2,
    totalCount: 12,
    severityCounts: { critical: 3, serious: 4, moderate: 2, minor: 1 },
    statusCounts: { new: 5, recurring: 3, fixed: 2 },
    linkedCount: 4,
    selectedCount: 0,
    fpFilter: "active" as const,
    severityFilter: "all" as const,
    statusFilter: "all" as const,
    findings: mockFindings,
    scanUrl: "https://test.com",
    scanDate: "2024-01-01",
    onFpFilterChange: vi.fn(),
    onSeverityFilterChange: vi.fn(),
    onStatusFilterChange: vi.fn(),
    onExportToJira: vi.fn(),
  };

  it("renders FINDINGS label", () => {
    render(<FindingsFilterBar {...defaultProps} />);
    expect(screen.getByText("FINDINGS")).toBeInTheDocument();
  });

  it("renders false positive filter buttons", () => {
    render(<FindingsFilterBar {...defaultProps} />);
    expect(screen.getByText("Active (10)")).toBeInTheDocument();
    expect(screen.getByText(/False Positives \(2\)/)).toBeInTheDocument();
    expect(screen.getByText("All (12)")).toBeInTheDocument();
  });

  it("calls onFpFilterChange when filter button clicked", () => {
    const onFpFilterChange = vi.fn();
    render(<FindingsFilterBar {...defaultProps} onFpFilterChange={onFpFilterChange} />);
    fireEvent.click(screen.getByText("All (12)"));
    expect(onFpFilterChange).toHaveBeenCalledWith("all");
  });

  it("calls onFpFilterChange for active filter", () => {
    const onFpFilterChange = vi.fn();
    render(<FindingsFilterBar {...defaultProps} fpFilter="active" onFpFilterChange={onFpFilterChange} />);
    fireEvent.click(screen.getByText("Active (10)"));
    expect(onFpFilterChange).toHaveBeenCalledWith("active");
  });

  it("calls onFpFilterChange for false-positive filter", () => {
    const onFpFilterChange = vi.fn();
    render(<FindingsFilterBar {...defaultProps} onFpFilterChange={onFpFilterChange} />);
    fireEvent.click(screen.getByText(/False Positives \(2\)/));
    expect(onFpFilterChange).toHaveBeenCalledWith("false-positive");
  });

  it("renders severity filters with counts", () => {
    render(<FindingsFilterBar {...defaultProps} />);
    expect(screen.getByText("3 Critical")).toBeInTheDocument();
    expect(screen.getByText("4 Serious")).toBeInTheDocument();
    expect(screen.getByText("2 Moderate")).toBeInTheDocument();
    expect(screen.getByText("1 Minor")).toBeInTheDocument();
  });

  it("calls onSeverityFilterChange when severity button clicked", () => {
    const onSeverityFilterChange = vi.fn();
    render(<FindingsFilterBar {...defaultProps} onSeverityFilterChange={onSeverityFilterChange} />);
    fireEvent.click(screen.getByText("3 Critical"));
    expect(onSeverityFilterChange).toHaveBeenCalledWith("critical");
  });

  it("toggles severity filter when clicked twice", () => {
    const onSeverityFilterChange = vi.fn();
    render(<FindingsFilterBar {...defaultProps} severityFilter="critical" onSeverityFilterChange={onSeverityFilterChange} />);
    fireEvent.click(screen.getByText("3 Critical"));
    expect(onSeverityFilterChange).toHaveBeenCalledWith("all");
  });

  it("renders status filters with icons and counts", () => {
    render(<FindingsFilterBar {...defaultProps} />);
    expect(screen.getByText(/5 New/)).toBeInTheDocument();
    expect(screen.getByText(/3 Recurring/)).toBeInTheDocument();
    expect(screen.getByText(/2 Fixed/)).toBeInTheDocument();
  });

  it("calls onStatusFilterChange when status button clicked", () => {
    const onStatusFilterChange = vi.fn();
    render(<FindingsFilterBar {...defaultProps} onStatusFilterChange={onStatusFilterChange} />);
    fireEvent.click(screen.getByText(/5 New/));
    expect(onStatusFilterChange).toHaveBeenCalledWith("new");
  });

  it("toggles status filter when clicked twice", () => {
    const onStatusFilterChange = vi.fn();
    render(<FindingsFilterBar {...defaultProps} statusFilter="new" onStatusFilterChange={onStatusFilterChange} />);
    fireEvent.click(screen.getByText(/5 New/));
    expect(onStatusFilterChange).toHaveBeenCalledWith("all");
  });

  it("renders JIRA linked count when present", () => {
    render(<FindingsFilterBar {...defaultProps} linkedCount={4} />);
    expect(screen.getByText(/4 linked to JIRA/)).toBeInTheDocument();
  });

  it("does not render JIRA linked count when zero", () => {
    render(<FindingsFilterBar {...defaultProps} linkedCount={0} />);
    expect(screen.queryByText(/linked to JIRA/)).not.toBeInTheDocument();
  });

  it("renders export dropdown", () => {
    render(<FindingsFilterBar {...defaultProps} />);
    expect(screen.getByTestId("export-dropdown")).toBeInTheDocument();
  });

  it("renders export to JIRA button", () => {
    render(<FindingsFilterBar {...defaultProps} />);
    expect(screen.getByText(/Export to JIRA/)).toBeInTheDocument();
  });

  it("shows selected count in export button when items selected", () => {
    render(<FindingsFilterBar {...defaultProps} selectedCount={5} />);
    expect(screen.getByText(/Export to JIRA \(5\)/)).toBeInTheDocument();
  });

  it("calls onExportToJira when button clicked", () => {
    const onExportToJira = vi.fn();
    render(<FindingsFilterBar {...defaultProps} onExportToJira={onExportToJira} />);
    fireEvent.click(screen.getByText(/Export to JIRA/));
    expect(onExportToJira).toHaveBeenCalledTimes(1);
  });

  it("renders source filter when counts provided", () => {
    const sourceCounts = { axeCore: 8, customRule: 2, total: 10 };
    render(<FindingsFilterBar {...defaultProps} sourceCounts={sourceCounts} onSourceFilterChange={vi.fn()} />);
    expect(screen.getByTestId("source-filter")).toBeInTheDocument();
  });

  it("does not render source filter when counts not provided", () => {
    render(<FindingsFilterBar {...defaultProps} />);
    expect(screen.queryByTestId("source-filter")).not.toBeInTheDocument();
  });

  it("calls onSourceFilterChange when source filter changes", () => {
    const onSourceFilterChange = vi.fn();
    const sourceCounts = { axeCore: 8, customRule: 2, total: 10 };
    render(<FindingsFilterBar {...defaultProps} sourceCounts={sourceCounts} onSourceFilterChange={onSourceFilterChange} />);
    fireEvent.click(screen.getByTestId("source-filter"));
    expect(onSourceFilterChange).toHaveBeenCalledWith("custom-rule");
  });

  it("renders dividers", () => {
    render(<FindingsFilterBar {...defaultProps} />);
    const dividers = screen.getAllByTestId("divider");
    expect(dividers.length).toBeGreaterThanOrEqual(2);
  });
});
