// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SiteScanner } from "../../../components/scanner/SiteScanner";
import type { PageResult } from "../../../hooks/useSiteScan";

const mockUseSiteScan = vi.fn();
const RealURL = URL;

vi.mock("../../../hooks/useSiteScan", () => ({
  useSiteScan: () => mockUseSiteScan(),
}));

const baseHook = () => ({
  phase: "idle",
  discoveredUrls: [] as string[],
  currentPage: 0,
  totalPages: 0,
  results: [] as PageResult[],
  summary: null,
  error: null,
  startScan: vi.fn(),
  reset: vi.fn(),
  isScanning: false,
});

describe("components/scanner/SiteScanner", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockUseSiteScan.mockReturnValue(baseHook());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal("URL", RealURL);
  });

  it("submits a scan with form values and ignores blank or in-progress submissions", () => {
    const startScan = vi.fn();
    mockUseSiteScan.mockReturnValue({ ...baseHook(), startScan });

    const { rerender } = render(<SiteScanner />);

    const urlInput = screen.getAllByPlaceholderText("https://example.com")[0];
    fireEvent.change(urlInput, { target: { value: " https://ally.com " } });
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "25" } });
    fireEvent.change(selects[1], { target: { value: "3" } });
    fireEvent.change(selects[2], { target: { value: "wcag22aa" } });

    fireEvent.click(screen.getByRole("button", { name: /Start Site Scan/ }));
    expect(startScan).toHaveBeenCalledWith("https://ally.com", 25, 3, "wcag22aa");

    // blank submission ignored
    startScan.mockClear();
    fireEvent.change(urlInput, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: /Start Site Scan/ }));
    expect(startScan).not.toHaveBeenCalled();

    // in-progress submission ignored
    startScan.mockClear();
    mockUseSiteScan.mockReturnValue({ ...baseHook(), startScan, isScanning: true });
    rerender(<SiteScanner />);
    fireEvent.change(screen.getAllByPlaceholderText("https://example.com")[0], {
      target: { value: "https://ally.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Scanning..." }));
    expect(startScan).not.toHaveBeenCalled();
  });

  it("shows crawling and scanning progress with live results", () => {
    const crawlingHook = {
      ...baseHook(),
      phase: "crawling",
      isScanning: true,
      discoveredUrls: ["https://a.com", "https://b.com"],
    };
    mockUseSiteScan.mockReturnValue(crawlingHook);
    render(<SiteScanner />);
    expect(screen.getByText(/Discovering Pages/)).toBeInTheDocument();
    expect(screen.getByText(/Found 2 pages so far/)).toBeInTheDocument();

    const scanningHook = {
      ...baseHook(),
      phase: "scanning",
      isScanning: true,
      currentPage: 1,
      totalPages: 4,
      results: [
        {
          url: "https://site.com/page-high",
          score: 95,
          totalIssues: 1,
          critical: 0,
          serious: 0,
          moderate: 1,
          minor: 0,
          scanTime: 120,
        },
        {
          url: "https://site.com/page-mid",
          score: 70,
          totalIssues: 2,
          critical: 0,
          serious: 1,
          moderate: 1,
          minor: 0,
          scanTime: 95,
        },
        {
          url: "https://site.com/page-low",
          score: 45,
          totalIssues: 5,
          critical: 1,
          serious: 2,
          moderate: 1,
          minor: 1,
          scanTime: 210,
        },
      ],
    };
    mockUseSiteScan.mockReturnValue(scanningHook);

    const OriginalURL = URL;
    class MockURL {
      href: string;
      pathname: string;
      constructor(url: string) {
        this.href = url;
        this.pathname = "";
      }
    }
    vi.stubGlobal("URL", MockURL as unknown as typeof URL);
    render(<SiteScanner />);
    expect(screen.getByText("Scanning page 1 of 4")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getAllByText("/").length).toBeGreaterThan(0); // fallback when pathname is empty

    // restore behavior for other assertions
    vi.stubGlobal("URL", OriginalURL);
    mockUseSiteScan.mockReturnValue(scanningHook);
    render(<SiteScanner />);
    expect(screen.getByText("/page-high")).toBeInTheDocument();
    expect(screen.getAllByText("5 issues").length).toBeGreaterThan(0);
  });

  it("renders error state and reset button", () => {
    const reset = vi.fn();
    mockUseSiteScan.mockReturnValue({
      ...baseHook(),
      phase: "error",
      error: "Boom",
      reset,
    });

    render(<SiteScanner />);
    expect(screen.getByText("Boom")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(reset).toHaveBeenCalled();
  });

  it("shows summary table and sorts results when scan completes", () => {
    const reset = vi.fn();
    const summaryResults: PageResult[] = [
      {
        url: "https://site.com/z",
        score: 80,
        totalIssues: 3,
        critical: 0,
        serious: 1,
        moderate: 1,
        minor: 1,
        scanTime: 80,
      },
      {
        url: "https://site.com/a",
        score: 50,
        totalIssues: 6,
        critical: 1,
        serious: 2,
        moderate: 2,
        minor: 0,
        scanTime: 110,
      },
      {
        url: "https://site.com/",
        score: 60,
        totalIssues: 1,
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 1,
        scanTime: 75,
      },
    ];

    class MockURL {
      href: string;
      pathname: string;
      constructor(url: string) {
        this.href = url;
        this.pathname = "";
      }
    }
    vi.stubGlobal("URL", MockURL as unknown as typeof URL);

    mockUseSiteScan.mockReturnValue({
      ...baseHook(),
      phase: "complete",
      reset,
      summary: {
        averageScore: 92,
        pagesScanned: 3,
        totalIssues: 9,
        critical: 1,
        results: summaryResults,
      },
      results: [],
    });

    render(<SiteScanner />);

    // Reset visible in complete state
    const resetButtons = screen.getAllByRole("button", { name: "Reset" });
    expect(resetButtons.length).toBeGreaterThan(0);

    // Summary cards (scoped to avoid duplicate numbers)
    const cards = screen.getAllByText(/Score|Pages Scanned|Total Issues|Critical/i).map((label) =>
      label.parentElement as HTMLElement
    );
    expect(cards[0]).toHaveTextContent("92");
    expect(cards[1]).toHaveTextContent("Pages Scanned");
    expect(cards[1]).toHaveTextContent("3");
    expect(cards[2]).toHaveTextContent("Total Issues");
    expect(cards[2]).toHaveTextContent("9");
    expect(cards[3]).toHaveTextContent("Critical");
    expect(cards[3]).toHaveTextContent("1");

    // Table is sorted by score ascending
    const rows = screen.getAllByRole("row").slice(1); // skip header
    expect(rows[0].textContent).toContain("50");
    expect(rows[1].textContent).toContain("60");
    expect(rows[2].textContent).toContain("80");
    expect(rows[1].textContent).toContain("/"); // fallback from mocked URL

    // Verify path link and severity columns with styles
    const firstRow = rows[0];
    const link = within(firstRow).getByRole("link");
    expect(link).toHaveTextContent("/"); // mocked URL fallback
    expect(link).toHaveAttribute("href", "https://site.com/a");

    const cells = within(firstRow).getAllByRole("cell");
    // cells: [page, score, critical, serious, moderate, minor, total]
    expect(cells[3]).toHaveTextContent("2");
    expect(cells[3]).toHaveStyle({ color: "#f97316" });
    expect(cells[4]).toHaveTextContent("2");
    expect(cells[4]).toHaveStyle({ color: "#eab308" });
    expect(cells[5]).toHaveTextContent("0");
    expect(cells[5]).toHaveStyle({ color: "#94a3b8" });

    // Row with zero serious should use gray fallback color
    const secondRowCells = within(rows[1]).getAllByRole("cell");
    expect(secondRowCells[3]).toHaveTextContent("0");
    expect(secondRowCells[3]).toHaveStyle({ color: "#94a3b8" });
    expect(secondRowCells[5]).toHaveTextContent("1");
    expect(secondRowCells[5]).toHaveStyle({ color: "#3b82f6" });
  });
});
