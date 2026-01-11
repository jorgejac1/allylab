// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ReportsView, ReportsSummary } from "../../../components/reports/ReportsView";
import type { SavedScan } from "../../../types";
import type { RegressionInfo } from "../../../hooks/useScans";

const mockScanHistory = vi.fn();
const mockComparisonView = vi.fn();
const mockPeriodComparison = vi.fn();
const mockTrendCharts = vi.fn();
const mockExportOptions = vi.fn();
const mockScanResults = vi.fn();

vi.mock("../../../components/ui", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  Button: ({
    children,
    onClick,
    disabled,
    style,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    style?: React.CSSProperties;
  }) => (
    <button onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  ),
  Tabs: ({
    tabs,
    activeTab,
    onChange,
  }: {
    tabs: Array<{ id: string; label: string; icon?: string }>;
    activeTab: string;
    onChange: (id: string) => void;
  }) => (
    <div>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}>
          {t.label}
          {activeTab === t.id ? "*" : ""}
        </button>
      ))}
    </div>
  ),
  EmptyState: ({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) => (
    <div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}));

vi.mock("../../../components/scan", () => ({
  ScanResults: (props: unknown) => {
    mockScanResults(props);
    return <div data-testid="scan-results">scan details</div>;
  },
}));

vi.mock("../../../components/reports/ScanHistory", () => ({
  ScanHistory: (props: {
    onSelectScan: (scan: SavedScan) => void;
    onCompare: (a: SavedScan, b: SavedScan) => void;
  }) => {
    mockScanHistory(props);
    return (
      <div data-testid="scan-history">
        <button
          onClick={() =>
            props.onSelectScan({
              id: "select",
              url: "https://select.com",
              timestamp: new Date().toISOString(),
              score: 70,
              totalIssues: 1,
              critical: 0,
              serious: 0,
              moderate: 1,
              minor: 0,
              findings: [],
              scanDuration: 10,
            })
          }
        >
          Select Scan
        </button>
        <button
          onClick={() =>
            props.onCompare(
              {
                id: "c1",
                url: "https://a.com",
                timestamp: new Date("2024-01-01").toISOString(),
                score: 60,
                totalIssues: 2,
                critical: 0,
                serious: 1,
                moderate: 1,
                minor: 0,
                findings: [],
                scanDuration: 10,
              },
              {
                id: "c2",
                url: "https://b.com",
                timestamp: new Date("2024-02-01").toISOString(),
                score: 80,
                totalIssues: 1,
                critical: 0,
                serious: 0,
                moderate: 1,
                minor: 0,
                findings: [],
                scanDuration: 10,
              }
            )
          }
        >
          Trigger Compare
        </button>
        <button
          onClick={() =>
            props.onCompare(
              {
                id: "c2",
                url: "https://b.com",
                timestamp: new Date("2024-02-01").toISOString(),
                score: 80,
                totalIssues: 1,
                critical: 0,
                serious: 0,
                moderate: 1,
                minor: 0,
                findings: [],
                scanDuration: 10,
              },
              {
                id: "c1",
                url: "https://a.com",
                timestamp: new Date("2024-01-01").toISOString(),
                score: 60,
                totalIssues: 2,
                critical: 0,
                serious: 1,
                moderate: 1,
                minor: 0,
                findings: [],
                scanDuration: 10,
              }
            )
          }
        >
          Trigger Reverse Compare
        </button>
      </div>
    );
  },
}));

vi.mock("../../../components/reports/ComparisonView", () => ({
  ComparisonView: (props: { olderScan: SavedScan; newerScan: SavedScan; onClose: () => void }) => {
    mockComparisonView(props);
    return (
      <div data-testid="comparison-view">
        <div data-testid="older-scan">{props.olderScan.id}</div>
        <div data-testid="newer-scan">{props.newerScan.id}</div>
        <button onClick={props.onClose}>Close Comparison</button>
      </div>
    );
  },
}));

vi.mock("../../../components/reports/PeriodComparison", () => ({
  PeriodComparison: (props: { onClose: () => void }) => {
    mockPeriodComparison(props);
    return (
      <div data-testid="period-comparison">
        <button onClick={props.onClose}>Close Period</button>
      </div>
    );
  },
}));

vi.mock("../../../components/reports/TrendCharts", () => ({
  TrendCharts: () => {
    mockTrendCharts();
    return <div data-testid="trend-charts">trends</div>;
  },
}));

vi.mock("../../../components/reports/ExportOptions", () => ({
  ExportOptions: (props: unknown) => {
    mockExportOptions(props);
    return <div data-testid="export-options">export</div>;
  },
}));

const baseScan = (overrides: Partial<SavedScan> = {}): SavedScan => ({
  id: overrides.id || "s1",
  url: overrides.url || "https://allylab.com/page1",
  timestamp: overrides.timestamp || new Date().toISOString(),
  score: overrides.score ?? 75,
  totalIssues: overrides.totalIssues ?? 3,
  critical: overrides.critical ?? 0,
  serious: overrides.serious ?? 1,
  moderate: overrides.moderate ?? 1,
  minor: overrides.minor ?? 1,
  findings: [],
  scanDuration: 20,
});

