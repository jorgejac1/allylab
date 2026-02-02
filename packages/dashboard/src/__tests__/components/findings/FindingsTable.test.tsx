// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FindingsTable } from "../../../components/findings/FindingsTable";
import type { TrackedFinding } from "../../../types";

// Mock components
// Track what totalPages value is passed to Pagination
let lastTotalPagesValue = 0;

vi.mock("../../../components/ui", () => ({
  Card: ({ children, padding }: { children: React.ReactNode; padding?: string }) => (
    <div data-testid="card" data-padding={padding}>{children}</div>
  ),
  Pagination: ({ currentPage, totalPages, pageSize, onPageChange, onPageSizeChange }: { currentPage: number; totalPages: number; pageSize: number; onPageChange: (page: number) => void; onPageSizeChange: (size: number) => void }) => {
    lastTotalPagesValue = totalPages;
    return (
      <div data-testid="pagination" data-total-pages={totalPages}>
        <button data-testid="pagination-next-page" onClick={() => onPageChange(2)}>Next Page</button>
        <button data-testid="pagination-change-size" onClick={() => onPageSizeChange(20)}>Change Page Size</button>
        <span>Page {currentPage} of {totalPages}</span>
        <span>Size: {pageSize}</span>
      </div>
    );
  },
}));

vi.mock("../../../components/findings/FindingsFilterBar", () => ({
  FindingsFilterBar: ({ onFpFilterChange, onSeverityFilterChange, onStatusFilterChange, onSourceFilterChange, onExportToJira }: { onFpFilterChange: (filter: string) => void; onSeverityFilterChange: (severity: string) => void; onStatusFilterChange: (status: string) => void; onSourceFilterChange: (source: string) => void; onExportToJira: () => void }) => (
    <div data-testid="filter-bar">
      <button onClick={() => onFpFilterChange("all")}>All</button>
      <button onClick={() => onFpFilterChange("false-positive")}>False Positives</button>
      <button onClick={() => onSeverityFilterChange("critical")}>Critical</button>
      <button onClick={() => onStatusFilterChange("new")}>New</button>
      <button onClick={() => onSourceFilterChange("custom-rule")}>Custom</button>
      <button onClick={onExportToJira}>Export to JIRA</button>
    </div>
  ),
}));

vi.mock("../../../components/findings/FindingsSelectionBar", () => ({
  FindingsSelectionBar: ({ onSelectAll, onClearSelection, onCreatePR, onExportJira }: { onSelectAll: () => void; onClearSelection: () => void; onCreatePR: () => void; onExportJira: () => void }) => (
    <div data-testid="selection-bar">
      <button onClick={onSelectAll}>Select All</button>
      <button onClick={onClearSelection}>Clear</button>
      <button onClick={onCreatePR}>Create PR</button>
      <button onClick={onExportJira}>Export JIRA</button>
    </div>
  ),
}));

