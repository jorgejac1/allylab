// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SavedScan, PdfExportSettings } from "../../../types";
import { TrendsPDFButton } from "../../../components/reports/TrendsPDFButton";

const mockGenerateTrends = vi.fn();

vi.mock("../../../utils/pdfExport", () => ({
  generateTrendsPDF: (...args: unknown[]) => mockGenerateTrends(...args),
}));

const mockToast = {
  toasts: [],
  success: vi.fn(),
  error: vi.fn(),
  closeToast: vi.fn(),
};

vi.mock("../../../hooks", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useToast: () => mockToast,
  };
});

vi.mock("../../../components/ui", () => {
  const Button = ({
    children,
    onClick,
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick}>
      {children}
    </button>
  );
  const Toast = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return { Button, Toast };
});

describe("reports/TrendsPDFButton", () => {
  beforeEach(() => {
    mockGenerateTrends.mockReset();
    mockToast.success.mockReset();
    mockToast.error.mockReset();
  });

  afterEach(() => cleanup());

  it("exports trends PDF and shows errors", async () => {
    const settings: PdfExportSettings = {
      includeSummary: true,
      includeStats: true,
      includeScoreTrend: true,
      includeIssueTrend: true,
      includeDistribution: true,
      companyName: "Acme",
      logoUrl: "",
    };
    const scans: SavedScan[] = [
      {
        id: "s1",
        url: "https://allylab.com",
        timestamp: new Date().toISOString(),
        score: 80,
        totalIssues: 2,
        critical: 0,
        serious: 1,
        moderate: 1,
        minor: 0,
        findings: [],
        scanDuration: 100,
      },
    ];

    render(<TrendsPDFButton scans={scans} settings={settings} scoreGoal={90} />);
    const btn = screen.getAllByRole("button", { name: /Export PDF/ })[0];
    fireEvent.click(btn);
    await waitFor(() => expect(mockGenerateTrends).toHaveBeenCalledWith({ scans, settings, scoreGoal: 90 }));
    expect(screen.queryByText(/No scan data/)).not.toBeInTheDocument();

    mockGenerateTrends.mockRejectedValue(new Error("fail"));
    fireEvent.click(btn);
    await waitFor(() => expect(screen.getByText("fail")).toBeInTheDocument());
  });

  it("falls back to generic error message when rejection is not an Error", async () => {
    const settings: PdfExportSettings = {
      includeSummary: true,
      includeStats: true,
      includeScoreTrend: true,
      includeIssueTrend: true,
      includeDistribution: true,
      companyName: "Acme",
      logoUrl: "",
    };
    const scans: SavedScan[] = [
      {
        id: "s1",
        url: "https://allylab.com",
        timestamp: new Date().toISOString(),
        score: 80,
        totalIssues: 2,
        critical: 0,
        serious: 1,
        moderate: 1,
        minor: 0,
        findings: [],
        scanDuration: 100,
      },
    ];

    render(<TrendsPDFButton scans={scans} settings={settings} scoreGoal={90} />);
    const btn = screen.getAllByRole("button", { name: /Export PDF/ })[0];

    mockGenerateTrends.mockRejectedValueOnce("string-error");
    fireEvent.click(btn);
    await waitFor(() => expect(screen.getByText("Export failed")).toBeInTheDocument());
  });

  it("shows no-data error in trends PDF button", async () => {
    render(
      <TrendsPDFButton
        scans={[]}
        settings={{
          includeSummary: true,
          includeStats: true,
          includeScoreTrend: true,
          includeIssueTrend: true,
          includeDistribution: true,
          companyName: "",
          logoUrl: "",
        }}
        scoreGoal={80}
      />
    );
    const btn = screen.getAllByRole("button", { name: /Export PDF/ })[0] as HTMLButtonElement;
    // Button is disabled when there are no scans; force-enable to trigger handler for coverage
    btn.disabled = false;
    fireEvent.click(btn);
    await waitFor(() => expect(screen.getByText("No scan data to export")).toBeInTheDocument());
    expect(mockGenerateTrends).not.toHaveBeenCalled();
  });
});
