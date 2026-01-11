import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { KPICard } from "../../../components/executive/KPICard";

vi.mock("../../../components/charts", () => ({
  Sparkline: ({ data, width, height, color }: { data: number[]; width: number; height: number; color: string }) => (
    <div data-testid="sparkline" data-data={JSON.stringify(data)} data-width={width} data-height={height} data-color={color}>
      Sparkline
    </div>
  ),
}));

describe("executive/KPICard", () => {
  it("renders label and value", () => {
    render(<KPICard label="Test Label" value="100" />);

    expect(screen.getByText("Test Label")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders numeric value", () => {
    render(<KPICard label="Count" value={42} />);

    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders subValue when provided", () => {
    render(<KPICard label="Score" value="85" subValue="Grade B" />);

    expect(screen.getByText("Grade B")).toBeInTheDocument();
  });

  it("does not render subValue when not provided", () => {
    render(<KPICard label="Score" value="85" />);

    expect(screen.queryByText("Grade B")).not.toBeInTheDocument();
  });

  it("applies custom color to value", () => {
    render(<KPICard label="Critical" value="5" color="#dc2626" />);

    const valueElement = screen.getByText("5");
    expect(valueElement).toHaveStyle({ color: "#dc2626" });
  });

  it("applies default color when no color provided", () => {
    render(<KPICard label="Default" value="10" />);

    const valueElement = screen.getByText("10");
    expect(valueElement).toHaveStyle({ color: "#111827" });
  });

  it("renders icon when provided", () => {
    render(<KPICard label="Issues" value="50" icon="🐛" />);

    expect(screen.getByText("🐛")).toBeInTheDocument();
  });

  it("does not render icon when not provided", () => {
    render(<KPICard label="Issues" value="50" />);

    expect(screen.queryByText("🐛")).not.toBeInTheDocument();
  });

  it("renders Sparkline when trend has 2 or more data points", () => {
    render(<KPICard label="Trend" value="75" trend={[70, 72, 75]} />);

    const sparkline = screen.getByTestId("sparkline");
    expect(sparkline).toBeInTheDocument();
    expect(sparkline).toHaveAttribute("data-data", JSON.stringify([70, 72, 75]));
    expect(sparkline).toHaveAttribute("data-width", "60");
    expect(sparkline).toHaveAttribute("data-height", "24");
    expect(sparkline).toHaveAttribute("data-color", "auto");
  });

  it("does not render Sparkline when trend has less than 2 data points", () => {
    render(<KPICard label="Trend" value="75" trend={[70]} />);

    expect(screen.queryByTestId("sparkline")).not.toBeInTheDocument();
  });

  it("does not render Sparkline when trend is empty", () => {
    render(<KPICard label="Trend" value="75" trend={[]} />);

    expect(screen.queryByTestId("sparkline")).not.toBeInTheDocument();
  });

  it("does not render Sparkline when trend is undefined", () => {
    render(<KPICard label="Trend" value="75" />);

    expect(screen.queryByTestId("sparkline")).not.toBeInTheDocument();
  });

  it("renders all elements together", () => {
    render(
      <KPICard
        label="Average Score"
        value={92}
        subValue="Grade A"
        color="#10b981"
        icon="🎯"
        trend={[88, 90, 92]}
      />
    );

    expect(screen.getByText("🎯")).toBeInTheDocument();
    expect(screen.getByText("Average Score")).toBeInTheDocument();
    expect(screen.getByText("92")).toBeInTheDocument();
    expect(screen.getByText("Grade A")).toBeInTheDocument();
    expect(screen.getByTestId("sparkline")).toBeInTheDocument();
  });
});
