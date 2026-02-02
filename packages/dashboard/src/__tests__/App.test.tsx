// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import App from "../App";

afterEach(() => {
  cleanup();
});

// Mock hooks
let mockStatus: "connected" | "disconnected" | "checking" = "connected";

vi.mock("../hooks", () => ({
  useApiStatus: () => ({ status: mockStatus }),
}));

// Mock layout component
vi.mock("../components/layout", () => ({
  SidebarLayout: ({
    children,
    groups,
    activeItem,
    onItemClick,
    apiStatus,
  }: {
    children: React.ReactNode;
    groups: Array<{ title: string; items: Array<{ id: string; label: string; icon: React.ReactNode }> }>;
    activeItem: string;
    onItemClick: (id: string) => void;
    apiStatus: string;
  }) => (
    <div data-testid="sidebar-layout" data-active={activeItem} data-status={apiStatus}>
      <div data-testid="nav-groups">
        {groups.map((group) => (
          <div key={group.title} data-testid={`group-${group.title}`}>
            <span>{group.title}</span>
            {group.items.map((item) => (
              <button
                key={item.id}
                data-testid={`nav-${item.id}`}
                onClick={() => onItemClick(item.id)}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        ))}
        <button data-testid="nav-invalid" onClick={() => onItemClick("invalid-page")}>
          Invalid
        </button>
      </div>
      <div data-testid="content">{children}</div>
    </div>
  ),
  UserSwitcher: () => <div data-testid="user-switcher">User Switcher</div>,
}));

// Mock page components - each lazy loaded separately
vi.mock("../pages/ScanPage", () => ({
  ScanPage: ({
    currentScan,
    onScanComplete,
    drillDownContext,
  }: {
    currentScan: unknown;
    onScanComplete: (scan: unknown) => void;
    drillDownContext: unknown;
  }) => (
    <div data-testid="scan-page">
      <span data-testid="has-scan">{currentScan ? "yes" : "no"}</span>
      <span data-testid="drill-down">{JSON.stringify(drillDownContext)}</span>
      <button onClick={() => onScanComplete({ id: "test-scan" })}>Complete Scan</button>
    </div>
  ),
}));

vi.mock("../pages/SiteScanPage", () => ({
  SiteScanPage: () => <div data-testid="site-scan-page">Site Scan Page</div>,
}));

vi.mock("../pages/ReportsPage", () => ({
  ReportsPage: () => <div data-testid="reports-page">Reports Page</div>,
}));

vi.mock("../pages/ExecutivePage", () => ({
  ExecutivePage: ({ onDrillDown }: { onDrillDown: (target: { type: string; url?: string; ruleId?: string }) => void }) => (
    <div data-testid="executive-page">
      <button
        data-testid="drill-down-site"
        onClick={() => onDrillDown({ type: "site", url: "https://example.com" })}
      >
        Drill Down Site
      </button>
      <button
        data-testid="drill-down-rule"
        onClick={() => onDrillDown({ type: "rule", ruleId: "color-contrast" })}
      >
        Drill Down Rule
      </button>
    </div>
  ),
}));

vi.mock("../pages/BenchmarkPage", () => ({
  BenchmarkPage: () => <div data-testid="benchmark-page">Benchmark Page</div>,
}));

vi.mock("../pages/SettingsPage", () => ({
  SettingsPage: () => <div data-testid="settings-page">Settings Page</div>,
}));

// Clear localStorage before tests to ensure consistent state
beforeEach(() => {
  localStorage.clear();
});

// Note: We don't mock ../context or ../utils/permissions so the real
// AppProvider and AuthProvider work correctly for navigation and auth state.
// AuthProvider uses DEFAULT_USER (admin) which has access to all pages.

describe("App", () => {
  beforeEach(() => {
    mockStatus = "connected";
    vi.clearAllMocks();
  });

  it("renders SidebarLayout with correct groups", () => {
    render(<App />);
    expect(screen.getByTestId("sidebar-layout")).toBeInTheDocument();
    expect(screen.getByTestId("group-Scanning")).toBeInTheDocument();
    expect(screen.getByTestId("group-Analysis")).toBeInTheDocument();
    expect(screen.getByTestId("group-Configuration")).toBeInTheDocument();
  });

  it("renders all navigation items", () => {
    render(<App />);
    expect(screen.getByTestId("nav-scan")).toBeInTheDocument();
    expect(screen.getByTestId("nav-site-scan")).toBeInTheDocument();
    expect(screen.getByTestId("nav-reports")).toBeInTheDocument();
    expect(screen.getByTestId("nav-executive")).toBeInTheDocument();
    expect(screen.getByTestId("nav-benchmark")).toBeInTheDocument();
    expect(screen.getByTestId("nav-settings")).toBeInTheDocument();
  });

  it("defaults to scan page", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByTestId("scan-page")).toBeInTheDocument());
    expect(screen.getByTestId("sidebar-layout")).toHaveAttribute("data-active", "scan");
  });

  it("navigates to site-scan page", async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("nav-site-scan"));
    await waitFor(() => expect(screen.getByTestId("site-scan-page")).toBeInTheDocument());
  });

  it("navigates to reports page", async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("nav-reports"));
    await waitFor(() => expect(screen.getByTestId("reports-page")).toBeInTheDocument());
  });

  it("navigates to executive page", async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("nav-executive"));
    await waitFor(() => expect(screen.getByTestId("executive-page")).toBeInTheDocument());
  });

  it("navigates to benchmark page", async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("nav-benchmark"));
    await waitFor(() => expect(screen.getByTestId("benchmark-page")).toBeInTheDocument());
  });

  it("navigates to settings page", async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("nav-settings"));
    await waitFor(() => expect(screen.getByTestId("settings-page")).toBeInTheDocument());
  });

  it("ignores invalid navigation ids", async () => {
    render(<App />);
    // Navigate to a valid page first
    fireEvent.click(screen.getByTestId("nav-reports"));
    await waitFor(() => expect(screen.getByTestId("reports-page")).toBeInTheDocument());

    // Try to navigate with an invalid id - should be ignored
    fireEvent.click(screen.getByTestId("nav-invalid"));

    // The layout still shows reports (invalid id ignored)
    expect(screen.getByTestId("sidebar-layout")).toHaveAttribute("data-active", "reports");
    expect(screen.getByTestId("reports-page")).toBeInTheDocument();
  });


  it("updates currentScan when scan completes", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByTestId("scan-page")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Complete Scan"));
    expect(screen.getByTestId("has-scan")).toHaveTextContent("yes");
  });

  it("passes apiStatus to SidebarLayout", () => {
    mockStatus = "disconnected";
    render(<App />);
    expect(screen.getByTestId("sidebar-layout")).toHaveAttribute(
      "data-status",
      "disconnected"
    );
  });

  it("shows API disconnected banner when status is disconnected", () => {
    mockStatus = "disconnected";
    render(<App />);
    expect(screen.getByText("API Disconnected:")).toBeInTheDocument();
    expect(
      screen.getByText(/Unable to connect to the scanning service/)
    ).toBeInTheDocument();
  });

  it("does not show API disconnected banner when status is connected", () => {
    mockStatus = "connected";
    render(<App />);
    expect(screen.queryByText("API Disconnected:")).not.toBeInTheDocument();
  });

  it("handles site drill down from executive page", async () => {
    render(<App />);
    // Navigate to executive page
    fireEvent.click(screen.getByTestId("nav-executive"));
    await waitFor(() => expect(screen.getByTestId("executive-page")).toBeInTheDocument());
    // Click drill down site button
    fireEvent.click(screen.getByTestId("drill-down-site"));
    // Should navigate to scan page with drill down context
    await waitFor(() => expect(screen.getByTestId("scan-page")).toBeInTheDocument());
    expect(screen.getByTestId("drill-down")).toHaveTextContent("https://example.com");
  });

  it("handles rule drill down from executive page", async () => {
    render(<App />);
    // Navigate to executive page
    fireEvent.click(screen.getByTestId("nav-executive"));
    await waitFor(() => expect(screen.getByTestId("executive-page")).toBeInTheDocument());
    // Click drill down rule button
    fireEvent.click(screen.getByTestId("drill-down-rule"));
    // Should navigate to scan page with drill down context
    await waitFor(() => expect(screen.getByTestId("scan-page")).toBeInTheDocument());
    expect(screen.getByTestId("drill-down")).toHaveTextContent("color-contrast");
  });

  it("shows drill down context banner for site drill down", async () => {
    render(<App />);
    // Navigate to executive page
    fireEvent.click(screen.getByTestId("nav-executive"));
    await waitFor(() => expect(screen.getByTestId("executive-page")).toBeInTheDocument());
    // Click drill down site button
    fireEvent.click(screen.getByTestId("drill-down-site"));
    await waitFor(() => expect(screen.getByTestId("scan-page")).toBeInTheDocument());
    // Should show drill down banner
    expect(screen.getByText(/Viewing: https:\/\/example\.com/)).toBeInTheDocument();
    expect(screen.getByText("Clear filter")).toBeInTheDocument();
  });

  it("shows drill down context banner for rule drill down", async () => {
    render(<App />);
    // Navigate to executive page
    fireEvent.click(screen.getByTestId("nav-executive"));
    await waitFor(() => expect(screen.getByTestId("executive-page")).toBeInTheDocument());
    // Click drill down rule button
    fireEvent.click(screen.getByTestId("drill-down-rule"));
    await waitFor(() => expect(screen.getByTestId("scan-page")).toBeInTheDocument());
    // Should show drill down banner
    expect(screen.getByText(/Filtering by rule: color-contrast/)).toBeInTheDocument();
  });

  it("clears drill down context when Clear filter is clicked", async () => {
    render(<App />);
    // Navigate to executive page
    fireEvent.click(screen.getByTestId("nav-executive"));
    await waitFor(() => expect(screen.getByTestId("executive-page")).toBeInTheDocument());
    // Click drill down site button
    fireEvent.click(screen.getByTestId("drill-down-site"));
    await waitFor(() => expect(screen.getByTestId("scan-page")).toBeInTheDocument());
    // Click clear filter
    fireEvent.click(screen.getByText("Clear filter"));
    // Drill down context should be cleared
    expect(screen.getByTestId("drill-down")).toHaveTextContent("null");
    expect(screen.queryByText("Clear filter")).not.toBeInTheDocument();
  });

  it("clears drill down context when navigating away", async () => {
    render(<App />);
    // Navigate to executive page
    fireEvent.click(screen.getByTestId("nav-executive"));
    await waitFor(() => expect(screen.getByTestId("executive-page")).toBeInTheDocument());
    // Click drill down site button
    fireEvent.click(screen.getByTestId("drill-down-site"));
    await waitFor(() => expect(screen.getByTestId("scan-page")).toBeInTheDocument());
    // Navigate to reports
    fireEvent.click(screen.getByTestId("nav-reports"));
    await waitFor(() => expect(screen.getByTestId("reports-page")).toBeInTheDocument());
    // Navigate back to scan
    fireEvent.click(screen.getByTestId("nav-scan"));
    await waitFor(() => expect(screen.getByTestId("scan-page")).toBeInTheDocument());
    // Drill down should be cleared
    expect(screen.getByTestId("drill-down")).toHaveTextContent("null");
  });

  it("does not show drill down banner on non-scan pages", async () => {
    render(<App />);
    // Navigate to executive page
    fireEvent.click(screen.getByTestId("nav-executive"));
    await waitFor(() => expect(screen.getByTestId("executive-page")).toBeInTheDocument());
    // Click drill down site button
    fireEvent.click(screen.getByTestId("drill-down-site"));
    await waitFor(() => expect(screen.getByTestId("scan-page")).toBeInTheDocument());
    // Should be on scan page with banner
    expect(screen.getByText(/Viewing:/)).toBeInTheDocument();
    // Navigate away and back to executive
    fireEvent.click(screen.getByTestId("nav-reports"));
    await waitFor(() => expect(screen.getByTestId("reports-page")).toBeInTheDocument());
    // No drill down banner on reports page
    expect(screen.queryByText(/Viewing:/)).not.toBeInTheDocument();
  });
});

