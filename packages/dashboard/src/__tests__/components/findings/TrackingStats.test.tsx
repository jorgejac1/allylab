// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TrackingStats } from "../../../components/findings/TrackingStats";

describe("findings/TrackingStats", () => {
  const stats = {
    new: 5,
    recurring: 3,
    fixed: 2,
    total: 10,
  };

  it("renders all stat items", () => {
    const { container } = render(<TrackingStats stats={stats} />);

    // Check for SVG icons instead of emojis
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThanOrEqual(3);
  });

  it("displays correct counts", () => {
    render(<TrackingStats stats={stats} />);

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("displays status labels", () => {
    render(<TrackingStats stats={stats} />);

    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("Recurring")).toBeInTheDocument();
    expect(screen.getByText("Fixed")).toBeInTheDocument();
    expect(screen.getByText("Total Tracked")).toBeInTheDocument();
  });

  it("handles zero counts", () => {
    const zeroStats = { new: 0, recurring: 0, fixed: 0, total: 0 };
    render(<TrackingStats stats={zeroStats} />);

    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(4);
  });

  it("handles large counts", () => {
    const largeStats = { new: 100, recurring: 50, fixed: 25, total: 175 };
    render(<TrackingStats stats={largeStats} />);

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("175")).toBeInTheDocument();
  });

  it("applies correct styling", () => {
    const { container } = render(<TrackingStats stats={stats} />);

    const statsContainer = container.firstChild as HTMLElement;
    expect(statsContainer).toHaveStyle({
      display: "flex",
      gap: "16px",
      padding: "12px 16px",
      background: "rgb(248, 250, 252)",
      borderRadius: "8px",
    });
  });
});
