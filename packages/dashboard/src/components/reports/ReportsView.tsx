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
    { id: 'history', label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ClipboardList size={14} />Scan History</span>, count: scans.length },
    { id: 'trends', label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><TrendingUp size={14} />Trends</span> },
    { id: 'compare', label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} />Period Compare</span> },
    { id: 'export', label: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Upload size={14} />Export</span> },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px' }}>
            Reports & History
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            View scan history, track trends, and export your data
          </p>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'flex', gap: 16 }}>
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
      <div style={{ display: 'flex', gap: 24 }}>
        {/* Main Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCloseDetails}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    ← Back to History
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <ExportOptions scans={scans} selectedScan={selectedScan || undefined} />
                <ReportsSummary scans={scans} />
              </div>
            </Suspense>
          )}
        </div>

        {/* Sidebar - Recent Activity */}
        {activeTab === 'history' && !selectedScan && !comparisonScans && (
          <div style={{ width: 300, flexShrink: 0 }}>
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
    <div
      style={{
        padding: '12px 20px',
        background: '#f8fafc',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>
        {value}
        <span style={{ fontSize: 12, fontWeight: 400, color: '#64748b' }}>{suffix}</span>
      </div>
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>
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
      <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Clock size={16} />Recent Activity
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {scans.map(scan => {
          const regression = hasRegression?.(scan.id);
          
          return (
            <button
              key={scan.id}
              onClick={() => onSelect(scan)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                background: regression ? '#fef3c7' : '#f8fafc',
                border: regression ? '1px solid #f59e0b' : '1px solid #e2e8f0',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: scan.score >= 70 ? '#dcfce7' : scan.score >= 40 ? '#fef9c3' : '#fee2e2',
                  color: scan.score >= 70 ? '#166534' : scan.score >= 40 ? '#854d0e' : '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {scan.score}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 500,
                    fontSize: 13,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {new URL(scan.url).hostname}
                  {regression && (
                    <span style={{ fontSize: 11, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <TrendingDown size={12} />-{regression.scoreDrop}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  {formatRelativeTime(new Date(scan.timestamp))}
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
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
      <h4 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <BarChart3 size={18} />Summary Statistics
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />
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
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        background: '#f8fafc',
        borderRadius: 6,
      }}
    >
      <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: color || '#0f172a' }}>
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
