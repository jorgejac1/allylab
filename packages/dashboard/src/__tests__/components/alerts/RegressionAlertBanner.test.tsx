import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RegressionAlertBanner } from "../../../components/alerts/RegressionAlertBanner";
import type { RegressionInfo } from "../../../hooks/useScans";

function createRegression(overrides: Partial<RegressionInfo> = {}): RegressionInfo {
  return {
    scanId: overrides.scanId ?? "scan-1",
    url: overrides.url ?? "example.com",
    previousScore: overrides.previousScore ?? 90,
    currentScore: overrides.currentScore ?? 70,
    scoreDrop: overrides.scoreDrop ?? 20,
    timestamp: overrides.timestamp ?? "2024-01-15T10:30:00Z",
  };
}

describe("alerts/RegressionAlertBanner", () => {
  it("renders title and regression info", () => {
    const regressions = [createRegression()];

    render(<RegressionAlertBanner regressions={regressions} />);

    expect(screen.getByText("Score Regression Detected")).toBeInTheDocument();
    expect(screen.getByText("example.com")).toBeInTheDocument();
    expect(screen.getByText("20 points")).toBeInTheDocument();
    expect(screen.getByText("(90 → 70)")).toBeInTheDocument();
  });

  it("shows up to 3 regressions", () => {
    const regressions = [
      createRegression({ scanId: "1", url: "site1.com" }),
      createRegression({ scanId: "2", url: "site2.com" }),
      createRegression({ scanId: "3", url: "site3.com" }),
    ];

    render(<RegressionAlertBanner regressions={regressions} />);

    expect(screen.getByText("site1.com")).toBeInTheDocument();
    expect(screen.getByText("site2.com")).toBeInTheDocument();
    expect(screen.getByText("site3.com")).toBeInTheDocument();
  });

  it("shows count of additional regressions when more than 3", () => {
    const regressions = [
      createRegression({ scanId: "1", url: "site1.com" }),
      createRegression({ scanId: "2", url: "site2.com" }),
      createRegression({ scanId: "3", url: "site3.com" }),
      createRegression({ scanId: "4", url: "site4.com" }),
      createRegression({ scanId: "5", url: "site5.com" }),
    ];

    render(<RegressionAlertBanner regressions={regressions} />);

    expect(screen.getByText("+2 more regressions")).toBeInTheDocument();
    // Fourth and fifth sites should not be visible
    expect(screen.queryByText("site4.com")).not.toBeInTheDocument();
    expect(screen.queryByText("site5.com")).not.toBeInTheDocument();
  });

  it("formats timestamp correctly", () => {
    const regressions = [
      createRegression({ timestamp: "2024-03-15T14:30:00Z" }),
    ];

    render(<RegressionAlertBanner regressions={regressions} />);

    // The formatted date should be present (exact format may vary by locale)
    const dateElement = screen.getByText(/Mar 15/);
    expect(dateElement).toBeInTheDocument();
  });
});
