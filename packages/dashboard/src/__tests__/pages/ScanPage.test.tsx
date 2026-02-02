import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { ScanPage } from "../../pages/ScanPage";
import { performRescan } from "../../utils/scan";
import type { SavedScan } from "../../types";
import { mockUseScanSSE, mockUseScans } from "../__mocks__/hooks";
import { mockGetScansForUrl, mockLoadAllScans } from "../__mocks__/storage";

vi.mock("../../components/layout", () => import("../__mocks__/pageComponents"));
vi.mock("../../components/scan", () => import("../__mocks__/pageComponents"));
vi.mock("../../components/ui", () => import("../__mocks__/pageComponents"));
vi.mock("../../hooks", () => import("../__mocks__/hooks"));
vi.mock("../../utils/storage", () => import("../__mocks__/storage"));

const baseScan: SavedScan = {
  id: "scan-1",
  url: "https://example.com",
  timestamp: "now",
  score: 90,
  totalIssues: 2,
  critical: 1,
  serious: 1,
  moderate: 0,
  minor: 0,
  findings: [
    { id: "f1", ruleId: "r1", ruleTitle: "Title1", description: "", impact: "critical", selector: "#a", html: "<div>", helpUrl: "", wcagTags: [] },
    { id: "f2", ruleId: "r2", ruleTitle: "Title2", description: "", impact: "serious", selector: "#b", html: "<span>", helpUrl: "", wcagTags: [] },
  ],
  scanDuration: 1,
};

