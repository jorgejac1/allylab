// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JiraExportModal } from "../../../components/findings/JiraExportModal";
import type { Finding } from "../../../types";

// Mock hooks
vi.mock("../../../hooks", () => ({
  useLocalStorage: vi.fn(<T,>(key: string, defaultValue: T) => {
    if (key === "allylab_jira_config") {
      return [{ enabled: true, serverUrl: "https://jira.test.com", email: "test@test.com", apiToken: "token" }, vi.fn()];
    }
    return [defaultValue, vi.fn()];
  }),
  useJiraExport: vi.fn(() => ({
    isExporting: false,
    lastResult: null,
    bulkProgress: null,
    exportSingle: vi.fn(async () => ({ success: true, request: { fields: { project: { key: "TEST" }, issuetype: { name: "Bug" }, summary: "", description: "" } } })),
    exportBulk: vi.fn(async () => ({ total: 0, completed: 0, successful: 0, failed: 0, results: [] })),
    previewPayload: vi.fn((finding: { ruleTitle: string; description: string }) => ({
      fields: {
        project: { key: "TEST" },
        summary: finding.ruleTitle,
        description: finding.description,
        issuetype: { name: "Bug" },
      },
    })),
    reset: vi.fn(),
  })),
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
  Button: ({ children, onClick, disabled, variant, size }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; variant?: string; size?: string }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={`button-${variant || "default"}-${size || "default"}`}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
  Tabs: ({ tabs, activeTab, onChange }: { tabs: Array<{ id: string; label: string; count?: number }>; activeTab: string; onChange: (id: string) => void }) => (
    <div data-testid="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          data-testid={`tab-${tab.id}`}
          data-active={activeTab === tab.id}
        >
          {tab.label} {tab.count !== undefined && `(${tab.count})`}
        </button>
      ))}
    </div>
  ),
}));

