// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { GoalProgress } from "../../../components/charts/GoalProgress";

afterEach(() => {
  cleanup();
});

// Mock Card component
vi.mock("../../../components/ui", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
}));

describe("charts/GoalProgress", () => {
  it("renders goal progress title", () => {
    render(<GoalProgress currentScore={75} goalScore={90} />);
    // Target icon is now used instead of emoji
    expect(screen.getByText("Goal Progress")).toBeInTheDocument();
  });

  it("displays points to goal when not reached", () => {
    render(<GoalProgress currentScore={75} goalScore={90} />);
    expect(screen.getByText("15 points to goal")).toBeInTheDocument();
  });

  it("displays Goal Reached when current >= goal", () => {
    render(<GoalProgress currentScore={95} goalScore={90} />);
    expect(screen.getByText("Goal Reached!")).toBeInTheDocument();
    // Check icon is now used instead of emoji - no longer checking for "✓" text
  });

  it("displays current score", () => {
    render(<GoalProgress currentScore={75} goalScore={90} />);
    expect(screen.getByText("Current")).toBeInTheDocument();
    // Score appears twice - once in progress bar, once in stats
    const scores = screen.getAllByText("75");
    expect(scores.length).toBeGreaterThan(0);
  });

  it("displays goal score", () => {
    render(<GoalProgress currentScore={75} goalScore={90} />);
    expect(screen.getByText("Goal")).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
  });

  it("does not display last scan diff when previousScore is not provided", () => {
    render(<GoalProgress currentScore={75} goalScore={90} />);
    expect(screen.queryByText("Last Scan")).not.toBeInTheDocument();
  });

  it("displays last scan diff when previousScore is provided", () => {
    render(<GoalProgress currentScore={80} goalScore={90} previousScore={75} />);
    expect(screen.getByText("Last Scan")).toBeInTheDocument();
    expect(screen.getByText("+5")).toBeInTheDocument();
  });

  it("displays negative diff when score decreased", () => {
    render(<GoalProgress currentScore={70} goalScore={90} previousScore={75} />);
    expect(screen.getByText("-5")).toBeInTheDocument();
  });

  it("displays zero diff when score unchanged", () => {
    render(<GoalProgress currentScore={75} goalScore={90} previousScore={75} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("does not show + sign for zero or negative diff", () => {
    render(<GoalProgress currentScore={75} goalScore={90} previousScore={80} />);
    // -5, not +-5
    expect(screen.getByText("-5")).toBeInTheDocument();
    expect(screen.queryByText("+-5")).not.toBeInTheDocument();
  });

  it("renders milestones by default", () => {
    const { container } = render(<GoalProgress currentScore={50} goalScore={100} />);
    // Milestones should be rendered as divs with position absolute
    const milestoneMarkers = container.querySelectorAll('[style*="position: absolute"][style*="width: 2px"]');
    expect(milestoneMarkers.length).toBeGreaterThan(0);
  });

  it("does not render milestones when showMilestones is false", () => {
    const { container } = render(
      <GoalProgress currentScore={50} goalScore={100} showMilestones={false} />
    );
    // No milestone markers with width: 2px should exist
    const milestoneMarkers = container.querySelectorAll('[style*="width: 2px"][style*="height: 100%"]');
    expect(milestoneMarkers.length).toBe(0);
  });

  it("shows estimated scans when there is positive progress", () => {
    render(<GoalProgress currentScore={80} goalScore={100} previousScore={70} />);
    // 20 points to goal, 10 points progress = ~2 scans
    expect(screen.getByText("Est. scans to goal")).toBeInTheDocument();
    expect(screen.getByText("~2")).toBeInTheDocument();
  });

  it("does not show estimated scans when no progress", () => {
    render(<GoalProgress currentScore={80} goalScore={100} previousScore={80} />);
    expect(screen.queryByText("Est. scans to goal")).not.toBeInTheDocument();
  });

  it("does not show estimated scans when goal already reached", () => {
    render(<GoalProgress currentScore={100} goalScore={90} previousScore={80} />);
    expect(screen.queryByText("Est. scans to goal")).not.toBeInTheDocument();
  });

  it("does not show estimated scans when no previousScore provided", () => {
    render(<GoalProgress currentScore={80} goalScore={100} />);
    expect(screen.queryByText("Est. scans to goal")).not.toBeInTheDocument();
  });

  it("does not show estimated scans when negative progress", () => {
    render(<GoalProgress currentScore={80} goalScore={100} previousScore={85} />);
    expect(screen.queryByText("Est. scans to goal")).not.toBeInTheDocument();
  });

  it("does not show estimated scans when estimate >= 100", () => {
    // 99 points to goal, 1 point progress = 99 scans (shown)
    // 100 points to goal, 1 point progress = 100 scans (not shown)
    render(<GoalProgress currentScore={1} goalScore={101} previousScore={0} />);
    expect(screen.queryByText("Est. scans to goal")).not.toBeInTheDocument();
  });

  it("shows estimated scans when estimate is 99 or less", () => {
    // 50 points to goal, 1 point progress = 50 scans
    render(<GoalProgress currentScore={50} goalScore={100} previousScore={49} />);
    expect(screen.getByText("Est. scans to goal")).toBeInTheDocument();
    expect(screen.getByText("~50")).toBeInTheDocument();
  });

  it("caps progress bar at 100%", () => {
    const { container } = render(<GoalProgress currentScore={150} goalScore={100} />);
    const progressBar = container.querySelector('[style*="width: 100%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it("shows 0 points to goal when current equals goal", () => {
    render(<GoalProgress currentScore={90} goalScore={90} />);
    // Should show Goal Reached! instead of points to goal
    expect(screen.getByText("Goal Reached!")).toBeInTheDocument();
  });

  it("renders Card wrapper", () => {
    render(<GoalProgress currentScore={75} goalScore={90} />);
    expect(screen.getByTestId("card")).toBeInTheDocument();
  });

  it("uses green gradient for progress bar when goal reached", () => {
    const { container } = render(<GoalProgress currentScore={95} goalScore={90} />);
    const progressBar = container.querySelector('[style*="linear-gradient(90deg, rgb(16, 185, 129)"]');
    expect(progressBar).toBeInTheDocument();
  });

  it("uses blue gradient for progress bar when goal not reached", () => {
    const { container } = render(<GoalProgress currentScore={75} goalScore={90} />);
    const progressBar = container.querySelector('[style*="linear-gradient(90deg, rgb(59, 130, 246)"]');
    expect(progressBar).toBeInTheDocument();
  });

  it("positions score label correctly for low progress", () => {
    const { container } = render(<GoalProgress currentScore={10} goalScore={100} />);
    // Should have dark text color for low progress (< 15%)
    const scoreLabel = container.querySelector('[style*="color: rgb(71, 85, 105)"]');
    expect(scoreLabel).toBeInTheDocument();
  });

  it("positions score label correctly for high progress", () => {
    const { container } = render(<GoalProgress currentScore={50} goalScore={100} />);
    // Should have white text color for high progress (> 15%)
    const scoreLabel = container.querySelector('[style*="color: rgb(255, 255, 255)"]');
    expect(scoreLabel).toBeInTheDocument();
  });

  it("filters milestones that exceed goal score", () => {
    // Goal of 50 means only 25 and 50 milestones should render
    // 75, 90, 100 should be filtered out
    const { container } = render(<GoalProgress currentScore={30} goalScore={50} />);
    // Check that milestones are at 50% (25/50) and 100% (50/50) positions
    const milestoneMarkers = container.querySelectorAll('[style*="position: absolute"][style*="width: 2px"]');
    // Should have 2 markers: at 25 (50%) and 50 (100%)
    expect(milestoneMarkers.length).toBe(2);
  });

  it("shows diff with green color for positive change", () => {
    const { container } = render(<GoalProgress currentScore={80} goalScore={100} previousScore={75} />);
    const diffValue = container.querySelector('[style*="color: rgb(16, 185, 129)"]');
    expect(diffValue).toBeInTheDocument();
  });

  it("shows diff with red color for negative change", () => {
    const { container } = render(<GoalProgress currentScore={70} goalScore={100} previousScore={75} />);
    const diffValue = container.querySelector('[style*="color: rgb(239, 68, 68)"]');
    expect(diffValue).toBeInTheDocument();
  });

  it("handles previousScore of 0", () => {
    render(<GoalProgress currentScore={10} goalScore={100} previousScore={0} />);
    expect(screen.getByText("+10")).toBeInTheDocument();
  });
});