describe("pages/ScanPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetScansForUrl.mockReset();
  });

  it("filters findings when drilldown targets an issue", () => {
    mockUseScanSSE.mockReturnValue({
      isScanning: false,
      progress: { percent: 0, message: "", status: "idle" },
      result: null,
      error: null,
      startScan: vi.fn(),
      cancelScan: vi.fn(),
      reset: vi.fn(),
    });
    mockUseScans.mockReturnValue({ addScan: vi.fn() });

    render(
      <ScanPage
        currentScan={baseScan}
        onScanComplete={vi.fn()}
        drillDownContext={{ type: "issue", ruleId: "r1" }}
      />
    );

    expect(screen.getByTestId("scan-results")).toHaveAttribute("data-findings", "1");
  });

  it("starts a scan from the scan form", () => {
    const startScan = vi.fn();
    const reset = vi.fn();
    mockUseScanSSE.mockReturnValue({
      isScanning: false,
      progress: { percent: 0, message: "", status: "idle" },
      result: null,
      error: null,
      startScan,
      cancelScan: vi.fn(),
      reset,
    });
    mockUseScans.mockReturnValue({ addScan: vi.fn() });
    const onScanComplete = vi.fn();

    render(<ScanPage currentScan={null} onScanComplete={onScanComplete} />);

    fireEvent.click(screen.getByTestId("trigger-scan"));

    expect(reset).toHaveBeenCalled();
    expect(onScanComplete).toHaveBeenCalledWith(null);
    expect(startScan).toHaveBeenCalledWith("https://scan.me", { standard: "wcag21aa", viewport: "desktop" });
  });

  it("calls onComplete hook and passes saved scan", () => {
    const savedScan = { ...baseScan, id: "saved" };
    mockUseScanSSE.mockReturnValue({
      isScanning: false,
      progress: { percent: 0, message: "", status: "idle" },
      result: null,
      error: null,
      startScan: vi.fn(),
      cancelScan: vi.fn(),
      reset: vi.fn(),
    });
    mockUseScans.mockReturnValue({ addScan: vi.fn().mockReturnValue(savedScan) });
    const onScanComplete = vi.fn();

    render(<ScanPage currentScan={null} onScanComplete={onScanComplete} />);

    const options = mockUseScanSSE.mock.calls[0]?.[0] as { onComplete: (scan: SavedScan) => void };
    options.onComplete(baseScan);

    expect(onScanComplete).toHaveBeenCalledWith(savedScan);
  });

  it("loads latest scan for drilldown site context", async () => {
    mockUseScanSSE.mockReturnValue({
      isScanning: false,
      progress: { percent: 0, message: "", status: "idle" },
      result: null,
      error: null,
      startScan: vi.fn(),
      cancelScan: vi.fn(),
      reset: vi.fn(),
    });
    mockUseScans.mockReturnValue({ addScan: vi.fn() });
    const onScanComplete = vi.fn();
    const latest: SavedScan = { ...baseScan, id: "latest" };
    mockGetScansForUrl.mockReturnValue([latest]);

    render(<ScanPage currentScan={null} onScanComplete={onScanComplete} drillDownContext={{ type: "site", url: baseScan.url }} />);

    await waitFor(() => expect(onScanComplete).toHaveBeenCalledWith(latest));
  });

  it("skips onScanComplete when no scans found for site drilldown", async () => {
    mockUseScanSSE.mockReturnValue({
      isScanning: false,
      progress: { percent: 0, message: "", status: "idle" },
      result: null,
      error: null,
      startScan: vi.fn(),
      cancelScan: vi.fn(),
      reset: vi.fn(),
    });
    mockUseScans.mockReturnValue({ addScan: vi.fn() });
    const onScanComplete = vi.fn();
    mockGetScansForUrl.mockReturnValue([]);

    render(<ScanPage currentScan={null} onScanComplete={onScanComplete} drillDownContext={{ type: "site", url: baseScan.url }} />);

    await waitFor(() => expect(onScanComplete).not.toHaveBeenCalled());
  });

  it("loads scan containing issue for drilldown issue context", async () => {
    mockUseScanSSE.mockReturnValue({
      isScanning: false,
      progress: { percent: 0, message: "", status: "idle" },
      result: null,
      error: null,
      startScan: vi.fn(),
      cancelScan: vi.fn(),
      reset: vi.fn(),
    });
    mockUseScans.mockReturnValue({ addScan: vi.fn() });
    const onScanComplete = vi.fn();
    const scanWithIssue: SavedScan = { ...baseScan, id: "scan-with-issue" };
    mockLoadAllScans.mockReturnValue([scanWithIssue]);

    render(<ScanPage currentScan={null} onScanComplete={onScanComplete} drillDownContext={{ type: "issue", ruleId: "r1" }} />);

    await waitFor(() => expect(onScanComplete).toHaveBeenCalledWith(scanWithIssue));
  });

  it("skips onScanComplete when no scans have the issue for issue drilldown", async () => {
    mockUseScanSSE.mockReturnValue({
      isScanning: false,
      progress: { percent: 0, message: "", status: "idle" },
      result: null,
      error: null,
      startScan: vi.fn(),
      cancelScan: vi.fn(),
      reset: vi.fn(),
    });
    mockUseScans.mockReturnValue({ addScan: vi.fn() });
    const onScanComplete = vi.fn();
    mockLoadAllScans.mockReturnValue([]);

    render(<ScanPage currentScan={null} onScanComplete={onScanComplete} drillDownContext={{ type: "issue", ruleId: "nonexistent" }} />);

    await waitFor(() => expect(onScanComplete).not.toHaveBeenCalled());
  });

  it("shows progress and cancel button when scanning", () => {
    mockUseScanSSE.mockReturnValue({
      isScanning: true,
      progress: { percent: 25, message: "Scanning", status: "running" },
      result: null,
      error: null,
      startScan: vi.fn(),
      cancelScan: vi.fn(),
      reset: vi.fn(),
    });
    mockUseScans.mockReturnValue({ addScan: vi.fn() });
    const onScanComplete = vi.fn();

    render(<ScanPage currentScan={null} onScanComplete={onScanComplete} />);

    expect(screen.getByTestId("scan-progress")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Cancel Scan/));
  });

  it("renders success banner and empty state depending on result/error", () => {
    mockUseScanSSE.mockReturnValue({
      isScanning: false,
      progress: { percent: 0, message: "", status: "complete" },
      result: { ...baseScan, totalIssues: 3, score: 80 },
      error: null,
      startScan: vi.fn(),
      cancelScan: vi.fn(),
      reset: vi.fn(),
    });
    mockUseScans.mockReturnValue({ addScan: vi.fn() });
    const onScanComplete = vi.fn();

    const { rerender } = render(<ScanPage currentScan={null} onScanComplete={onScanComplete} />);
    expect(screen.getByText(/Scan Complete/)).toBeInTheDocument();

    mockUseScanSSE.mockReturnValueOnce({
      isScanning: false,
      progress: { percent: 0, message: "", status: "idle" },
      result: null,
      error: "Oops",
      startScan: vi.fn(),
      cancelScan: vi.fn(),
      reset: vi.fn(),
    });
    rerender(<ScanPage currentScan={null} onScanComplete={onScanComplete} />);
    expect(screen.getByText("Oops")).toBeInTheDocument();

    mockUseScanSSE.mockReturnValueOnce({
      isScanning: false,
      progress: { percent: 0, message: "", status: "idle" },
      result: null,
      error: null,
      startScan: vi.fn(),
      cancelScan: vi.fn(),
      reset: vi.fn(),
    });
    rerender(<ScanPage currentScan={null} onScanComplete={onScanComplete} />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("handles rescan and cancel actions", () => {
    const startScan = vi.fn();
    const reset = vi.fn();
    const cancelScan = vi.fn();
    mockUseScanSSE.mockReturnValue({
      isScanning: false,
      progress: { percent: 0, message: "", status: "idle" },
      result: null,
      error: null,
      startScan,
      cancelScan,
      reset,
    });
    mockUseScans.mockReturnValue({ addScan: vi.fn() });
    const onScanComplete = vi.fn();

    const { container: firstContainer } = render(<ScanPage currentScan={baseScan} onScanComplete={onScanComplete} />);
    fireEvent.click(within(firstContainer).getByTestId("rescan"));
    expect(reset).toHaveBeenCalled();
    expect(onScanComplete).toHaveBeenCalledWith(null);
    expect(startScan).toHaveBeenCalledWith(baseScan.url, { standard: "wcag21aa", viewport: "desktop" });

    mockUseScanSSE.mockReturnValue({
      isScanning: true,
      progress: { percent: 50, message: "Halfway", status: "running" },
      result: null,
      error: null,
      startScan,
      cancelScan,
      reset,
    });
    const { container: secondContainer, rerender } = render(<ScanPage currentScan={baseScan} onScanComplete={onScanComplete} />);
    rerender(<ScanPage currentScan={baseScan} onScanComplete={onScanComplete} />);
    fireEvent.click(within(secondContainer).getByText(/Cancel Scan/));
    expect(cancelScan).toHaveBeenCalled();

    mockUseScanSSE.mockReturnValue({
      isScanning: false,
      progress: { percent: 0, message: "", status: "idle" },
      result: null,
      error: null,
      startScan,
      cancelScan,
      reset,
    });
    const { container: thirdContainer } = render(<ScanPage currentScan={null} onScanComplete={onScanComplete} />);
    startScan.mockClear();
    expect(within(thirdContainer).queryByTestId("rescan")).toBeNull();
    expect(startScan).not.toHaveBeenCalled();

    expect(performRescan(null, startScan)).toBe(false);
  });
});
