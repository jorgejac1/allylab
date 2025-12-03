// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ImpactAnalysis } from "../../../components/scan/ImpactAnalysis";
import type { ScanResult } from "../../../types";

const baseResult: ScanResult = {
  id: "1",
  url: "https://allylab.com",
  timestamp: new Date().toISOString(),
  score: 80,
  totalIssues: 4,
  critical: 1,
  serious: 1,
  moderate: 1,
  minor: 1,
  findings: [],
  scanDuration: 2000,
};

vi.mock("../../../utils/devTime", () => ({
  calculateDevTime: () => ({
    totalHours: 12,
    devWeeks: 2,
    sprints: 1,
    bySeverity: { critical: 5, serious: 4, moderate: 3 },
  }),
  getRiskAssessment: () => ({
    level: "high",
    label: "High",
    description: "Risky",
  }),
}));

describe("components/scan/ImpactAnalysis", () => {
  it("renders dev time and risk assessment blocks", () => {
    render(<ImpactAnalysis result={baseResult} />);
    expect(screen.getByText("12h")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText(/Risky/)).toBeInTheDocument();
    expect(screen.getByText("5h")).toBeInTheDocument();
    expect(screen.getByText("4h")).toBeInTheDocument();
  });
});
