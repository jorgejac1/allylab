// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, act, within, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ScanHistory } from "../../../components/reports/ScanHistory";
import type { SavedScan, DateRange, DateRangeOption, SortOption } from "../../../types";
import type { RegressionInfo } from "../../../hooks/useScans";

let toolbarProps: {
  filterUrl: string;
  onFilterUrlChange: (url: string) => void;
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  dateRangeOption: DateRangeOption;
  onDateRangeOptionChange: (o: DateRangeOption) => void;
  customDateRange: DateRange;
  onCustomDateChange: (field: "start" | "end", value: string) => void;
  showCustomPicker: boolean;
  compareMode: boolean;
  compareSelectionCount: number;
  onCompareModeToggle: () => void;
  onCompareSubmit: () => void;
  onCompareCancel: () => void;
  canCompare: boolean;
  onClearAll: () => void;
  uniqueUrls: string[];
};

vi.mock("../../../components/ui", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  Button: ({
    children,
    onClick,
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
  }) => (
    <button onClick={onClick} data-variant={variant}>
      {children}
    </button>
  ),
  EmptyState: ({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) => (
    <div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}));

vi.mock("../../../components/reports/scan-history", () => ({
  ScanHistoryToolbar: (props: typeof toolbarProps) => {
    toolbarProps = props;
    return (
      <div data-testid="toolbar">
        <button onClick={() => props.onSortChange("score-low")}>Sort Score Low</button>
        <button onClick={() => props.onFilterUrlChange("allylab.com")}>Filter Ally</button>
        <button onClick={() => props.onDateRangeOptionChange("custom")}>Custom Range</button>
        <button onClick={() => props.onCustomDateChange("start", "2024-01-01")}>Set Start</button>
        <button onClick={() => props.onClearAll()}>Clear All</button>
        <button onClick={() => props.onCompareModeToggle()}>Compare Mode</button>
        <button onClick={() => props.onCompareSubmit()}>Submit Compare</button>
        <button onClick={() => props.onCompareCancel()}>Cancel Compare</button>
      </div>
    );
  },
  ScanCard: ({
    scan,
    onSelect,
    onCompareToggle,
    onDelete,
  }: {
    scan: SavedScan;
    onSelect: (scan: SavedScan) => void;
    onCompareToggle?: (scan: SavedScan) => void;
    onDelete?: (scanId: string) => void;
  }) => (
    <div data-testid={`scan-${scan.id}`}>
      <span>{scan.url}</span>
      <button onClick={() => onSelect(scan)}>Select</button>
      <button onClick={() => onCompareToggle?.(scan)}>Toggle Compare</button>
      {onDelete && <button onClick={() => onDelete(scan.id)}>Delete</button>}
    </div>
  ),
}));

const makeScan = (overrides: Partial<SavedScan> = {}): SavedScan => ({
  id: overrides.id || "s1",
  url: overrides.url || "https://allylab.com/page",
  timestamp: overrides.timestamp || new Date().toISOString(),
  score: overrides.score ?? 70,
  totalIssues: overrides.totalIssues ?? 5,
  critical: overrides.critical ?? 1,
  serious: overrides.serious ?? 1,
  moderate: overrides.moderate ?? 1,
  minor: overrides.minor ?? 2,
  findings: [],
  scanDuration: 100,
});

