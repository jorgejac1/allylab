// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { DonutChart } from "../../../components/charts/DonutChart";

afterEach(() => {
  cleanup();
});

describe("charts/DonutChart", () => {
  const mockData = [
    { label: "Critical", value: 10, color: "#dc2626" },
    { label: "Serious", value: 20, color: "#f97316" },
    { label: "Moderate", value: 30, color: "#eab308" },
  ];

  it("returns null when total is zero", () => {
    const { container } = render(
      <DonutChart data={[{ label: "Test", value: 0, color: "#000" }]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("returns null when all values are zero", () => {
    const { container } = render(
      <DonutChart data={[
        { label: "A", value: 0, color: "#000" },
        { label: "B", value: 0, color: "#111" },
      ]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders SVG with default size of 180", () => {
    const { container } = render(<DonutChart data={mockData} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "180");
    expect(svg).toHaveAttribute("height", "180");
  });

  it("renders SVG with custom size", () => {
    const { container } = render(<DonutChart data={mockData} size={200} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "200");
    expect(svg).toHaveAttribute("height", "200");
  });

  it("renders total in center", () => {
    render(<DonutChart data={mockData} />);
    // Total = 10 + 20 + 30 = 60
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("renders legend by default", () => {
    render(<DonutChart data={mockData} />);
    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(screen.getByText("Serious")).toBeInTheDocument();
    expect(screen.getByText("Moderate")).toBeInTheDocument();
  });

  it("does not render legend when showLegend is false", () => {
    render(<DonutChart data={mockData} showLegend={false} />);
    expect(screen.queryByText("Critical")).not.toBeInTheDocument();
  });

  it("shows value and percentage in legend", () => {
    render(<DonutChart data={mockData} />);
    // Critical: 10 out of 60 = 17%
    expect(screen.getByText("10 (17%)")).toBeInTheDocument();
    // Serious: 20 out of 60 = 33%
    expect(screen.getByText("20 (33%)")).toBeInTheDocument();
    // Moderate: 30 out of 60 = 50%
    expect(screen.getByText("30 (50%)")).toBeInTheDocument();
  });

  it("renders background circle", () => {
    const { container } = render(<DonutChart data={mockData} />);
    const circles = container.querySelectorAll("circle");
    // 1 background + 3 segments = 4 circles
    expect(circles.length).toBe(4);
    // First circle is background with #f1f5f9
    expect(circles[0]).toHaveAttribute("stroke", "#f1f5f9");
  });

  it("renders segment circles with correct colors", () => {
    const { container } = render(<DonutChart data={mockData} />);
    const circles = container.querySelectorAll("circle");
    // Skip first (background), check segment colors
    expect(circles[1]).toHaveAttribute("stroke", "#dc2626");
    expect(circles[2]).toHaveAttribute("stroke", "#f97316");
    expect(circles[3]).toHaveAttribute("stroke", "#eab308");
  });

  it("uses default stroke width of 35", () => {
    const { container } = render(<DonutChart data={mockData} />);
    const circles = container.querySelectorAll("circle");
    expect(circles[0]).toHaveAttribute("stroke-width", "35");
  });

  it("uses custom stroke width", () => {
    const { container } = render(<DonutChart data={mockData} strokeWidth={20} />);
    const circles = container.querySelectorAll("circle");
    expect(circles[0]).toHaveAttribute("stroke-width", "20");
  });

  it("filters out zero-value segments", () => {
    const dataWithZero = [
      { label: "Critical", value: 10, color: "#dc2626" },
      { label: "Serious", value: 0, color: "#f97316" },
      { label: "Moderate", value: 30, color: "#eab308" },
    ];
    const { container } = render(<DonutChart data={dataWithZero} />);
    const circles = container.querySelectorAll("circle");
    // 1 background + 2 non-zero segments = 3 circles
    expect(circles.length).toBe(3);
  });

  it("renders legend color indicators", () => {
    const { container } = render(<DonutChart data={mockData} />);
    // Should have 3 colored squares in legend
    const colorIndicators = container.querySelectorAll('[style*="border-radius: 3px"]');
    expect(colorIndicators.length).toBe(3);
  });

  it("renders circles with fill none", () => {
    const { container } = render(<DonutChart data={mockData} />);
    const circles = container.querySelectorAll("circle");
    circles.forEach(circle => {
      expect(circle).toHaveAttribute("fill", "none");
    });
  });

  it("handles single data point", () => {
    const singleData = [{ label: "Only", value: 100, color: "#000" }];
    render(<DonutChart data={singleData} />);
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("Only")).toBeInTheDocument();
    expect(screen.getByText("100 (100%)")).toBeInTheDocument();
  });

  it("renders with correct center text styling", () => {
    render(<DonutChart data={mockData} />);
    const total = screen.getByText("60");
    expect(total).toHaveStyle({ fontSize: "28px", fontWeight: "700" });
  });

  it("renders Total label with correct styling", () => {
    render(<DonutChart data={mockData} />);
    const totalLabel = screen.getByText("Total");
    expect(totalLabel).toHaveStyle({ fontSize: "11px" });
  });

  it("renders flex container for chart and legend", () => {
    const { container } = render(<DonutChart data={mockData} />);
    const flexContainer = container.firstChild;
    expect(flexContainer).toHaveStyle({
      display: "flex",
      alignItems: "center",
      gap: "24px",
    });
  });
});
