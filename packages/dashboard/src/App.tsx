import { useState, useCallback } from "react";
import { SidebarLayout } from "./components/layout";
import {
  ScanPage,
  ReportsPage,
  SettingsPage,
  ExecutivePage,
  BenchmarkPage,
  SiteScanPage,
} from "./pages";
import { useApiStatus } from "./hooks";
import type { SavedScan } from "./types";
import type { DrillDownTarget } from "./types";

type PageId = "scan" | "site-scan" | "reports" | "executive" | "benchmark" | "settings";

const NAV_GROUPS = [
  {
    title: "Scanning",
    items: [
      { id: "scan", label: "Accessibility Scanner", icon: "♿" },
      { id: "site-scan", label: "Site Scan", icon: "🌐" },
    ],
  },
  {
    title: "Analysis",
    items: [
      { id: "reports", label: "Reports & History", icon: "📊" },
      { id: "executive", label: "Executive Dashboard", icon: "📈" },
      { id: "benchmark", label: "Competitor Benchmark", icon: "🏆" },
    ],
  },
  {
    title: "Configuration",
    items: [{ id: "settings", label: "Settings", icon: "⚙️" }],
  },
];

export default function App() {
  const [activePage, setActivePage] = useState<PageId>("scan");
  const [currentScan, setCurrentScan] = useState<SavedScan | null>(null);
  const [drillDownContext, setDrillDownContext] =
    useState<DrillDownTarget | null>(null);
  const { status } = useApiStatus();

  const handleNavigate = (id: string) => {
    if (
      ["scan", "site-scan", "reports", "executive", "benchmark", "settings"].includes(id)
    ) {
      setActivePage(id as PageId);
      setDrillDownContext(null);
    }
  };

  const handleDrillDown = useCallback((target: DrillDownTarget) => {
    setDrillDownContext(target);
    setActivePage("scan");
  }, []);

  const handleClearDrillDown = useCallback(() => {
    setDrillDownContext(null);
  }, []);

  return (
    <SidebarLayout
      groups={NAV_GROUPS}
      activeItem={activePage}
      onItemClick={handleNavigate}
      apiStatus={status}
    >
      {/* API Status Banner */}
      {status === "disconnected" && (
        <div
          style={{
            padding: "12px 24px",
            background: "#fef2f2",
            borderBottom: "1px solid #fecaca",
            color: "#991b1b",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>⚠️</span>
          <span>
            <strong>API Disconnected:</strong> Unable to connect to the scanning
            service. Make sure the API is running on port 3001.
          </span>
        </div>
      )}

      {/* Drill-down Context Banner */}
      {drillDownContext && activePage === "scan" && (
        <div
          style={{
            padding: "12px 24px",
            background: "#eff6ff",
            borderBottom: "1px solid #bfdbfe",
            color: "#1e40af",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            {drillDownContext.type === "site"
              ? `📍 Viewing: ${drillDownContext.url}`
              : `🔍 Filtering by rule: ${drillDownContext.ruleId}`}
          </span>
          <button
            onClick={handleClearDrillDown}
            style={{
              background: "none",
              border: "none",
              color: "#1e40af",
              cursor: "pointer",
              fontSize: 14,
              textDecoration: "underline",
            }}
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Page Content */}
      {activePage === "scan" && (
        <ScanPage
          currentScan={currentScan}
          onScanComplete={setCurrentScan}
          drillDownContext={drillDownContext}
        />
      )}
      {activePage === "site-scan" && <SiteScanPage />}
      {activePage === "reports" && <ReportsPage />}
      {activePage === "executive" && (
        <ExecutivePage onDrillDown={handleDrillDown} />
      )}
      {activePage === "benchmark" && <BenchmarkPage />}
      {activePage === "settings" && <SettingsPage />}
    </SidebarLayout>
  );
}