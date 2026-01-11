import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TopIssuesTable } from "../../../components/executive/TopIssuesTable";
import type { TopIssue } from "../../../types";

vi.mock("../../../utils/scoreUtils", () => ({
  getSeverityColor: (severity: string) => {
    const colors: Record<string, string> = {
      critical: "#dc2626",
      serious: "#ea580c",
      moderate: "#ca8a04",
      minor: "#2563eb",
    };
    return colors[severity] || "#6b7280";
  },
}));

describe("executive/TopIssuesTable", () => {
  const mockIssues: TopIssue[] = [
    {
      ruleId: "color-contrast",
      title: "Color Contrast",
      count: 45,
      severity: "serious",
      affectedSites: 3,
    },
    {
      ruleId: "image-alt",
      title: "Images must have alt text",
      count: 30,
      severity: "critical",
      affectedSites: 5,
    },
    {
      ruleId: "link-name",
      title: "Links must have discernible text",
      count: 15,
      severity: "moderate",
      affectedSites: 1,
    },
  ];

  it("renders empty state when no issues", () => {
    render(<TopIssuesTable issues={[]} />);

    expect(screen.getByText("No issues found")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(<TopIssuesTable issues={mockIssues} />);

    expect(screen.getByText("Issue")).toBeInTheDocument();
    expect(screen.getByText("Severity")).toBeInTheDocument();
    expect(screen.getByText("Count")).toBeInTheDocument();
    expect(screen.getByText("Sites")).toBeInTheDocument();
  });

  it("renders issue titles", () => {
    render(<TopIssuesTable issues={mockIssues} />);

    expect(screen.getByText("Color Contrast")).toBeInTheDocument();
    expect(screen.getByText("Images must have alt text")).toBeInTheDocument();
    expect(screen.getByText("Links must have discernible text")).toBeInTheDocument();
  });

  it("renders rule IDs", () => {
    render(<TopIssuesTable issues={mockIssues} />);

    expect(screen.getByText("color-contrast")).toBeInTheDocument();
    expect(screen.getByText("image-alt")).toBeInTheDocument();
    expect(screen.getByText("link-name")).toBeInTheDocument();
  });

  it("renders severity badges with correct text", () => {
    render(<TopIssuesTable issues={mockIssues} />);

    expect(screen.getByText("serious")).toBeInTheDocument();
    expect(screen.getByText("critical")).toBeInTheDocument();
    expect(screen.getByText("moderate")).toBeInTheDocument();
  });

  it("renders counts", () => {
    render(<TopIssuesTable issues={mockIssues} />);

    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("renders affected sites with correct pluralization - multiple sites", () => {
    render(<TopIssuesTable issues={mockIssues} />);

    expect(screen.getByText("3 sites")).toBeInTheDocument();
    expect(screen.getByText("5 sites")).toBeInTheDocument();
  });

  it("renders affected sites with correct pluralization - single site", () => {
    render(<TopIssuesTable issues={mockIssues} />);

    expect(screen.getByText("1 site")).toBeInTheDocument();
  });

  it("does not show click hint when onClickIssue is not provided", () => {
    render(<TopIssuesTable issues={mockIssues} />);

    expect(screen.queryByText(/Click a row/)).not.toBeInTheDocument();
  });

  it("shows click hint when onClickIssue is provided", () => {
    const handleClick = vi.fn();
    render(<TopIssuesTable issues={mockIssues} onClickIssue={handleClick} />);

    expect(screen.getByText("Click a row to view all instances of this issue")).toBeInTheDocument();
  });

  it("calls onClickIssue with ruleId when row is clicked", () => {
    const handleClick = vi.fn();
    render(<TopIssuesTable issues={mockIssues} onClickIssue={handleClick} />);

    const colorContrastRow = screen.getByText("Color Contrast").closest("tr");
    fireEvent.click(colorContrastRow!);

    expect(handleClick).toHaveBeenCalledWith("color-contrast");
  });

  it("applies pointer cursor when clickable", () => {
    const handleClick = vi.fn();
    render(<TopIssuesTable issues={mockIssues} onClickIssue={handleClick} />);

    const row = screen.getByText("Color Contrast").closest("tr");
    expect(row).toHaveStyle({ cursor: "pointer" });
  });

  it("applies default cursor when not clickable", () => {
    render(<TopIssuesTable issues={mockIssues} />);

    const row = screen.getByText("Color Contrast").closest("tr");
    expect(row).toHaveStyle({ cursor: "default" });
  });

  it("applies hover effect on mouse enter when clickable", () => {
    const handleClick = vi.fn();
    render(<TopIssuesTable issues={mockIssues} onClickIssue={handleClick} />);

    const row = screen.getByText("Color Contrast").closest("tr");
    fireEvent.mouseEnter(row!);

    expect(row).toHaveStyle({ background: "#f0f9ff" });
  });

  it("resets hover effect on mouse leave when clickable", () => {
    const handleClick = vi.fn();
    render(<TopIssuesTable issues={mockIssues} onClickIssue={handleClick} />);

    const row = screen.getByText("Color Contrast").closest("tr");
    fireEvent.mouseEnter(row!);
    fireEvent.mouseLeave(row!);

    expect(row).toHaveStyle({ background: "#fff" });
  });

  it("does not apply hover effect when not clickable", () => {
    render(<TopIssuesTable issues={mockIssues} />);

    const row = screen.getByText("Color Contrast").closest("tr");
    const initialBackground = row!.style.background;
    fireEvent.mouseEnter(row!);

    expect(row).toHaveStyle({ background: initialBackground });
  });

  it("alternates row backgrounds - even row", () => {
    render(<TopIssuesTable issues={mockIssues} />);

    const firstRow = screen.getByText("Color Contrast").closest("tr");
    expect(firstRow).toHaveStyle({ background: "#fff" });
  });

  it("alternates row backgrounds - odd row", () => {
    render(<TopIssuesTable issues={mockIssues} />);

    const secondRow = screen.getByText("Images must have alt text").closest("tr");
    expect(secondRow).toHaveStyle({ background: "#fafafa" });
  });

  it("handles click on issue when onClickIssue is undefined", () => {
    render(<TopIssuesTable issues={mockIssues} />);

    const row = screen.getByText("Color Contrast").closest("tr");
    // Should not throw
    fireEvent.click(row!);
  });

  it("handles mouse enter when not clickable", () => {
    render(<TopIssuesTable issues={mockIssues} />);

    const row = screen.getByText("Color Contrast").closest("tr");
    // Should not change background
    fireEvent.mouseEnter(row!);
    expect(row).toHaveStyle({ background: "#fff" });
  });

  it("handles mouse leave when not clickable", () => {
    render(<TopIssuesTable issues={mockIssues} />);

    const row = screen.getByText("Color Contrast").closest("tr");
    fireEvent.mouseLeave(row!);
    // Should not throw and maintain original background
    expect(row).toHaveStyle({ background: "#fff" });
  });

  it("renders minor severity correctly", () => {
    const issuesWithMinor: TopIssue[] = [
      {
        ruleId: "minor-issue",
        title: "Minor Issue",
        count: 5,
        severity: "minor",
        affectedSites: 2,
      },
    ];

    render(<TopIssuesTable issues={issuesWithMinor} />);

    expect(screen.getByText("minor")).toBeInTheDocument();
  });
});
