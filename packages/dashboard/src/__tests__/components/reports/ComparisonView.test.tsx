// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { SavedScan } from "../../../types";
import type { RegressionInfo } from "../../../hooks/useScans";
import { ComparisonView } from "../../../components/reports/ComparisonView";

vi.mock("../../../components/ui", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock("../../../components/charts", () => ({
  ScoreCircle: ({ score }: { score: number }) => <div data-testid="score-circle">{score}</div>,
  SeverityBar: (props: unknown) => <div data-testid="severity-bar">{JSON.stringify(props)}</div>,
}));

const makeScan = (overrides: Partial<SavedScan> = {}): SavedScan => ({
  id: overrides.id || "s1",
  url: overrides.url || "https://allylab.com/page",
  timestamp: overrides.timestamp || new Date("2024-01-01T00:00:00Z").toISOString(),
  score: overrides.score ?? 70,
  totalIssues: overrides.totalIssues ?? 5,
  critical: overrides.critical ?? 1,
  serious: overrides.serious ?? 1,
  moderate: overrides.moderate ?? 1,
  minor: overrides.minor ?? 2,
  findings: [],
  scanDuration: 100,
});

describe("reports/ComparisonView", () => {
  it("renders regression alert and summary text", () => {
    const older = makeScan({ id: "old", score: 70, totalIssues: 6 });
    const newer = makeScan({ id: "new", score: 60, totalIssues: 8, timestamp: new Date("2024-01-02").toISOString() });
    const regression: RegressionInfo = {
      scanId: "new",
      currentScore: 60,
      previousScore: 80,
      scoreDrop: 20,
      url: "allylab.com",
      timestamp: new Date().toISOString(),
    };
    const onClose = vi.fn();

    render(<ComparisonView olderScan={older} newerScan={newer} onClose={onClose} hasRegression={() => regression} />);

    expect(screen.getByText(/Score decreased/)).toBeInTheDocument();
    expect(screen.getByText(/regression of 20 points/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Close/ }));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders improvement summary and diff rows without regressions", () => {
    const older = makeScan({ id: "old", score: 60, totalIssues: 8, critical: 2, serious: 2, moderate: 2, minor: 2 });
    const newer = makeScan({ id: "new", score: 80, totalIssues: 4, critical: 1, serious: 1, moderate: 1, minor: 1, timestamp: new Date("2024-01-02").toISOString() });

    render(<ComparisonView olderScan={older} newerScan={newer} onClose={vi.fn()} />);

    expect(screen.getByText(/Score improved by 20 points/)).toBeInTheDocument();
    const circles = screen.getAllByTestId("score-circle");
    expect(circles.length).toBeGreaterThanOrEqual(2);

    // Diff rows show "+" styling via text content
    expect(screen.getByText("+20")).toBeInTheDocument(); // score diff
  });

  it("renders score unchanged case with neutral styling", () => {
    const older = makeScan({ id: "old", score: 75, totalIssues: 5 });
    const newer = makeScan({ id: "new", score: 75, totalIssues: 5, timestamp: new Date("2024-01-02").toISOString() });

    render(<ComparisonView olderScan={older} newerScan={newer} onClose={vi.fn()} />);

    expect(screen.getByText(/Score remained the same/)).toBeInTheDocument();
    const zeroTexts = screen.getAllByText("0");
    expect(zeroTexts.length).toBeGreaterThanOrEqual(1); // At least one "0" for score diff
  });

  it("shows regression on older scan only", () => {
    const older = makeScan({ id: "old", score: 70 });
    const newer = makeScan({ id: "new", score: 80, timestamp: new Date("2024-01-02").toISOString() });
    const olderRegression: RegressionInfo = {
      scanId: "old",
      currentScore: 70,
      previousScore: 85,
      scoreDrop: 15,
      url: "allylab.com",
      timestamp: new Date().toISOString(),
    };

    const hasRegression = (scanId: string) => {
      if (scanId === "old") return olderRegression;
      return undefined;
    };

    render(<ComparisonView olderScan={older} newerScan={newer} onClose={vi.fn()} hasRegression={hasRegression} />);

    expect(screen.getByText(/Before.*scan shows a regression of 15 points/)).toBeInTheDocument();
  });

  it("shows score improved without issues diff text when issues unchanged", () => {
    const older = makeScan({ id: "old", score: 60, totalIssues: 5 });
    const newer = makeScan({ id: "new", score: 80, totalIssues: 5, timestamp: new Date("2024-01-02").toISOString() });

    render(<ComparisonView olderScan={older} newerScan={newer} onClose={vi.fn()} />);

    const summaryText = screen.getByText(/Score improved by 20 points/);
    expect(summaryText).toBeInTheDocument();
    // Should not mention "Fixed" when issues didn't change
    expect(summaryText.textContent).not.toMatch(/Fixed/);
  });

  it("shows score decreased without new issues text when issues decreased", () => {
    const older = makeScan({ id: "old", score: 80, totalIssues: 8 });
    const newer = makeScan({ id: "new", score: 70, totalIssues: 3, timestamp: new Date("2024-01-02").toISOString() });

    render(<ComparisonView olderScan={older} newerScan={newer} onClose={vi.fn()} />);

    const summaryText = screen.getByText(/Score decreased by 10 points/);
    expect(summaryText).toBeInTheDocument();
    // Should not mention "new issues detected" when issues actually decreased
    expect(summaryText.textContent).not.toMatch(/new issues detected/);
  });

  it("shows all diff icons for various scenarios", () => {
    const older = makeScan({ id: "old", score: 70, totalIssues: 5 });
    const newer = makeScan({ id: "new", score: 70, totalIssues: 5, timestamp: new Date("2024-01-02").toISOString() });

    render(<ComparisonView olderScan={older} newerScan={newer} onClose={vi.fn()} />);

    // With score unchanged, should show neutral icon (➖)
    // This covers the score unchanged branch (line 121)
    const neutralIcons = screen.getAllByText("➖");
    expect(neutralIcons.length).toBeGreaterThanOrEqual(2); // score and issues both unchanged
  });

  it("renders ScanCard with and without regression styling", () => {
    const older = makeScan({ id: "old", score: 70 });
    const newer = makeScan({ id: "new", score: 80, timestamp: new Date("2024-01-02").toISOString() });

    const newerRegression: RegressionInfo = {
      scanId: "new",
      currentScore: 80,
      previousScore: 90,
      scoreDrop: 10,
      url: "allylab.com",
      timestamp: new Date().toISOString(),
    };

    render(
      <ComparisonView
        olderScan={older}
        newerScan={newer}
        onClose={vi.fn()}
        hasRegression={(id) => id === "new" ? newerRegression : undefined}
      />
    );

    // Should show regression badge on the "After" card
    expect(screen.getByText(/🔻 -10 from previous/)).toBeInTheDocument();
  });
});
