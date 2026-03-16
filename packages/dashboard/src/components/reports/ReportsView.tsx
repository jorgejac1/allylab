import { useState, lazy, Suspense, type ReactNode } from 'react';
import { Card, Button, Tabs, EmptyState, TabLoader } from '../ui';
import { ScanHistory } from './ScanHistory';
import type { SavedScan } from '../../types';
import type { RegressionInfo } from '../../hooks/useScans';
import { ClipboardList, TrendingUp, Calendar, Upload, BarChart3, Clock, TrendingDown } from 'lucide-react';

// Lazy load heavy components for better code splitting
const ComparisonView = lazy(() => import('./ComparisonView').then(m => ({ default: m.ComparisonView })));
const PeriodComparison = lazy(() => import('./PeriodComparison').then(m => ({ default: m.PeriodComparison })));
const TrendCharts = lazy(() => import('./TrendCharts').then(m => ({ default: m.TrendCharts })));
const ExportOptions = lazy(() => import('./ExportOptions').then(m => ({ default: m.ExportOptions })));
const ScanResults = lazy(() => import('../scan/ScanResults').then(m => ({ default: m.ScanResults })));

interface ReportsViewProps {
  scans: SavedScan[];
  onDeleteScan?: (scanId: string) => void;
  onRescan?: (url: string) => void;
  recentRegressions?: RegressionInfo[];
  hasRegression?: (scanId: string) => RegressionInfo | undefined;
}

type TabId = 'history' | 'trends' | 'compare' | 'export';

