import { lazy, Suspense, useMemo, useEffect } from "react";
import { SidebarLayout, UserSwitcher } from "./components/layout";
import { ErrorBoundary } from "./components/ui";
import { AppProvider, useApp, AuthProvider, useAuth } from "./context";
import { useApiStatus } from "./hooks";
import { canAccessPage } from "./utils/permissions";
import type { NavigationPage } from "./types/auth";
import {
  Accessibility,
  Globe,
  BarChart3,
  TrendingUp,
  Trophy,
  Settings,
  AlertTriangle,
  MapPin,
  Search
} from 'lucide-react';

// Lazy load page components for code splitting
const ScanPage = lazy(() => import("./pages/ScanPage").then(m => ({ default: m.ScanPage })));
const SiteScanPage = lazy(() => import("./pages/SiteScanPage").then(m => ({ default: m.SiteScanPage })));
const ReportsPage = lazy(() => import("./pages/ReportsPage").then(m => ({ default: m.ReportsPage })));
const ExecutivePage = lazy(() => import("./pages/ExecutivePage").then(m => ({ default: m.ExecutivePage })));
const BenchmarkPage = lazy(() => import("./pages/BenchmarkPage").then(m => ({ default: m.BenchmarkPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then(m => ({ default: m.SettingsPage })));

// Base navigation structure with page IDs
const NAV_ITEMS = {
  scan: { id: "scan", label: "Accessibility Scanner", icon: <Accessibility size={18} /> },
  "site-scan": { id: "site-scan", label: "Site Scan", icon: <Globe size={18} /> },
  reports: { id: "reports", label: "Reports & History", icon: <BarChart3 size={18} /> },
  executive: { id: "executive", label: "Executive Dashboard", icon: <TrendingUp size={18} /> },
  benchmark: { id: "benchmark", label: "Competitor Benchmark", icon: <Trophy size={18} /> },
  settings: { id: "settings", label: "Settings", icon: <Settings size={18} /> },
};

// Navigation groups structure
const NAV_GROUPS_STRUCTURE = [
  {
    title: "Scanning",
    pages: ["scan", "site-scan"] as NavigationPage[],
  },
  {
    title: "Analysis",
    pages: ["reports", "executive", "benchmark"] as NavigationPage[],
  },
  {
    title: "Configuration",
    pages: ["settings"] as NavigationPage[],
  },
];

// Loading fallback component
function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: 300,
      color: '#64748b',
      fontSize: 14,
    }}>
      Loading...
    </div>
  );
}

// Access denied component
function AccessDenied() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: 300,
      color: '#64748b',
      fontSize: 14,
      gap: 8,
    }}>
      <AlertTriangle size={32} color="#f59e0b" />
      <div style={{ fontSize: 18, fontWeight: 600, color: '#1e293b' }}>Access Denied</div>
      <div>You don&apos;t have permission to view this page.</div>
    </div>
  );
}

// Main app content (uses context)
function AppContent() {
  const {
    activePage,
    navigate,
    currentScan,
    setCurrentScan,
    drillDownContext,
    setDrillDown,
    clearDrillDown
  } = useApp();
  const { status } = useApiStatus();
  const { role, accessiblePages, canAccessPage: userCanAccess } = useAuth();

  // Filter navigation groups based on user's role
  const filteredNavGroups = useMemo(() => {
    if (!role) return [];

    return NAV_GROUPS_STRUCTURE
      .map((group) => ({
        title: group.title,
        items: group.pages
          .filter((pageId) => canAccessPage(role, pageId))
          .map((pageId) => NAV_ITEMS[pageId]),
      }))
      .filter((group) => group.items.length > 0);
  }, [role]);

  // Redirect to first accessible page if current page is not accessible
  useEffect(() => {
    if (role && !userCanAccess(activePage as NavigationPage) && accessiblePages.length > 0) {
      navigate(accessiblePages[0] as typeof activePage);
    }
  }, [role, activePage, userCanAccess, accessiblePages, navigate]);

  const handleNavigate = (id: string) => {
    const validPages = ["scan", "site-scan", "reports", "executive", "benchmark", "settings"];
    if (validPages.includes(id) && userCanAccess(id as NavigationPage)) {
      navigate(id as typeof activePage);
    }
  };

  // Check if user can access current page
  const canViewCurrentPage = userCanAccess(activePage as NavigationPage);

  return (
    <SidebarLayout
      groups={filteredNavGroups}
      activeItem={activePage}
      onItemClick={handleNavigate}
      apiStatus={status}
      footer={<UserSwitcher />}
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
          <AlertTriangle size={16} />
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
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {drillDownContext.type === "site" ? <MapPin size={16} /> : <Search size={16} />}
            {drillDownContext.type === "site"
              ? `Viewing: ${drillDownContext.url}`
              : `Filtering by rule: ${drillDownContext.ruleId}`}
          </span>
          <button
            onClick={clearDrillDown}
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

      {/* Page Content with Suspense and ErrorBoundary */}
      <ErrorBoundary section="Page Content">
        <Suspense fallback={<PageLoader />}>
          {!canViewCurrentPage ? (
            <AccessDenied />
          ) : (
            <>
              {activePage === "scan" && (
                <ErrorBoundary section="Scan Page">
                  <ScanPage
                    currentScan={currentScan}
                    onScanComplete={setCurrentScan}
                    drillDownContext={drillDownContext}
                  />
                </ErrorBoundary>
              )}
              {activePage === "site-scan" && (
                <ErrorBoundary section="Site Scan Page">
                  <SiteScanPage />
                </ErrorBoundary>
              )}
              {activePage === "reports" && (
                <ErrorBoundary section="Reports Page">
                  <ReportsPage />
                </ErrorBoundary>
              )}
              {activePage === "executive" && (
                <ErrorBoundary section="Executive Dashboard">
                  <ExecutivePage onDrillDown={setDrillDown} />
                </ErrorBoundary>
              )}
              {activePage === "benchmark" && (
                <ErrorBoundary section="Benchmark Page">
                  <BenchmarkPage />
                </ErrorBoundary>
              )}
              {activePage === "settings" && (
                <ErrorBoundary section="Settings Page">
                  <SettingsPage />
                </ErrorBoundary>
              )}
            </>
          )}
        </Suspense>
      </ErrorBoundary>
    </SidebarLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary section="Application">
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
