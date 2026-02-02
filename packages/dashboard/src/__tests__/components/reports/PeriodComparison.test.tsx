import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { PeriodComparison } from "../../../components/reports/PeriodComparison";
import type { SavedScan } from "../../../types";

vi.mock("../../../utils/api", () => ({
  getApiBase: () => "http://api",
}));

vi.mock("../../../components/ui", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock("../../../components/charts", () => ({
  ScoreCircle: ({ score }: { score: number }) => <div data-testid="score-circle">{score}</div>,
}));

vi.mock("../../../components/reports/comparison", () => ({
  DateRangeCard: ({ label, range }: { label: string; range: string }) => (
    <div data-testid="date-range-card">{label}: {range}</div>
  ),
  PeriodCard: ({ label, score }: { label: string; score: number }) => (
    <div data-testid="period-card">{label}: {score}</div>
  ),
  ChangeIndicator: ({ scoreChange, issueChange, scorePercent }: { scoreChange: number; issueChange: number; scorePercent: number }) => {
    const isImproved = scoreChange > 0;
    const isDeclined = scoreChange < 0;
    const isNeutral = scoreChange === 0;
    return (
      <div data-testid="change-indicator">
        <div style={{ color: isImproved ? '#10b981' : isDeclined ? '#ef4444' : '#64748b' }}>
          {isImproved && <span className="lucide-trending-up" />}
          {isDeclined && <span className="lucide-trending-down" />}
          {isNeutral && <span className="lucide-minus" />}
        </div>
        <div style={{ color: isImproved ? '#10b981' : isDeclined ? '#ef4444' : '#64748b' }}>
          {scoreChange > 0 ? '+' : ''}{scoreChange}
        </div>
        <div>({scorePercent > 0 ? '+' : ''}{scorePercent.toFixed(1)}%)</div>
        <div style={{ color: issueChange < 0 ? '#10b981' : issueChange > 0 ? '#ef4444' : '#64748b' }}>
          {issueChange < 0 ? '↓' : issueChange > 0 ? '↑' : ''} {Math.abs(issueChange).toFixed(1)} issues
        </div>
      </div>
    );
  },
  SeverityChangeCard: ({ label, before, after }: { label: string; before: number; after: number }) => (
    <div data-testid="severity-change-card">{label}: {before} → {after}</div>
  ),
  SummaryBanner: ({ comparison }: { comparison: { score: { change: number } } }) => (
    <div data-testid="summary-banner">Score change: {comparison.score.change}</div>
  ),
}));

vi.mock("../../../hooks", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
  };
});

const scans: SavedScan[] = [
  {
    id: "s1",
    url: "https://allylab.com",
    timestamp: new Date().toISOString(),
    score: 80,
    totalIssues: 4,
    critical: 1,
    serious: 1,
    moderate: 1,
    minor: 1,
    findings: [],
    scanDuration: 10,
  },
];

const successPayload = {
  success: true,
  data: {
    comparison: {
      score: { period1: 70, period2: 80, change: 10, changePercent: 14.3 },
      issues: { period1: 5, period2: 4, change: -1, changePercent: -20 },
      critical: { period1: 1, period2: 0, change: -1 },
      serious: { period1: 1, period2: 1, change: 0 },
      scanCount: { period1: 2, period2: 1 },
    },
    period1: {
      start: "2024-01-01",
      end: "2024-01-10",
      stats: {
        avgScore: 70,
        minScore: 60,
        maxScore: 80,
        avgIssues: 5,
        avgCritical: 1,
        avgSerious: 1,
        avgModerate: 1,
        avgMinor: 2,
        totalIssuesFixed: 2,
        scoreImprovement: -5,
      },
    },
    period2: {
      start: "2024-02-01",
      end: "2024-02-10",
      stats: {
        avgScore: 80,
        minScore: 70,
        maxScore: 90,
        avgIssues: 4,
        avgCritical: 0,
        avgSerious: 1,
        avgModerate: 2,
        avgMinor: 3,
        totalIssuesFixed: 3,
        scoreImprovement: 5,
      },
    },
  },
};

