// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { PDFDashboardData, SiteStats, TopIssue } from "../../../types/executive";
import { PDFReportButton } from "../../../components/reports/PDFReportButton";

const mockGenerateExec = vi.fn();

vi.mock("../../../utils/pdfExport", () => ({
  generateExecutiveReportPDF: (...args: unknown[]) => mockGenerateExec(...args),
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
    disabled,
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
  const Toast = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return { Button, Toast };
});

const pdfData: PDFDashboardData = {
  averageScore: 90,
  totalIssues: 10,
  sitesMonitored: 2,
  severity: { critical: 1, serious: 2, moderate: 3, minor: 4 },
  overallTrend: [1, 2],
  criticalTrend: [0, 1],
};

const site: SiteStats = {
  url: "https://allylab.com",
  domain: "allylab.com",
  latestScore: 95,
  latestIssues: 1,
  critical: 0,
  serious: 0,
  moderate: 1,
  minor: 0,
  scanCount: 2,
  trend: [90, 95],
  lastScanned: new Date().toISOString(),
  scoreChange: 5,
};

const issue: TopIssue = {
  ruleId: "r1",
  title: "Issue",
  count: 2,
  severity: "serious",
  affectedSites: 1,
};

describe("reports/PDFReportButton", () => {
  beforeEach(() => {
    mockGenerateExec.mockReset();
    mockToast.success.mockReset();
    mockToast.error.mockReset();
  });

  afterEach(() => cleanup());

  it("generates executive PDF and handles errors", async () => {
    mockGenerateExec.mockResolvedValue(undefined);
    render(<PDFReportButton data={pdfData} sites={[site]} topIssues={[issue]} companyName="Acme" />);

    const btn = screen.getAllByRole("button", { name: /Export PDF/ })[0];
    fireEvent.click(btn);
    expect(btn).toBeDisabled();
    await waitFor(() => expect(mockGenerateExec).toHaveBeenCalled());
    expect(mockToast.success).toHaveBeenCalledWith("PDF report generated successfully");

    mockGenerateExec.mockRejectedValue(new Error("boom"));
    fireEvent.click(screen.getByRole("button", { name: /Export PDF/ }));
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith("Failed to generate PDF. Please try again."));
  });

  it("disables executive PDF when no sites", () => {
    render(<PDFReportButton data={pdfData} sites={[]} topIssues={[issue]} />);
    const buttons = screen.getAllByRole("button", { name: /Export PDF/ });
    const target = buttons.find(btn => btn.getAttribute("disabled") !== null);
    expect(target).toBeDefined();
    expect(target).toBeDisabled();
  });
});
