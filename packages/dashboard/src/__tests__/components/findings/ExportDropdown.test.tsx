// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ExportDropdown } from "../../../components/findings/ExportDropdown";
import type { TrackedFinding } from "../../../types";

// Module-level mock functions for useToast
const mockSuccess = vi.fn();
const mockError = vi.fn();
const mockCloseToast = vi.fn();

// Mock UI components
vi.mock("../../../components/ui", () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
  Toast: () => <div data-testid="toast" />,
}));

// Mock useToast hook
vi.mock("../../../hooks", () => ({
  useToast: () => ({
    toasts: [],
    success: mockSuccess,
    error: mockError,
    closeToast: mockCloseToast,
  }),
}));

// Mock getApiBase
vi.mock("../../../utils/api", () => ({
  getApiBase: () => "http://localhost:3000/api",
}));

// Mock ExcelJS - uses named export pattern
vi.mock("exceljs", () => {
  const MockWorkbook = class {
    creator = "";
    created = new Date();
    addWorksheet() {
      return {
        columns: [],
        getRow: () => ({
          font: {},
          fill: {},
        }),
        addRow: () => ({
          getCell: () => ({
            fill: {},
            font: {},
          }),
        }),
      };
    }
    xlsx = {
      writeBuffer: async () => new ArrayBuffer(0),
    };
  };
  return {
    default: { Workbook: MockWorkbook },
    Workbook: MockWorkbook,
  };
});

// Mock fetch
global.fetch = vi.fn();

// Mock URL methods
global.URL.createObjectURL = vi.fn(() => "blob:mock");
global.URL.revokeObjectURL = vi.fn();

