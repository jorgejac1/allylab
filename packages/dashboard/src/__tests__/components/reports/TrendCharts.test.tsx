// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SavedScan } from "../../../types";
import type { RegressionInfo } from "../../../hooks/useScans";
import { TrendCharts } from "../../../components/reports/TrendCharts";

const mockTrendLine = vi.fn();
const mockIssueTrend = vi.fn();
const mockDonut = vi.fn();
const mockGoal = vi.fn();
const mockTrendsBtn = vi.fn();

let reportSettings: {
  scoreGoal: { scoreGoal: number; showGoalProgress: boolean; showScoreGoal: boolean };
  pdfExport: Record<string, unknown>;
};

vi.mock("../../../components/ui", () => {
  const Card = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  );
  const Button = ({
    children,
    onClick,
    disabled,
    ...rest
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  );
  const StatCard = ({ label, value, prefix, color }: { label: string; value: number | string; prefix?: string; suffix?: string; color?: string }) => (
    <div data-testid="stat-card">
      <div>{label}</div>
      <div style={{ color: color || '#0f172a' }}>
        {prefix}{value}
      </div>
    </div>
  );
  const ProgressRow = ({ label, value }: { label: string; value: number | string }) => (
    <div data-testid="progress-row">{label}: {value}</div>
  );
  return { Card, Button, StatCard, ProgressRow };
});

vi.mock("../../../components/charts", () => ({
  TrendLine: (props: unknown) => {
    mockTrendLine(props);
    return <div data-testid="trend-line" />;
  },
  IssueTrendChart: (props: unknown) => {
    mockIssueTrend(props);
    return <div data-testid="issue-trend" />;
  },
  DonutChart: (props: unknown) => {
    mockDonut(props);
    return <div data-testid="donut" />;
  },
  GoalProgress: (props: unknown) => {
    mockGoal(props);
    return <div data-testid="goal" />;
  },
  IssueChangeBadge: ({ label, change }: { label: string; change: number }) => (
    <div data-testid="issue-change-badge">
      <span>{label}</span>
      <span style={{ color: change < 0 ? '#10b981' : change > 0 ? '#ef4444' : '#64748b' }}>
        {change > 0 ? '+' : ''}{change}
      </span>
      {change < 0 && <span className="lucide-check" />}
      {change > 0 && <span className="lucide-arrow-up" />}
    </div>
  ),
}));

vi.mock("../../../components/alerts", () => ({
  RegressionAlertBanner: ({ regressions }: { regressions: Array<{ scanId: string; url: string; scoreDrop: number; previousScore: number; currentScore: number; timestamp: string }> }) => (
    <div data-testid="regression-alert">
      <h4 style={{ color: "#92400e" }}>Score Regression Detected</h4>
      {regressions.slice(0, 3).map((r) => (
        <div key={r.scanId}>
          <span style={{ fontWeight: 500 }}>{r.url}</span>
          <span style={{ fontWeight: 700, color: "#dc2626" }}>{r.scoreDrop} points</span>
        </div>
      ))}
      {regressions.length > 3 && (
        <div style={{ color: "#a16207" }}>+{regressions.length - 3} more regressions</div>
      )}
    </div>
  ),
}));

vi.mock("../../../hooks", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useReportSettings: () => ({ settings: reportSettings }),
  };
});

vi.mock("../../../components/reports/TrendsPDFButton", () => ({
  TrendsPDFButton: (props: unknown) => {
    mockTrendsBtn(props);
    return <button>pdf</button>;
  },
}));

const makeScan = (overrides: Partial<SavedScan> = {}): SavedScan => ({
  id: overrides.id || "s1",
  url: overrides.url || "https://allylab.com/page",
  timestamp: overrides.timestamp || new Date("2024-01-01T00:00:00Z").toISOString(),
  score: overrides.score ?? 80,
  totalIssues: overrides.totalIssues ?? 4,
  critical: overrides.critical ?? 1,
  serious: overrides.serious ?? 1,
  moderate: overrides.moderate ?? 1,
  minor: overrides.minor ?? 1,
  findings: [],
  scanDuration: 100,
});

