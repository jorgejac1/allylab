// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { IssueTrendChart } from "../../../components/charts/IssueTrendChart";

// Ensure cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock recharts components - invoke formatter functions to get coverage
vi.mock("recharts", () => ({
  LineChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="line-chart" data-length={data.length}>{children}</div>
  ),
  AreaChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="area-chart" data-length={data.length}>{children}</div>
  ),
  Line: ({ dataKey, name, stroke }: { dataKey: string; name: string; stroke: string }) => (
    <div data-testid={`line-${dataKey}`} data-name={name} data-stroke={stroke} />
  ),
  Area: ({ dataKey, name, stroke }: { dataKey: string; name: string; stroke: string }) => (
    <div data-testid={`area-${dataKey}`} data-name={name} data-stroke={stroke} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: ({ content }: { content: React.ReactElement }) => {
    // Render the tooltip content with mock props to test CustomTooltip
    const activeProps = {
      active: true,
      label: "Jan 1",
      payload: [{
        payload: { date: "Jan 1", critical: 5, serious: 10, moderate: 15, minor: 20, total: 50 },
        value: 5,
        name: "critical",
        color: "#dc2626"
      }]
    };
    const inactiveProps = { active: false, payload: [], label: "" };
    const emptyPayloadProps = { active: true, payload: [], label: "Jan 1" };
    // Test null coalescing branches - payload item exists but nested payload is undefined
    const undefinedDataPointProps = {
      active: true,
      label: "Jan 1",
      payload: [{ value: 5, name: "critical", color: "#dc2626" }] // no nested payload
    };

    return (
      <div data-testid="tooltip">
        <div data-testid="tooltip-active">{React.cloneElement(content, activeProps)}</div>
        <div data-testid="tooltip-inactive">{React.cloneElement(content, inactiveProps)}</div>
        <div data-testid="tooltip-empty">{React.cloneElement(content, emptyPayloadProps)}</div>
        <div data-testid="tooltip-undefined-datapoint">{React.cloneElement(content, undefinedDataPointProps)}</div>
      </div>
    );
  },
  Legend: ({ formatter }: { formatter?: (value: string) => React.ReactNode }) => (
    <div data-testid="legend">
      {formatter && <span data-testid="legend-formatted">{formatter("Critical")}</span>}
    </div>
  ),
  ResponsiveContainer: ({ children, height }: { children: React.ReactNode; height: number }) => (
    <div data-testid="responsive-container" data-height={height}>{children}</div>
  ),
}));

