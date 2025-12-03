// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScanResults } from "../../../components/scan/ScanResults";
import type { SavedScan, TrackedFinding, TrackingStats as TrackingStatsType } from "../../../types";
import { exportToCSV, exportToJSON } from "../../../utils/export";

let lastDrawerProps: any;

vi.mock("../../../components/charts", () => ({
  ScoreCircle: (props: { score: number }) => <div data-testid="score-circle">{props.score}</div>,
  SeverityBar: (props: Record<string, number>) => <div data-testid="severity-bar">{JSON.stringify(props)}</div>,
}));

vi.mock("../../../components/findings", () => ({
  FindingsTable: (props: any) => (
    <div data-testid="findings-table" onClick={() => props.onViewDetails?.(props.findings[0])}>
      findings {props.findings?.length}
    </div>
  ),
  IssuePatterns: (props: any) => <div data-testid="issue-patterns">{props.findings?.length}</div>,
  TrackingStats: (props: any) => <div data-testid="tracking-stats">{props.stats.total}</div>,
  FindingDetailsDrawer: (props: any) => {
    lastDrawerProps = props;
    return props.isOpen ? (
      <div data-testid="drawer">
        <button onClick={() => props.onGenerateFix?.(props.finding)}>fix</button>
        <button onClick={props.onFalsePositiveChange}>fp</button>
        <button onClick={props.onClose}>close</button>
      </div>
    ) : null;
  },
}));

vi.mock("../../../components/scan/ImpactAnalysis", () => ({
  ImpactAnalysis: () => <div data-testid="impact-analysis">impact</div>,
}));

vi.mock("../../../utils/export", () => ({
  exportToCSV: vi.fn(),
  exportToJSON: vi.fn(),
}));

vi.mock("../../../utils/falsePositives", () => ({
  applyFalsePositiveStatus: (findings: TrackedFinding[]) => findings,
}));

const makeFinding = (overrides: Partial<TrackedFinding> = {}): TrackedFinding => ({
  id: "f1",
  ruleId: "r1",
  ruleTitle: "Rule One",
  description: "desc",
  impact: "critical",
  selector: "body",
  html: "<div/>",
  helpUrl: "https://help",
  wcagTags: ["a", "b", "c", "d"],
  status: "new",
  fingerprint: "fp1",
  ...overrides,
});

const makeScan = (overrides: Partial<SavedScan> = {}): SavedScan => ({
  id: "s1",
  url: "https://allylab.com",
  timestamp: new Date("2024-01-01").toISOString(),
  score: 90,
  totalIssues: 2,
  critical: 1,
  serious: 1,
  moderate: 0,
  minor: 0,
  findings: [],
  scanDuration: 1000,
  trackedFindings: [makeFinding(), makeFinding({ id: "fp", falsePositive: true, status: "recurring" })],
  ...overrides,
});

const trackingStats: TrackingStatsType = {
  total: 5,
  new: 2,
  recurring: 3,
  fixed: 1,
};