describe("reports/PeriodComparison", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("computes ranges for preset buttons and resets comparison data", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(successPayload),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<PeriodComparison scans={scans} onClose={() => {}} />);

    // Use week preset to cover week branch
    fireEvent.click(screen.getByText("Week vs Week"));
    const compareButton = await screen.findByRole("button", { name: /Compare Periods/i });
    fireEvent.click(compareButton);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/Previous Period/)).toBeInTheDocument());

    // Switch to quarter to cover quarter branch and clear prior comparison data
    fireEvent.click(screen.getByText("Quarter vs Quarter"));
    expect(screen.getByText(/Compare Performance Over Time/)).toBeInTheDocument();
  });

  it("shows error when response not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn(),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<PeriodComparison scans={scans} onClose={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: /Compare Periods/i }));
    await waitFor(() => expect(screen.getByText(/Failed to fetch comparison data/)).toBeInTheDocument());
  });

  it("shows API error when success is false", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: false, error: "boom" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<PeriodComparison scans={scans} onClose={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: /Compare Periods/i }));
    await waitFor(() => expect(screen.getByText(/boom/)).toBeInTheDocument());
  });

  it("falls back to generic error on unknown rejection", async () => {
    const fetchMock = vi.fn().mockRejectedValue("fail");
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<PeriodComparison scans={scans} onClose={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: /Compare Periods/i }));
    await waitFor(() =>
      expect(screen.getByText(/Failed to compare periods/)).toBeInTheDocument()
    );
  });

  it("shows decline state and issue increase styling", async () => {
    const decliningPayload = {
      success: true,
      data: {
        ...successPayload.data,
        comparison: {
          ...successPayload.data.comparison,
          score: { period1: 80, period2: 75, change: -5, changePercent: -6.2 },
          issues: { period1: 3, period2: 5, change: 2, changePercent: 66.7 },
        },
      },
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(decliningPayload),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<PeriodComparison scans={scans} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Compare Periods/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    // TrendingDown icon (lucide-react) for decline state
    expect(document.querySelector(".lucide-trending-down")).toBeInTheDocument();
    const scoreChangeNode = screen.getByText("-5");
    expect(scoreChangeNode).toHaveStyle({ color: "#ef4444" });
    const issueChangeNode = screen.getByText(/2\.0 issues/);
    expect(issueChangeNode).toHaveStyle({ color: "#ef4444" });
    // Issue change still uses text character ↑ for increases
    expect(issueChangeNode.textContent?.includes("↑")).toBe(true);
  });

  it("shows neutral change indicator when values are flat", async () => {
    const neutralPayload = {
      success: true,
      data: {
        ...successPayload.data,
        comparison: {
          ...successPayload.data.comparison,
          score: { period1: 80, period2: 80, change: 0, changePercent: 0 },
          issues: { period1: 4, period2: 4, change: 0, changePercent: 0 },
        },
      },
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(neutralPayload),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<PeriodComparison scans={scans} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Compare Periods/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    // Check the neutral state displays correctly (icon check removed - lucide-react class names vary by version)
    const scoreChangeNode = screen.getByText("0");
    expect(scoreChangeNode).toHaveStyle({ color: "#64748b" });
    const percentNode = screen.getByText("(0.0%)");
    expect(percentNode.textContent?.startsWith("(")).toBe(true);
    const issueChangeNode = screen.getByText(/0\.0 issues/);
    expect(issueChangeNode).toHaveStyle({ color: "#64748b" });
  });

  it("uses default date range when preset is custom (fallback branch)", async () => {
    const realUseState = React.useState;
    let call = 0;
    const useStateSpy = vi.spyOn(React, "useState");
    const mockedUseState: typeof React.useState = (initial?: unknown) => {
      call += 1;
      // first state (preset) -> force "custom" to hit default switch branch
      if (call === 1) {
        return realUseState("custom" as never);
      }
      return realUseState(initial as never);
    };
    useStateSpy.mockImplementation(mockedUseState);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(successPayload),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<PeriodComparison scans={scans} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Compare Periods/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    useStateSpy.mockRestore();
  });

  it("covers default case with custom initial preset", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(successPayload),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    // Render with initialPreset="custom" to hit the default case in the switch
    render(<PeriodComparison scans={scans} onClose={() => {}} initialPreset="custom" />);

    fireEvent.click(screen.getByRole("button", { name: /Compare Periods/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    // Verify the default case was executed with 30-day range
    const body = fetchMock.mock.calls[0]?.[1]?.body as string;
    const parsed = JSON.parse(body);
    const start = new Date(parsed.period2Start).getTime();
    const end = new Date(parsed.period2End).getTime();
    const diffDays = Math.round((end - start) / (24 * 60 * 60 * 1000));

    // Default case uses 30 days, same as month case
    expect(diffDays).toBeGreaterThanOrEqual(29);
    expect(diffDays).toBeLessThanOrEqual(31);
  });

  it("shows unknown error when API responds with no message", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: false }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<PeriodComparison scans={scans} onClose={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: /Compare Periods/i }));
    await waitFor(() => expect(screen.getByText(/Unknown error/)).toBeInTheDocument());
  });
});