describe("findings/ExportDropdown", () => {
  const mockFindings: TrackedFinding[] = [
    {
      id: "f1",
      ruleId: "r1",
      ruleTitle: "Test Rule",
      description: "Test description",
      impact: "critical",
      selector: "div.test",
      html: "<div/>",
      helpUrl: "https://test.com",
      wcagTags: ["wcag2a"],
      source: "axe-core",
      status: "new",
      firstSeen: "2024-01-01T00:00:00Z",
      fingerprint: "fp1",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    cleanup();
  });

  it("renders export button", () => {
    render(<ExportDropdown findings={mockFindings} scanUrl="https://test.com" scanDate="2024-01-01" />);
    expect(screen.getByText("Export")).toBeInTheDocument();
  });

  it("disables button when no findings", () => {
    render(<ExportDropdown findings={[]} scanUrl="https://test.com" scanDate="2024-01-01" />);
    // The button contains a span with icon and text, so find by role
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("opens dropdown when button clicked", () => {
    render(<ExportDropdown findings={mockFindings} scanUrl="https://test.com" scanDate="2024-01-01" />);
    fireEvent.click(screen.getByText("Export"));
    expect(screen.getByText("Export as CSV")).toBeInTheDocument();
    expect(screen.getByText("Export as Excel")).toBeInTheDocument();
    expect(screen.getByText("Export as JSON")).toBeInTheDocument();
  });

  it("closes dropdown when backdrop clicked", () => {
    render(<ExportDropdown findings={mockFindings} scanUrl="https://test.com" scanDate="2024-01-01" />);
    fireEvent.click(screen.getByText("Export"));
    expect(screen.getByText("Export as CSV")).toBeInTheDocument();

    const backdrop = document.querySelector('[style*="position: fixed"]');
    fireEvent.click(backdrop!);
    expect(screen.queryByText("Export as CSV")).not.toBeInTheDocument();
  });

  it("shows dropdown items with icons", () => {
    render(<ExportDropdown findings={mockFindings} scanUrl="https://test.com" scanDate="2024-01-01" />);
    fireEvent.click(screen.getByText("Export"));

    // Icons are now SVG elements from lucide-react (FileText, BarChart3, Braces)
    const svgIcons = document.querySelectorAll("svg");
    expect(svgIcons.length).toBeGreaterThan(0);
    expect(screen.getByText("Export as CSV")).toBeInTheDocument();
    expect(screen.getByText("Export as Excel")).toBeInTheDocument();
    expect(screen.getByText("Export as JSON")).toBeInTheDocument();
  });

  it("changes button text when exporting", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      blob: async () => new Blob(),
    } as Response);

    render(<ExportDropdown findings={mockFindings} scanUrl="https://test.com" scanDate="2024-01-01" />);
    fireEvent.click(screen.getByText("Export"));
    fireEvent.click(screen.getByText("Export as CSV"));

    await waitFor(() => {
      expect(screen.queryByText("Exporting...")).toBeInTheDocument();
    });
  });

  it("closes dropdown after selecting export format", () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      blob: async () => new Blob(),
    } as Response);

    render(<ExportDropdown findings={mockFindings} scanUrl="https://test.com" scanDate="2024-01-01" />);
    fireEvent.click(screen.getByText("Export"));
    fireEvent.click(screen.getByText("Export as CSV"));

    expect(screen.queryByText("Export as CSV")).not.toBeInTheDocument();
  });

  it("renders toast component", () => {
    render(<ExportDropdown findings={mockFindings} scanUrl="https://test.com" scanDate="2024-01-01" />);
    expect(screen.getByTestId("toast")).toBeInTheDocument();
  });

  // Test for line 24: exportToExcel call
  it("exports to Excel format", async () => {
    render(<ExportDropdown findings={mockFindings} scanUrl="https://test.com" scanDate="2024-01-01" />);
    fireEvent.click(screen.getByText("Export"));
    fireEvent.click(screen.getByText("Export as Excel"));

    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalledWith("Exported 1 findings as EXCEL");
    });
  });

  // Test for line 48: throw error when response.ok is false
  it("throws error when export response is not ok", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    render(<ExportDropdown findings={mockFindings} scanUrl="https://test.com" scanDate="2024-01-01" />);
    fireEvent.click(screen.getByText("Export"));
    fireEvent.click(screen.getByText("Export as CSV"));

    await waitFor(() => {
      expect(mockError).toHaveBeenCalledWith("Failed to export as CSV. Please try again.");
    });
  });

  // Test for lines 64-65: catch block logs error and shows error toast
  it("handles export error and shows error toast", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

    render(<ExportDropdown findings={mockFindings} scanUrl="https://test.com" scanDate="2024-01-01" />);
    fireEvent.click(screen.getByText("Export"));
    fireEvent.click(screen.getByText("Export as JSON"));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Export failed:", expect.any(Error));
      expect(mockError).toHaveBeenCalledWith("Failed to export as JSON. Please try again.");
    });

    consoleErrorSpy.mockRestore();
  });

  // Test for lines 121-126: Export as Excel and JSON onClick handlers
  it("calls handleExport with json format when Export as JSON is clicked", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      blob: async () => new Blob(),
    } as Response);

    render(<ExportDropdown findings={mockFindings} scanUrl="https://test.com" scanDate="2024-01-01" />);
    fireEvent.click(screen.getByText("Export"));
    fireEvent.click(screen.getByText("Export as JSON"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/export/json",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });
  });

  // Test for lines 152-153: DropdownItem onMouseEnter/onMouseLeave (hover state)
  it("changes background on hover for dropdown items", () => {
    render(<ExportDropdown findings={mockFindings} scanUrl="https://test.com" scanDate="2024-01-01" />);
    fireEvent.click(screen.getByText("Export"));

    const csvButton = screen.getByText("Export as CSV").closest("button")!;

    // Initially no hover background
    expect(csvButton).toHaveStyle({ background: "none" });

    // Hover - should change background
    fireEvent.mouseEnter(csvButton);
    expect(csvButton).toHaveStyle({ background: "rgb(248, 250, 252)" });

    // Leave hover - should reset background
    fireEvent.mouseLeave(csvButton);
    expect(csvButton).toHaveStyle({ background: "none" });
  });

  // Test for exportToExcel function (lines 177-260)
  it("exports to Excel with proper workbook structure", async () => {
    render(<ExportDropdown findings={mockFindings} scanUrl="https://test.com" scanDate="2024-01-01" />);
    fireEvent.click(screen.getByText("Export"));
    fireEvent.click(screen.getByText("Export as Excel"));

    await waitFor(() => {
      // Verify the download link was created and clicked
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  // Test for exportToExcel with multiple findings including different severities
  it("exports Excel with color-coded severity cells", async () => {
    const findingsWithDifferentSeverities: TrackedFinding[] = [
      { ...mockFindings[0], id: "f1", impact: "critical" },
      { ...mockFindings[0], id: "f2", impact: "serious" },
      { ...mockFindings[0], id: "f3", impact: "moderate" },
      { ...mockFindings[0], id: "f4", impact: "minor" },
    ];

    render(<ExportDropdown findings={findingsWithDifferentSeverities} scanUrl="https://test.com" scanDate="2024-01-01" />);
    fireEvent.click(screen.getByText("Export"));
    fireEvent.click(screen.getByText("Export as Excel"));

    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalledWith("Exported 4 findings as EXCEL");
    });
  });

  // Test for exportToExcel with finding without status (uses 'new' default)
  it("exports Excel with default status when finding has no status", async () => {
    const findingWithoutStatus: TrackedFinding[] = [
      { ...mockFindings[0], status: undefined as unknown as TrackedFinding["status"] },
    ];

    render(<ExportDropdown findings={findingWithoutStatus} scanUrl="https://test.com" scanDate="2024-01-01" />);
    fireEvent.click(screen.getByText("Export"));
    fireEvent.click(screen.getByText("Export as Excel"));

    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalledWith("Exported 1 findings as EXCEL");
    });
  });

  // Test for exportToExcel with false positive finding
  it("exports Excel with false positive indicator", async () => {
    const fpFinding: TrackedFinding[] = [
      { ...mockFindings[0], falsePositive: true },
    ];

    render(<ExportDropdown findings={fpFinding} scanUrl="https://test.com" scanDate="2024-01-01" />);
    fireEvent.click(screen.getByText("Export"));
    fireEvent.click(screen.getByText("Export as Excel"));

    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalledWith("Exported 1 findings as EXCEL");
    });
  });

  // Test for DropdownItem isLast prop (no border on last item)
  it("renders last dropdown item without bottom border", () => {
    render(<ExportDropdown findings={mockFindings} scanUrl="https://test.com" scanDate="2024-01-01" />);
    fireEvent.click(screen.getByText("Export"));

    const jsonButton = screen.getByText("Export as JSON").closest("button")!;
    const csvButton = screen.getByText("Export as CSV").closest("button")!;

    // JSON is the last item - all border is none (border-style: none)
    const jsonStyle = jsonButton.getAttribute("style") || "";
    expect(jsonStyle).toContain("border-style: none");

    // CSV is not the last - border-style includes 'solid' for the bottom border
    const csvStyle = csvButton.getAttribute("style") || "";
    expect(csvStyle).toContain("solid");
    // The border color includes the border-bottom color
    expect(csvStyle).toContain("rgb(241, 245, 249)");
  });

  // Test successful CSV export shows success toast
  it("shows success toast after successful CSV export", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      blob: async () => new Blob(),
    } as Response);

    render(<ExportDropdown findings={mockFindings} scanUrl="https://test.com" scanDate="2024-01-01" />);
    fireEvent.click(screen.getByText("Export"));
    fireEvent.click(screen.getByText("Export as CSV"));

    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalledWith("Exported 1 findings as CSV");
    });
  });

  // Test for line 238: unknown severity (branch where severityColors[f.impact] is falsy)
  it("exports Excel with unknown severity without color coding", async () => {
    const findingWithUnknownSeverity: TrackedFinding[] = [
      { ...mockFindings[0], id: "f1", impact: "unknown" as TrackedFinding["impact"] },
    ];

    render(<ExportDropdown findings={findingWithUnknownSeverity} scanUrl="https://test.com" scanDate="2024-01-01" />);
    fireEvent.click(screen.getByText("Export"));
    fireEvent.click(screen.getByText("Export as Excel"));

    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalledWith("Exported 1 findings as EXCEL");
    });
  });
});
