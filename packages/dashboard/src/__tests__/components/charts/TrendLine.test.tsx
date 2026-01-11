// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { TrendLine } from "../../../components/charts/TrendLine";

afterEach(() => {
  cleanup();
});

// Mock recharts components
vi.mock("recharts", () => ({
  LineChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="line-chart" data-length={data.length}>{children}</div>
  ),
  Line: ({ dataKey, stroke, strokeWidth }: { dataKey: string; stroke: string; strokeWidth: number }) => (
    <div data-testid={`line-${dataKey}`} data-stroke={stroke} data-stroke-width={strokeWidth} />
  ),
  XAxis: ({ dataKey }: { dataKey: string }) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: ({ domain, tickFormatter }: { domain: number[]; tickFormatter?: (value: number) => string }) => {
    // Call tickFormatter to get coverage
    const formattedValue = tickFormatter ? tickFormatter(75) : "75";
    return (
      <div
        data-testid="y-axis"
        data-domain-min={domain[0]}
        data-domain-max={domain[1]}
        data-formatted-tick={formattedValue}
      />
    );
  },
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: ({ formatter, labelFormatter }: { formatter: (v: number, n: string) => unknown; labelFormatter: (label: string, payload?: unknown[]) => string }) => {
    // Test the formatter and labelFormatter functions
    const formattedScore = formatter(85, "score");
    const formattedOther = formatter(10, "other");
    const labelWithDate = labelFormatter("Jan 1", [{ payload: { fullDate: "2024-01-01T10:00:00Z" } }]);
    const labelWithoutDate = labelFormatter("Jan 1", [{ payload: {} }]);
    const labelNoPayload = labelFormatter("Jan 1", undefined);

    return (
      <div
        data-testid="tooltip"
        data-formatted-score={JSON.stringify(formattedScore)}
        data-formatted-other={JSON.stringify(formattedOther)}
        data-label-with-date={labelWithDate}
        data-label-without-date={labelWithoutDate}
        data-label-no-payload={labelNoPayload}
      />
    );
  },
  ReferenceLine: ({ y, stroke, label }: { y: number; stroke: string; label: { value: string } }) => (
    <div data-testid="reference-line" data-y={y} data-stroke={stroke} data-label={label.value} />
  ),
  ResponsiveContainer: ({ children, width, height }: { children: React.ReactNode; width: number; height: number }) => (
    <div data-testid="responsive-container" data-width={width} data-height={height}>{children}</div>
  ),
}));

