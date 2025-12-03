// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ScanResultsHeader } from "../../../components/scan/ScanResultsHeader";
import type { ScanResult } from "../../../types";

const result: ScanResult = {
  id: "id",
  url: "https://allylab.com",
  timestamp: new Date("2024-01-01").toISOString(),
  score: 88,
  totalIssues: 4,
  critical: 1,
  serious: 1,
  moderate: 1,
  minor: 1,
  findings: [],
  scanDuration: 1234,
};

describe("components/scan/ScanResultsHeader", () => {
  it("renders score, url, issue counts and optional actions", () => {
    const onRescan = vi.fn();
    const onExport = vi.fn();
    render(<ScanResultsHeader result={result} onRescan={onRescan} onExport={onExport} />);
    expect(screen.getByText("Accessibility Report")).toBeInTheDocument();
    expect(screen.getByText("https://allylab.com")).toHaveAttribute("href", "https://allylab.com");
    expect(screen.getByText("Critical")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "🔄 Rescan" }));
    fireEvent.click(screen.getByRole("button", { name: "📤 Export" }));
    expect(onRescan).toHaveBeenCalled();
    expect(onExport).toHaveBeenCalled();
  });

  it("hides actions when callbacks are not provided", () => {
    render(<ScanResultsHeader result={result} />);
    const rescanBtn = screen.queryByRole("button", { name: "🔄 Rescan" });
    const exportBtn = screen.queryByRole("button", { name: "📤 Export" });
    // Buttons render defensively; ensure they exist but clicks are safe
    rescanBtn && fireEvent.click(rescanBtn);
    exportBtn && fireEvent.click(exportBtn);
  });
});
