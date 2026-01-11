// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import type React from "react";
import { SeverityPill } from "../../../../components/reports/scan-history/SeverityPill";
import { FilterTag } from "../../../../components/reports/scan-history/FilterTag";
import { DateRangePicker } from "../../../../components/reports/scan-history/DateRangePicker";
import { ScanCard } from "../../../../components/reports/scan-history/ScanCard";
import { ScanHistoryToolbar } from "../../../../components/reports/scan-history/ScanHistoryToolbar";
import type { SavedScan } from "../../../../types";
import type { RegressionInfo } from "../../../../hooks/useScans";

// Mocks
vi.mock("../../../../components/ui", () => {
  type Option = { value: string; label: string };
  type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { options?: Option[] };
  const Select = ({ options, ...rest }: SelectProps) => (
    <select data-testid="select" {...rest}>
      {options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
  const Button = ({ children, onClick, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...rest} onClick={onClick}>
      {children}
    </button>
  );
  const Card = ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
    <div data-testid="card" {...rest}>
      {children}
    </div>
  );
  const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input data-testid="input" {...props} />;
  return { Button, Card, Select, Input };
});

vi.mock("../../../../components/charts", () => ({
  ScoreCircle: ({ score }: { score: number }) => <div data-testid="score-circle">{score}</div>,
  Sparkline: (props: { data: unknown }) => <div data-testid="sparkline">{JSON.stringify(props.data)}</div>,
}));

vi.mock("../../../../utils/dateRange", () => ({
  formatDateForInput: (d: Date | null) => (d ? "2024-01-01" : ""),
  formatDateRangeLabel: vi.fn(() => "RangeLabel"),
}));

describe("scan-history components", () => {
  afterEach(() => cleanup());
  const baseScan: SavedScan = {
    id: "s1",
    url: "https://allylab.com/path",
    timestamp: new Date("2024-01-01T00:00:00Z").toISOString(),
    score: 88,
    totalIssues: 4,
    critical: 1,
    serious: 1,
    moderate: 1,
    minor: 1,
    findings: [],
    scanDuration: 1200,
  };

  it("renders SeverityPill or returns null based on count", () => {
    const { container, rerender } = render(<SeverityPill severity="critical" count={0} />);
    expect(container.firstChild).toBeNull();

    rerender(<SeverityPill severity="critical" count={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("calls onRemove in FilterTag without bubbling", () => {
    const remove = vi.fn();
    const parent = vi.fn();
    render(
      <div onClick={parent}>
        <FilterTag label="Site: allylab.com" onRemove={remove} />
      </div>
    );
    fireEvent.click(screen.getByText("×"));
    expect(remove).toHaveBeenCalled();
    expect(parent).not.toHaveBeenCalled();
  });

  it("handles date changes and clear button in DateRangePicker", () => {
    const onDateChange = vi.fn();
    const onClear = vi.fn();
    const start = new Date("2024-01-01");
    const end = new Date("2024-01-02");
    render(
      <DateRangePicker
        dateRange={{ start, end }}
        onDateChange={onDateChange}
        onClear={onClear}
      />
    );

    const inputs = screen.getAllByDisplayValue("2024-01-01");
    fireEvent.change(inputs[0], { target: { value: "2024-02-01" } });
    fireEvent.change(inputs[1], { target: { value: "2024-02-10" } });
    expect(onDateChange).toHaveBeenCalledWith("start", "2024-02-01");
    expect(onDateChange).toHaveBeenCalledWith("end", "2024-02-10");

    fireEvent.click(screen.getByText("✕ Clear"));
    expect(onClear).toHaveBeenCalled();
  });

  it("renders ScanCard variants for selection, compare, regression, and delete", () => {
    const onSelect = vi.fn();
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    const regression: RegressionInfo = {
      scanId: "s1",
      currentScore: 50,
      previousScore: 80,
      scoreDrop: 30,
      url: "allylab.com",
      timestamp: new Date().toISOString(),
    };

    // Selected card border
    const { rerender } = render(
      <ScanCard
        scan={baseScan}
        isSelected
        scoreTrend={[70, 80, 88]}
        regression={regression}
        onSelect={onSelect}
        onCompareToggle={onToggle}
        onDelete={onDelete}
      />
    );
    fireEvent.click(screen.getByTestId("card"));
    expect(onSelect).toHaveBeenCalled();
    expect(screen.getByTitle(/Score dropped 30 points/)).toBeInTheDocument();
    expect(screen.getByTestId("sparkline")).toBeInTheDocument();

    // Compare mode uses toggle and checkbox
    rerender(
      <ScanCard
        scan={baseScan}
        compareMode
        isCompareSelected
        scoreTrend={[88]}
        onSelect={onSelect}
        onCompareToggle={onToggle}
      />
    );
    fireEvent.click(screen.getByTestId("card"));
    expect(onToggle).toHaveBeenCalled();
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledTimes(2);

    // Delete button stops propagation
    rerender(
      <ScanCard
        scan={baseScan}
        scoreTrend={[80, 82]}
        onSelect={onSelect}
        onDelete={onDelete}
      />
    );
    fireEvent.click(screen.getByText("🗑️"));
    expect(onDelete).toHaveBeenCalled();
  });

  it("applies regression border style when regression exists and not selected", () => {
    const regression: RegressionInfo = {
      scanId: "s1",
      currentScore: 40,
      previousScore: 70,
      scoreDrop: 30,
      url: "allylab.com",
      timestamp: new Date().toISOString(),
    };
    render(
      <ScanCard
        scan={baseScan}
        scoreTrend={[70, 60]}
        regression={regression}
        onSelect={vi.fn()}
      />
    );
    const card = screen.getByTestId("card") as HTMLDivElement;
    expect(card.style.border).toBe("2px solid rgb(245, 158, 11)");
  });

  it("handles toolbar filters, compare mode, and active filter tags", () => {
    const onFilterUrlChange = vi.fn();
    const onSortChange = vi.fn();
    const onDateRangeOptionChange = vi.fn();
    const onCustomDateChange = vi.fn();
    const onCompareModeToggle = vi.fn();
    const onCompareSubmit = vi.fn();
    const onCompareCancel = vi.fn();
    const onClearAll = vi.fn();

    // Base render with compare toggle
    const { rerender } = render(
      <ScanHistoryToolbar
        filterUrl="all"
        onFilterUrlChange={onFilterUrlChange}
        uniqueUrls={["allylab.com"]}
        sortBy="newest"
        onSortChange={onSortChange}
        dateRangeOption="all"
        onDateRangeOptionChange={onDateRangeOptionChange}
        customDateRange={{ start: null, end: null }}
        onCustomDateChange={onCustomDateChange}
        showCustomPicker={false}
        compareMode={false}
        compareSelectionCount={0}
        onCompareModeToggle={onCompareModeToggle}
        onCompareSubmit={onCompareSubmit}
        onCompareCancel={onCompareCancel}
        canCompare={true}
        onClearAll={onClearAll}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "📊 Compare Scans" }));
    expect(onCompareModeToggle).toHaveBeenCalled();

    // Compare mode active, custom picker visible, active filters summary
    rerender(
      <ScanHistoryToolbar
        filterUrl="allylab.com"
        onFilterUrlChange={onFilterUrlChange}
        uniqueUrls={["allylab.com"]}
        sortBy="oldest"
        onSortChange={onSortChange}
        dateRangeOption="7days"
        onDateRangeOptionChange={onDateRangeOptionChange}
        customDateRange={{ start: new Date(), end: new Date() }}
        onCustomDateChange={onCustomDateChange}
        showCustomPicker={true}
        compareMode={true}
        compareSelectionCount={1}
        onCompareModeToggle={onCompareModeToggle}
        onCompareSubmit={onCompareSubmit}
        onCompareCancel={onCompareCancel}
        canCompare={true}
        onClearAll={onClearAll}
      />
    );

    expect(screen.getAllByTestId("select").length).toBeGreaterThan(0);
    const selects = screen.getAllByTestId("select");
    fireEvent.change(selects[1], { target: { value: "oldest" } });
    expect(onSortChange).toHaveBeenCalledWith("oldest");
    fireEvent.change(selects[2], { target: { value: "30days" } });
    expect(onDateRangeOptionChange).toHaveBeenCalledWith("30days");

    const compareBtn = screen.getByRole("button", { name: /Compare/ });
    expect(compareBtn).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCompareCancel).toHaveBeenCalled();

    // Active filters summary + clear
    fireEvent.change(selects[0], { target: { value: "allylab.com" } });
    expect(onFilterUrlChange).toHaveBeenCalledWith("allylab.com");
    const siteTag = screen.getAllByText("Site: allylab.com")[0];
    fireEvent.click(siteTag.querySelector("button") as HTMLButtonElement);
    expect(onFilterUrlChange).toHaveBeenCalledWith("all");

    const rangeTag = screen.getByText("RangeLabel");
    fireEvent.click(rangeTag.querySelector("button") as HTMLButtonElement);
    expect(onDateRangeOptionChange).toHaveBeenCalledWith("all");

    expect(screen.getByText("RangeLabel")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Clear all"));
    expect(onClearAll).toHaveBeenCalled();
  });

  it("hides compare controls and active filters when none are set", () => {
    const { queryByText, queryAllByTestId } = render(
      <ScanHistoryToolbar
        filterUrl="all"
        onFilterUrlChange={vi.fn()}
        uniqueUrls={[]}
        sortBy="newest"
        onSortChange={vi.fn()}
        dateRangeOption="all"
        onDateRangeOptionChange={vi.fn()}
        customDateRange={{ start: null, end: null }}
        onCustomDateChange={vi.fn()}
        showCustomPicker={false}
        compareMode={false}
        compareSelectionCount={0}
        onCompareModeToggle={vi.fn()}
        onCompareSubmit={vi.fn()}
        onCompareCancel={vi.fn()}
        canCompare={false}
        onClearAll={vi.fn()}
      />
    );

    expect(queryByText(/Compare Scans/)).toBeNull();
    expect(queryByText(/Active filters/)).toBeNull();
    expect(queryAllByTestId("select")).toHaveLength(3);
  });
});
