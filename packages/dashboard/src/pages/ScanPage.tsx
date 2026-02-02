import { useEffect } from 'react';
import { PageContainer } from '../components/layout';
import { ScanForm, ScanProgress, ScanResults } from '../components/scan';
import { EmptyState, Button } from '../components/ui';
import { useScanSSE, useScans } from '../hooks';
import { X, Search } from 'lucide-react';
import { getScansForUrl, loadAllScans } from '../utils/storage';
import { performRescan } from '../utils/scan';
import type { SavedScan, WCAGStandard, Viewport, DrillDownTarget } from '../types';

interface ScanPageProps {
  currentScan: SavedScan | null;
  onScanComplete: (scan: SavedScan | null) => void;
  drillDownContext?: DrillDownTarget | null;
}

export function ScanPage({ currentScan, onScanComplete, drillDownContext }: ScanPageProps) {
  const { addScan } = useScans();

  const {
    isScanning,
    progress,
    result,
    error,
    startScan,
    cancelScan,
    reset,
  } = useScanSSE({
    onComplete: (scanResult) => {
      const saved = addScan(scanResult);
      onScanComplete(saved);
    },
  });

  // Handle drill-down from Executive Dashboard
  useEffect(() => {
    if (!drillDownContext) return;

    if (drillDownContext.type === 'site' && drillDownContext.url) {
      // Load the latest scan for this URL
      const scans = getScansForUrl(drillDownContext.url);
      if (scans.length > 0) {
        onScanComplete(scans[0]);
      }
    } else if (drillDownContext.type === 'issue' && drillDownContext.ruleId) {
      // Load the most recent scan that contains this issue
      const allScans = loadAllScans();
      const scanWithIssue = allScans.find(scan => 
        scan.findings.some(f => f.ruleId === drillDownContext.ruleId)
      );
      if (scanWithIssue) {
        onScanComplete(scanWithIssue);
      }
    }
  }, [drillDownContext, onScanComplete]);

  const handleScan = (url: string, options: { standard: WCAGStandard; viewport: Viewport }) => {
    reset();
    onScanComplete(null);
    startScan(url, options);
  };

  const handleRescan = () => {
    return performRescan(currentScan, handleScan);
  };

  const handleCancel = () => {
    cancelScan();
  };

  // Filter findings by ruleId if drill-down context is for an issue
  const filteredScan = currentScan && drillDownContext?.type === 'issue' && drillDownContext.ruleId
    ? {
        ...currentScan,
        findings: currentScan.findings.filter(f => f.ruleId === drillDownContext.ruleId),
        totalIssues: currentScan.findings.filter(f => f.ruleId === drillDownContext.ruleId).length,
      }
    : currentScan;

  return (
    <PageContainer
      title="Accessibility Scanner"
      subtitle={drillDownContext?.type === 'issue' 
        ? `Filtered by: ${drillDownContext.ruleId}` 
        : "Scan any URL for accessibility issues"
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Scan Form */}
        <ScanForm 
          onScan={handleScan} 
          isScanning={isScanning}
          initialUrl={drillDownContext?.type === 'site' ? drillDownContext.url : undefined}
        />

        {/* Progress with Cancel Button */}
        {isScanning && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ScanProgress
              percent={progress.percent}
              message={progress.message}
              isComplete={progress.status === 'complete'}
            />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Button variant="secondary" size="sm" onClick={handleCancel}>
                <X size={12} style={{ marginRight: 4 }} /> Cancel Scan
              </Button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              padding: 16,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              color: '#991b1b',
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results */}
        {filteredScan ? (
          <ScanResults scan={filteredScan} onRescan={handleRescan} />
        ) : result ? (
          <div
            style={{
              padding: 16,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 8,
              color: '#166534',
            }}
          >
            <strong>Scan Complete:</strong> Found {result.totalIssues} issues with score {result.score}/100
          </div>
        ) : !isScanning && !error ? (
          <EmptyState
            icon={<Search size={48} />}
            title="Ready to Scan"
            description="Enter a URL above to start scanning for accessibility issues."
          />
        ) : null}
      </div>
    </PageContainer>
  );
}