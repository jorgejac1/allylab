// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { GoalReferenceLine } from "../../../components/charts/GoalReferenceLine";

afterEach(() => {
  cleanup();
});

// Mock recharts ReferenceLine
vi.mock("recharts", () => ({
  ReferenceLine: ({
    y,
    stroke,
    strokeDasharray,
    strokeWidth,
    label
  }: {
    y: number;
    stroke: string;
    strokeDasharray: string;
    strokeWidth: number;
    label: { value: string; position: string; fill: string; fontSize: number; fontWeight: number };
  }) => (
    <div
      data-testid="reference-line"
      data-y={y}
      data-stroke={stroke}
      data-dasharray={strokeDasharray}
      data-stroke-width={strokeWidth}
      data-label-value={label.value}
      data-label-position={label.position}
      data-label-fill={label.fill}
      data-label-font-size={label.fontSize}
      data-label-font-weight={label.fontWeight}
    />
  ),
}));

describe("charts/GoalReferenceLine", () => {
  it("renders ReferenceLine with correct y value", () => {
    render(<GoalReferenceLine goal={85} />);
    const line = screen.getByTestId("reference-line");
    expect(line).toHaveAttribute("data-y", "85");
  });

  it("uses default label format when not specified", () => {
    render(<GoalReferenceLine goal={90} />);
    const line = screen.getByTestId("reference-line");
    expect(line).toHaveAttribute("data-label-value", "Goal: 90");
  });

  it("uses custom label when specified", () => {
    render(<GoalReferenceLine goal={85} label="Target: 85 points" />);
    const line = screen.getByTestId("reference-line");
    expect(line).toHaveAttribute("data-label-value", "Target: 85 points");
  });

  it("uses default orange color when not specified", () => {
    render(<GoalReferenceLine goal={85} />);
    const line = screen.getByTestId("reference-line");
    expect(line).toHaveAttribute("data-stroke", "#f59e0b");
  });

  it("uses custom color when specified", () => {
    render(<GoalReferenceLine goal={85} color="#10b981" />);
    const line = screen.getByTestId("reference-line");
    expect(line).toHaveAttribute("data-stroke", "#10b981");
  });

  it("renders with dashed stroke pattern", () => {
    render(<GoalReferenceLine goal={85} />);
    const line = screen.getByTestId("reference-line");
    expect(line).toHaveAttribute("data-dasharray", "5 5");
  });

  it("renders with stroke width of 2", () => {
    render(<GoalReferenceLine goal={85} />);
    const line = screen.getByTestId("reference-line");
    expect(line).toHaveAttribute("data-stroke-width", "2");
  });

  it("positions label on the right", () => {
    render(<GoalReferenceLine goal={85} />);
    const line = screen.getByTestId("reference-line");
    expect(line).toHaveAttribute("data-label-position", "right");
  });

  it("uses same color for label fill as stroke", () => {
    render(<GoalReferenceLine goal={85} color="#3b82f6" />);
    const line = screen.getByTestId("reference-line");
    expect(line).toHaveAttribute("data-label-fill", "#3b82f6");
  });

  it("sets label font size to 11", () => {
    render(<GoalReferenceLine goal={85} />);
    const line = screen.getByTestId("reference-line");
    expect(line).toHaveAttribute("data-label-font-size", "11");
  });

  it("sets label font weight to 600", () => {
    render(<GoalReferenceLine goal={85} />);
    const line = screen.getByTestId("reference-line");
    expect(line).toHaveAttribute("data-label-font-weight", "600");
  });

  it("handles goal value of 0", () => {
    render(<GoalReferenceLine goal={0} />);
    const line = screen.getByTestId("reference-line");
    expect(line).toHaveAttribute("data-y", "0");
    expect(line).toHaveAttribute("data-label-value", "Goal: 0");
  });

  it("handles goal value of 100", () => {
    render(<GoalReferenceLine goal={100} />);
    const line = screen.getByTestId("reference-line");
    expect(line).toHaveAttribute("data-y", "100");
    expect(line).toHaveAttribute("data-label-value", "Goal: 100");
  });
});