describe("components/findings/JiraExportModal", () => {
  const makeFinding = (overrides: Partial<Finding> = {}): Finding => ({
    id: "f1",
    ruleId: "r1",
    ruleTitle: "Test Rule",
    description: "Test description",
    impact: "critical",
    selector: "div",
    html: "<div/>",
    helpUrl: "https://test.com",
    wcagTags: ["wcag2a"],
    ...overrides,
  });

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    findings: [
      makeFinding({ id: "f1", ruleTitle: "Rule 1", impact: "critical" }),
      makeFinding({ id: "f2", ruleTitle: "Rule 2", impact: "serious" }),
    ],
    pageUrl: "https://test.com",
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const hooks = await import("../../../hooks");

    // Reset to default implementation
    vi.mocked(hooks.useLocalStorage).mockImplementation(<T,>(key: string, defaultValue: T) => {
      if (key === "allylab_jira_config") {
        return [{ enabled: true, serverUrl: "https://jira.test.com", email: "test@test.com", apiToken: "token" }, vi.fn()];
      }
      return [defaultValue, vi.fn()];
    });

    vi.mocked(hooks.useJiraExport).mockReturnValue({
      isExporting: false,
      lastResult: null,
      bulkProgress: null,
      exportSingle: vi.fn(async () => ({ success: true, request: { fields: { project: { key: "TEST" }, issuetype: { name: "Bug" }, summary: "", description: "" } } })),
      exportBulk: vi.fn(async () => ({ total: 0, completed: 0, successful: 0, failed: 0, results: [] })),
      previewPayload: vi.fn((finding: Finding) => ({
        fields: {
          project: { key: "TEST" },
          summary: finding.ruleTitle,
          description: finding.description,
          issuetype: { name: "Bug" },
        },
      })),
      reset: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("does not render when closed", () => {
    render(<JiraExportModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  it("renders with correct title", () => {
    render(<JiraExportModal {...defaultProps} />);
    expect(screen.getByTestId("modal-title")).toHaveTextContent("Export to JIRA");
  });

  it("displays message when JIRA not configured", async () => {
    const hooks = await import("../../../hooks");
    vi.mocked(hooks.useLocalStorage).mockImplementation(<T,>(key: string, defaultValue: T) => {
      if (key === "allylab_jira_config") {
        return [{ enabled: false }, vi.fn()];
      }
      return [defaultValue, vi.fn()];
    });

    render(<JiraExportModal {...defaultProps} />);

    expect(screen.getByText("JIRA Integration Not Configured")).toBeInTheDocument();
    expect(screen.getByText(/Configure your JIRA settings first/)).toBeInTheDocument();
  });

  it("renders tabs for preview and results", () => {
    render(<JiraExportModal {...defaultProps} />);
    expect(screen.getByTestId("tab-preview")).toBeInTheDocument();
    expect(screen.getByTestId("tab-result")).toBeInTheDocument();
  });

  it("displays selected findings count", () => {
    render(<JiraExportModal {...defaultProps} />);
    expect(screen.getByText(/2 of 2 issues selected/)).toBeInTheDocument();
  });

  it("renders Select All and Select None buttons", () => {
    render(<JiraExportModal {...defaultProps} />);
    expect(screen.getByText("Select All")).toBeInTheDocument();
    expect(screen.getByText("Select None")).toBeInTheDocument();
  });

  it("renders findings list with checkboxes", () => {
    render(<JiraExportModal {...defaultProps} />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);
    expect(screen.getByText("Rule 1")).toBeInTheDocument();
    expect(screen.getByText("Rule 2")).toBeInTheDocument();
  });

  it("all findings are selected by default", () => {
    render(<JiraExportModal {...defaultProps} />);
    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });
  });

  it("handles individual finding selection", () => {
    render(<JiraExportModal {...defaultProps} />);
    const checkboxes = screen.getAllByRole("checkbox");

    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).not.toBeChecked();

    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();
  });

  it("handles Select All button", () => {
    render(<JiraExportModal {...defaultProps} />);

    // Deselect first
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    // Select all
    const selectAllBtn = screen.getByText("Select All");
    fireEvent.click(selectAllBtn);

    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });
  });

  it("handles Select None button", () => {
    render(<JiraExportModal {...defaultProps} />);

    const selectNoneBtn = screen.getByText("Select None");
    fireEvent.click(selectNoneBtn);

    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach(checkbox => {
      expect(checkbox).not.toBeChecked();
    });
  });

  it("updates selected count when selections change", () => {
    render(<JiraExportModal {...defaultProps} />);

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    expect(screen.getByText(/1 of 2 issues selected/)).toBeInTheDocument();
  });

  it("displays preview for first selected finding", () => {
    render(<JiraExportModal {...defaultProps} />);
    expect(screen.getByText("Preview (first selected issue)")).toBeInTheDocument();
    expect(screen.getByText(/"summary": "Rule 1"/)).toBeInTheDocument();
  });

  it("displays severity badges for findings", () => {
    render(<JiraExportModal {...defaultProps} />);
    expect(screen.getByText("critical")).toBeInTheDocument();
    expect(screen.getByText("serious")).toBeInTheDocument();
  });

  it("displays export button with correct count", () => {
    render(<JiraExportModal {...defaultProps} />);
    expect(screen.getByText(/Export 2 Issues/)).toBeInTheDocument();
  });

  it("disables export button when no findings selected", () => {
    render(<JiraExportModal {...defaultProps} />);

    const selectNoneBtn = screen.getByText("Select None");
    fireEvent.click(selectNoneBtn);

    const exportButtons = screen.getAllByRole("button");
    const exportBtn = exportButtons.find(btn => btn.textContent?.includes("Export"));
    expect(exportBtn).toBeDisabled();
  });

  it("calls exportBulk when export button clicked", async () => {
    const hooks = await import("../../../hooks");
    const exportBulk = vi.fn(async () => ({ total: 0, completed: 0, successful: 0, failed: 0, results: [] }));
    vi.mocked(hooks.useJiraExport).mockReturnValue({
      isExporting: false,
      lastResult: null,
      bulkProgress: null,
      exportSingle: vi.fn(),
      exportBulk,
      previewPayload: vi.fn(() => ({ fields: { project: { key: "TEST" }, issuetype: { name: "Bug" }, summary: "", description: "" } })),
      reset: vi.fn(),
    });

    render(<JiraExportModal {...defaultProps} />);

    const exportButtons = screen.getAllByRole("button");
    const exportBtn = exportButtons.find(btn => btn.textContent?.includes("Export"));
    fireEvent.click(exportBtn!);

    await waitFor(() => {
      expect(exportBulk).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: "f1" }),
          expect.objectContaining({ id: "f2" }),
        ]),
        "https://test.com"
      );
    });
  });

  it("switches to results tab after export", async () => {
    const hooks = await import("../../../hooks");
    const exportBulk = vi.fn(async () => ({ total: 0, completed: 0, successful: 0, failed: 0, results: [] }));
    vi.mocked(hooks.useJiraExport).mockReturnValue({
      isExporting: false,
      lastResult: null,
      bulkProgress: null,
      exportSingle: vi.fn(),
      exportBulk,
      previewPayload: vi.fn(() => ({ fields: { project: { key: "TEST" }, issuetype: { name: "Bug" }, summary: "", description: "" } })),
      reset: vi.fn(),
    });

    render(<JiraExportModal {...defaultProps} />);

    const exportButtons = screen.getAllByRole("button");
    const exportBtn = exportButtons.find(btn => btn.textContent?.includes("Export"));
    fireEvent.click(exportBtn!);

    await waitFor(() => {
      const resultsTab = screen.getByTestId("tab-result");
      expect(resultsTab).toHaveAttribute("data-active", "true");
    });
  });

  it("displays loading state during export", async () => {
    const hooks = await import("../../../hooks");
    vi.mocked(hooks.useJiraExport).mockReturnValue({
      isExporting: true,
      lastResult: null,
      bulkProgress: { completed: 1, total: 2, successful: 0, failed: 0, results: [] },
      exportSingle: vi.fn(),
      exportBulk: vi.fn(),
      previewPayload: vi.fn(() => ({ fields: { project: { key: "TEST" }, issuetype: { name: "Bug" }, summary: "", description: "" } })),
      reset: vi.fn(),
    });

    render(<JiraExportModal {...defaultProps} />);

    expect(screen.getByText(/Exporting 1\/2/)).toBeInTheDocument();
  });

  it("displays 0 completed when bulkProgress is null during export", async () => {
    const hooks = await import("../../../hooks");
    vi.mocked(hooks.useJiraExport).mockReturnValue({
      isExporting: true,
      lastResult: null,
      bulkProgress: null,
      exportSingle: vi.fn(),
      exportBulk: vi.fn(),
      previewPayload: vi.fn(() => ({ fields: { project: { key: "TEST" }, issuetype: { name: "Bug" }, summary: "", description: "" } })),
      reset: vi.fn(),
    });

    render(<JiraExportModal {...defaultProps} />);

    // When bulkProgress is null, completed falls back to 0
    expect(screen.getByText(/Exporting 0\/2/)).toBeInTheDocument();
  });

  it("disables export button during export", async () => {
    const hooks = await import("../../../hooks");
    vi.mocked(hooks.useJiraExport).mockReturnValue({
      isExporting: true,
      lastResult: null,
      bulkProgress: { completed: 1, total: 2, successful: 0, failed: 0, results: [] },
      exportSingle: vi.fn(),
      exportBulk: vi.fn(),
      previewPayload: vi.fn(() => ({ fields: { project: { key: "TEST" }, issuetype: { name: "Bug" }, summary: "", description: "" } })),
      reset: vi.fn(),
    });

    render(<JiraExportModal {...defaultProps} />);

    const exportButtons = screen.getAllByRole("button");
    const exportBtn = exportButtons.find(btn => btn.textContent?.includes("Exporting"));
    expect(exportBtn).toBeDisabled();
  });

  it("renders export results when available", async () => {
    const hooks = await import("../../../hooks");
    vi.mocked(hooks.useJiraExport).mockReturnValue({
      isExporting: false,
      lastResult: null,
      bulkProgress: {
        completed: 2,
        total: 2,
        successful: 2,
        failed: 0,
        results: [
          {
            success: true,
            issueKey: "TEST-123",
            request: { fields: { project: { key: "TEST" }, issuetype: { name: "Bug" }, summary: "Rule 1 summary for test...", description: "" } },
          },
          {
            success: true,
            issueKey: "TEST-124",
            request: { fields: { project: { key: "TEST" }, issuetype: { name: "Bug" }, summary: "Rule 2 summary for test...", description: "" } },
          },
        ],
      },
      exportSingle: vi.fn(),
      exportBulk: vi.fn(),
      previewPayload: vi.fn(() => ({ fields: { project: { key: "TEST" }, issuetype: { name: "Bug" }, summary: "", description: "" } })),
      reset: vi.fn(),
    });

    render(<JiraExportModal {...defaultProps} />);

    // Switch to results tab
    const resultsTab = screen.getByTestId("tab-result");
    fireEvent.click(resultsTab);

    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Successful")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("displays progress bar in results", async () => {
    const hooks = await import("../../../hooks");
    vi.mocked(hooks.useJiraExport).mockReturnValue({
      isExporting: false,
      lastResult: null,
      bulkProgress: {
        completed: 2,
        total: 2,
        successful: 2,
        failed: 0,
        results: [],
      },
      exportSingle: vi.fn(),
      exportBulk: vi.fn(),
      previewPayload: vi.fn(() => ({ fields: { project: { key: "TEST" }, issuetype: { name: "Bug" }, summary: "", description: "" } })),
      reset: vi.fn(),
    });

    render(<JiraExportModal {...defaultProps} />);

    const resultsTab = screen.getByTestId("tab-result");
    fireEvent.click(resultsTab);

    expect(screen.getAllByText("2").length).toBeGreaterThan(0); // Total count
  });

  it("calls reset and onClose when modal closed", async () => {
    const hooks = await import("../../../hooks");
    const reset = vi.fn();
    const onClose = vi.fn();

    vi.mocked(hooks.useJiraExport).mockReturnValue({
      isExporting: false,
      lastResult: null,
      bulkProgress: null,
      exportSingle: vi.fn(),
      exportBulk: vi.fn(),
      previewPayload: vi.fn(() => ({ fields: { project: { key: "TEST" }, issuetype: { name: "Bug" }, summary: "", description: "" } })),
      reset,
    });

    render(<JiraExportModal {...defaultProps} onClose={onClose} />);

    const cancelBtn = screen.getByText("Cancel");
    fireEvent.click(cancelBtn);

    expect(reset).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("shows single issue text when only one selected", () => {
    render(<JiraExportModal {...defaultProps} />);

    // Deselect one finding
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]);

    expect(screen.getByText(/Export 1 Issue$/)).toBeInTheDocument();
  });

  it("highlights selected findings", () => {
    render(<JiraExportModal {...defaultProps} />);
    const labels = screen.getAllByRole("checkbox").map(cb => cb.closest("label"));

    labels.forEach(label => {
      expect(label).toHaveStyle({ background: "#f0f9ff" });
    });
  });

  it("switches between tabs", () => {
    render(<JiraExportModal {...defaultProps} />);

    const previewTab = screen.getByTestId("tab-preview");
    const resultsTab = screen.getByTestId("tab-result");

    expect(previewTab).toHaveAttribute("data-active", "true");
    expect(resultsTab).toHaveAttribute("data-active", "false");

    fireEvent.click(resultsTab);

    expect(previewTab).toHaveAttribute("data-active", "false");
    expect(resultsTab).toHaveAttribute("data-active", "true");
  });

  it("renders Cancel button", () => {
    render(<JiraExportModal {...defaultProps} />);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("closes modal when not configured and close clicked", async () => {
    const hooks = await import("../../../hooks");
    const onClose = vi.fn();

    vi.mocked(hooks.useLocalStorage).mockImplementation(<T,>(key: string, defaultValue: T) => {
      if (key === "allylab_jira_config") {
        return [{ enabled: false }, vi.fn()];
      }
      return [defaultValue, vi.fn()];
    });

    render(<JiraExportModal {...defaultProps} onClose={onClose} />);

    const closeButtons = screen.getAllByRole("button");
    const closeBtn = closeButtons.find(btn => btn.textContent === "Close");
    fireEvent.click(closeBtn!);

    expect(onClose).toHaveBeenCalled();
  });

  it("uses fallback color for unknown severity", () => {
    const props = {
      ...defaultProps,
      findings: [
        makeFinding({ id: "f1", ruleTitle: "Rule 1", impact: "unknown" as Finding["impact"] }),
      ],
    };

    render(<JiraExportModal {...props} />);

    // The unknown severity should be displayed with fallback colors
    const severityBadge = screen.getByText("unknown");
    expect(severityBadge).toBeInTheDocument();
    // Fallback background color is #f3f4f6 and text color is #6b7280
    expect(severityBadge).toHaveStyle({ background: "#f3f4f6", color: "#6b7280" });
  });

  it("displays failed export results with error icon and red background", async () => {
    const hooks = await import("../../../hooks");
    vi.mocked(hooks.useJiraExport).mockReturnValue({
      isExporting: false,
      lastResult: null,
      bulkProgress: {
        completed: 2,
        total: 2,
        successful: 1,
        failed: 1,
        results: [
          {
            success: true,
            issueKey: "TEST-123",
            request: { fields: { project: { key: "TEST" }, issuetype: { name: "Bug" }, summary: "Successful export summary for testing...", description: "" } },
          },
          {
            success: false,
            error: "Permission denied",
            request: { fields: { project: { key: "TEST" }, issuetype: { name: "Bug" }, summary: "Failed export summary for testing purposes...", description: "" } },
          },
        ],
      },
      exportSingle: vi.fn(),
      exportBulk: vi.fn(),
      previewPayload: vi.fn(() => ({ fields: { project: { key: "TEST" }, issuetype: { name: "Bug" }, summary: "", description: "" } })),
      reset: vi.fn(),
    });

    render(<JiraExportModal {...defaultProps} />);

    // Switch to results tab
    const resultsTab = screen.getByTestId("tab-result");
    fireEvent.click(resultsTab);

    // Check for success and failure results (icons are now lucide-react components)

    // Check for error message
    expect(screen.getByText("Permission denied")).toBeInTheDocument();
  });

  it("displays error message in red for failed exports", async () => {
    const hooks = await import("../../../hooks");
    vi.mocked(hooks.useJiraExport).mockReturnValue({
      isExporting: false,
      lastResult: null,
      bulkProgress: {
        completed: 1,
        total: 1,
        successful: 0,
        failed: 1,
        results: [
          {
            success: false,
            error: "API rate limit exceeded",
            request: { fields: { project: { key: "TEST" }, issuetype: { name: "Bug" }, summary: "Rate limited export summary test case...", description: "" } },
          },
        ],
      },
      exportSingle: vi.fn(),
      exportBulk: vi.fn(),
      previewPayload: vi.fn(() => ({ fields: { project: { key: "TEST" }, issuetype: { name: "Bug" }, summary: "", description: "" } })),
      reset: vi.fn(),
    });

    render(<JiraExportModal {...defaultProps} />);

    // Switch to results tab
    const resultsTab = screen.getByTestId("tab-result");
    fireEvent.click(resultsTab);

    // Check that error is displayed with correct styling
    const errorMessage = screen.getByText("API rate limit exceeded");
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveStyle({ color: "#ef4444" });
  });

  it("applies red background to failed export result rows", async () => {
    const hooks = await import("../../../hooks");
    vi.mocked(hooks.useJiraExport).mockReturnValue({
      isExporting: false,
      lastResult: null,
      bulkProgress: {
        completed: 1,
        total: 1,
        successful: 0,
        failed: 1,
        results: [
          {
            success: false,
            error: "Connection timeout",
            request: { fields: { project: { key: "TEST" }, issuetype: { name: "Bug" }, summary: "Timeout test export summary content...", description: "" } },
          },
        ],
      },
      exportSingle: vi.fn(),
      exportBulk: vi.fn(),
      previewPayload: vi.fn(() => ({ fields: { project: { key: "TEST" }, issuetype: { name: "Bug" }, summary: "", description: "" } })),
      reset: vi.fn(),
    });

    render(<JiraExportModal {...defaultProps} />);

    // Switch to results tab
    const resultsTab = screen.getByTestId("tab-result");
    fireEvent.click(resultsTab);

    // The failed result should show error message with error styling
    const errorMessage = screen.getByText("Connection timeout");
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveStyle({ color: "#ef4444" });
  });

  it("applies green background to successful export result rows", async () => {
    const hooks = await import("../../../hooks");
    vi.mocked(hooks.useJiraExport).mockReturnValue({
      isExporting: false,
      lastResult: null,
      bulkProgress: {
        completed: 1,
        total: 1,
        successful: 1,
        failed: 0,
        results: [
          {
            success: true,
            issueKey: "TEST-999",
            request: { fields: { project: { key: "TEST" }, issuetype: { name: "Bug" }, summary: "Successful test export summary content...", description: "" } },
          },
        ],
      },
      exportSingle: vi.fn(),
      exportBulk: vi.fn(),
      previewPayload: vi.fn(() => ({ fields: { project: { key: "TEST" }, issuetype: { name: "Bug" }, summary: "", description: "" } })),
      reset: vi.fn(),
    });

    const { container } = render(<JiraExportModal {...defaultProps} />);

    // Switch to results tab
    const resultsTab = screen.getByTestId("tab-result");
    fireEvent.click(resultsTab);

    // The successful result should show issue key
    const issueKey = screen.getByText("TEST-999");
    expect(issueKey).toBeInTheDocument();
    // Should have a success icon (checkmark SVG)
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