describe("reports/TrendCharts", () => {
  beforeEach(() => {
    mockTrendLine.mockReset();
    mockIssueTrend.mockReset();
    mockDonut.mockReset();
    mockGoal.mockReset();
    mockTrendsBtn.mockReset();
    reportSettings = {
      scoreGoal: { scoreGoal: 90, showGoalProgress: true, showScoreGoal: true },
      pdfExport: { includeSummary: true, includeStats: true, includeCharts: true },
    };
  });

  it("renders empty state when no scans", () => {
    render(<TrendCharts scans={[]} />);
    expect(screen.getByText(/No scan data available/)).toBeInTheDocument();
  });

  it("filters by URL, toggles chart type, shows goal, regressions, and stats", () => {
    const scans = [
      makeScan({ id: "s1", timestamp: new Date("2024-01-01").toISOString(), score: 60, totalIssues: 6 }),
      makeScan({ id: "s2", timestamp: new Date("2024-01-02").toISOString(), score: 70, totalIssues: 5 }),
      makeScan({ id: "s3", timestamp: new Date("2024-01-03").toISOString(), score: 75, totalIssues: 4, url: "https://allylab.com/other" }),
      makeScan({ id: "s4", timestamp: new Date("2024-01-04").toISOString(), score: 90, totalIssues: 2 }),
    ];
    const regressions: RegressionInfo[] = [
      { scanId: "s2", currentScore: 70, previousScore: 90, scoreDrop: 20, url: "allylab.com", timestamp: new Date().toISOString() },
    ];

    render(<TrendCharts scans={scans} url="https://allylab.com/page" recentRegressions={regressions} />);

    // Goal and PDF button invoked with filtered scans
    expect(screen.getByTestId("goal")).toBeInTheDocument();
    expect(mockTrendsBtn).toHaveBeenCalled();

    // Score trend renders chart line
    expect(screen.getByTestId("trend-line")).toBeInTheDocument();

    // Issue trend toggles chart type
    const stacked = screen.getByRole("button", { name: "Stacked" });
    const lines = screen.getByRole("button", { name: "Lines" });
    fireEvent.click(lines);
    expect(mockIssueTrend).toHaveBeenCalledWith(expect.objectContaining({ chartType: "line" }));
    fireEvent.click(stacked);
    expect(mockIssueTrend).toHaveBeenCalledWith(expect.objectContaining({ chartType: "area" }));

    // Donut and progress summary visible
    expect(screen.getByTestId("donut")).toBeInTheDocument();
    expect(screen.getByText(/Issues Fixed/)).toBeInTheDocument();

    // Regression banner
    expect(screen.getByText(/Score Regression Detected/)).toBeInTheDocument();
  });

  it("shows need more data when only one scan", () => {
    const scans = [makeScan()];
    render(<TrendCharts scans={scans} />);
    expect(screen.getByText(/Need at least 2 scans/)).toBeInTheDocument();
  });

  it("renders issue change badges with positive and negative indicators", () => {
    const scans = [
      makeScan({
        id: "base",
        timestamp: new Date("2024-01-01").toISOString(),
        critical: 2,
        serious: 1,
        moderate: 0,
        minor: 0,
      }),
      makeScan({
        id: "latest",
        timestamp: new Date("2024-01-02").toISOString(),
        critical: 1, // negative change -> checkmark
        serious: 2, // positive change -> arrow
        moderate: 0,
        minor: 0,
      }),
    ];

    render(<TrendCharts scans={scans} />);

    expect(screen.getAllByText("Critical")[0]).toBeInTheDocument();
    // Negative change shows Check icon (lucide-react)
    expect(document.querySelector(".lucide-check")).toBeInTheDocument();
    // Positive change shows ArrowUp icon (lucide-react)
    expect(document.querySelector(".lucide-arrow-up")).toBeInTheDocument();
  });

  it("shows positive net issue change with red color and plus sign", () => {
    const scans = [
      makeScan({
        id: "start",
        timestamp: new Date("2024-01-01").toISOString(),
        totalIssues: 1,
      }),
      makeScan({
        id: "end",
        timestamp: new Date("2024-01-02").toISOString(),
        totalIssues: 5, // net change positive
      }),
    ];

    render(<TrendCharts scans={scans} />);

    const netChanges = screen.getAllByText(/issues/);
    const positive = netChanges.find((el) => el.textContent?.includes("+4 issues"));
    expect(positive).toBeDefined();
    expect(positive as HTMLElement).toHaveStyle({ color: "#ef4444" });
  });

  it("omits goal score when setting is disabled", () => {
    reportSettings = {
      ...reportSettings,
      scoreGoal: { scoreGoal: 75, showGoalProgress: true, showScoreGoal: false },
    };
    const scans = [
      makeScan({ timestamp: new Date("2024-01-01").toISOString(), score: 50 }),
      makeScan({ timestamp: new Date("2024-01-02").toISOString(), score: 60 }),
    ];

    render(<TrendCharts scans={scans} />);

    expect(mockTrendLine).toHaveBeenCalledWith(expect.objectContaining({ goalScore: undefined }));
  });

  it("shows negative score improvement without prefix and in red", () => {
    const scans = [
      makeScan({ timestamp: new Date("2024-01-01").toISOString(), score: 90 }),
      makeScan({ timestamp: new Date("2024-01-02").toISOString(), score: 80 }),
    ];

    render(<TrendCharts scans={scans} />);

    const labels = screen.getAllByText("Score Improvement");
    const card = labels
      .map((el) => el.parentElement as HTMLElement | null)
      .find((el) => el?.textContent?.includes("-10"));
    expect(card).toBeDefined();
    const valueNode = card?.querySelector("div:nth-child(2)") as HTMLElement;
    expect(valueNode).toHaveTextContent("-10");
    expect(valueNode.textContent?.startsWith("+")).toBe(false);
    expect(valueNode).toHaveStyle({ color: "#ef4444" });
  });

  it("shows extra regressions count when more than three", () => {
    const scans = [
      makeScan({ id: "a", timestamp: new Date("2024-01-01").toISOString(), score: 90 }),
      makeScan({ id: "b", timestamp: new Date("2024-01-02").toISOString(), score: 80 }),
      makeScan({ id: "c", timestamp: new Date("2024-01-03").toISOString(), score: 70 }),
      makeScan({ id: "d", timestamp: new Date("2024-01-04").toISOString(), score: 60 }),
    ];
    const regressions: RegressionInfo[] = [
      { scanId: "a", currentScore: 70, previousScore: 90, scoreDrop: 20, url: "a.com", timestamp: new Date().toISOString() },
      { scanId: "b", currentScore: 70, previousScore: 90, scoreDrop: 20, url: "b.com", timestamp: new Date().toISOString() },
      { scanId: "c", currentScore: 70, previousScore: 90, scoreDrop: 20, url: "c.com", timestamp: new Date().toISOString() },
      { scanId: "d", currentScore: 70, previousScore: 90, scoreDrop: 20, url: "d.com", timestamp: new Date().toISOString() },
    ];

    render(<TrendCharts scans={scans} recentRegressions={regressions} />);

    const moreText = screen.getByText("+1 more regressions");
    expect(moreText).toBeInTheDocument();
    expect(moreText).toHaveStyle({ color: "#a16207" });
  });
});
