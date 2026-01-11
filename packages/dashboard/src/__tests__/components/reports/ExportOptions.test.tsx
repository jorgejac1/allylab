import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type React from "react";
import { ExportOptions } from "../../../components/reports/ExportOptions";
import type { SavedScan, TrackedFinding } from "../../../types";

// Mock UI components
vi.mock("../../../components/ui", () => {
  const Button = ({
    children,
    onClick,
    disabled,
    ...rest
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button disabled={disabled} onClick={onClick} {...rest}>
      {children}
    </button>
  );
  const Card = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  );
  const Modal = ({
    children,
    isOpen,
    title,
    onClose,
  }: {
    children: React.ReactNode;
    isOpen: boolean;
    title: string;
    onClose: () => void;
    size?: string;
  }) =>
    isOpen ? (
      <div>
        <div>{title}</div>
        <button onClick={onClose}>Close</button>
        {children}
      </div>
    ) : null;
  return { Button, Card, Modal };
});

// Mock export helpers
const mockExportCSV = vi.fn();
const mockExportJSON = vi.fn();
vi.mock("../../../utils/export", () => ({
  exportToCSV: (...args: unknown[]) => mockExportCSV(...args),
  exportToJSON: (...args: unknown[]) => mockExportJSON(...args),
}));

describe("reports/ExportOptions", () => {
  const baseFinding: TrackedFinding = {
    id: "f1",
    ruleId: "r1",
    ruleTitle: "Rule",
    description: "desc",
    impact: "minor",
    selector: "a",
    html: "<a/>",
    helpUrl: "https://allylab.com",
    wcagTags: [],
    status: "new",
    fingerprint: "a",
  };

  const baseScan: SavedScan = {
    id: "s1",
    url: "https://allylab.com/page",
    timestamp: new Date().toISOString(),
    score: 90,
    totalIssues: 1,
    critical: 0,
    serious: 0,
    moderate: 1,
    minor: 0,
    findings: [],
    trackedFindings: [baseFinding],
    scanDuration: 1000,
  };

  const otherScan: SavedScan = {
    ...baseScan,
    id: "s2",
    url: "https://allylab.com/other",
    trackedFindings: [],
  };

  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);
    mockExportCSV.mockReset();
    mockExportJSON.mockReset();
  });

  afterEach(() => cleanup());

  it("disables single export without selection and opens modal when enabled", () => {
    render(<ExportOptions scans={[baseScan]} selectedScan={undefined} />);

    const currentBtn = screen.getByRole("button", { name: /Export Current Scan/ });
    expect(currentBtn).toBeDisabled();

    const allBtn = screen.getByRole("button", { name: /Export All Scans/ });
    fireEvent.click(allBtn);
    expect(screen.getByText("Choose Export Format")).toBeInTheDocument();
  });

  it("exports selected scan to CSV and JSON", () => {
    render(<ExportOptions scans={[baseScan]} selectedScan={baseScan} />);

    const currentButtons = screen.getAllByRole("button", { name: /Export Current Scan/ });
    const enabledCurrent = currentButtons.find(btn => !btn.hasAttribute("disabled")) as HTMLButtonElement | undefined;
    expect(enabledCurrent).toBeDefined();
    fireEvent.click(enabledCurrent!);
    fireEvent.click(screen.getAllByText("CSV Format")[0]);
    expect(mockExportCSV).toHaveBeenCalledWith(baseScan.trackedFindings, expect.stringContaining(".csv"));
    expect(screen.queryByText("CSV Format")).not.toBeInTheDocument();

    const currentButtons2 = screen.getAllByRole("button", { name: /Export Current Scan/ });
    const enabledCurrent2 = currentButtons2.find(btn => !btn.hasAttribute("disabled")) as HTMLButtonElement | undefined;
    fireEvent.click(enabledCurrent2!);
    fireEvent.click(screen.getAllByText("JSON Format")[0]);
    expect(mockExportJSON).toHaveBeenCalledWith(baseScan, expect.stringContaining(".json"));
  });

  it("exports all scans when exportType is all", () => {
    render(<ExportOptions scans={[baseScan, otherScan]} selectedScan={baseScan} />);

    const allButtons = screen.getAllByRole("button", { name: /Export All Scans/ });
    const enabledAll = allButtons.find(btn => !btn.hasAttribute("disabled")) as HTMLButtonElement | undefined;
    expect(enabledAll).toBeDefined();
    fireEvent.click(enabledAll!);
    fireEvent.click(screen.getAllByText("CSV Format")[0]);
    expect(mockExportCSV).toHaveBeenCalledWith(
      expect.arrayContaining(baseScan.trackedFindings || []),
      expect.stringContaining("allylab-all-scans")
    );

    const allButtons2 = screen.getAllByRole("button", { name: /Export All Scans/ });
    const enabledAll2 = allButtons2.find(btn => !btn.hasAttribute("disabled")) as HTMLButtonElement | undefined;
    fireEvent.click(enabledAll2!);
    fireEvent.click(screen.getAllByText("JSON Format")[0]);
    expect(mockExportJSON).toHaveBeenCalledWith(expect.arrayContaining([baseScan, otherScan]), expect.any(String));
  });

  it("closes modal when Close button is clicked", () => {
    render(<ExportOptions scans={[baseScan]} selectedScan={baseScan} />);

    // Open the modal
    const currentButtons = screen.getAllByRole("button", { name: /Export Current Scan/ });
    const enabledCurrent = currentButtons.find(btn => !btn.hasAttribute("disabled")) as HTMLButtonElement | undefined;
    fireEvent.click(enabledCurrent!);

    // Modal should be open
    expect(screen.getByText("Choose Export Format")).toBeInTheDocument();

    // Click the close button
    const closeButton = screen.getByRole("button", { name: /Close/ });
    fireEvent.click(closeButton);

    // Modal should be closed
    expect(screen.queryByText("Choose Export Format")).not.toBeInTheDocument();
  });

  it("disables Export All button when no scans available", () => {
    render(<ExportOptions scans={[]} selectedScan={undefined} />);

    const allButtons = screen.getAllByRole("button", { name: /Export All Scans/ });
    const allBtn = allButtons.find(btn => btn.textContent?.includes("Export All Scans"));
    expect(allBtn).toBeDisabled();
  });

  it("handles scan without trackedFindings gracefully", () => {
    const scanWithoutTracked = { ...baseScan, trackedFindings: undefined };
    render(<ExportOptions scans={[scanWithoutTracked]} selectedScan={scanWithoutTracked} />);

    const currentButtons = screen.getAllByRole("button", { name: /Export Current Scan/ });
    const enabledCurrent = currentButtons.find(btn => !btn.hasAttribute("disabled")) as HTMLButtonElement | undefined;
    fireEvent.click(enabledCurrent!);
    fireEvent.click(screen.getAllByText("CSV Format")[0]);

    expect(mockExportCSV).toHaveBeenCalledWith([], expect.stringContaining(".csv"));
  });

  it("handles all scans export with some scans missing trackedFindings", () => {
    const scanWithoutTracked = { ...baseScan, trackedFindings: undefined };
    const scanWithTracked = { ...otherScan, trackedFindings: [baseFinding] };
    render(<ExportOptions scans={[scanWithoutTracked, scanWithTracked]} selectedScan={undefined} />);

    const allButtons = screen.getAllByRole("button", { name: /Export All Scans/ });
    const enabledAll = allButtons.find(btn => !btn.hasAttribute("disabled")) as HTMLButtonElement | undefined;
    fireEvent.click(enabledAll!);
    fireEvent.click(screen.getAllByText("CSV Format")[0]);

    // Should handle missing trackedFindings by using empty array
    expect(mockExportCSV).toHaveBeenCalledWith(
      expect.arrayContaining([baseFinding]),
      expect.stringContaining("allylab-all-scans")
    );
  });
});