describe("reports/ReportsView", () => {
  const hasRegression = vi.fn((id: string): RegressionInfo | undefined =>
    id === "s2"
      ? {
          scanId: id,
          currentScore: 50,
          previousScore: 70,
          scoreDrop: 20,
          url: "allylab.com",
          timestamp: new Date().toISOString(),
        }
      : undefined
  );

  const scans: SavedScan[] = [
    baseScan({ id: "s1", timestamp: new Date().toISOString() }),
    baseScan({
      id: "s2",
      url: "https://allylab.com/page2",
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      score: 50,
    }),
    baseScan({
      id: "s3",
      url: "https://allylab.com/page3",
      timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      score: 90,
    }),
    baseScan({
      id: "s4",
      url: "https://other.com",
      timestamp: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    }),
  ];

  beforeEach(() => {
    mockScanHistory.mockClear();
    mockComparisonView.mockClear();
    mockPeriodComparison.mockClear();
    mockTrendCharts.mockClear();
    mockExportOptions.mockClear();
    mockScanResults.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it("renders empty state when no scans", () => {
    render(<ReportsView scans={[]} />);
    expect(screen.getByText("No Reports Available")).toBeInTheDocument();
  });

  it("navigates history flow, selection, and comparison", () => {
    render(<ReportsView scans={scans} hasRegression={hasRegression} />);

    // default history renders ScanHistory and sidebar
    expect(screen.getByTestId("scan-history")).toBeInTheDocument();
    expect(screen.getByText(/Recent Activity/)).toBeInTheDocument();

    // Quick stats render values
    expect(screen.getByText("Total Scans")).toBeInTheDocument();
    expect(screen.getByText(/Avg Score/)).toBeInTheDocument();
    expect(screen.getByText("Sites Scanned")).toBeInTheDocument();

    // select a scan to show details
    fireEvent.click(screen.getByText("Select Scan"));
    expect(screen.getByTestId("scan-results")).toBeInTheDocument();

    // go back
    fireEvent.click(screen.getByText("← Back to History"));
    expect(screen.getByTestId("scan-history")).toBeInTheDocument();

    // trigger compare to show ComparisonView
    fireEvent.click(screen.getByText("Trigger Compare"));
    expect(screen.getByTestId("comparison-view")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close Comparison"));
    expect(screen.getByTestId("scan-history")).toBeInTheDocument();
  });

  it("switches tabs to trends, compare, and export", () => {
    render(<ReportsView scans={scans} />);

    fireEvent.click(screen.getAllByText("Trends")[0]);
    expect(screen.getByTestId("trend-charts")).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("Period Compare")[0]);
    expect(screen.getByTestId("period-comparison")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close Period"));
    expect(screen.getAllByTestId("scan-history").length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByText("Export")[0]);
    expect(screen.getByTestId("export-options")).toBeInTheDocument();
    expect(screen.getByText(/Summary Statistics/)).toBeInTheDocument();
  });

  it("orders comparison older/newer scans correctly", () => {
    render(<ReportsView scans={scans} />);
    fireEvent.click(screen.getByText("Trigger Compare"));
    expect(screen.getByTestId("older-scan")).toHaveTextContent("c1");
    expect(screen.getByTestId("newer-scan")).toHaveTextContent("c2");
  });

  it("orders comparison when first arg is newer", () => {
    render(<ReportsView scans={scans} />);
    fireEvent.click(screen.getByText("Trigger Reverse Compare"));
    expect(screen.getByTestId("older-scan")).toHaveTextContent("c1");
    expect(screen.getByTestId("newer-scan")).toHaveTextContent("c2");
  });

  it("formats relative time for recent activity", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 5);
    const olderThanWeek = new Date();
    olderThanWeek.setDate(olderThanWeek.getDate() - 10);

    render(
      <ReportsView
        scans={[
          baseScan({ id: "recent", timestamp: oldDate.toISOString() }),
          baseScan({ id: "old", timestamp: olderThanWeek.toISOString() }),
        ]}
      />
    );

    expect(screen.getByText(/5d ago/)).toBeInTheDocument();
    expect(screen.getByText(olderThanWeek.toLocaleDateString())).toBeInTheDocument();
  });

  it("selects scan from recent activity list", () => {
    const scan = baseScan({ id: "only", url: "https://allylab.com/foo", score: 85 });
    render(<ReportsView scans={[scan]} />);

    fireEvent.click(screen.getByRole("button", { name: /allylab.com/i }));
    expect(screen.getByTestId("scan-results")).toBeInTheDocument();
  });

  it("passes onRescan handler to scan results", () => {
    const onRescan = vi.fn();
    render(<ReportsView scans={scans} onRescan={onRescan} />);

    fireEvent.click(screen.getByText("Select Scan"));
    const props = mockScanResults.mock.calls[mockScanResults.mock.calls.length - 1]?.[0] as { onRescan?: () => void } | undefined;
    expect(props?.onRescan).toBeDefined();
    props?.onRescan?.();
    expect(onRescan).toHaveBeenCalledWith("https://select.com");
  });

  it("applies low score styling in recent activity", () => {
    const lowScan = baseScan({ id: "low", score: 30 });
    render(<ReportsView scans={[lowScan]} />);
    const badge = document.querySelector('div[style*="254, 226, 226"]') as HTMLElement | null;
    expect(badge).not.toBeNull();
    expect(badge).toHaveTextContent("30");
    expect(badge).toHaveStyle({ background: "#fee2e2", color: "#991b1b" });
  });

  it("omits first/last scan rows when no scans", () => {
    render(<ReportsSummary scans={[]} />);
    expect(screen.queryByText("First Scan")).not.toBeInTheDocument();
    expect(screen.queryByText("Last Scan")).not.toBeInTheDocument();
  });
});