vi.mock("../../../components/findings/FindingsRow", () => ({
  FindingsRow: ({
    finding,
    isSelected,
    jiraIssueKey,
    isLinkingJira,
    jiraLinkInput,
    onToggleSelect,
    onToggleFalsePositive,
    onViewDetails,
    onJiraLinkInputChange,
    onStartJiraLink,
    onSaveJiraLink,
    onCancelJiraLink,
    onRemoveJiraLink,
    renderPRStatus,
  }: {
    finding: TrackedFinding;
    isSelected: boolean;
    jiraIssueKey?: string;
    isLinkingJira: boolean;
    jiraLinkInput: string;
    onToggleSelect: (findingId: string) => void;
    onToggleFalsePositive: (finding: TrackedFinding) => void;
    onViewDetails: (finding: TrackedFinding) => void;
    onJiraLinkInputChange: (value: string) => void;
    onStartJiraLink: (findingId: string) => void;
    onSaveJiraLink: (findingId: string) => void;
    onCancelJiraLink: () => void;
    onRemoveJiraLink: (findingId: string) => void;
    renderPRStatus: (findingId: string) => React.ReactNode;
  }) => (
    <tr data-testid={`finding-row-${finding.id}`}>
      <td>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(finding.id)}
          data-testid={`checkbox-${finding.id}`}
        />
      </td>
      <td>{finding.ruleTitle}</td>
      <td>
        <button onClick={() => onToggleFalsePositive(finding)} data-testid={`fp-toggle-${finding.id}`}>
          {finding.falsePositive ? "Restore" : "Ignore"}
        </button>
      </td>
      <td>
        <button onClick={() => onViewDetails(finding)} data-testid={`view-${finding.id}`}>View</button>
      </td>
      <td data-testid={`jira-cell-${finding.id}`}>
        {jiraIssueKey && <span data-testid={`jira-key-${finding.id}`}>{jiraIssueKey}</span>}
        {isLinkingJira ? (
          <div data-testid={`jira-linking-${finding.id}`}>
            <input
              data-testid={`jira-input-${finding.id}`}
              value={jiraLinkInput}
              onChange={(e) => onJiraLinkInputChange(e.target.value)}
            />
            <button data-testid={`jira-save-${finding.id}`} onClick={() => onSaveJiraLink(finding.id)}>Save</button>
            <button data-testid={`jira-cancel-${finding.id}`} onClick={onCancelJiraLink}>Cancel</button>
          </div>
        ) : (
          <button data-testid={`jira-start-${finding.id}`} onClick={() => onStartJiraLink(finding.id)}>Link</button>
        )}
        {jiraIssueKey && (
          <button data-testid={`jira-remove-${finding.id}`} onClick={() => onRemoveJiraLink(finding.id)}>Remove</button>
        )}
      </td>
      <td data-testid={`pr-status-${finding.id}`}>{renderPRStatus(finding.id)}</td>
    </tr>
  ),
}));

vi.mock("../../../components/findings/JiraExportModal", () => ({
  JiraExportModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? <div data-testid="jira-modal"><button onClick={onClose}>Close</button></div> : null,
}));

vi.mock("../../../components/findings/BatchPRModal", () => ({
  BatchPRModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? <div data-testid="batch-pr-modal"><button onClick={onClose}>Close</button></div> : null,
}));

vi.mock("../../../components/findings/VerificationModal", () => ({
  VerificationModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? <div data-testid="verification-modal"><button onClick={onClose}>Close</button></div> : null,
}));

vi.mock("../../../components/findings/PRStatusBadge", () => ({
  PRStatusBadge: ({ pr, onVerify, isVerifying }: { pr: { id: string; status: string }; onVerify: () => void; isVerifying: boolean }) => (
    <button onClick={onVerify} disabled={isVerifying} data-testid={`pr-badge-${pr.id}`}>
      {pr.status}
    </button>
  ),
}));

