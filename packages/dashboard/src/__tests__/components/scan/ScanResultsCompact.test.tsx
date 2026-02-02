// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ScanResultsCompact } from "../../../components/scan/ScanResultsCompact";
import type { SavedScan } from "../../../types";

const makeScan = (overrides: Partial<SavedScan> = {}): SavedScan => ({
  id: "s1",
  url: "https://allylab.com/page",
  timestamp: new Date("2024-01-01").toISOString(),
  score: 90,
  totalIssues: 4,
  critical: 1,
  serious: 1,
  moderate: 1,
  minor: 1,
  findings: [],
  scanDuration: 1000,
  ...overrides,
});

describe("components/scan/ScanResultsCompact", () => {
  it("renders hostname, timestamp, severities and click handler", () => {
    const onClick = vi.fn();
    render(<ScanResultsCompact scan={makeScan()} onClick={onClick} selected />);
    expect(screen.getByText("allylab.com")).toBeInTheDocument();
    fireEvent.click(screen.getByText("allylab.com"));
    expect(onClick).toHaveBeenCalled();
    const counts = screen.getAllByText("1", { exact: true });
    expect(counts.length).toBeGreaterThanOrEqual(4);
  });

  it("shows no-issues badge when totalIssues is zero", () => {
    render(<ScanResultsCompact scan={makeScan({ totalIssues: 0, critical: 0, serious: 0, moderate: 0, minor: 0 })} />);
    expect(screen.getByText(/No issues/)).toBeInTheDocument();
  });
});
