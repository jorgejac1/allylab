// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { IssuePatterns } from "../../../components/findings/IssuePatterns";
import type { Finding } from "../../../types";

// Mock UI components
vi.mock("../../../components/ui", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  SeverityBadge: ({ severity }: { severity: string }) => <span data-testid="severity-badge">{severity}</span>,
}));

// Mock utility functions
vi.mock("../../../utils/patterns", () => ({
  analyzePatterns: vi.fn(),
  calculateEfficiencyGain: vi.fn(),
}));

import { analyzePatterns, calculateEfficiencyGain } from "../../../utils/patterns";

describe("findings/IssuePatterns", () => {
  const mockFindings: Finding[] = [
    {
      id: "f1",
      ruleId: "r1",
      ruleTitle: "Rule 1",
      description: "desc1",
      impact: "critical",
      selector: "div",
      html: "<div/>",
      helpUrl: "https://test.com",
      wcagTags: ["WCAG2AA"],
    },
    {
      id: "f2",
      ruleId: "r2",
      ruleTitle: "Rule 2",
      description: "desc2",
      impact: "serious",
      selector: "span",
      html: "<span/>",
      helpUrl: "https://test.com",
      wcagTags: [],
    },
  ];

  const mockPatterns: Array<{
    ruleId: string;
    ruleTitle: string;
    severity: "critical" | "serious" | "moderate" | "minor";
    type: "template" | "global" | "page-specific";
    count: number;
    pages: number;
    fixStrategy: string;
  }> = [
    {
      ruleId: "r1",
      ruleTitle: "Rule 1",
      severity: "critical",
      type: "template",
      count: 5,
      pages: 3,
      fixStrategy: "Fix the component",
    },
    {
      ruleId: "r2",
      ruleTitle: "Rule 2",
      severity: "serious",
      type: "global",
      count: 2,
      pages: 2,
      fixStrategy: "Update global styles",
    },
    {
      ruleId: "r3",
      ruleTitle: "Rule 3",
      severity: "moderate",
      type: "page-specific",
      count: 1,
      pages: 1,
      fixStrategy: "Fix on page",
    },
  ];

  beforeEach(() => {
    vi.mocked(analyzePatterns).mockReturnValue(mockPatterns);
    vi.mocked(calculateEfficiencyGain).mockReturnValue(75);
  });

  it("renders title and description", () => {
    render(<IssuePatterns findings={mockFindings} />);

    expect(screen.getByText("🧠 Smart Issue Analysis")).toBeInTheDocument();
    expect(screen.getByText("Pattern detection & deduplication")).toBeInTheDocument();
  });

  it("displays statistics", () => {
    render(<IssuePatterns findings={mockFindings} />);

    expect(screen.getByText("TOTAL ISSUES FOUND")).toBeInTheDocument();
    const twos = screen.getAllByText("2");
    expect(twos.length).toBeGreaterThanOrEqual(1); // findings.length

    expect(screen.getByText("UNIQUE ISSUE TYPES")).toBeInTheDocument();
    const threes = screen.getAllByText("3");
    expect(threes.length).toBeGreaterThanOrEqual(1); // patterns.length

    expect(screen.getByText("EFFICIENCY GAIN")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();

    expect(screen.getByText("COMPONENT ISSUES")).toBeInTheDocument();
    const fives = screen.getAllByText("5");
    expect(fives.length).toBeGreaterThanOrEqual(1); // template issues count
  });

  it("displays subtext for stats", () => {
    render(<IssuePatterns findings={mockFindings} />);

    expect(screen.getByText("Fix 3 to solve 2")).toBeInTheDocument();
    expect(screen.getByText("Fix once, affect many")).toBeInTheDocument();
  });

  it("renders patterns table with headers", () => {
    render(<IssuePatterns findings={mockFindings} />);

    expect(screen.getByText("All Issue Patterns")).toBeInTheDocument();
    expect(screen.getByText("Issue")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Count")).toBeInTheDocument();
    expect(screen.getByText("Pages")).toBeInTheDocument();
    expect(screen.getByText("Fix Strategy")).toBeInTheDocument();
  });

  it("renders pattern rows", () => {
    render(<IssuePatterns findings={mockFindings} />);

    expect(screen.getByText("Rule 1")).toBeInTheDocument();
    expect(screen.getByText("Rule 2")).toBeInTheDocument();
    expect(screen.getByText("Rule 3")).toBeInTheDocument();
  });

  it("displays pattern types with correct styling", () => {
    render(<IssuePatterns findings={mockFindings} />);

    expect(screen.getByText("🔄 Template")).toBeInTheDocument();
    expect(screen.getByText("🌐 Global")).toBeInTheDocument();
    expect(screen.getByText("📄 Page")).toBeInTheDocument();
  });

  it("displays pattern counts and pages", () => {
    render(<IssuePatterns findings={mockFindings} />);

    // Check counts are displayed
    const counts = screen.getAllByText("5");
    expect(counts.length).toBeGreaterThanOrEqual(1);
  });

  it("displays fix strategies", () => {
    render(<IssuePatterns findings={mockFindings} />);

    expect(screen.getByText("Fix the component")).toBeInTheDocument();
    expect(screen.getByText("Update global styles")).toBeInTheDocument();
    expect(screen.getByText("Fix on page")).toBeInTheDocument();
  });

  it("renders recommended fix order section", () => {
    render(<IssuePatterns findings={mockFindings} />);

    expect(screen.getByText("✨ Recommended Fix Order")).toBeInTheDocument();
  });

  it("displays component issues recommendation", () => {
    render(<IssuePatterns findings={mockFindings} />);

    expect(screen.getByText(/Component Issues \(5\)/)).toBeInTheDocument();
    expect(screen.getByText(/fix 1 issues to resolve 5 total occurrences/)).toBeInTheDocument();
  });

  it("displays global issues recommendation", () => {
    render(<IssuePatterns findings={mockFindings} />);

    expect(screen.getByText(/Global Issues \(1\)/)).toBeInTheDocument();
  });

  it("displays remaining issues recommendation", () => {
    render(<IssuePatterns findings={mockFindings} />);

    expect(screen.getByText(/Remaining Issues:/)).toBeInTheDocument();
  });

  it("limits patterns to first 10", () => {
    const manyPatterns: Array<{
      ruleId: string;
      ruleTitle: string;
      severity: "critical" | "serious" | "moderate" | "minor";
      type: "template" | "global" | "page-specific";
      count: number;
      pages: number;
      fixStrategy: string;
    }> = Array.from({ length: 15 }, (_, i) => ({
      ruleId: `r${i}`,
      ruleTitle: `Rule ${i}`,
      severity: "minor",
      type: "page-specific",
      count: 1,
      pages: 1,
      fixStrategy: "Fix",
    }));

    vi.mocked(analyzePatterns).mockReturnValue(manyPatterns);
    render(<IssuePatterns findings={mockFindings} />);

    // Should only render 10 rows
    expect(screen.getByText("Rule 0")).toBeInTheDocument();
    expect(screen.getByText("Rule 9")).toBeInTheDocument();
    expect(screen.queryByText("Rule 10")).not.toBeInTheDocument();
  });

  it("calls analyzePatterns with findings", () => {
    render(<IssuePatterns findings={mockFindings} />);

    expect(analyzePatterns).toHaveBeenCalledWith(mockFindings);
  });

  it("calls calculateEfficiencyGain with patterns", () => {
    render(<IssuePatterns findings={mockFindings} />);

    expect(calculateEfficiencyGain).toHaveBeenCalledWith(mockPatterns);
  });

  it("renders severity badges for each pattern", () => {
    render(<IssuePatterns findings={mockFindings} />);

    const badges = screen.getAllByTestId("severity-badge");
    expect(badges.length).toBe(3);
  });
});