describe("charts/TrendLine", () => {
  const mockData = [
    { date: "Jan 1", score: 70, fullDate: "2024-01-01T10:00:00Z", issues: 10, critical: 1, serious: 2, moderate: 3, minor: 4 },
    { date: "Jan 2", score: 75, fullDate: "2024-01-02T10:00:00Z", issues: 8, critical: 1, serious: 1, moderate: 3, minor: 3 },
    { date: "Jan 3", score: 80, fullDate: "2024-01-03T10:00:00Z", issues: 5, critical: 0, serious: 1, moderate: 2, minor: 2 },
  ];

  it("renders with default width and height", () => {
    render(<TrendLine data={mockData} />);
    const container = screen.getByTestId("responsive-container");
    expect(container).toHaveAttribute("data-width", "600");
    expect(container).toHaveAttribute("data-height", "200");
  });

  it("renders with custom width and height", () => {
    render(<TrendLine data={mockData} width={800} height={300} />);
    const container = screen.getByTestId("responsive-container");
    expect(container).toHaveAttribute("data-width", "800");
    expect(container).toHaveAttribute("data-height", "300");
  });

  it("renders LineChart with data", () => {
    render(<TrendLine data={mockData} />);
    const chart = screen.getByTestId("line-chart");
    expect(chart).toHaveAttribute("data-length", "3");
  });

  it("renders CartesianGrid", () => {
    render(<TrendLine data={mockData} />);
    expect(screen.getByTestId("cartesian-grid")).toBeInTheDocument();
  });

  it("renders XAxis with date key", () => {
    render(<TrendLine data={mockData} />);
    const xAxis = screen.getByTestId("x-axis");
    expect(xAxis).toHaveAttribute("data-key", "date");
  });

  it("renders YAxis with calculated domain", () => {
    render(<TrendLine data={mockData} />);
    const yAxis = screen.getByTestId("y-axis");
    // min score 70, max score 80
    // yMin = floor(70/10)*10 - 10 = 60
    // yMax = ceil(80/10)*10 + 10 = 90
    expect(yAxis).toHaveAttribute("data-domain-min", "60");
    expect(yAxis).toHaveAttribute("data-domain-max", "90");
  });

  it("renders Tooltip", () => {
    render(<TrendLine data={mockData} />);
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();
  });

  it("renders score Line", () => {
    render(<TrendLine data={mockData} />);
    expect(screen.getByTestId("line-score")).toBeInTheDocument();
  });

  it("uses green color for upward trend", () => {
    const upwardData = [
      { date: "Jan 1", score: 70, fullDate: "2024-01-01T10:00:00Z", issues: 10, critical: 1, serious: 2, moderate: 3, minor: 4 },
      { date: "Jan 2", score: 80, fullDate: "2024-01-02T10:00:00Z", issues: 5, critical: 0, serious: 1, moderate: 2, minor: 2 },
    ];
    render(<TrendLine data={upwardData} />);
    const line = screen.getByTestId("line-score");
    expect(line).toHaveAttribute("data-stroke", "#10b981");
  });

  it("uses red color for downward trend", () => {
    const downwardData = [
      { date: "Jan 1", score: 80, fullDate: "2024-01-01T10:00:00Z", issues: 5, critical: 0, serious: 1, moderate: 2, minor: 2 },
      { date: "Jan 2", score: 70, fullDate: "2024-01-02T10:00:00Z", issues: 10, critical: 1, serious: 2, moderate: 3, minor: 4 },
    ];
    render(<TrendLine data={downwardData} />);
    const line = screen.getByTestId("line-score");
    expect(line).toHaveAttribute("data-stroke", "#ef4444");
  });

  it("uses green color for flat trend (equal first and last)", () => {
    const flatData = [
      { date: "Jan 1", score: 75, fullDate: "2024-01-01T10:00:00Z", issues: 8, critical: 1, serious: 1, moderate: 3, minor: 3 },
      { date: "Jan 2", score: 70, fullDate: "2024-01-02T10:00:00Z", issues: 10, critical: 1, serious: 2, moderate: 3, minor: 4 },
      { date: "Jan 3", score: 75, fullDate: "2024-01-03T10:00:00Z", issues: 8, critical: 1, serious: 1, moderate: 3, minor: 3 },
    ];
    render(<TrendLine data={flatData} />);
    const line = screen.getByTestId("line-score");
    expect(line).toHaveAttribute("data-stroke", "#10b981");
  });

  it("does not render reference line when goalScore is not provided", () => {
    render(<TrendLine data={mockData} />);
    expect(screen.queryByTestId("reference-line")).not.toBeInTheDocument();
  });

  it("renders reference line when goalScore is provided", () => {
    render(<TrendLine data={mockData} goalScore={85} />);
    const refLine = screen.getByTestId("reference-line");
    expect(refLine).toHaveAttribute("data-y", "85");
    expect(refLine).toHaveAttribute("data-stroke", "#f59e0b");
    expect(refLine).toHaveAttribute("data-label", "Goal: 85");
  });

  it("includes goalScore in Y axis range calculation", () => {
    // Data scores: 70-80, but goal is 95
    render(<TrendLine data={mockData} goalScore={95} />);
    const yAxis = screen.getByTestId("y-axis");
    // yMax should include goal: ceil(95/10)*10 + 10 = 100 (capped)
    expect(yAxis).toHaveAttribute("data-domain-max", "100");
  });

  it("caps yMax at 100", () => {
    const highData = [
      { date: "Jan 1", score: 95, fullDate: "2024-01-01T10:00:00Z", issues: 2, critical: 0, serious: 0, moderate: 1, minor: 1 },
      { date: "Jan 2", score: 98, fullDate: "2024-01-02T10:00:00Z", issues: 1, critical: 0, serious: 0, moderate: 0, minor: 1 },
    ];
    render(<TrendLine data={highData} />);
    const yAxis = screen.getByTestId("y-axis");
    // ceil(98/10)*10 + 10 = 110, but capped at 100
    expect(yAxis).toHaveAttribute("data-domain-max", "100");
  });

  it("caps yMin at 0", () => {
    const lowData = [
      { date: "Jan 1", score: 5, fullDate: "2024-01-01T10:00:00Z", issues: 50, critical: 10, serious: 15, moderate: 15, minor: 10 },
      { date: "Jan 2", score: 10, fullDate: "2024-01-02T10:00:00Z", issues: 45, critical: 8, serious: 12, moderate: 15, minor: 10 },
    ];
    render(<TrendLine data={lowData} />);
    const yAxis = screen.getByTestId("y-axis");
    // floor(5/10)*10 - 10 = -10, but capped at 0
    expect(yAxis).toHaveAttribute("data-domain-min", "0");
  });

  it("renders Line with stroke width of 2", () => {
    render(<TrendLine data={mockData} />);
    const line = screen.getByTestId("line-score");
    expect(line).toHaveAttribute("data-stroke-width", "2");
  });

  it("handles empty data array", () => {
    render(<TrendLine data={[]} />);
    // Should still render, but with undefined scores handled
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("handles single data point", () => {
    const singleData = [{ date: "Jan 1", score: 75, fullDate: "2024-01-01T10:00:00Z", issues: 8, critical: 1, serious: 1, moderate: 3, minor: 3 }];
    render(<TrendLine data={singleData} />);
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("formats score correctly in tooltip", () => {
    render(<TrendLine data={mockData} />);
    const tooltip = screen.getByTestId("tooltip");
    const formattedScore = tooltip.getAttribute("data-formatted-score");
    expect(formattedScore).toBe('["85/100","Score"]');
  });

  it("passes through non-score values in tooltip", () => {
    render(<TrendLine data={mockData} />);
    const tooltip = screen.getByTestId("tooltip");
    const formattedOther = tooltip.getAttribute("data-formatted-other");
    expect(formattedOther).toBe('[10,"other"]');
  });

  it("formats label with fullDate when available", () => {
    render(<TrendLine data={mockData} />);
    const tooltip = screen.getByTestId("tooltip");
    const labelWithDate = tooltip.getAttribute("data-label-with-date");
    // Should contain formatted date
    expect(labelWithDate).toContain("Jan");
  });

  it("returns original label when no fullDate", () => {
    render(<TrendLine data={mockData} />);
    const tooltip = screen.getByTestId("tooltip");
    const labelWithoutDate = tooltip.getAttribute("data-label-without-date");
    expect(labelWithoutDate).toBe("Jan 1");
  });

  it("returns original label when no payload", () => {
    render(<TrendLine data={mockData} />);
    const tooltip = screen.getByTestId("tooltip");
    const labelNoPayload = tooltip.getAttribute("data-label-no-payload");
    expect(labelNoPayload).toBe("Jan 1");
  });

  it("includes goal in yMin calculation when goal is lower than data", () => {
    const highData = [
      { date: "Jan 1", score: 80, fullDate: "2024-01-01T10:00:00Z", issues: 5, critical: 0, serious: 1, moderate: 2, minor: 2 },
      { date: "Jan 2", score: 90, fullDate: "2024-01-02T10:00:00Z", issues: 3, critical: 0, serious: 0, moderate: 1, minor: 2 },
    ];
    render(<TrendLine data={highData} goalScore={50} />);
    const yAxis = screen.getByTestId("y-axis");
    // rangeMin = min(80, 50) = 50
    // yMin = floor(50/10)*10 - 10 = 40
    expect(yAxis).toHaveAttribute("data-domain-min", "40");
  });

  it("formats Y axis tick values correctly", () => {
    render(<TrendLine data={mockData} />);
    const yAxis = screen.getByTestId("y-axis");
    // tickFormatter returns the value as a string
    expect(yAxis).toHaveAttribute("data-formatted-tick", "75");
  });
});
