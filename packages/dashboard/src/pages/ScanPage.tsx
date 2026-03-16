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
      <div className="flex flex-col gap-6">
        {/* Scan Form */}
        <ScanForm
          onScan={handleScan}
          isScanning={isScanning}
          initialUrl={drillDownContext?.type === 'site' ? drillDownContext.url : undefined}
        />

        {/* Progress with Cancel Button */}
        {isScanning && (
          <div className="flex flex-col gap-3">
            <ScanProgress
              percent={progress.percent}
              message={progress.message}
              isComplete={progress.status === 'complete'}
            />
            <div className="flex justify-center">
              <Button variant="secondary" size="sm" onClick={handleCancel}>
                <X size={12} className="mr-1" /> Cancel Scan
              </Button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results */}
        {filteredScan ? (
          <ScanResults scan={filteredScan} onRescan={handleRescan} />
        ) : result ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
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
