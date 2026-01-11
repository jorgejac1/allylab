import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SiteRankings } from "../../../components/executive/SiteRankings";
import type { SiteStats } from "../../../types";

vi.mock("../../../components/charts", () => ({
  Sparkline: ({ data, width, height, color }: { data: number[]; width: number; height: number; color: string }) => (
    <div data-testid="sparkline" data-data={JSON.stringify(data)} data-width={width} data-height={height} data-color={color}>
      Sparkline
    </div>
  ),
}));

vi.mock("../../../utils/scoreUtils", () => ({
  getScoreColor: (score: number) => {
    if (score >= 90) return "#10b981";
    if (score >= 70) return "#f59e0b";
    if (score >= 50) return "#ea580c";
    return "#dc2626";
  },
  getScoreGrade: (score: number) => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  },
  formatDate: (dateStr: string) => {
    return `formatted-${dateStr}`;
  },
}));

describe("executive/SiteRankings", () => {
  const mockSites: SiteStats[] = [
    {
      url: "https://example.com",
      domain: "example.com",
      latestScore: 45,
      latestIssues: 50,
      critical: 5,
      serious: 10,
      moderate: 20,
      minor: 15,
      scanCount: 5,
      trend: [40, 42, 45],
      lastScanned: "2024-01-15T10:00:00Z",
      scoreChange: 3,
    },
    {
      url: "https://test.com",
      domain: "test.com",
      latestScore: 72,
      latestIssues: 20,
      critical: 1,
      serious: 5,
      moderate: 8,
      minor: 6,
      scanCount: 3,
      trend: [75, 73, 72],
      lastScanned: "2024-01-14T10:00:00Z",
      scoreChange: -3,
    },
    {
      url: "https://demo.com",
      domain: "demo.com",
      latestScore: 92,
      latestIssues: 5,
      critical: 0,
      serious: 1,
      moderate: 2,
      minor: 2,
      scanCount: 10,
      trend: [88, 90, 92],
      lastScanned: "2024-01-13T10:00:00Z",
      scoreChange: 0,
    },
  ];

  it("renders empty state when no sites", () => {
    render(<SiteRankings sites={[]} />);

    expect(screen.getByText("No sites scanned yet")).toBeInTheDocument();
  });

  it("renders site domains", () => {
    render(<SiteRankings sites={mockSites} />);

    expect(screen.getByText("example.com")).toBeInTheDocument();
    expect(screen.getByText("test.com")).toBeInTheDocument();
    expect(screen.getByText("demo.com")).toBeInTheDocument();
  });

  it("renders issue counts and last scanned dates", () => {
    render(<SiteRankings sites={mockSites} />);

    expect(screen.getByText(/50 issues/)).toBeInTheDocument();
    expect(screen.getByText(/20 issues/)).toBeInTheDocument();
    expect(screen.getByText(/5 issues/)).toBeInTheDocument();
  });

  it("renders formatted dates", () => {
    render(<SiteRankings sites={mockSites} />);

    expect(screen.getByText(/formatted-2024-01-15T10:00:00Z/)).toBeInTheDocument();
  });

  it("renders scores", () => {
    render(<SiteRankings sites={mockSites} />);

    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("92")).toBeInTheDocument();
  });

  it("renders grade badges", () => {
    render(<SiteRankings sites={mockSites} />);

    expect(screen.getByText("F")).toBeInTheDocument(); // score 45
    expect(screen.getByText("C")).toBeInTheDocument(); // score 72
    expect(screen.getByText("A")).toBeInTheDocument(); // score 92
  });

  it("renders rank badges", () => {
    render(<SiteRankings sites={mockSites} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("highlights worst site (rank 1)", () => {
    render(<SiteRankings sites={mockSites} />);

    const worstRankBadge = screen.getByText("1").closest("div");
    expect(worstRankBadge).toHaveStyle({ background: "#dc2626", color: "#fff" });
  });

  it("styles non-worst rank badges correctly", () => {
    render(<SiteRankings sites={mockSites} />);

    const secondRankBadge = screen.getByText("2").closest("div");
    expect(secondRankBadge).toHaveStyle({ background: "#f3f4f6", color: "#6b7280" });
  });

  it("shows positive score change indicator", () => {
    render(<SiteRankings sites={mockSites} />);

    expect(screen.getByText(/↑ 3/)).toBeInTheDocument();
  });

  it("shows negative score change indicator", () => {
    render(<SiteRankings sites={mockSites} />);

    expect(screen.getByText(/↓ 3/)).toBeInTheDocument();
  });

  it("does not show score change when zero", () => {
    render(<SiteRankings sites={mockSites} />);

    // The site with scoreChange: 0 should not show any change indicator
    const demoSiteRow = screen.getByText("demo.com").closest("div")?.parentElement;
    expect(demoSiteRow).not.toHaveTextContent("↑ 0");
    expect(demoSiteRow).not.toHaveTextContent("↓ 0");
  });

  it("renders sparklines for sites with enough trend data", () => {
    render(<SiteRankings sites={mockSites} />);

    const sparklines = screen.getAllByTestId("sparkline");
    expect(sparklines).toHaveLength(3);
  });

  it("does not render sparkline when trend has less than 2 data points", () => {
    const sitesWithShortTrend: SiteStats[] = [
      {
        ...mockSites[0],
        trend: [45],
      },
    ];

    render(<SiteRankings sites={sitesWithShortTrend} />);

    expect(screen.queryByTestId("sparkline")).not.toBeInTheDocument();
  });

  it("limits displayed sites based on maxItems", () => {
    render(<SiteRankings sites={mockSites} maxItems={2} />);

    expect(screen.getByText("example.com")).toBeInTheDocument();
    expect(screen.getByText("test.com")).toBeInTheDocument();
    expect(screen.queryByText("demo.com")).not.toBeInTheDocument();
  });

  it("uses default maxItems of 8", () => {
    const manySites = Array.from({ length: 10 }, (_, i) => ({
      ...mockSites[0],
      url: `https://site${i}.com`,
      domain: `site${i}.com`,
    }));

    render(<SiteRankings sites={manySites} />);

    expect(screen.getByText("site0.com")).toBeInTheDocument();
    expect(screen.getByText("site7.com")).toBeInTheDocument();
    expect(screen.queryByText("site8.com")).not.toBeInTheDocument();
    expect(screen.queryByText("site9.com")).not.toBeInTheDocument();
  });

  it("does not show click hint when onClickSite is not provided", () => {
    render(<SiteRankings sites={mockSites} />);

    expect(screen.queryByText(/Click a site/)).not.toBeInTheDocument();
  });

  it("shows click hint when onClickSite is provided", () => {
    const handleClick = vi.fn();
    render(<SiteRankings sites={mockSites} onClickSite={handleClick} />);

    expect(screen.getByText("Click a site to view its latest scan")).toBeInTheDocument();
  });

  it("calls onClickSite with URL when site is clicked", () => {
    const handleClick = vi.fn();
    render(<SiteRankings sites={mockSites} onClickSite={handleClick} />);

    const siteRow = screen.getByText("example.com").closest("div")?.parentElement;
    fireEvent.click(siteRow!);

    expect(handleClick).toHaveBeenCalledWith("https://example.com");
  });

  it("applies pointer cursor when clickable", () => {
    const handleClick = vi.fn();
    render(<SiteRankings sites={mockSites} onClickSite={handleClick} />);

    const siteRow = screen.getByText("example.com").closest('[style*="cursor"]');
    expect(siteRow).toHaveStyle({ cursor: "pointer" });
  });

  it("applies default cursor when not clickable", () => {
    render(<SiteRankings sites={mockSites} />);

    const siteRow = screen.getByText("example.com").closest('[style*="cursor"]');
    expect(siteRow).toHaveStyle({ cursor: "default" });
  });

  it("applies hover effect on mouse enter when clickable", () => {
    const handleClick = vi.fn();
    render(<SiteRankings sites={mockSites} onClickSite={handleClick} />);

    const siteRow = screen.getByText("example.com").closest('[style*="border"]');
    fireEvent.mouseEnter(siteRow!);

    expect(siteRow).toHaveStyle({ background: "#f0f9ff" });
    expect(siteRow).toHaveStyle({ borderColor: "#93c5fd" });
  });

  it("resets hover effect on mouse leave when clickable", () => {
    const handleClick = vi.fn();
    render(<SiteRankings sites={mockSites} onClickSite={handleClick} />);

    const siteRow = screen.getByText("example.com").closest('[style*="border"]');
    fireEvent.mouseEnter(siteRow!);
    fireEvent.mouseLeave(siteRow!);

    // First site (worst) should have red background
    expect(siteRow).toHaveStyle({ background: "#fef2f2" });
    expect(siteRow).toHaveStyle({ borderColor: "#fecaca" });
  });

  it("does not apply hover effect when not clickable", () => {
    render(<SiteRankings sites={mockSites} />);

    const siteRow = screen.getByText("example.com").closest('[style*="border"]') as HTMLElement;
    const initialBackground = siteRow.style.background;
    fireEvent.mouseEnter(siteRow);

    expect(siteRow).toHaveStyle({ background: initialBackground });
  });

  it("applies worst site styling (first site)", () => {
    render(<SiteRankings sites={mockSites} />);

    const worstSiteRow = screen.getByText("example.com").closest('[style*="border"]');
    expect(worstSiteRow).toHaveStyle({ background: "#fef2f2" });
  });

  it("applies normal styling for non-worst sites", () => {
    render(<SiteRankings sites={mockSites} />);

    const normalSiteRow = screen.getByText("test.com").closest('[style*="border"]');
    expect(normalSiteRow).toHaveStyle({ background: "#fff" });
  });

  it("handles click when onClickSite is undefined", () => {
    render(<SiteRankings sites={mockSites} />);

    const siteRow = screen.getByText("example.com").closest('[style*="border"]');
    // Should not throw
    fireEvent.click(siteRow!);
  });

  it("handles mouse enter when not clickable", () => {
    render(<SiteRankings sites={mockSites} />);

    const siteRow = screen.getByText("example.com").closest('[style*="border"]');
    fireEvent.mouseEnter(siteRow!);
    // Should not change style
    expect(siteRow).toHaveStyle({ background: "#fef2f2" });
  });

  it("handles mouse leave when not clickable", () => {
    render(<SiteRankings sites={mockSites} />);

    const siteRow = screen.getByText("example.com").closest('[style*="border"]');
    fireEvent.mouseLeave(siteRow!);
    // Should not throw
    expect(siteRow).toHaveStyle({ background: "#fef2f2" });
  });

  it("styles rank badge for rank > 3 with white background", () => {
    const manySites = Array.from({ length: 5 }, (_, i) => ({
      ...mockSites[0],
      url: `https://site${i}.com`,
      domain: `site${i}.com`,
    }));

    render(<SiteRankings sites={manySites} />);

    // Rank 4 badge should have white background (not gray like ranks 2-3)
    const rank4Badge = screen.getByText("4").closest("div");
    expect(rank4Badge).toHaveStyle({ background: "#fff" });
  });

  it("renders score with correct color based on value", () => {
    render(<SiteRankings sites={mockSites} />);

    // Score 45 should have red color (#dc2626)
    const lowScore = screen.getByText("45");
    expect(lowScore).toHaveStyle({ color: "#dc2626" });

    // Score 92 should have green color (#10b981)
    const highScore = screen.getByText("92");
    expect(highScore).toHaveStyle({ color: "#10b981" });
  });
});