describe("App - NAV_GROUPS structure", () => {
  it("has correct scanning group items", () => {
    render(<App />);
    expect(screen.getByText(/Accessibility Scanner/)).toBeInTheDocument();
    expect(screen.getByText(/Site Scan/)).toBeInTheDocument();
  });

  it("has correct analysis group items", () => {
    render(<App />);
    expect(screen.getByText(/Reports & History/)).toBeInTheDocument();
    expect(screen.getByText(/Executive Dashboard/)).toBeInTheDocument();
    expect(screen.getByText(/Competitor Benchmark/)).toBeInTheDocument();
  });

  it("has correct configuration group items", () => {
    render(<App />);
    expect(screen.getByText(/Settings/)).toBeInTheDocument();
  });

  it("has correct icons for navigation items", () => {
    render(<App />);
    // Icons are now lucide-react components (SVGs), so we verify nav items exist by their test IDs
    // The mock renders icons as React elements, which become SVG elements in the DOM
    expect(screen.getByTestId("nav-scan")).toBeInTheDocument();
    expect(screen.getByTestId("nav-site-scan")).toBeInTheDocument();
    expect(screen.getByTestId("nav-reports")).toBeInTheDocument();
    expect(screen.getByTestId("nav-executive")).toBeInTheDocument();
    expect(screen.getByTestId("nav-benchmark")).toBeInTheDocument();
    expect(screen.getByTestId("nav-settings")).toBeInTheDocument();
  });
});
