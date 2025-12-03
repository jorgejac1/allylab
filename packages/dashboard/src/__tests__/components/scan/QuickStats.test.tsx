// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { QuickStats } from "../../../components/scan/QuickStats";
import type { ScanResult } from "../../../types";

const baseResult: ScanResult = {
  id: "1",
  url: "https://allylab.com",
  timestamp: new Date().toISOString(),
  score: 90,
  totalIssues: 4,
  critical: 1,
  serious: 1,
  moderate: 1,
  minor: 1,
  findings: [],
  scanDuration: 1500,
};

  describe("components/scan/QuickStats", () => {
  it("renders score, issues, severities, and duration", () => {
    render(<QuickStats result={baseResult} />);
    expect(screen.getByText("90/100")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(screen.getAllByText(/^\(1\)$/).length).toBe(4);
    expect(screen.getByText("1.5s")).toBeInTheDocument();
  });
});
