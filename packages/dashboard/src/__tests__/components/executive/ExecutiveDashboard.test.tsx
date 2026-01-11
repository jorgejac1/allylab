import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DashboardData, DrillDownTarget } from "../../../types";

const mockDashboardData: DashboardData = {
  totalSites: 5,
  totalIssues: 150,
  totalScans: 25,
  avgScore: 72,
  severityCounts: { critical: 10, serious: 30, moderate: 60, minor: 50 },
  topIssues: [
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
  ],
  siteStats: [
    {
      url: "https://example.com",
      domain: "example.com",
      latestScore: 65,
      latestIssues: 40,
      critical: 5,
      serious: 10,
      moderate: 15,
      minor: 10,
      scanCount: 5,
      trend: [60, 62, 65],
      lastScanned: "2024-01-15T10:00:00Z",
      scoreChange: 3,
    },
  ],
  overallTrend: [70, 71, 72],
  criticalTrend: [12, 11, 10],
};

const emptyDashboardData: DashboardData = {
  totalSites: 0,
  totalIssues: 0,
  totalScans: 0,
  avgScore: 0,
  severityCounts: { critical: 0, serious: 0, moderate: 0, minor: 0 },
  topIssues: [],
  siteStats: [],
  overallTrend: [],
  criticalTrend: [],
};

let currentMockData = mockDashboardData;