export function ReportsView({
  scans,
  onDeleteScan,
  onRescan,
  recentRegressions = [],
  hasRegression,
}: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('history');
  const [selectedScan, setSelectedScan] = useState<SavedScan | null>(null);
  const [selectedScanId, setSelectedScanId] = useState<string | undefined>(undefined);
  const [comparisonScans, setComparisonScans] = useState<{
    older: SavedScan;
    newer: SavedScan;
  } | null>(null);

  const tabs: { id: string; label: ReactNode; count?: number }[] = [
    { id: 'history', label: <span className="flex items-center gap-1.5"><ClipboardList size={14} />Scan History</span>, count: scans.length },
    { id: 'trends', label: <span className="flex items-center gap-1.5"><TrendingUp size={14} />Trends</span> },
    { id: 'compare', label: <span className="flex items-center gap-1.5"><Calendar size={14} />Period Compare</span> },
    { id: 'export', label: <span className="flex items-center gap-1.5"><Upload size={14} />Export</span> },
  ];

  const handleSelectScan = (scan: SavedScan) => {
    setSelectedScan(scan);
    setSelectedScanId(scan.id);
    setComparisonScans(null);
  };

  const handleCompare = (scan1: SavedScan, scan2: SavedScan) => {
    const older =
      new Date(scan1.timestamp).getTime() < new Date(scan2.timestamp).getTime()
        ? scan1
        : scan2;
    const newer = older === scan1 ? scan2 : scan1;

    setComparisonScans({ older, newer });
    setSelectedScan(null);
    setSelectedScanId(undefined);
  };

  const handleCloseComparison = () => {
    setComparisonScans(null);
  };

  const handleCloseDetails = () => {
    setSelectedScan(null);
    setSelectedScanId(undefined);
  };

  if (scans.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 size={32} />}
        title="No Reports Available"
        description="Run your first accessibility scan to start generating reports and tracking progress over time."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold mt-0 mb-1">
            Reports & History
          </h2>
          <p className="text-sm text-slate-500 m-0">
            View scan history, track trends, and export your data
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4">
          <QuickStat label="Total Scans" value={scans.length} />
          <QuickStat
            label="Avg Score"
            value={Math.round(scans.reduce((sum, s) => sum + s.score, 0) / scans.length)}
            suffix="/100"
          />
          <QuickStat
            label="Sites Scanned"
            value={new Set(scans.map(s => new URL(s.url).hostname)).size}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={id => setActiveTab(id as TabId)}
      />

      {/* Content */}
      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'history' && (
            <>
              {comparisonScans ? (
                <Suspense fallback={<TabLoader />}>
                  <ComparisonView
                    olderScan={comparisonScans.older}
                    newerScan={comparisonScans.newer}
                    onClose={handleCloseComparison}
                    hasRegression={hasRegression}
                  />
                </Suspense>
              ) : selectedScan ? (
                <div className="flex flex-col gap-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCloseDetails}
                    className="self-start"
                  >
                    &larr; Back to History
                  </Button>
                  <Suspense fallback={<TabLoader />}>
                    <ScanResults
                      scan={selectedScan}
                      onRescan={onRescan ? () => onRescan(selectedScan.url) : undefined}
                    />
                  </Suspense>
                </div>
              ) : (
                <ScanHistory
                  scans={scans}
                  onSelectScan={handleSelectScan}
                  onDeleteScan={onDeleteScan}
                  onCompare={handleCompare}
                  selectedScanId={selectedScanId}
                  hasRegression={hasRegression}
                />
              )}
            </>
          )}

          {activeTab === 'trends' && (
            <Suspense fallback={<TabLoader />}>
              <TrendCharts
                scans={scans}
                recentRegressions={recentRegressions}
              />
            </Suspense>
          )}

          {activeTab === 'compare' && (
            <Suspense fallback={<TabLoader />}>
              <PeriodComparison
                scans={scans}
                onClose={() => setActiveTab('history')}
              />
            </Suspense>
          )}

          {activeTab === 'export' && (
            <Suspense fallback={<TabLoader />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ExportOptions scans={scans} selectedScan={selectedScan || undefined} />
                <ReportsSummary scans={scans} />
              </div>
            </Suspense>
          )}
        </div>

        {/* Sidebar - Recent Activity */}
        {activeTab === 'history' && !selectedScan && !comparisonScans && (
          <div className="w-[300px] shrink-0 hidden sm:block">
            <RecentActivity
              scans={scans.slice(0, 5)}
              onSelect={handleSelectScan}
              hasRegression={hasRegression}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ==============================================
// Quick Stat Component
// ==============================================

function QuickStat({
  label,
  value,
  suffix = '',
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="py-3 px-5 bg-slate-50 rounded-lg border border-slate-200 text-center">
      <div className="text-2xl font-bold text-slate-900">
        {value}
        <span className="text-xs font-normal text-slate-500">{suffix}</span>
      </div>
      <div className="text-xs text-slate-500 uppercase">
        {label}
      </div>
    </div>
  );
}

// ==============================================
// Recent Activity Sidebar
// ==============================================

interface RecentActivityProps {
  scans: SavedScan[];
  onSelect: (scan: SavedScan) => void;
  hasRegression?: (scanId: string) => RegressionInfo | undefined;
}

function RecentActivity({ scans, onSelect, hasRegression }: RecentActivityProps) {
  return (
    <Card>
      <h4 className="text-sm font-semibold mt-0 mb-4 flex items-center gap-2">
        <Clock size={16} />Recent Activity
      </h4>
      <div className="flex flex-col gap-3">
        {scans.map(scan => {
          const regression = hasRegression?.(scan.id);

          return (
            <button
              key={scan.id}
              onClick={() => onSelect(scan)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer text-left w-full ${
                regression
                  ? 'bg-amber-100 border border-amber-500'
                  : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                style={{
                  background: scan.score >= 70 ? '#dcfce7' : scan.score >= 40 ? '#fef9c3' : '#fee2e2',
                  color: scan.score >= 70 ? '#166534' : scan.score >= 40 ? '#854d0e' : '#991b1b',
                }}
              >
                {scan.score}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                  {new URL(scan.url).hostname}
                  {regression && (
                    <span className="text-xs text-red-600 flex items-center gap-0.5">
                      <TrendingDown size={12} />-{regression.scoreDrop}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  {formatRelativeTime(new Date(scan.timestamp))}
                </div>
              </div>
              <div className="text-xs text-slate-500">
                {scan.totalIssues} issues
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ==============================================
// Reports Summary Card
// ==============================================

interface ReportsSummaryProps {
  scans: SavedScan[];
}

function ReportsSummary({ scans }: ReportsSummaryProps) {
  const totalIssues = scans.reduce((sum, s) => sum + s.totalIssues, 0);
  const criticalIssues = scans.reduce((sum, s) => sum + s.critical, 0);
  const seriousIssues = scans.reduce((sum, s) => sum + s.serious, 0);
  const uniqueSites = new Set(scans.map(s => new URL(s.url).hostname)).size;

  const firstScan = scans.length > 0
    ? new Date(Math.min(...scans.map(s => new Date(s.timestamp).getTime())))
    : null;
  const lastScan = scans.length > 0
    ? new Date(Math.max(...scans.map(s => new Date(s.timestamp).getTime())))
    : null;

  return (
    <Card>
      <h4 className="text-base font-semibold mt-0 mb-4 flex items-center gap-2">
        <BarChart3 size={18} />Summary Statistics
      </h4>
      <div className="flex flex-col gap-3">
        <SummaryRow label="Total Scans" value={scans.length.toString()} />
        <SummaryRow label="Unique Sites" value={uniqueSites.toString()} />
        <SummaryRow label="Total Issues Found" value={totalIssues.toString()} />
        <SummaryRow
          label="Critical Issues"
          value={criticalIssues.toString()}
          color="#dc2626"
        />
        <SummaryRow
          label="Serious Issues"
          value={seriousIssues.toString()}
          color="#ea580c"
        />
        <hr className="border-none border-t border-slate-200 my-1" />
        {firstScan && (
          <SummaryRow label="First Scan" value={firstScan.toLocaleDateString()} />
        )}
        {lastScan && (
          <SummaryRow label="Last Scan" value={lastScan.toLocaleDateString()} />
        )}
      </div>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-md">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold" style={{ color: color || '#0f172a' }}>
        {value}
      </span>
    </div>
  );
}

export { ReportsSummary };

// ==============================================
// Helper Functions
// ==============================================

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
