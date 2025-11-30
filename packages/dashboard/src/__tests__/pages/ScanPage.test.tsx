import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { ScanPage } from "../../pages/ScanPage";
import type { SavedScan } from "../../types";
import { mockUseScanSSE, mockUseScans } from "../__mocks__/hooks";
import { mockGetScansForUrl } from "../__mocks__/storage";

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
});