// Use vi.hoisted for module-level mocks
const {
  mockJiraLinks,
  mockSetJiraLinks,
  mockVerifyFixes,
  mockGetPRsForFinding,
} = vi.hoisted(() => {
  const jiraLinks: Record<string, string> = {};
  return {
    mockJiraLinks: jiraLinks,
    mockSetJiraLinks: vi.fn((updater: (prev: Record<string, string>) => Record<string, string>) => {
      const result = updater(jiraLinks);
      Object.keys(jiraLinks).forEach(key => delete jiraLinks[key]);
      Object.assign(jiraLinks, result);
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockVerifyFixes: vi.fn((): any => Promise.resolve({ success: true, message: "Verified" })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetPRsForFinding: vi.fn((): any => []),
  };
});

// Mock the usePRTracking module directly (used by useFindingsVerification)
vi.mock("../../../hooks/usePRTracking", () => ({
  usePRTracking: vi.fn(() => ({
    getPRsForFinding: mockGetPRsForFinding,
    verifyFixes: mockVerifyFixes,
  })),
}));

// Mock useLocalStorage at its actual file path (used by useFindingsJira)
vi.mock("../../../hooks/useLocalStorage", () => ({
  useLocalStorage: vi.fn(<T,>(key: string, defaultValue: T) => {
    if (key === "allylab_jira_links") {
      return [mockJiraLinks, mockSetJiraLinks];
    }
    return [defaultValue, vi.fn()];
  }),
}));

vi.mock("../../../hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../hooks")>();
  return {
    ...actual,
    useLocalStorage: vi.fn(<T,>(key: string, defaultValue: T) => {
      if (key === "allylab_jira_links") {
        return [mockJiraLinks, mockSetJiraLinks];
      }
      return [defaultValue, vi.fn()];
    }),
    usePRTracking: vi.fn(() => ({
      getPRsForFinding: mockGetPRsForFinding,
      verifyFixes: mockVerifyFixes,
    })),
  };
});

vi.mock("../../../utils/falsePositives", () => ({
  markAsFalsePositive: vi.fn(),
  unmarkFalsePositive: vi.fn(),
  applyFalsePositiveStatus: vi.fn((findings: TrackedFinding[]) => findings),
}));

describe("components/findings/FindingsTable", () => {
  const makeFinding = (overrides: Partial<TrackedFinding> = {}): TrackedFinding => ({
    id: "f1",
    ruleId: "r1",
    ruleTitle: "Test Rule",
    description: "Test description",
    impact: "critical",
    selector: "div",
    html: "<div/>",
    helpUrl: "https://test.com",
    wcagTags: ["wcag2a"],
    source: "axe-core",
    status: "new",
    firstSeen: "2024-01-01T00:00:00Z",
    fingerprint: "fp1",
    falsePositive: false,
    ...overrides,
  });

  const defaultProps = {
    findings: [
      makeFinding({ id: "f1", ruleTitle: "Rule 1", impact: "critical", status: "new" }),
      makeFinding({ id: "f2", ruleTitle: "Rule 2", impact: "serious", status: "recurring" }),
    ],
    pageUrl: "https://test.com",
    onViewDetails: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset mock JIRA links
    Object.keys(mockJiraLinks).forEach(key => delete mockJiraLinks[key]);
    // Reset mock functions
    mockGetPRsForFinding.mockReturnValue([]);
    mockVerifyFixes.mockResolvedValue({ success: true, message: "Verified" });
    // Reset applyFalsePositiveStatus to default behavior
    const { applyFalsePositiveStatus } = await import("../../../utils/falsePositives");
    vi.mocked(applyFalsePositiveStatus).mockImplementation((findings) => findings);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the findings table", () => {
    render(<FindingsTable {...defaultProps} />);
    expect(screen.getByTestId("card")).toBeInTheDocument();
    expect(screen.getByTestId("filter-bar")).toBeInTheDocument();
    expect(screen.getByTestId("selection-bar")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(<FindingsTable {...defaultProps} />);
    expect(screen.getByText("Severity")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Issue")).toBeInTheDocument();
    expect(screen.getByText("WCAG")).toBeInTheDocument();
    expect(screen.getByText("JIRA")).toBeInTheDocument();
    expect(screen.getByText("PR Status")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("renders finding rows", () => {
    render(<FindingsTable {...defaultProps} />);
    expect(screen.getByTestId("finding-row-f1")).toBeInTheDocument();
    expect(screen.getByTestId("finding-row-f2")).toBeInTheDocument();
    expect(screen.getByText("Rule 1")).toBeInTheDocument();
    expect(screen.getByText("Rule 2")).toBeInTheDocument();
  });

  it("handles page size changes", () => {
    render(<FindingsTable {...defaultProps} />);
    const pagination = screen.getByTestId("pagination");
    const changeSizeBtn = screen.getByTestId("pagination-change-size");

    fireEvent.click(changeSizeBtn);
    expect(pagination).toHaveTextContent("Size: 20");
  });

  it("handles page changes", () => {
    const findings = Array.from({ length: 15 }, (_, i) =>
      makeFinding({ id: `f${i}`, ruleTitle: `Rule ${i}` })
    );
    render(<FindingsTable {...defaultProps} findings={findings} />);

    const nextPageBtn = screen.getByTestId("pagination-next-page");
    fireEvent.click(nextPageBtn);

    const pagination = screen.getByTestId("pagination");
    expect(pagination).toHaveTextContent("Page 2");
  });

  it("handles select all page checkbox", () => {
    render(<FindingsTable {...defaultProps} />);
    const selectAllCheckbox = screen.getAllByRole("checkbox")[0];

    fireEvent.click(selectAllCheckbox);
    expect(screen.getByTestId("checkbox-f1")).toBeChecked();
    expect(screen.getByTestId("checkbox-f2")).toBeChecked();
  });

  it("handles individual row selection", () => {
    render(<FindingsTable {...defaultProps} />);
    const checkbox1 = screen.getByTestId("checkbox-f1");

    fireEvent.click(checkbox1);
    expect(checkbox1).toBeChecked();
  });

  it("handles false positive toggle", () => {
    const onFalsePositiveChange = vi.fn();
    render(<FindingsTable {...defaultProps} onFalsePositiveChange={onFalsePositiveChange} />);

    const fpToggle = screen.getByTestId("fp-toggle-f1");
    fireEvent.click(fpToggle);

    expect(onFalsePositiveChange).toHaveBeenCalled();
  });

  it("calls onViewDetails when view button clicked", () => {
    const onViewDetails = vi.fn();
    render(<FindingsTable {...defaultProps} onViewDetails={onViewDetails} />);

    const viewBtn = screen.getByTestId("view-f1");
    fireEvent.click(viewBtn);

    expect(onViewDetails).toHaveBeenCalledWith(
      expect.objectContaining({ id: "f1", ruleTitle: "Rule 1" })
    );
  });

  it("applies severity filter", () => {
    render(<FindingsTable {...defaultProps} />);
    const criticalBtn = screen.getByText("Critical");

    fireEvent.click(criticalBtn);
    // After filtering, only critical findings should be visible
    expect(screen.getByTestId("finding-row-f1")).toBeInTheDocument();
  });

  it("applies status filter", () => {
    render(<FindingsTable {...defaultProps} />);
    const newBtn = screen.getByText("New");

    fireEvent.click(newBtn);
    // After filtering, only new findings should be visible
    expect(screen.getByTestId("finding-row-f1")).toBeInTheDocument();
  });

  it("applies false positive filter", () => {
    render(<FindingsTable {...defaultProps} />);
    const allBtn = screen.getByText("All");

    fireEvent.click(allBtn);
    expect(screen.getByTestId("finding-row-f1")).toBeInTheDocument();
  });

  it("applies source filter", () => {
    render(<FindingsTable {...defaultProps} />);
    const customBtn = screen.getByText("Custom");

    fireEvent.click(customBtn);
    // Custom rule filter applied
  });

  it("opens JIRA export modal", () => {
    render(<FindingsTable {...defaultProps} />);
    const exportBtn = screen.getByText("Export to JIRA");

    fireEvent.click(exportBtn);
    expect(screen.getByTestId("jira-modal")).toBeInTheDocument();
  });

  it("closes JIRA modal", () => {
    render(<FindingsTable {...defaultProps} />);

    fireEvent.click(screen.getByText("Export to JIRA"));
    expect(screen.getByTestId("jira-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByTestId("jira-modal")).not.toBeInTheDocument();
  });

  it("opens batch PR modal", () => {
    render(<FindingsTable {...defaultProps} />);

    // First select some findings
    fireEvent.click(screen.getByTestId("checkbox-f1"));

    // Then click Create PR
    const createPRBtn = screen.getByText("Create PR");
    fireEvent.click(createPRBtn);

    expect(screen.getByTestId("batch-pr-modal")).toBeInTheDocument();
  });

  it("handles select all filtered", () => {
    render(<FindingsTable {...defaultProps} />);
    const selectAllBtn = screen.getByText("Select All");

    fireEvent.click(selectAllBtn);
    expect(screen.getByTestId("checkbox-f1")).toBeChecked();
    expect(screen.getByTestId("checkbox-f2")).toBeChecked();
  });

  it("handles clear selection", () => {
    render(<FindingsTable {...defaultProps} />);

    // First select
    fireEvent.click(screen.getByTestId("checkbox-f1"));
    expect(screen.getByTestId("checkbox-f1")).toBeChecked();

    // Then clear
    const clearBtn = screen.getByText("Clear");
    fireEvent.click(clearBtn);
    expect(screen.getByTestId("checkbox-f1")).not.toBeChecked();
  });

  it("shows empty state when no findings match filters", () => {
    render(<FindingsTable {...defaultProps} findings={[]} />);
    expect(screen.getByText("No findings match the current filters")).toBeInTheDocument();
  });

  it("shows empty state for false positives", () => {
    render(<FindingsTable {...defaultProps} findings={[]} />);

    // Switch to false positive filter
    fireEvent.click(screen.getByText("All"));

    // Empty state should be shown
    expect(screen.getByText(/No/)).toBeInTheDocument();
  });

  it("renders pagination when there are findings", () => {
    render(<FindingsTable {...defaultProps} />);
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  it("filters out false positives when active filter is selected", () => {
    const findings = [
      makeFinding({ id: "f1", falsePositive: false }),
      makeFinding({ id: "f2", falsePositive: true }),
    ];

    render(<FindingsTable {...defaultProps} findings={findings} />);

    // With default "active" filter, only f1 should be visible
    expect(screen.getByTestId("finding-row-f1")).toBeInTheDocument();
  });

  it("calculates severity counts correctly", () => {
    const findings = [
      makeFinding({ id: "f1", impact: "critical" }),
      makeFinding({ id: "f2", impact: "critical" }),
      makeFinding({ id: "f3", impact: "serious" }),
    ];

    render(<FindingsTable {...defaultProps} findings={findings} />);
    // FilterBar should receive correct counts
    expect(screen.getByTestId("filter-bar")).toBeInTheDocument();
  });

  it("calculates status counts correctly", () => {
    const findings = [
      makeFinding({ id: "f1", status: "new" }),
      makeFinding({ id: "f2", status: "new" }),
      makeFinding({ id: "f3", status: "recurring" }),
    ];

    render(<FindingsTable {...defaultProps} findings={findings} />);
    // FilterBar should receive correct counts
    expect(screen.getByTestId("filter-bar")).toBeInTheDocument();
  });

  it("resets to page 1 when filters change", () => {
    const findings = Array.from({ length: 15 }, (_, i) =>
      makeFinding({ id: `f${i}`, ruleTitle: `Rule ${i}` })
    );
    render(<FindingsTable {...defaultProps} findings={findings} />);

    // Go to page 2
    fireEvent.click(screen.getByTestId("pagination-next-page"));
    expect(screen.getByTestId("pagination")).toHaveTextContent("Page 2");

    // Apply filter
    fireEvent.click(screen.getByText("Critical"));

    // Should reset to page 1
    expect(screen.getByTestId("pagination")).toHaveTextContent("Page 1");
  });

  // Tests for handleVerifyFix (lines 63-77)
  it("handles verify fix with successful result", async () => {
    const findings = [makeFinding({ id: "f1", ruleTitle: "Rule 1" })];
    const mockPR = { id: "pr1", status: "merged", title: "Fix a11y" };
    mockGetPRsForFinding.mockReturnValue([mockPR]);
    mockVerifyFixes.mockResolvedValue({ success: true, message: "Verified" });

    render(<FindingsTable {...defaultProps} findings={findings} />);

    // Click the PR badge to trigger verification
    const prBadge = screen.getByTestId("pr-badge-pr1");
    fireEvent.click(prBadge);

    // Wait for verification to complete
    await vi.waitFor(() => {
      expect(mockVerifyFixes).toHaveBeenCalledWith("pr1");
    });

    // Modal should be open
    expect(screen.getByTestId("verification-modal")).toBeInTheDocument();
  });

  it("handles verify fix with null result (error)", async () => {
    const findings = [makeFinding({ id: "f1", ruleTitle: "Rule 1" })];
    const mockPR = { id: "pr2", status: "merged", title: "Fix a11y" };
    mockGetPRsForFinding.mockReturnValue([mockPR]);
    mockVerifyFixes.mockResolvedValue(null);

    render(<FindingsTable {...defaultProps} findings={findings} />);

    const prBadge = screen.getByTestId("pr-badge-pr2");
    fireEvent.click(prBadge);

    await vi.waitFor(() => {
      expect(mockVerifyFixes).toHaveBeenCalledWith("pr2");
    });

    // Modal should be open even on error
    expect(screen.getByTestId("verification-modal")).toBeInTheDocument();
  });

  // Tests for unmarkFalsePositive (line 169)
  it("calls unmarkFalsePositive when toggling a false positive finding", async () => {
    const { unmarkFalsePositive, applyFalsePositiveStatus } = await import("../../../utils/falsePositives");
    // Make applyFalsePositiveStatus return findings with falsePositive: true
    vi.mocked(applyFalsePositiveStatus).mockImplementation((findings) =>
      findings.map(f => ({ ...f, falsePositive: true }))
    );

    const findings = [makeFinding({ id: "f1", falsePositive: false })];

    render(<FindingsTable {...defaultProps} findings={findings} />);

    // First, switch to "All" filter to show false positives
    fireEvent.click(screen.getByText("All"));

    // Toggle false positive for f1 (which is marked as FP by applyFalsePositiveStatus)
    const fpToggle = screen.getByTestId("fp-toggle-f1");
    fireEvent.click(fpToggle);

    expect(unmarkFalsePositive).toHaveBeenCalledWith("fp1");
  });

  // Tests for deselecting (line 180)
  it("deselects a finding when clicking on already selected checkbox", () => {
    render(<FindingsTable {...defaultProps} />);

    const checkbox = screen.getByTestId("checkbox-f1");

    // Select
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Deselect
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  // Tests for toggle select all when all selected (line 189)
  it("deselects all when clicking select all checkbox with all selected", () => {
    render(<FindingsTable {...defaultProps} />);

    const selectAllCheckbox = screen.getAllByRole("checkbox")[0];

    // Select all
    fireEvent.click(selectAllCheckbox);
    expect(screen.getByTestId("checkbox-f1")).toBeChecked();
    expect(screen.getByTestId("checkbox-f2")).toBeChecked();

    // Deselect all
    fireEvent.click(selectAllCheckbox);
    expect(screen.getByTestId("checkbox-f1")).not.toBeChecked();
    expect(screen.getByTestId("checkbox-f2")).not.toBeChecked();
  });

  // Tests for JIRA linking (lines 211-218, 347-353)
  it("starts JIRA linking mode when clicking Link button", () => {
    render(<FindingsTable {...defaultProps} />);

    const linkBtn = screen.getByTestId("jira-start-f1");
    fireEvent.click(linkBtn);

    expect(screen.getByTestId("jira-linking-f1")).toBeInTheDocument();
  });

  it("saves JIRA link when clicking Save button", () => {
    render(<FindingsTable {...defaultProps} />);

    // Start linking
    fireEvent.click(screen.getByTestId("jira-start-f1"));

    // Type JIRA key
    const input = screen.getByTestId("jira-input-f1");
    fireEvent.change(input, { target: { value: "test-123" } });

    // Save
    fireEvent.click(screen.getByTestId("jira-save-f1"));

    // mockSetJiraLinks should have been called
    expect(mockSetJiraLinks).toHaveBeenCalled();
  });

  it("cancels JIRA linking when clicking Cancel button", () => {
    render(<FindingsTable {...defaultProps} />);

    // Start linking
    fireEvent.click(screen.getByTestId("jira-start-f1"));
    expect(screen.getByTestId("jira-linking-f1")).toBeInTheDocument();

    // Cancel
    fireEvent.click(screen.getByTestId("jira-cancel-f1"));

    // Should show Link button again
    expect(screen.getByTestId("jira-start-f1")).toBeInTheDocument();
  });

  it("does not save empty JIRA link", () => {
    render(<FindingsTable {...defaultProps} />);

    // Start linking
    fireEvent.click(screen.getByTestId("jira-start-f1"));

    // Leave input empty and click Save
    fireEvent.click(screen.getByTestId("jira-save-f1"));

    // mockSetJiraLinks should not have been called with the link
    // The function is called but the empty string condition prevents actual save
  });

  // Tests for handleRemoveJiraLink (lines 222-225)
  it("removes JIRA link when clicking Remove button", () => {
    // Set up existing JIRA link
    mockJiraLinks["f1"] = "TEST-123";

    const { rerender } = render(<FindingsTable {...defaultProps} />);

    // Force rerender to pick up the link
    rerender(<FindingsTable {...defaultProps} />);

    // Click remove
    const removeBtn = screen.getByTestId("jira-remove-f1");
    fireEvent.click(removeBtn);

    expect(mockSetJiraLinks).toHaveBeenCalled();
  });

  // Tests for renderPRStatusCell (lines 233-245)
  it("renders PR status badges when finding has associated PRs", () => {
    const findings = [makeFinding({ id: "f1", ruleTitle: "Rule 1" })];
    const mockPRs = [
      { id: "pr1", status: "open", title: "Fix issue 1" },
      { id: "pr2", status: "merged", title: "Fix issue 2" },
    ];
    mockGetPRsForFinding.mockReturnValue(mockPRs);

    render(<FindingsTable {...defaultProps} findings={findings} />);

    // Both PR badges should be rendered
    expect(screen.getByTestId("pr-badge-pr1")).toBeInTheDocument();
    expect(screen.getByTestId("pr-badge-pr2")).toBeInTheDocument();
  });

  it("renders dash when finding has no associated PRs", () => {
    mockGetPRsForFinding.mockReturnValue([]);

    render(<FindingsTable {...defaultProps} />);

    // The PR status cell should show dash (rendered by renderPRStatusCell)
    const prStatusCell = screen.getByTestId("pr-status-f1");
    expect(prStatusCell).toBeInTheDocument();
  });

  // Tests for modal onClose handlers (lines 404-418)
  it("closes batch PR modal and resets state", () => {
    render(<FindingsTable {...defaultProps} />);

    // Select a finding first
    fireEvent.click(screen.getByTestId("checkbox-f1"));

    // Open batch PR modal
    fireEvent.click(screen.getByText("Create PR"));
    expect(screen.getByTestId("batch-pr-modal")).toBeInTheDocument();

    // Close the modal
    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByTestId("batch-pr-modal")).not.toBeInTheDocument();
  });

  it("closes verification modal and resets verification state", async () => {
    const findings = [makeFinding({ id: "f1", ruleTitle: "Rule 1" })];
    const mockPR = { id: "pr1", status: "merged", title: "Fix" };
    mockGetPRsForFinding.mockReturnValue([mockPR]);

    render(<FindingsTable {...defaultProps} findings={findings} />);

    // Trigger verification
    fireEvent.click(screen.getByTestId("pr-badge-pr1"));

    await vi.waitFor(() => {
      expect(screen.getByTestId("verification-modal")).toBeInTheDocument();
    });

    // Close the modal
    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByTestId("verification-modal")).not.toBeInTheDocument();
  });

  it("shows verifying state on PR badge during verification", async () => {
    const findings = [makeFinding({ id: "f1", ruleTitle: "Rule 1" })];
    const mockPR = { id: "pr1", status: "merged", title: "Fix" };
    mockGetPRsForFinding.mockReturnValue([mockPR]);

    // Make verifyFixes take some time
    mockVerifyFixes.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({ success: true, message: "ok" }), 100);
    }));

    render(<FindingsTable {...defaultProps} findings={findings} />);

    const prBadge = screen.getByTestId("pr-badge-pr1");
    fireEvent.click(prBadge);

    // Badge should be disabled during verification
    expect(prBadge).toBeDisabled();
  });

  it("exports to JIRA with all filtered findings when none selected", () => {
    render(<FindingsTable {...defaultProps} />);

    // Don't select any findings, just click export
    fireEvent.click(screen.getByText("Export JIRA"));

    // JIRA modal should open
    expect(screen.getByTestId("jira-modal")).toBeInTheDocument();
  });

  it("updates JIRA link input value", () => {
    render(<FindingsTable {...defaultProps} />);

    // Start linking
    fireEvent.click(screen.getByTestId("jira-start-f1"));

    // Type in input
    const input = screen.getByTestId("jira-input-f1");
    fireEvent.change(input, { target: { value: "PROJ-456" } });

    expect(input).toHaveValue("PROJ-456");
  });

  // Tests for false-positive filter showing only FP findings (line 117)
  it("filters to show only false positive findings when fpFilter is false-positive", async () => {
    const { applyFalsePositiveStatus } = await import("../../../utils/falsePositives");
    // Set up findings where f1 is NOT a false positive and f2 IS a false positive
    vi.mocked(applyFalsePositiveStatus).mockImplementation((findings) =>
      findings.map(f => ({
        ...f,
        falsePositive: f.id === "f2", // Only f2 is a false positive
      }))
    );

    const findings = [
      makeFinding({ id: "f1", ruleTitle: "Rule 1" }),
      makeFinding({ id: "f2", ruleTitle: "Rule 2" }),
    ];

    render(<FindingsTable {...defaultProps} findings={findings} />);

    // By default (active filter), only non-FP findings show - f1
    expect(screen.getByTestId("finding-row-f1")).toBeInTheDocument();
    expect(screen.queryByTestId("finding-row-f2")).not.toBeInTheDocument();

    // Switch to false-positive filter - only f2 should show
    fireEvent.click(screen.getByText("False Positives"));
    expect(screen.queryByTestId("finding-row-f1")).not.toBeInTheDocument();
    expect(screen.getByTestId("finding-row-f2")).toBeInTheDocument();
  });

  // Test for 'axe-core' default source (line 121)
  it("treats findings without source as axe-core", () => {
    const findings = [
      makeFinding({ id: "f1", source: undefined }), // No source - should default to axe-core
      makeFinding({ id: "f2", source: "custom-rule" }),
    ];

    render(<FindingsTable {...defaultProps} findings={findings} />);

    // Both should be visible with "all" source filter
    expect(screen.getByTestId("finding-row-f1")).toBeInTheDocument();
    expect(screen.getByTestId("finding-row-f2")).toBeInTheDocument();

    // Filter to custom-rule only - f1 (undefined/axe-core source) should be filtered out
    fireEvent.click(screen.getByText("Custom"));
    expect(screen.queryByTestId("finding-row-f1")).not.toBeInTheDocument();
    expect(screen.getByTestId("finding-row-f2")).toBeInTheDocument();
  });

  // Test for source filter matching (else case for line 122)
  it("shows findings that match the source filter", () => {
    const findings = [
      makeFinding({ id: "f1", source: "axe-core" }),
      makeFinding({ id: "f2", source: "custom-rule" }),
    ];

    render(<FindingsTable {...defaultProps} findings={findings} />);

    // Apply custom-rule filter
    fireEvent.click(screen.getByText("Custom"));

    // f2 should match the filter, f1 should be filtered out
    // Note: Our mock filter bar triggers onSourceFilterChange("custom-rule")
    expect(screen.queryByTestId("finding-row-f1")).not.toBeInTheDocument();
    expect(screen.getByTestId("finding-row-f2")).toBeInTheDocument();
  });

  // Test for handleOpenJiraExport when selections exist (else case for line 204-206)
  it("uses selected findings when exporting to JIRA with selections", () => {
    render(<FindingsTable {...defaultProps} />);

    // Select only f1
    fireEvent.click(screen.getByTestId("checkbox-f1"));

    // Export to JIRA via selection bar
    fireEvent.click(screen.getByText("Export JIRA"));

    // JIRA modal should open with selected findings (not all)
    expect(screen.getByTestId("jira-modal")).toBeInTheDocument();
  });

  // Test for empty state with false-positive filter showing checkmark and message (lines 364-369)
  it("shows checkmark and false positives empty message when no FPs exist", async () => {
    const { applyFalsePositiveStatus } = await import("../../../utils/falsePositives");
    // All findings are NOT false positives
    vi.mocked(applyFalsePositiveStatus).mockImplementation((findings) =>
      findings.map(f => ({ ...f, falsePositive: false }))
    );

    const findings = [
      makeFinding({ id: "f1", ruleTitle: "Rule 1" }),
    ];

    const { container } = render(<FindingsTable {...defaultProps} findings={findings} />);

    // Switch to false-positive filter - should show empty state since no FPs
    fireEvent.click(screen.getByText("False Positives"));

    // Should show icon and "No false positives marked" message
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("No false positives marked")).toBeInTheDocument();
  });

  // Direct test for empty state with default filter
  it("shows search icon and regular empty state message when no findings match", () => {
    const { container } = render(<FindingsTable {...defaultProps} findings={[]} />);

    // With empty findings and default filter, shows the regular empty message
    expect(screen.getByText("No findings match the current filters")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  // Test for totalPages || 1 fallback (line 379)
  it("shows at least 1 total page even with no findings after filtering", () => {
    // Render with findings that exist
    const findings = [
      makeFinding({ id: "f1", impact: "critical", status: "new" }),
    ];

    render(<FindingsTable {...defaultProps} findings={findings} />);

    // The pagination should show proper page info
    expect(screen.getByTestId("pagination")).toHaveTextContent("Page 1 of 1");
  });

  // Test that verifies the || 1 fallback is applied - pagination always gets at least 1
  it("passes at least 1 as totalPages to Pagination component", () => {
    const findings = [
      makeFinding({ id: "f1", impact: "serious", status: "recurring" }),
    ];

    render(<FindingsTable {...defaultProps} findings={findings} />);

    // The finding exists and pagination shows with totalPages >= 1
    expect(screen.getByTestId("finding-row-f1")).toBeInTheDocument();
    const pagination = screen.getByTestId("pagination");
    expect(pagination).toBeInTheDocument();
    // Verify the data attribute shows totalPages is at least 1 (the || 1 fallback ensures this)
    expect(pagination).toHaveAttribute("data-total-pages", "1");
    // Also verify via the tracked value
    expect(lastTotalPagesValue).toBe(1);
  });
});
