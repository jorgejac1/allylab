import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SeverityBreakdown } from "../../../components/executive/SeverityBreakdown";

describe("executive/SeverityBreakdown", () => {
  const defaultCounts = {
    critical: 5,
    serious: 10,
    moderate: 20,
    minor: 15,
  };

  it("renders all severity labels", () => {
    render(<SeverityBreakdown counts={defaultCounts} />);

    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(screen.getByText("Serious")).toBeInTheDocument();
    expect(screen.getByText("Moderate")).toBeInTheDocument();
    expect(screen.getByText("Minor")).toBeInTheDocument();
  });

  it("renders correct counts for each severity", () => {
    render(<SeverityBreakdown counts={defaultCounts} />);

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("renders zero counts correctly", () => {
    const zeroCounts = {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
    };

    render(<SeverityBreakdown counts={zeroCounts} />);

    const zeros = screen.getAllByText("0");
    expect(zeros).toHaveLength(4);
  });

  it("applies correct colors to severity counts", () => {
    render(<SeverityBreakdown counts={defaultCounts} />);

    expect(screen.getByText("5")).toHaveStyle({ color: "#dc2626" }); // Critical - red
    expect(screen.getByText("10")).toHaveStyle({ color: "#ea580c" }); // Serious - orange
    expect(screen.getByText("20")).toHaveStyle({ color: "#ca8a04" }); // Moderate - yellow
    expect(screen.getByText("15")).toHaveStyle({ color: "#2563eb" }); // Minor - blue
  });

  it("renders progress bars based on percentage", () => {
    const counts = {
      critical: 25,
      serious: 25,
      moderate: 25,
      minor: 25,
    };

    const { container } = render(<SeverityBreakdown counts={counts} />);

    // Each severity should have 25% width (total = 100, each = 25)
    const progressBars = container.querySelectorAll('[style*="width: 25%"]');
    expect(progressBars).toHaveLength(4);
  });

  it("handles large counts correctly", () => {
    const largeCounts = {
      critical: 1000,
      serious: 2000,
      moderate: 3000,
      minor: 4000,
    };

    render(<SeverityBreakdown counts={largeCounts} />);

    expect(screen.getByText("1000")).toBeInTheDocument();
    expect(screen.getByText("2000")).toBeInTheDocument();
    expect(screen.getByText("3000")).toBeInTheDocument();
    expect(screen.getByText("4000")).toBeInTheDocument();
  });

  it("calculates correct percentages", () => {
    const counts = {
      critical: 10,
      serious: 20,
      moderate: 30,
      minor: 40,
    };

    const { container } = render(<SeverityBreakdown counts={counts} />);

    // Total = 100
    // Critical: 10%, Serious: 20%, Moderate: 30%, Minor: 40%
    expect(container.querySelector('[style*="width: 10%"]')).toBeInTheDocument();
    expect(container.querySelector('[style*="width: 20%"]')).toBeInTheDocument();
    expect(container.querySelector('[style*="width: 30%"]')).toBeInTheDocument();
    expect(container.querySelector('[style*="width: 40%"]')).toBeInTheDocument();
  });

  it("handles all zero counts (no division by zero)", () => {
    const zeroCounts = {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
    };

    const { container } = render(<SeverityBreakdown counts={zeroCounts} />);

    // All progress bars should have 0% width
    const progressBars = container.querySelectorAll('[style*="width: 0%"]');
    expect(progressBars).toHaveLength(4);
  });

  it("rounds percentages to whole numbers", () => {
    const counts = {
      critical: 1,
      serious: 1,
      moderate: 1,
      minor: 0,
    };

    const { container } = render(<SeverityBreakdown counts={counts} />);

    // Total = 3
    // Each non-zero = 33% (rounded from 33.33%)
    const progressBars = container.querySelectorAll('[style*="width: 33%"]');
    expect(progressBars).toHaveLength(3);
  });

  it("handles missing counts with fallback to 0", () => {
    const partialCounts = {
      critical: 5,
      serious: 10,
      moderate: 0,
      minor: 0,
    };

    render(<SeverityBreakdown counts={partialCounts} />);

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    const zeros = screen.getAllByText("0");
    expect(zeros).toHaveLength(2);
  });
});
