// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { SeverityBar } from "../../../components/charts/SeverityBar";

afterEach(() => {
  cleanup();
});

describe("charts/SeverityBar", () => {
  it("returns null when all counts are zero", () => {
    const { container } = render(
      <SeverityBar critical={0} serious={0} moderate={0} minor={0} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders bar with default height of 24", () => {
    const { container } = render(
      <SeverityBar critical={5} serious={3} moderate={2} minor={1} />
    );
    const bar = container.querySelector('[style*="height: 24px"]');
    expect(bar).toBeInTheDocument();
  });

  it("renders bar with custom height", () => {
    const { container } = render(
      <SeverityBar critical={5} serious={3} moderate={2} minor={1} height={32} />
    );
    const bar = container.querySelector('[style*="height: 32px"]');
    expect(bar).toBeInTheDocument();
  });

  it("only renders segments for non-zero counts", () => {
    render(
      <SeverityBar critical={5} serious={0} moderate={3} minor={0} />
    );
    // Should only have critical and moderate segments
    expect(screen.getByTitle("critical: 5")).toBeInTheDocument();
    expect(screen.getByTitle("moderate: 3")).toBeInTheDocument();
    expect(screen.queryByTitle(/serious/)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/minor/)).not.toBeInTheDocument();
  });

  it("displays count inside segment when percent > 15", () => {
    // Critical 20 out of 25 = 80% > 15%
    render(<SeverityBar critical={20} serious={1} moderate={2} minor={2} />);
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("does not display count inside segment when percent <= 15", () => {
    // Minor 1 out of 100 = 1% <= 15%
    render(<SeverityBar critical={90} serious={5} moderate={4} minor={1} />);
    // The "1" should not appear as text in the bar (only in labels)
    const minorSegment = screen.getByTitle("minor: 1");
    expect(minorSegment.textContent).toBe("");
  });

  it("renders labels by default", () => {
    render(<SeverityBar critical={5} serious={3} moderate={2} minor={1} />);
    expect(screen.getByText("critical: 5")).toBeInTheDocument();
    expect(screen.getByText("serious: 3")).toBeInTheDocument();
    expect(screen.getByText("moderate: 2")).toBeInTheDocument();
    expect(screen.getByText("minor: 1")).toBeInTheDocument();
  });

  it("does not render labels when showLabels is false", () => {
    render(
      <SeverityBar critical={5} serious={3} moderate={2} minor={1} showLabels={false} />
    );
    expect(screen.queryByText("critical: 5")).not.toBeInTheDocument();
  });

  it("calculates correct percentages", () => {
    // Total = 10, critical = 5 should be 50%
    render(
      <SeverityBar critical={5} serious={2} moderate={2} minor={1} />
    );
    const criticalSegment = screen.getByTitle("critical: 5");
    expect(criticalSegment).toHaveStyle({ width: "50%" });
  });

  it("renders segments with correct colors", () => {
    render(<SeverityBar critical={1} serious={1} moderate={1} minor={1} />);
    const criticalSegment = screen.getByTitle("critical: 1");
    const seriousSegment = screen.getByTitle("serious: 1");
    const moderateSegment = screen.getByTitle("moderate: 1");
    const minorSegment = screen.getByTitle("minor: 1");

    // Check backgrounds are from SEVERITY_COLORS
    // #dc2626, #ea580c, #ca8a04, #65a30d
    expect(criticalSegment).toHaveStyle({ background: "rgb(220, 38, 38)" });
    expect(seriousSegment).toHaveStyle({ background: "rgb(234, 88, 12)" });
    expect(moderateSegment).toHaveStyle({ background: "rgb(202, 138, 4)" });
    expect(minorSegment).toHaveStyle({ background: "rgb(101, 163, 13)" });
  });

  it("renders colored indicator dots in labels", () => {
    const { container } = render(
      <SeverityBar critical={1} serious={1} moderate={1} minor={1} />
    );
    // Should have 4 colored dots in labels
    const dots = container.querySelectorAll('[style*="border-radius: 2px"]');
    expect(dots.length).toBe(4);
  });

  it("applies rounded border radius to bar container", () => {
    const { container } = render(
      <SeverityBar critical={5} serious={3} moderate={2} minor={1} height={24} />
    );
    // border-radius should be height / 2 = 12
    const barContainer = container.querySelector('[style*="border-radius: 12px"]');
    expect(barContainer).toBeInTheDocument();
  });

  it("renders with only one severity type", () => {
    render(<SeverityBar critical={10} serious={0} moderate={0} minor={0} />);
    expect(screen.getByTitle("critical: 10")).toBeInTheDocument();
    expect(screen.getByText("critical: 10")).toBeInTheDocument();
  });

  it("renders bar with overflow hidden", () => {
    const { container } = render(
      <SeverityBar critical={5} serious={3} moderate={2} minor={1} />
    );
    const barContainer = container.querySelector('[style*="overflow: hidden"]');
    expect(barContainer).toBeInTheDocument();
  });

  it("applies gray background to bar container", () => {
    const { container } = render(
      <SeverityBar critical={5} serious={3} moderate={2} minor={1} />
    );
    const barContainer = container.querySelector('[style*="background: rgb(226, 232, 240)"]');
    expect(barContainer).toBeInTheDocument();
  });

  it("renders segments with white text color", () => {
    render(<SeverityBar critical={50} serious={0} moderate={0} minor={0} />);
    const criticalSegment = screen.getByTitle("critical: 50");
    expect(criticalSegment).toHaveStyle({ color: "rgb(255, 255, 255)" });
  });

  it("renders labels with gap and flex-wrap", () => {
    const { container } = render(
      <SeverityBar critical={1} serious={1} moderate={1} minor={1} />
    );
    const labelsContainer = container.querySelector('[style*="gap: 16px"]');
    expect(labelsContainer).toHaveStyle({ flexWrap: "wrap" });
  });
});
