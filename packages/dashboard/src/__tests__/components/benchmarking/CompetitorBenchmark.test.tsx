// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { CompetitorBenchmark } from "../../../components/benchmarking/CompetitorBenchmark";

afterEach(() => {
  cleanup();
});

// Mock hooks
const mockAddCompetitor = vi.fn();
const mockRemoveCompetitor = vi.fn();
const mockScanCompetitor = vi.fn();
const mockScanAll = vi.fn();
const mockGetBenchmarkData = vi.fn();
const mockSuccess = vi.fn();
const mockError = vi.fn();
const mockWarning = vi.fn();
const mockCloseToast = vi.fn();

vi.mock("../../../hooks", () => ({
  useCompetitors: () => ({
    competitors: mockCompetitors,
    isScanning: mockIsScanning,
    scanningId: mockScanningId,
    addCompetitor: mockAddCompetitor,
    removeCompetitor: mockRemoveCompetitor,
    scanCompetitor: mockScanCompetitor,
    scanAll: mockScanAll,
    getBenchmarkData: mockGetBenchmarkData,
  }),
  useToast: () => ({
    toasts: mockToasts,
    success: mockSuccess,
    error: mockError,
    warning: mockWarning,
    closeToast: mockCloseToast,
  }),
}));

// Mock UI components
vi.mock("../../../components/ui", () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    size,
    style,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
    style?: React.CSSProperties;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      style={style}
    >
      {children}
    </button>
  ),
  Input: ({
    value,
    onChange,
    placeholder,
    onKeyDown,
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    onKeyDown?: (e: React.KeyboardEvent) => void;
  }) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
    />
  ),
  EmptyState: ({
    icon,
    title,
    description,
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
  }) => (
    <div data-testid="empty-state">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
  Toast: ({
    toasts,
    onClose,
  }: {
    toasts: Array<{ id: string; message: string }>;
    onClose: (id: string) => void;
  }) => (
    <div data-testid="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} data-testid={`toast-${toast.id}`}>
          {toast.message}
          <button onClick={() => onClose(toast.id)}>Close</button>
        </div>
      ))}
    </div>
  ),
}));

// Mock data
let mockCompetitors: Array<{
  id: string;
  name: string;
  url: string;
  lastScore?: number;
  lastScanned?: string;
}> = [];
let mockIsScanning = false;
let mockScanningId: string | null = null;
let mockToasts: Array<{ id: string; message: string }> = [];