describe("charts/IssueTrendChart", () => {
  const mockData = [
    { date: "Jan 1", critical: 5, serious: 10, moderate: 15, minor: 20, total: 50 },
    { date: "Jan 2", critical: 4, serious: 8, moderate: 12, minor: 18, total: 42 },
    { date: "Jan 3", critical: 3, serious: 6, moderate: 10, minor: 15, total: 34 },
  ];

  it("shows message when data has less than 2 points", () => {
    render(<IssueTrendChart data={[mockData[0]]} />);
    expect(screen.getByText("Need at least 2 scans to show issue trends.")).toBeInTheDocument();
  });

  it("shows message when data is empty", () => {
    render(<IssueTrendChart data={[]} />);
    expect(screen.getByText("Need at least 2 scans to show issue trends.")).toBeInTheDocument();
  });

  it("renders area chart by default", () => {
    render(<IssueTrendChart data={mockData} />);
    expect(screen.getByTestId("area-chart")).toBeInTheDocument();
  });

  it("renders area chart when chartType is area", () => {
    render(<IssueTrendChart data={mockData} chartType="area" />);
    expect(screen.getByTestId("area-chart")).toBeInTheDocument();
  });

  it("renders line chart when chartType is line", () => {
    render(<IssueTrendChart data={mockData} chartType="line" />);
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("uses default height of 250", () => {
    render(<IssueTrendChart data={mockData} />);
    const container = screen.getByTestId("responsive-container");
    expect(container).toHaveAttribute("data-height", "250");
  });

  it("uses custom height", () => {
    render(<IssueTrendChart data={mockData} height={300} />);
    const container = screen.getByTestId("responsive-container");
    expect(container).toHaveAttribute("data-height", "300");
  });

  it("renders all severity areas in area chart", () => {
    render(<IssueTrendChart data={mockData} chartType="area" />);
    expect(screen.getByTestId("area-critical")).toBeInTheDocument();
    expect(screen.getByTestId("area-serious")).toBeInTheDocument();
    expect(screen.getByTestId("area-moderate")).toBeInTheDocument();
    expect(screen.getByTestId("area-minor")).toBeInTheDocument();
  });

  it("renders all severity lines in line chart", () => {
    render(<IssueTrendChart data={mockData} chartType="line" />);
    expect(screen.getByTestId("line-critical")).toBeInTheDocument();
    expect(screen.getByTestId("line-serious")).toBeInTheDocument();
    expect(screen.getByTestId("line-moderate")).toBeInTheDocument();
    expect(screen.getByTestId("line-minor")).toBeInTheDocument();
  });

  it("does not render total line by default", () => {
    render(<IssueTrendChart data={mockData} chartType="line" />);
    expect(screen.queryByTestId("line-total")).not.toBeInTheDocument();
  });

  it("renders total line when showTotal is true in line chart", () => {
    render(<IssueTrendChart data={mockData} chartType="line" showTotal={true} />);
    expect(screen.getByTestId("line-total")).toBeInTheDocument();
  });

  it("renders CartesianGrid", () => {
    render(<IssueTrendChart data={mockData} />);
    expect(screen.getByTestId("cartesian-grid")).toBeInTheDocument();
  });

  it("renders XAxis", () => {
    render(<IssueTrendChart data={mockData} />);
    expect(screen.getByTestId("x-axis")).toBeInTheDocument();
  });

  it("renders YAxis", () => {
    render(<IssueTrendChart data={mockData} />);
    expect(screen.getByTestId("y-axis")).toBeInTheDocument();
  });

  it("renders Tooltip", () => {
    render(<IssueTrendChart data={mockData} />);
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();
  });

  it("renders Legend", () => {
    render(<IssueTrendChart data={mockData} />);
    expect(screen.getByTestId("legend")).toBeInTheDocument();
  });

  it("passes correct data length to chart", () => {
    render(<IssueTrendChart data={mockData} />);
    const chart = screen.getByTestId("area-chart");
    expect(chart).toHaveAttribute("data-length", "3");
  });

  it("renders with exactly 2 data points", () => {
    const twoPointData = mockData.slice(0, 2);
    render(<IssueTrendChart data={twoPointData} />);
    expect(screen.getByTestId("area-chart")).toBeInTheDocument();
  });
});

// Test CustomTooltip and TooltipRow by directly invoking the rendered content
describe("charts/IssueTrendChart - CustomTooltip", () => {
  it("renders tooltip with active state showing all severity rows", () => {
    const mockData = [
      { date: "Jan 1", critical: 5, serious: 10, moderate: 15, minor: 20, total: 50 },
      { date: "Jan 2", critical: 4, serious: 8, moderate: 12, minor: 18, total: 42 },
    ];
    render(<IssueTrendChart data={mockData} />);
    // Check that tooltip renders active content
    const activeTooltip = screen.getByTestId("tooltip-active");
    expect(activeTooltip).toBeInTheDocument();
    // Check severity labels are shown in the active tooltip (use within to avoid legend conflicts)
    expect(activeTooltip).toHaveTextContent("Critical");
    expect(activeTooltip).toHaveTextContent("Serious");
    expect(activeTooltip).toHaveTextContent("Moderate");
    expect(activeTooltip).toHaveTextContent("Minor");
    expect(activeTooltip).toHaveTextContent("Total");
  });

  it("renders tooltip inactive state as null", () => {
    const mockData = [
      { date: "Jan 1", critical: 5, serious: 10, moderate: 15, minor: 20, total: 50 },
      { date: "Jan 2", critical: 4, serious: 8, moderate: 12, minor: 18, total: 42 },
    ];
    render(<IssueTrendChart data={mockData} />);
    // Inactive tooltip should be empty (CustomTooltip returns null)
    const inactiveTooltip = screen.getByTestId("tooltip-inactive");
    expect(inactiveTooltip).toBeEmptyDOMElement();
  });

  it("renders tooltip empty payload state as null", () => {
    const mockData = [
      { date: "Jan 1", critical: 5, serious: 10, moderate: 15, minor: 20, total: 50 },
      { date: "Jan 2", critical: 4, serious: 8, moderate: 12, minor: 18, total: 42 },
    ];
    render(<IssueTrendChart data={mockData} />);
    // Empty payload tooltip should be empty (CustomTooltip returns null)
    const emptyTooltip = screen.getByTestId("tooltip-empty");
    expect(emptyTooltip).toBeEmptyDOMElement();
  });

  it("renders legend formatter correctly for area chart", () => {
    const mockData = [
      { date: "Jan 1", critical: 5, serious: 10, moderate: 15, minor: 20, total: 50 },
      { date: "Jan 2", critical: 4, serious: 8, moderate: 12, minor: 18, total: 42 },
    ];
    render(<IssueTrendChart data={mockData} chartType="area" />);
    expect(screen.getByTestId("legend")).toBeInTheDocument();
    // Check that the formatter function is called
    expect(screen.getByTestId("legend-formatted")).toBeInTheDocument();
  });

  it("renders legend formatter correctly for line chart", () => {
    const mockData = [
      { date: "Jan 1", critical: 5, serious: 10, moderate: 15, minor: 20, total: 50 },
      { date: "Jan 2", critical: 4, serious: 8, moderate: 12, minor: 18, total: 42 },
    ];
    render(<IssueTrendChart data={mockData} chartType="line" />);
    expect(screen.getByTestId("legend")).toBeInTheDocument();
    // Check that the formatter function is called
    expect(screen.getByTestId("legend-formatted")).toBeInTheDocument();
  });

  it("displays correct values in TooltipRow", () => {
    const mockData = [
      { date: "Jan 1", critical: 5, serious: 10, moderate: 15, minor: 20, total: 50 },
      { date: "Jan 2", critical: 4, serious: 8, moderate: 12, minor: 18, total: 42 },
    ];
    render(<IssueTrendChart data={mockData} />);
    // Check values are displayed
    expect(screen.getByText("5")).toBeInTheDocument(); // critical value
    expect(screen.getByText("50")).toBeInTheDocument(); // total value
  });

  it("displays tooltip date label", () => {
    const mockData = [
      { date: "Jan 1", critical: 5, serious: 10, moderate: 15, minor: 20, total: 50 },
      { date: "Jan 2", critical: 4, serious: 8, moderate: 12, minor: 18, total: 42 },
    ];
    render(<IssueTrendChart data={mockData} />);
    // Check that date label appears in tooltips (multiple instances due to mock variations)
    const dateLabels = screen.getAllByText("Jan 1");
    expect(dateLabels.length).toBeGreaterThan(0);
  });

  it("handles undefined dataPoint gracefully with fallback values", () => {
    const mockData = [
      { date: "Jan 1", critical: 5, serious: 10, moderate: 15, minor: 20, total: 50 },
      { date: "Jan 2", critical: 4, serious: 8, moderate: 12, minor: 18, total: 42 },
    ];
    render(<IssueTrendChart data={mockData} />);
    // This tests the null coalescing operators (?? 0) in CustomTooltip
    // When payload[0].payload is undefined, values should fall back to 0
    const undefinedTooltip = screen.getByTestId("tooltip-undefined-datapoint");
    expect(undefinedTooltip).toBeInTheDocument();
    // Should still render the tooltip structure with fallback values (0)
    expect(undefinedTooltip).toHaveTextContent("Critical");
    expect(undefinedTooltip).toHaveTextContent("0");
  });
});