describe("reports/ScanHistory", () => {
  const onSelectScan = vi.fn();
  const onCompare = vi.fn();
  const onDeleteScan = vi.fn();
  const hasRegression = vi.fn((id: string): RegressionInfo | undefined =>
    id === "s1"
      ? {
          scanId: id,
          currentScore: 60,
          previousScore: 80,
          scoreDrop: 20,
          url: "allylab.com",
          timestamp: new Date().toISOString(),
        }
      : undefined
  );

  const scans: SavedScan[] = [
    makeScan({ id: "s1", url: "https://allylab.com", score: 80, timestamp: new Date("2024-01-02").toISOString() }),
    makeScan({ id: "s2", url: "https://allylab.com/other", score: 60, totalIssues: 10, timestamp: new Date("2024-01-01").toISOString() }),
    makeScan({ id: "s3", url: "https://other.com", score: 50, totalIssues: 2 }),
  ];

  beforeEach(() => {
    onSelectScan.mockReset();
    onCompare.mockReset();
  });

  afterEach(() => cleanup());

  it("shows empty state when no scans", () => {
    render(<ScanHistory scans={[]} onSelectScan={onSelectScan} />);
    expect(screen.getByText("No Scan History")).toBeInTheDocument();
  });

  it("sorts, filters, clears, and handles custom date picker state", () => {
    render(
      <ScanHistory
        scans={scans}
        onSelectScan={onSelectScan}
        onDeleteScan={onDeleteScan}
        onCompare={onCompare}
        hasRegression={hasRegression}
        selectedScanId="s3"
      />
    );

    // default shows all scans
    expect(screen.getAllByTestId(/scan-/)).toHaveLength(3);

    // change sort
    act(() => toolbarProps.onSortChange("score-low"));
    // after sort score-low the first rendered should be lowest score (s3)
    expect(screen.getAllByTestId(/scan-/)[0]).toHaveAttribute("data-testid", "scan-s3");

    // filter by hostname
    act(() => toolbarProps.onFilterUrlChange("allylab.com"));
    expect(screen.getAllByTestId(/scan-/)).toHaveLength(2);

    // custom date range toggles picker flag
    act(() => toolbarProps.onDateRangeOptionChange("custom"));
    expect(toolbarProps.showCustomPicker).toBe(true);
    act(() => toolbarProps.onCustomDateChange("start", "2024-01-01"));
    expect(toolbarProps.customDateRange.start).toBeInstanceOf(Date);

    // clear filters resets list
    act(() => toolbarProps.onClearAll());
    expect(screen.getAllByTestId(/scan-/)).toHaveLength(3);
  });

  it("shows filtered empty state and clears filters via button", () => {
    render(<ScanHistory scans={scans} onSelectScan={onSelectScan} onCompare={onCompare} />);
    act(() => toolbarProps.onFilterUrlChange("nonexistent.com"));
    expect(screen.getByText(/No scans match your filters/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Clear Filters"));
    expect(screen.getAllByTestId(/scan-/).length).toBeGreaterThanOrEqual(3);
  });

  it("applies date range bounds and exercises all sorting branches", () => {
    const datedScans: SavedScan[] = [
      makeScan({ id: "a", score: 90, totalIssues: 1, timestamp: new Date("2024-01-03").toISOString() }),
      makeScan({ id: "b", score: 70, totalIssues: 5, timestamp: new Date("2024-01-01").toISOString() }),
      makeScan({ id: "c", score: 80, totalIssues: 2, timestamp: new Date("2024-01-02").toISOString() }),
    ];

    const { container } = render(<ScanHistory scans={datedScans} onSelectScan={onSelectScan} onCompare={onCompare} />);

    act(() => toolbarProps.onDateRangeOptionChange("custom"));
    act(() => toolbarProps.onCustomDateChange("start", "2024-01-02"));
    act(() => toolbarProps.onCustomDateChange("end", "2024-01-02"));
    const filteredCards = within(container).getAllByTestId(/^scan-/);
    expect(filteredCards).toHaveLength(1);
    expect(screen.getByTestId("scan-c")).toBeInTheDocument();

    // clearing a date to hit null branch
    act(() => toolbarProps.onCustomDateChange("start", ""));

    act(() => toolbarProps.onClearAll());
    expect(within(container).getAllByTestId(/^scan-/)).toHaveLength(3);

    act(() => toolbarProps.onSortChange("oldest"));
    expect(within(container).getAllByTestId(/^scan-/)[0]).toHaveAttribute("data-testid", "scan-b");

    act(() => toolbarProps.onSortChange("newest"));
    expect(within(container).getAllByTestId(/^scan-/)[0]).toHaveAttribute("data-testid", "scan-a");

    act(() => toolbarProps.onSortChange("score-high"));
    expect(within(container).getAllByTestId(/^scan-/)[0]).toHaveAttribute("data-testid", "scan-a");

    act(() => toolbarProps.onSortChange("score-low"));
    expect(within(container).getAllByTestId(/^scan-/)[0]).toHaveAttribute("data-testid", "scan-b");

    act(() => toolbarProps.onSortChange("issues-high"));
    expect(within(container).getAllByTestId(/^scan-/)[0]).toHaveAttribute("data-testid", "scan-b");

    act(() => toolbarProps.onSortChange("issues-low"));
    expect(within(container).getAllByTestId(/^scan-/)[0]).toHaveAttribute("data-testid", "scan-a");
  });

  it("handles compare selection, submit, and cancel", () => {
    render(<ScanHistory scans={scans} onSelectScan={onSelectScan} onCompare={onCompare} />);

    // enable compare mode and select two scans
    act(() => toolbarProps.onCompareModeToggle());
    const compareButtons = screen.getAllByText("Toggle Compare", { selector: "button" });
    fireEvent.click(compareButtons[0]);
    expect(toolbarProps.compareSelectionCount).toBe(1);
    fireEvent.click(compareButtons[1]);

    expect(toolbarProps.compareSelectionCount).toBe(2);
    act(() => toolbarProps.onCompareSubmit());
    expect(onCompare).toHaveBeenCalled();

    // cancel compare clears selection when toggled back on
    act(() => toolbarProps.onCompareModeToggle());
    const compareAfterSubmit = screen.getAllByText("Toggle Compare", { selector: "button" });
    fireEvent.click(compareAfterSubmit[0]);
    act(() => toolbarProps.onCompareCancel());
    expect(toolbarProps.compareSelectionCount).toBe(0);
  });

  it("ignores additional compare selections after two are chosen", () => {
    render(<ScanHistory scans={scans} onSelectScan={onSelectScan} onCompare={onCompare} />);
    act(() => toolbarProps.onCompareModeToggle());

    const compareButtons = screen.getAllByText("Toggle Compare", { selector: "button" });
    fireEvent.click(compareButtons[0]);
    fireEvent.click(compareButtons[1]);
    expect(toolbarProps.compareSelectionCount).toBe(2);

    // Attempt to add a third selection should not increase count
    fireEvent.click(compareButtons[2]);
    expect(toolbarProps.compareSelectionCount).toBe(2);
  });

  it("toggles compare selection off and avoids submitting without two items", () => {
    render(<ScanHistory scans={scans} onSelectScan={onSelectScan} onCompare={onCompare} />);

    act(() => toolbarProps.onCompareModeToggle());
    const compareButtons = screen.getAllByText("Toggle Compare", { selector: "button" });

    // select then deselect same scan
    fireEvent.click(compareButtons[0]);
    expect(toolbarProps.compareSelectionCount).toBe(1);
    fireEvent.click(compareButtons[0]);
    expect(toolbarProps.compareSelectionCount).toBe(0);

    // submit with fewer than two selections should not call onCompare
    act(() => toolbarProps.onCompareSubmit());
    expect(onCompare).not.toHaveBeenCalled();
  });

  it("calls onSelectScan from card with scan object", () => {
    render(<ScanHistory scans={scans} onSelectScan={onSelectScan} onDeleteScan={onDeleteScan} />);
    fireEvent.click(screen.getAllByText("Select")[0]);
    // With default "newest" sort, s3 (today's scan) is first
    expect(onSelectScan).toHaveBeenCalledWith(expect.objectContaining({ id: "s3" }));

    fireEvent.click(screen.getAllByText("Delete")[0]);
    // first delete button corresponds to scan order in render (s3)
    expect(onDeleteScan).toHaveBeenCalledWith("s3");
  });
});