describe("components/scan/ScanResults", () => {

  it("renders findings tab, exports filtered data, and handles rescan", () => {
    const scan = makeScan();
    const onRescan = vi.fn();
    render(<ScanResults scan={scan} trackingStats={trackingStats} onRescan={onRescan} />);

    fireEvent.click(screen.getByRole("button", { name: "📤 Export CSV" }));
    expect(exportToCSV).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "📤 Export JSON" }));
    expect(exportToJSON).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "🔄 Rescan" }));
    expect(onRescan).toHaveBeenCalled();

    // Details drawer open/close
    fireEvent.click(screen.getByTestId("findings-table"));
    expect(screen.getByTestId("drawer")).toBeInTheDocument();
    fireEvent.click(screen.getByText("close"));
    expect(screen.queryByTestId("drawer")).toBeNull();
  });

  it("handles generate fix and false positive change flows", async () => {
    vi.useRealTimers();
    const scan = makeScan();
    const onGenerateFix = vi.fn().mockResolvedValue(undefined);
    render(<ScanResults scan={scan} trackingStats={trackingStats} onGenerateFix={onGenerateFix} />);

    fireEvent.click(screen.getAllByTestId("findings-table")[0]);
    const drawer = await screen.findByTestId("drawer");
    // Debug assertion to ensure handler is wired
    expect(lastDrawerProps).toBeDefined();
    // eslint-disable-next-line vitest/no-conditional-in-test
    if (process.env.DEBUG_SCAN_RESULTS) {
      // eslint-disable-next-line no-console
      console.log("drawer props", lastDrawerProps);
    }
    expect(typeof lastDrawerProps?.onGenerateFix).toBe("function");
    lastDrawerProps = (lastDrawerProps || {});
    await lastDrawerProps.onGenerateFix?.(lastDrawerProps.finding);

    fireEvent.click(within(drawer).getByText("fp"));
    await waitFor(() => expect(screen.queryByTestId("drawer")).toBeNull());
  });

  it("uses default generate fix handler when none provided", () => {
    const scan = makeScan();
    render(<ScanResults scan={scan} trackingStats={trackingStats} />);

    fireEvent.click(screen.getAllByTestId("findings-table")[0]);
    const drawer = screen.getByTestId("drawer");
    fireEvent.click(within(drawer).getByText("fix"));
    expect(screen.getByTestId("drawer")).toBeInTheDocument();
  });

  it("falls back to Promise.resolve when onGenerateFix is nullish", async () => {
    const scan = makeScan();
    render(
      <ScanResults
        scan={scan}
        trackingStats={trackingStats}
        onGenerateFix={null as unknown as () => Promise<void>}
      />
    );

    fireEvent.click(screen.getAllByTestId("findings-table")[0]);
    const drawer = await screen.findByTestId("drawer");
    fireEvent.click(within(drawer).getByText("fix"));
    expect(screen.getByTestId("drawer")).toBeInTheDocument();
  });

  it("falls back to empty arrays when trackedFindings is missing", () => {
    const scan = { ...makeScan(), trackedFindings: undefined as unknown as TrackedFinding[] };
    render(<ScanResults scan={scan} />);

    expect(screen.getAllByText(/No Issues Found/)[0]).toBeInTheDocument();
  });

  it("shows empty state when no findings and switches tabs", () => {
    const scan = makeScan({ trackedFindings: [] });
    render(<ScanResults scan={scan} />);

    expect(screen.getAllByText(/No Issues Found/)[0]).toBeInTheDocument();

    // switch to patterns
    const patternBtns = screen.getAllByRole("button", { name: /Patterns/ });
    fireEvent.click(patternBtns[patternBtns.length - 1]);
    expect(screen.getByTestId("issue-patterns")).toBeInTheDocument();

    // impact tab
    const impactBtns = screen.getAllByRole("button", { name: /Impact Analysis/ });
    fireEvent.click(impactBtns[impactBtns.length - 1]);
    expect(screen.getByTestId("impact-analysis")).toBeInTheDocument();

    // rules tab with empty rules
    const ruleBtns = screen.getAllByRole("button", { name: /Rules Summary/ });
    fireEvent.click(ruleBtns[ruleBtns.length - 1]);
    expect(screen.getByText(/All Rules Passed/i)).toBeInTheDocument();
  });

  it("renders rules summary rows with tag overflow", () => {
    const ruleFinding = makeFinding({ ruleId: "r2", ruleTitle: "Title 2", impact: "moderate", wcagTags: ["a", "b", "c", "d"], falsePositive: false });
    const frequentRule = makeFinding({ ruleId: "r3", ruleTitle: "Popular", impact: "serious", wcagTags: [], falsePositive: false });
    const scan = makeScan({ trackedFindings: [ruleFinding, frequentRule, frequentRule, frequentRule] });
    render(<ScanResults scan={scan} />);

    const ruleBtns = screen.getAllByRole("button", { name: /Rules Summary/ });
    fireEvent.click(ruleBtns[ruleBtns.length - 1]);
    const titles = screen.getAllByText(/Title 2|Popular/);
    expect(titles[0].textContent).toBe("Popular");
    expect(screen.getByText("Title 2")).toBeInTheDocument();
    expect(screen.getByText("+1 more")).toBeInTheDocument();
    const learnMoreLinks = screen.getAllByText("Learn More →");
    expect(learnMoreLinks[0]).toHaveAttribute("href", "https://help");
  });

  it("falls back to minor impact colors when rule impact is unknown", () => {
    const unknownRule = makeFinding({ ruleId: "x", ruleTitle: "Mystery", impact: "unknown" as any, falsePositive: false });
    const scan = makeScan({ trackedFindings: [unknownRule] });
    render(<ScanResults scan={scan} />);

    const ruleBtns = screen.getAllByRole("button", { name: /Rules Summary/ });
    fireEvent.click(ruleBtns[ruleBtns.length - 1]);

    const title = screen.getByText("Mystery");
    const row = title.closest("div")?.parentElement?.parentElement as HTMLElement;
    const countBox = row?.firstElementChild as HTMLElement;
    expect(countBox).toHaveStyle({ background: "#f0fdf4", color: "#65a30d" });
  });

  it("shows pluralized false positive count when multiple are hidden", () => {
    const scan = makeScan({
      trackedFindings: [
        makeFinding({ id: "fp1", falsePositive: true }),
        makeFinding({ id: "fp2", falsePositive: true }),
        makeFinding({ id: "keep", falsePositive: false }),
      ],
    });

    render(<ScanResults scan={scan} trackingStats={trackingStats} />);

    expect(screen.getByText(/2 false positives hidden/)).toBeInTheDocument();
  });
});