describe("benchmarking/CompetitorBenchmark", () => {
  beforeEach(() => {
    mockCompetitors = [];
    mockIsScanning = false;
    mockScanningId = null;
    mockToasts = [];
    mockGetBenchmarkData.mockReturnValue(null);
    vi.clearAllMocks();
  });

  it("renders the add competitor section", () => {
    render(<CompetitorBenchmark />);
    // Plus icon is now used instead of emoji
    expect(screen.getByText("Add Competitor")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("https://competitor.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Name (optional)")).toBeInTheDocument();
    expect(screen.getByText("+ Add")).toBeInTheDocument();
  });

  it("renders competitor comparison section", () => {
    render(<CompetitorBenchmark />);
    // Trophy icon is now used instead of emoji
    expect(screen.getByText("Competitor Comparison (0)")).toBeInTheDocument();
  });

  it("renders empty state when no competitors", () => {
    render(<CompetitorBenchmark />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No Competitors Added")).toBeInTheDocument();
    expect(
      screen.getByText("Add competitor URLs above to compare accessibility scores")
    ).toBeInTheDocument();
  });

  it("disables Add button when URL is empty", () => {
    render(<CompetitorBenchmark />);
    const addButton = screen.getByText("+ Add");
    expect(addButton).toBeDisabled();
  });

  it("enables Add button when URL is entered", () => {
    render(<CompetitorBenchmark />);
    const urlInput = screen.getByPlaceholderText("https://competitor.com");
    fireEvent.change(urlInput, { target: { value: "https://example.com" } });
    const addButton = screen.getByText("+ Add");
    expect(addButton).not.toBeDisabled();
  });

  it("adds competitor when Add button is clicked with valid URL", () => {
    render(<CompetitorBenchmark />);
    const urlInput = screen.getByPlaceholderText("https://competitor.com");
    const nameInput = screen.getByPlaceholderText("Name (optional)");

    fireEvent.change(urlInput, { target: { value: "https://competitor.com" } });
    fireEvent.change(nameInput, { target: { value: "Competitor A" } });
    fireEvent.click(screen.getByText("+ Add"));

    expect(mockAddCompetitor).toHaveBeenCalledWith("https://competitor.com", "Competitor A");
    expect(mockSuccess).toHaveBeenCalledWith("Added competitor: Competitor A");
  });

  it("adds competitor with hostname as name when name is not provided", () => {
    render(<CompetitorBenchmark />);
    const urlInput = screen.getByPlaceholderText("https://competitor.com");

    fireEvent.change(urlInput, { target: { value: "https://example.org" } });
    fireEvent.click(screen.getByText("+ Add"));

    expect(mockAddCompetitor).toHaveBeenCalledWith("https://example.org", undefined);
    expect(mockSuccess).toHaveBeenCalledWith("Added competitor: example.org");
  });

  it("shows warning for invalid URL", () => {
    render(<CompetitorBenchmark />);
    const urlInput = screen.getByPlaceholderText("https://competitor.com");

    fireEvent.change(urlInput, { target: { value: "not-a-valid-url" } });
    fireEvent.click(screen.getByText("+ Add"));

    expect(mockWarning).toHaveBeenCalledWith(
      "Please enter a valid URL (e.g., https://example.com)"
    );
    expect(mockAddCompetitor).not.toHaveBeenCalled();
  });

  it("adds competitor on Enter key in URL input", () => {
    render(<CompetitorBenchmark />);
    const urlInput = screen.getByPlaceholderText("https://competitor.com");

    fireEvent.change(urlInput, { target: { value: "https://test.com" } });
    fireEvent.keyDown(urlInput, { key: "Enter" });

    expect(mockAddCompetitor).toHaveBeenCalled();
  });

  it("adds competitor on Enter key in name input", () => {
    render(<CompetitorBenchmark />);
    const urlInput = screen.getByPlaceholderText("https://competitor.com");
    const nameInput = screen.getByPlaceholderText("Name (optional)");

    fireEvent.change(urlInput, { target: { value: "https://test.com" } });
    fireEvent.keyDown(nameInput, { key: "Enter" });

    expect(mockAddCompetitor).toHaveBeenCalled();
  });

  it("does not add competitor when URL is empty", () => {
    render(<CompetitorBenchmark />);
    const urlInput = screen.getByPlaceholderText("https://competitor.com");

    fireEvent.change(urlInput, { target: { value: "   " } });
    fireEvent.click(screen.getByText("+ Add"));

    expect(mockAddCompetitor).not.toHaveBeenCalled();
  });

  it("does not add competitor when URL is completely empty string", () => {
    render(<CompetitorBenchmark />);
    // Don't type anything in the URL input, just click Add
    fireEvent.click(screen.getByText("+ Add"));

    expect(mockAddCompetitor).not.toHaveBeenCalled();
    expect(mockWarning).not.toHaveBeenCalled();
  });

  it("returns early from handleAdd when newUrl.trim() is empty (covers line 31 return)", () => {
    render(<CompetitorBenchmark />);
    const urlInput = screen.getByPlaceholderText("https://competitor.com") as HTMLInputElement;

    // Verify initial state is empty
    expect(urlInput.value).toBe("");

    // Click Add with empty URL - should hit early return at line 31
    fireEvent.click(screen.getByText("+ Add"));

    // Should return early - no URL validation attempted, no addCompetitor called
    expect(mockAddCompetitor).not.toHaveBeenCalled();
    expect(mockWarning).not.toHaveBeenCalled();
    expect(mockSuccess).not.toHaveBeenCalled();
  });

  it("triggers early return via Enter key with empty URL", () => {
    render(<CompetitorBenchmark />);
    const urlInput = screen.getByPlaceholderText("https://competitor.com") as HTMLInputElement;

    // Press Enter with empty URL - should hit early return
    fireEvent.keyDown(urlInput, { key: "Enter" });

    expect(mockAddCompetitor).not.toHaveBeenCalled();
    expect(mockWarning).not.toHaveBeenCalled();
  });

  it("triggers early return with whitespace-only URL", () => {
    render(<CompetitorBenchmark />);
    const urlInput = screen.getByPlaceholderText("https://competitor.com");

    // Set URL to whitespace only
    fireEvent.change(urlInput, { target: { value: "   " } });
    // Now add - should early return because trim() is empty
    fireEvent.click(screen.getByText("+ Add"));

    expect(mockAddCompetitor).not.toHaveBeenCalled();
    expect(mockWarning).not.toHaveBeenCalled();
  });

  it("clears inputs after successful add", () => {
    render(<CompetitorBenchmark />);
    const urlInput = screen.getByPlaceholderText(
      "https://competitor.com"
    ) as HTMLInputElement;
    const nameInput = screen.getByPlaceholderText("Name (optional)") as HTMLInputElement;

    fireEvent.change(urlInput, { target: { value: "https://test.com" } });
    fireEvent.change(nameInput, { target: { value: "Test" } });
    fireEvent.click(screen.getByText("+ Add"));

    expect(urlInput.value).toBe("");
    expect(nameInput.value).toBe("");
  });

  it("renders competitors list when competitors exist", () => {
    mockCompetitors = [
      {
        id: "1",
        name: "Competitor A",
        url: "https://competitor-a.com",
        lastScore: 85,
        lastScanned: "2024-01-15T10:00:00Z",
      },
    ];

    render(<CompetitorBenchmark />);
    // Trophy icon is now used instead of emoji
    expect(screen.getByText("Competitor Comparison (1)")).toBeInTheDocument();
    expect(screen.getByText("Competitor A")).toBeInTheDocument();
    expect(screen.getByText("competitor-a.com")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("renders Scan All button when competitors exist", () => {
    mockCompetitors = [
      { id: "1", name: "Competitor A", url: "https://competitor-a.com" },
    ];

    render(<CompetitorBenchmark />);
    // RefreshCw icon is now used instead of emoji, button text is just "Scan All"
    expect(screen.getByText("Scan All")).toBeInTheDocument();
  });

  it("shows scanning state in Scan All button", () => {
    mockCompetitors = [
      { id: "1", name: "Competitor A", url: "https://competitor-a.com" },
    ];
    mockIsScanning = true;

    render(<CompetitorBenchmark />);
    // Loader2 icon is now used instead of emoji
    expect(screen.getByText("Scanning...")).toBeInTheDocument();
    expect(screen.getByText("Scanning...")).toBeDisabled();
  });

  it("calls scanAll when Scan All button is clicked", async () => {
    mockCompetitors = [
      { id: "1", name: "Competitor A", url: "https://competitor-a.com" },
    ];
    mockScanAll.mockResolvedValue(undefined);

    render(<CompetitorBenchmark />);
    // RefreshCw icon is now used instead of emoji
    fireEvent.click(screen.getByText("Scan All"));

    await waitFor(() => {
      expect(mockScanAll).toHaveBeenCalled();
      expect(mockSuccess).toHaveBeenCalledWith("All competitors scanned successfully");
    });
  });

  it("shows error when scanAll fails", async () => {
    mockCompetitors = [
      { id: "1", name: "Competitor A", url: "https://competitor-a.com" },
    ];
    mockScanAll.mockRejectedValue(new Error("Scan failed"));

    render(<CompetitorBenchmark />);
    // RefreshCw icon is now used instead of emoji
    fireEvent.click(screen.getByText("Scan All"));

    await waitFor(() => {
      expect(mockError).toHaveBeenCalledWith("Failed to scan some competitors");
    });
  });

  it("renders Your Site row when yourSiteUrl and yourSiteScore are provided", () => {
    mockCompetitors = [
      { id: "1", name: "Competitor A", url: "https://competitor-a.com" },
    ];

    render(
      <CompetitorBenchmark yourSiteUrl="https://mysite.com" yourSiteScore={92} />
    );
    expect(screen.getByText("Your Site")).toBeInTheDocument();
    expect(screen.getByText("mysite.com")).toBeInTheDocument();
    expect(screen.getByText("92")).toBeInTheDocument();
    expect(screen.getByText("YOU")).toBeInTheDocument();
  });

  it("does not render Your Site row when yourSiteUrl is not provided", () => {
    mockCompetitors = [
      { id: "1", name: "Competitor A", url: "https://competitor-a.com" },
    ];

    render(<CompetitorBenchmark yourSiteScore={92} />);
    expect(screen.queryByText("Your Site")).not.toBeInTheDocument();
  });

  it("does not render Your Site row when yourSiteScore is not provided", () => {
    mockCompetitors = [
      { id: "1", name: "Competitor A", url: "https://competitor-a.com" },
    ];

    render(<CompetitorBenchmark yourSiteUrl="https://mysite.com" />);
    expect(screen.queryByText("Your Site")).not.toBeInTheDocument();
  });

  it("renders scan and delete buttons for competitors", () => {
    mockCompetitors = [
      { id: "1", name: "Competitor A", url: "https://competitor-a.com" },
    ];

    render(<CompetitorBenchmark />);
    // RefreshCw and Trash2 icons are now used instead of emojis
    // Check for button existence by role since icons don't have text content
    const buttons = screen.getAllByRole("button");
    // Should have "+ Add", "Scan All", scan button, and delete button
    expect(buttons.length).toBeGreaterThanOrEqual(4);
  });

  it("calls scanCompetitor when scan button is clicked", () => {
    mockCompetitors = [
      { id: "1", name: "Competitor A", url: "https://competitor-a.com" },
    ];

    render(<CompetitorBenchmark />);
    // RefreshCw icon is now used - get buttons and find the scan button (second to last before delete)
    const buttons = screen.getAllByRole("button");
    // Find the scan button for the competitor (it's a secondary variant button with RefreshCw icon)
    const scanButton = buttons.find(btn => btn.getAttribute("data-variant") === "secondary" && btn.getAttribute("data-size") === "sm");
    if (scanButton) fireEvent.click(scanButton);

    expect(mockScanCompetitor).toHaveBeenCalledWith(mockCompetitors[0]);
  });

  it("calls removeCompetitor when delete button is clicked", () => {
    mockCompetitors = [
      { id: "1", name: "Competitor A", url: "https://competitor-a.com" },
    ];

    render(<CompetitorBenchmark />);
    // Trash2 icon is now used - get buttons and find the delete button (ghost variant)
    const buttons = screen.getAllByRole("button");
    const deleteButton = buttons.find(btn => btn.getAttribute("data-variant") === "ghost");
    if (deleteButton) fireEvent.click(deleteButton);

    expect(mockRemoveCompetitor).toHaveBeenCalledWith("1");
    expect(mockSuccess).toHaveBeenCalledWith("Removed competitor: Competitor A");
  });

  it("shows scanning spinner for individual competitor being scanned", () => {
    mockCompetitors = [
      { id: "1", name: "Competitor A", url: "https://competitor-a.com" },
    ];
    mockScanningId = "1";

    render(<CompetitorBenchmark />);
    // Loader2 icon is now used instead of emoji - check that scanning state is handled
    // The scan button should be disabled when scanning
    const buttons = screen.getAllByRole("button");
    const scanButton = buttons.find(btn => btn.getAttribute("data-variant") === "secondary" && btn.getAttribute("data-size") === "sm");
    expect(scanButton).toBeDisabled();
  });

  it("shows Not scanned when competitor has no score", () => {
    mockCompetitors = [
      { id: "1", name: "Competitor A", url: "https://competitor-a.com" },
    ];

    render(<CompetitorBenchmark />);
    expect(screen.getByText("Not scanned")).toBeInTheDocument();
  });

  it("renders last scanned date", () => {
    mockCompetitors = [
      {
        id: "1",
        name: "Competitor A",
        url: "https://competitor-a.com",
        lastScanned: "2024-01-15T10:00:00Z",
      },
    ];

    render(<CompetitorBenchmark />);
    expect(screen.getByText(/Scanned:/)).toBeInTheDocument();
  });

  it("sorts competitors by score descending", () => {
    mockCompetitors = [
      { id: "1", name: "Low Score", url: "https://low.com", lastScore: 50 },
      { id: "2", name: "High Score", url: "https://high.com", lastScore: 90 },
      { id: "3", name: "Mid Score", url: "https://mid.com", lastScore: 70 },
    ];

    render(<CompetitorBenchmark />);
    const names = screen.getAllByText(/Score$/).map((el) => el.textContent);
    // High Score should appear first (sorted by score desc)
    expect(names[0]).toBe("High Score");
  });

  it("sorts competitors with undefined scores (treated as 0)", () => {
    mockCompetitors = [
      { id: "1", name: "No Score", url: "https://noscore.com" }, // undefined lastScore
      { id: "2", name: "Has Score", url: "https://hasscore.com", lastScore: 50 },
      { id: "3", name: "Also No Score", url: "https://alsonoscore.com" }, // undefined lastScore
    ];

    render(<CompetitorBenchmark />);
    // Should render without error - undefined scores sorted as 0
    expect(screen.getByText("No Score")).toBeInTheDocument();
    expect(screen.getByText("Has Score")).toBeInTheDocument();
    expect(screen.getByText("Also No Score")).toBeInTheDocument();
  });

  it("renders summary cards when benchmark data is available", () => {
    mockGetBenchmarkData.mockReturnValue({
      yourSite: { url: "https://mysite.com", score: 85 },
      competitors: [{ name: "Competitor A", score: 75 }],
      summary: {
        yourRank: 1,
        totalCompetitors: 1,
        beating: 1,
        losingTo: 0,
        averageScore: 80,
      },
    });

    render(<CompetitorBenchmark />);
    expect(screen.getByText("Your Rank")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("Beating")).toBeInTheDocument();
    expect(screen.getByText("Losing To")).toBeInTheDocument();
    expect(screen.getByText("Avg Score")).toBeInTheDocument();
  });

  it("renders score bar chart when benchmark data has competitors", () => {
    mockGetBenchmarkData.mockReturnValue({
      yourSite: { url: "https://mysite.com", score: 85 },
      competitors: [{ name: "Competitor A", score: 75 }],
      summary: {
        yourRank: 1,
        totalCompetitors: 1,
        beating: 1,
        losingTo: 0,
        averageScore: 80,
      },
    });

    render(<CompetitorBenchmark />);
    // BarChart3 icon is now used instead of emoji
    expect(screen.getByText("Score Comparison")).toBeInTheDocument();
  });

  it("does not render score bar chart when benchmark data has no competitors", () => {
    mockGetBenchmarkData.mockReturnValue({
      yourSite: { url: "https://mysite.com", score: 85 },
      competitors: [],
      summary: {
        yourRank: 1,
        totalCompetitors: 0,
        beating: 0,
        losingTo: 0,
        averageScore: 85,
      },
    });

    render(<CompetitorBenchmark />);
    // BarChart3 icon is now used instead of emoji
    expect(screen.queryByText("Score Comparison")).not.toBeInTheDocument();
  });

  it("renders toast container", () => {
    render(<CompetitorBenchmark />);
    expect(screen.getByTestId("toast-container")).toBeInTheDocument();
  });

  it("closes toast when close is clicked", () => {
    mockToasts = [{ id: "1", message: "Test toast" }];

    render(<CompetitorBenchmark />);
    fireEvent.click(screen.getByText("Close"));

    expect(mockCloseToast).toHaveBeenCalledWith("1");
  });
});

// Test helper functions indirectly through component rendering
describe("benchmarking/CompetitorBenchmark - getScoreColor", () => {
  beforeEach(() => {
    mockCompetitors = [];
    mockGetBenchmarkData.mockReturnValue(null);
    vi.clearAllMocks();
  });

  it("renders green color for score >= 90", () => {
    mockCompetitors = [
      { id: "1", name: "A", url: "https://a.com", lastScore: 95 },
    ];

    const { container } = render(<CompetitorBenchmark />);
    const scoreElement = container.querySelector('[style*="color: rgb(16, 185, 129)"]');
    expect(scoreElement).toBeInTheDocument();
  });

  it("renders yellow color for score >= 70", () => {
    mockCompetitors = [
      { id: "1", name: "A", url: "https://a.com", lastScore: 75 },
    ];

    const { container } = render(<CompetitorBenchmark />);
    const scoreElement = container.querySelector('[style*="color: rgb(245, 158, 11)"]');
    expect(scoreElement).toBeInTheDocument();
  });

  it("renders orange color for score >= 50", () => {
    mockCompetitors = [
      { id: "1", name: "A", url: "https://a.com", lastScore: 55 },
    ];

    const { container } = render(<CompetitorBenchmark />);
    const scoreElement = container.querySelector('[style*="color: rgb(234, 88, 12)"]');
    expect(scoreElement).toBeInTheDocument();
  });

  it("renders red color for score < 50", () => {
    mockCompetitors = [
      { id: "1", name: "A", url: "https://a.com", lastScore: 40 },
    ];

    const { container } = render(<CompetitorBenchmark />);
    const scoreElement = container.querySelector('[style*="color: rgb(220, 38, 38)"]');
    expect(scoreElement).toBeInTheDocument();
  });
});

describe("benchmarking/CompetitorBenchmark - getGrade", () => {
  beforeEach(() => {
    mockCompetitors = [];
    mockGetBenchmarkData.mockReturnValue(null);
    vi.clearAllMocks();
  });

  it("shows Grade A for score >= 90", () => {
    mockCompetitors = [
      { id: "1", name: "TestSite", url: "https://test.com", lastScore: 95 },
    ];

    const { container } = render(<CompetitorBenchmark />);
    // Grade A is shown with specific styling
    const gradeElements = container.querySelectorAll('[style*="font-size: 12px"][style*="font-weight: 600"]');
    const hasGradeA = Array.from(gradeElements).some(el => el.textContent === "A");
    expect(hasGradeA).toBe(true);
  });

  it("shows Grade B for score >= 80", () => {
    mockCompetitors = [
      { id: "1", name: "TestSite", url: "https://test.com", lastScore: 85 },
    ];

    const { container } = render(<CompetitorBenchmark />);
    const gradeElements = container.querySelectorAll('[style*="font-size: 12px"][style*="font-weight: 600"]');
    const hasGradeB = Array.from(gradeElements).some(el => el.textContent === "B");
    expect(hasGradeB).toBe(true);
  });

  it("shows Grade C for score >= 70", () => {
    mockCompetitors = [
      { id: "1", name: "TestSite", url: "https://test.com", lastScore: 75 },
    ];

    const { container } = render(<CompetitorBenchmark />);
    const gradeElements = container.querySelectorAll('[style*="font-size: 12px"][style*="font-weight: 600"]');
    const hasGradeC = Array.from(gradeElements).some(el => el.textContent === "C");
    expect(hasGradeC).toBe(true);
  });

  it("shows Grade D for score >= 60", () => {
    mockCompetitors = [
      { id: "1", name: "TestSite", url: "https://test.com", lastScore: 65 },
    ];

    const { container } = render(<CompetitorBenchmark />);
    const gradeElements = container.querySelectorAll('[style*="font-size: 12px"][style*="font-weight: 600"]');
    const hasGradeD = Array.from(gradeElements).some(el => el.textContent === "D");
    expect(hasGradeD).toBe(true);
  });

  it("shows Grade F for score < 60", () => {
    mockCompetitors = [
      { id: "1", name: "TestSite", url: "https://test.com", lastScore: 50 },
    ];

    const { container } = render(<CompetitorBenchmark />);
    const gradeElements = container.querySelectorAll('[style*="font-size: 12px"][style*="font-weight: 600"]');
    const hasGradeF = Array.from(gradeElements).some(el => el.textContent === "F");
    expect(hasGradeF).toBe(true);
  });
});

describe("benchmarking/CompetitorBenchmark - ScoreBarChart", () => {
  beforeEach(() => {
    mockCompetitors = [];
    vi.clearAllMocks();
  });

  it("renders bar chart with sorted sites", () => {
    mockGetBenchmarkData.mockReturnValue({
      yourSite: { url: "https://mysite.com", score: 80 },
      competitors: [
        { name: "High", score: 95 },
        { name: "Low", score: 60 },
      ],
      summary: {
        yourRank: 2,
        totalCompetitors: 2,
        beating: 1,
        losingTo: 1,
        averageScore: 78,
      },
    });

    render(<CompetitorBenchmark />);
    // All sites should be in the chart
    expect(screen.getAllByText("Your Site").length).toBeGreaterThan(0);
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
  });

  it("renders bar widths based on score percentage", () => {
    mockGetBenchmarkData.mockReturnValue({
      yourSite: { url: "https://mysite.com", score: 50 },
      competitors: [{ name: "Top", score: 100 }],
      summary: {
        yourRank: 2,
        totalCompetitors: 1,
        beating: 0,
        losingTo: 1,
        averageScore: 75,
      },
    });

    const { container } = render(<CompetitorBenchmark />);
    // Top score (100) should have 100% width
    const fullWidthBar = container.querySelector('[style*="width: 100%"]');
    expect(fullWidthBar).toBeInTheDocument();
  });
});

describe("benchmarking/CompetitorBenchmark - SummaryCard color", () => {
  beforeEach(() => {
    mockCompetitors = [];
    vi.clearAllMocks();
  });

  it("shows red color for Losing To when losingTo > 0", () => {
    mockGetBenchmarkData.mockReturnValue({
      yourSite: { url: "https://mysite.com", score: 70 },
      competitors: [{ name: "Better", score: 90 }],
      summary: {
        yourRank: 2,
        totalCompetitors: 1,
        beating: 0,
        losingTo: 1,
        averageScore: 80,
      },
    });

    const { container } = render(<CompetitorBenchmark />);
    // losingTo card should have red color
    const redElement = container.querySelector('[style*="color: rgb(239, 68, 68)"]');
    expect(redElement).toBeInTheDocument();
  });

  it("shows green color for Losing To when losingTo === 0", () => {
    mockGetBenchmarkData.mockReturnValue({
      yourSite: { url: "https://mysite.com", score: 95 },
      competitors: [{ name: "Lower", score: 80 }],
      summary: {
        yourRank: 1,
        totalCompetitors: 1,
        beating: 1,
        losingTo: 0,
        averageScore: 87,
      },
    });

    const { container } = render(<CompetitorBenchmark />);
    // All losingTo cards with 0 should be green
    const greenElements = container.querySelectorAll('[style*="color: rgb(16, 185, 129)"]');
    expect(greenElements.length).toBeGreaterThan(0);
  });
});
