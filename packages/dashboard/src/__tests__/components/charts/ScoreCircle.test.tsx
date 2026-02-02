// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ScoreCircle } from "../../../components/charts/ScoreCircle";

afterEach(() => {
  cleanup();
});

// Mock the scoring utility
vi.mock("../../../utils/scoring", () => ({
  getScoreColor: (score: number) => {
    if (score >= 90) return "#10b981";
    if (score >= 70) return "#f59e0b";
    return "#ef4444";
  },
  getScoreGrade: (score: number) => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  },
}));

describe("charts/ScoreCircle", () => {
  it("renders the score value", () => {
    render(<ScoreCircle score={85} />);
    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("renders with default size of 100", () => {
    const { container } = render(<ScoreCircle score={75} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: "100px", height: "100px" });
  });

  it("renders with custom size", () => {
    const { container } = render(<ScoreCircle score={75} size={150} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: "150px", height: "150px" });
  });

  it("renders SVG with correct dimensions", () => {
    const { container } = render(<ScoreCircle score={75} size={120} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "120");
    expect(svg).toHaveAttribute("height", "120");
  });

  it("renders two circles (background and progress)", () => {
    const { container } = render(<ScoreCircle score={75} />);
    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(2);
  });

  it("uses calculated stroke width when not provided", () => {
    const { container } = render(<ScoreCircle score={75} size={100} />);
    const circles = container.querySelectorAll("circle");
    // Default stroke = size * 0.08 = 8
    expect(circles[0]).toHaveAttribute("stroke-width", "8");
  });

  it("uses custom stroke width when provided", () => {
    const { container } = render(<ScoreCircle score={75} strokeWidth={12} />);
    const circles = container.querySelectorAll("circle");
    expect(circles[0]).toHaveAttribute("stroke-width", "12");
  });

  it("does not show grade by default", () => {
    render(<ScoreCircle score={95} />);
    expect(screen.queryByText(/Grade/)).not.toBeInTheDocument();
  });

  it("shows grade when showGrade is true", () => {
    render(<ScoreCircle score={95} showGrade={true} />);
    expect(screen.getByText("Grade A")).toBeInTheDocument();
  });

  // Test all grade thresholds
  it("shows Grade A for score >= 90", () => {
    render(<ScoreCircle score={90} showGrade={true} />);
    expect(screen.getByText("Grade A")).toBeInTheDocument();
  });

  it("shows Grade B for score >= 80", () => {
    render(<ScoreCircle score={85} showGrade={true} />);
    expect(screen.getByText("Grade B")).toBeInTheDocument();
  });

  it("shows Grade C for score >= 70", () => {
    render(<ScoreCircle score={75} showGrade={true} />);
    expect(screen.getByText("Grade C")).toBeInTheDocument();
  });

  it("shows Grade D for score >= 60", () => {
    render(<ScoreCircle score={65} showGrade={true} />);
    expect(screen.getByText("Grade D")).toBeInTheDocument();
  });

  it("shows Grade F for score < 60", () => {
    render(<ScoreCircle score={55} showGrade={true} />);
    expect(screen.getByText("Grade F")).toBeInTheDocument();
  });

  it("renders background circle with gray stroke", () => {
    const { container } = render(<ScoreCircle score={75} />);
    const circles = container.querySelectorAll("circle");
    expect(circles[0]).toHaveAttribute("stroke", "#e2e8f0");
  });

  it("renders progress circle with colored stroke", () => {
    const { container } = render(<ScoreCircle score={75} />);
    const circles = container.querySelectorAll("circle");
    // Score 75 should get orange color based on mock
    expect(circles[1]).toHaveAttribute("stroke", "#f59e0b");
  });

  it("applies round stroke linecap to progress circle", () => {
    const { container } = render(<ScoreCircle score={75} />);
    const circles = container.querySelectorAll("circle");
    expect(circles[1]).toHaveAttribute("stroke-linecap", "round");
  });

  it("renders score with dynamic font size based on component size", () => {
    render(<ScoreCircle score={75} size={100} />);
    // fontSize should be size * 0.28 = 28
    const scoreDiv = screen.getByText("75");
    // Check the style attribute contains the expected font size (allowing for floating-point precision)
    expect(parseFloat(scoreDiv.style.fontSize)).toBeCloseTo(28);
  });

  it("renders grade text with dynamic font size", () => {
    render(<ScoreCircle score={95} size={100} showGrade={true} />);
    // Grade fontSize should be size * 0.14 = 14
    const gradeDiv = screen.getByText("Grade A");
    // Check the style attribute contains the expected font size (allowing for floating-point precision)
    expect(parseFloat(gradeDiv.style.fontSize)).toBeCloseTo(14);
  });

  it("renders score of 0 correctly", () => {
    render(<ScoreCircle score={0} showGrade={true} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("Grade F")).toBeInTheDocument();
  });

  it("renders score of 100 correctly", () => {
    render(<ScoreCircle score={100} showGrade={true} />);
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("Grade A")).toBeInTheDocument();
  });
});