vi.mock("../../../hooks", () => ({
  useDashboardData: () => currentMockData,
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
  formatDate: (dateStr: string) => `formatted-${dateStr}`,
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

vi.mock("../../../components/ui", () => ({
  Card: ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div data-testid="card" style={style}>
      {children}
    </div>
  ),
}));

vi.mock("../../../components/charts", () => ({
  Sparkline: ({ data }: { data: number[] }) => (
    <div data-testid="sparkline" data-data={JSON.stringify(data)}>
      Sparkline
    </div>
  ),
}));

vi.mock("../../../components/reports", () => ({
  PDFReportButton: ({ data, sites, topIssues }: { data: unknown; sites: unknown; topIssues: unknown }) => (
    <button data-testid="pdf-button" data-data={JSON.stringify({ data, sites, topIssues })}>
      Export PDF
    </button>
  ),
}));

vi.mock("../../../components/executive/KPICard", () => ({
  KPICard: ({
    label,
    value,
    subValue,
    color,
    icon,
    trend,
  }: {
    label: string;
    value: string | number;
    subValue?: string;
    color?: string;
    icon?: string;
    trend?: number[];
  }) => (
    <div data-testid="kpi-card" data-label={label} data-value={value} data-subvalue={subValue} data-color={color} data-icon={icon} data-trend={JSON.stringify(trend)}>
      {icon} {label}: {value}
    </div>
  ),
}));

vi.mock("../../../components/executive/KPIGrid", () => ({
  KPIGrid: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="kpi-grid">{children}</div>
  ),
}));

vi.mock("../../../components/executive/SeverityBreakdown", () => ({
  SeverityBreakdown: ({ counts }: { counts: Record<string, number> }) => (
    <div data-testid="severity-breakdown" data-counts={JSON.stringify(counts)}>
      Severity Breakdown
    </div>
  ),
}));

vi.mock("../../../components/executive/TopIssuesTable", () => ({
  TopIssuesTable: ({
    issues,
    onClickIssue,
  }: {
    issues: unknown[];
    onClickIssue?: (ruleId: string) => void;
  }) => (
    <div data-testid="top-issues-table" data-issues={JSON.stringify(issues)}>
      <button onClick={() => onClickIssue?.("test-rule")}>Click Issue</button>
      Top Issues
    </div>
  ),
}));

vi.mock("../../../components/executive/SiteRankings", () => ({
  SiteRankings: ({
    sites,
    onClickSite,
  }: {
    sites: unknown[];
    onClickSite?: (url: string) => void;
  }) => (
    <div data-testid="site-rankings" data-sites={JSON.stringify(sites)}>
      <button onClick={() => onClickSite?.("https://test.com")}>Click Site</button>
      Site Rankings
    </div>
  ),
}));

// Import after mocks are set up
import { ExecutiveDashboard } from "../../../components/executive/ExecutiveDashboard";

describe("executive/ExecutiveDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentMockData = mockDashboardData;
  });

  it("renders dashboard header", () => {
    render(<ExecutiveDashboard />);

    expect(screen.getByText("Executive Dashboard")).toBeInTheDocument();
    expect(screen.getByText("High-level accessibility overview across all monitored sites")).toBeInTheDocument();
  });

  it("renders empty state when no sites", () => {
    currentMockData = emptyDashboardData;

    render(<ExecutiveDashboard />);

    expect(screen.getByText("No Data Yet")).toBeInTheDocument();
    expect(screen.getByText(/Run some accessibility scans first/)).toBeInTheDocument();
    expect(screen.getByText("📊")).toBeInTheDocument();
  });

  it("renders PDF export button", () => {
    render(<ExecutiveDashboard />);

    expect(screen.getByTestId("pdf-button")).toBeInTheDocument();
  });

  it("passes correct data to PDF button", () => {
    render(<ExecutiveDashboard />);

    const pdfButton = screen.getByTestId("pdf-button");
    const pdfData = JSON.parse(pdfButton.getAttribute("data-data") || "{}");

    expect(pdfData.data.averageScore).toBe(72);
    expect(pdfData.data.totalIssues).toBe(150);
    expect(pdfData.data.sitesMonitored).toBe(5);
  });

  it("renders KPI grid", () => {
    render(<ExecutiveDashboard />);

    expect(screen.getByTestId("kpi-grid")).toBeInTheDocument();
  });

  it("renders KPI cards with correct data", () => {
    render(<ExecutiveDashboard />);

    const kpiCards = screen.getAllByTestId("kpi-card");
    expect(kpiCards).toHaveLength(4);

    // Average Score card
    const avgScoreCard = kpiCards.find((card) => card.getAttribute("data-label") === "Average Score");
    expect(avgScoreCard).toBeDefined();
    expect(avgScoreCard?.getAttribute("data-value")).toBe("72");
    expect(avgScoreCard?.getAttribute("data-icon")).toBe("🎯");

    // Total Issues card
    const totalIssuesCard = kpiCards.find((card) => card.getAttribute("data-label") === "Total Issues");
    expect(totalIssuesCard).toBeDefined();
    expect(totalIssuesCard?.getAttribute("data-value")).toBe("150");
    expect(totalIssuesCard?.getAttribute("data-icon")).toBe("🐛");

    // Critical Issues card
    const criticalCard = kpiCards.find((card) => card.getAttribute("data-label") === "Critical Issues");
    expect(criticalCard).toBeDefined();
    expect(criticalCard?.getAttribute("data-value")).toBe("10");
    expect(criticalCard?.getAttribute("data-icon")).toBe("🚨");

    // Sites Monitored card
    const sitesCard = kpiCards.find((card) => card.getAttribute("data-label") === "Sites Monitored");
    expect(sitesCard).toBeDefined();
    expect(sitesCard?.getAttribute("data-value")).toBe("5");
    expect(sitesCard?.getAttribute("data-icon")).toBe("🌐");
  });

  it("renders severity breakdown", () => {
    render(<ExecutiveDashboard />);

    const severityBreakdown = screen.getByTestId("severity-breakdown");
    expect(severityBreakdown).toBeInTheDocument();

    const counts = JSON.parse(severityBreakdown.getAttribute("data-counts") || "{}");
    expect(counts.critical).toBe(10);
    expect(counts.serious).toBe(30);
    expect(counts.moderate).toBe(60);
    expect(counts.minor).toBe(50);
  });

  it("renders top issues table", () => {
    render(<ExecutiveDashboard />);

    const topIssuesTable = screen.getByTestId("top-issues-table");
    expect(topIssuesTable).toBeInTheDocument();
  });

  it("renders site rankings", () => {
    render(<ExecutiveDashboard />);

    const siteRankings = screen.getByTestId("site-rankings");
    expect(siteRankings).toBeInTheDocument();
  });

  it("renders section headers", () => {
    render(<ExecutiveDashboard />);

    expect(screen.getByText("Issue Severity Distribution")).toBeInTheDocument();
    expect(screen.getByText("🔥 Top Issues by Frequency")).toBeInTheDocument();
    expect(screen.getByText("📉 Sites Needing Attention")).toBeInTheDocument();
    expect(screen.getByText("Ranked by accessibility score (lowest first)")).toBeInTheDocument();
  });

  it("calls onDrillDown with site target when site is clicked", () => {
    const handleDrillDown = vi.fn();
    render(<ExecutiveDashboard onDrillDown={handleDrillDown} />);

    const clickSiteButton = screen.getByText("Click Site");
    fireEvent.click(clickSiteButton);

    expect(handleDrillDown).toHaveBeenCalledWith({
      type: "site",
      url: "https://test.com",
    } as DrillDownTarget);
  });

  it("calls onDrillDown with issue target when issue is clicked", () => {
    const handleDrillDown = vi.fn();
    render(<ExecutiveDashboard onDrillDown={handleDrillDown} />);

    const clickIssueButton = screen.getByText("Click Issue");
    fireEvent.click(clickIssueButton);

    expect(handleDrillDown).toHaveBeenCalledWith({
      type: "issue",
      ruleId: "test-rule",
    } as DrillDownTarget);
  });

  it("does not throw when drilling down without handler", () => {
    render(<ExecutiveDashboard />);

    const clickSiteButton = screen.getByText("Click Site");
    const clickIssueButton = screen.getByText("Click Issue");

    // Should not throw
    fireEvent.click(clickSiteButton);
    fireEvent.click(clickIssueButton);
  });

  it("renders cards wrapper", () => {
    render(<ExecutiveDashboard />);

    const cards = screen.getAllByTestId("card");
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });

  it("formats total issues with locale string", () => {
    currentMockData = {
      ...mockDashboardData,
      totalIssues: 1500,
    };

    render(<ExecutiveDashboard />);

    const kpiCards = screen.getAllByTestId("kpi-card");
    const totalIssuesCard = kpiCards.find((card) => card.getAttribute("data-label") === "Total Issues");
    expect(totalIssuesCard?.getAttribute("data-value")).toBe("1,500");
  });

  it("passes trend data to KPI cards", () => {
    render(<ExecutiveDashboard />);

    const kpiCards = screen.getAllByTestId("kpi-card");

    const avgScoreCard = kpiCards.find((card) => card.getAttribute("data-label") === "Average Score");
    const trendData = JSON.parse(avgScoreCard?.getAttribute("data-trend") || "[]");
    expect(trendData).toEqual([70, 71, 72]);

    const criticalCard = kpiCards.find((card) => card.getAttribute("data-label") === "Critical Issues");
    const criticalTrendData = JSON.parse(criticalCard?.getAttribute("data-trend") || "[]");
    expect(criticalTrendData).toEqual([12, 11, 10]);
  });

  it("passes subValue to KPI cards", () => {
    render(<ExecutiveDashboard />);

    const kpiCards = screen.getAllByTestId("kpi-card");

    const avgScoreCard = kpiCards.find((card) => card.getAttribute("data-label") === "Average Score");
    expect(avgScoreCard?.getAttribute("data-subvalue")).toBe("Grade C");

    const totalIssuesCard = kpiCards.find((card) => card.getAttribute("data-label") === "Total Issues");
    expect(totalIssuesCard?.getAttribute("data-subvalue")).toBe("Across all sites");

    const criticalCard = kpiCards.find((card) => card.getAttribute("data-label") === "Critical Issues");
    expect(criticalCard?.getAttribute("data-subvalue")).toBe("Requires immediate attention");

    const sitesCard = kpiCards.find((card) => card.getAttribute("data-label") === "Sites Monitored");
    expect(sitesCard?.getAttribute("data-subvalue")).toBe("25 total scans");
  });

  it("passes color to Critical Issues KPI card", () => {
    render(<ExecutiveDashboard />);

    const kpiCards = screen.getAllByTestId("kpi-card");
    const criticalCard = kpiCards.find((card) => card.getAttribute("data-label") === "Critical Issues");
    expect(criticalCard?.getAttribute("data-color")).toBe("#dc2626");
  });
});
