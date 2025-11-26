import { useState, useCallback, useMemo } from 'react';
import type { SavedScan, ScanResult, TrackedFinding } from '../types';
import { loadAllScans, saveScan, deleteScan, getScansForUrl } from '../utils/storage';
import { getTrackingStats, getPreviousFingerprints } from '../utils/issueTracker';
import { generateFingerprint, generateFindingId } from '../utils/fingerprint';
import { loadAlertSettings } from '../utils/alertSettings';

export interface RegressionInfo {
  scanId: string;
  currentScore: number;
  previousScore: number;
  scoreDrop: number;
  url: string;
  timestamp: string;
}

// Helper function to filter recent regressions
function filterRecentRegressions(
  regressions: Map<string, RegressionInfo>,
  recentDays: number
): RegressionInfo[] {
  const cutoffMs = recentDays * 24 * 60 * 60 * 1000;
  const cutoffDate = Date.now() - cutoffMs;
  
  return Array.from(regressions.values())
    .filter(r => new Date(r.timestamp).getTime() > cutoffDate)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function useScans() {
  const [scans, setScans] = useState<SavedScan[]>(() => loadAllScans());
  const [isLoading] = useState(false);

  // Detect regressions - scans where score dropped significantly from previous
  const regressions = useMemo((): Map<string, RegressionInfo> => {
    const alertSettings = loadAlertSettings();
    const regressionMap = new Map<string, RegressionInfo>();

    // If alerts are disabled, return empty map
    if (!alertSettings.showRegressionAlerts) {
      return regressionMap;
    }
    
    // Group scans by hostname
    const scansByHost = new Map<string, SavedScan[]>();
    scans.forEach(scan => {
      const hostname = new URL(scan.url).hostname;
      const hostScans = scansByHost.get(hostname) || [];
      hostScans.push(scan);
      scansByHost.set(hostname, hostScans);
    });

    // For each host, check for regressions
    scansByHost.forEach((hostScans, hostname) => {
      // Sort by timestamp ascending (oldest first)
      const sorted = [...hostScans].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Compare each scan to the previous one
      for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i];
        const previous = sorted[i - 1];
        const scoreDrop = previous.score - current.score;

        if (scoreDrop >= alertSettings.regressionThreshold) {
          regressionMap.set(current.id, {
            scanId: current.id,
            currentScore: current.score,
            previousScore: previous.score,
            scoreDrop,
            url: hostname,
            timestamp: current.timestamp,
          });
        }
      }
    });

    return regressionMap;
  }, [scans]);

  // Get recent regressions - returns a getter function to avoid impure render
  const getRecentRegressions = useCallback((): RegressionInfo[] => {
    const alertSettings = loadAlertSettings();
    if (!alertSettings.showRegressionAlerts) {
      return [];
    }
    return filterRecentRegressions(regressions, alertSettings.recentDays);
  }, [regressions]);

  // Check if a specific scan has a regression
  const hasRegression = useCallback((scanId: string): RegressionInfo | undefined => {
    return regressions.get(scanId);
  }, [regressions]);

  // Add a new scan result
  const addScan = useCallback((result: ScanResult): SavedScan => {
    // Get previous fingerprints for this URL to track new vs recurring issues
    const previousFingerprints = getPreviousFingerprints(result.url);

    // Convert findings to tracked findings
    const trackedFindings: TrackedFinding[] = result.findings.map((finding, index) => {
      const fingerprint = generateFingerprint(finding);
      const isRecurring = previousFingerprints.has(fingerprint);

      return {
        ...finding,
        id: generateFindingId(finding, index),
        fingerprint,
        status: isRecurring ? 'recurring' : 'new',
        firstSeen: isRecurring ? undefined : result.timestamp,
        lastSeen: result.timestamp,
      };
    });

    // Create saved scan
    const savedScan: SavedScan = {
      ...result,
      trackedFindings,
    };

    // Persist to storage
    saveScan(savedScan);

    // Update state
    setScans(prev => [savedScan, ...prev]);

    return savedScan;
  }, []);

  // Remove a scan
  const removeScan = useCallback((scanId: string) => {
    deleteScan(scanId);
    setScans(prev => prev.filter(s => s.id !== scanId));
  }, []);

  // Get scans for a specific URL
  const getUrlScans = useCallback((url: string): SavedScan[] => {
    return getScansForUrl(url);
  }, []);

  // Get tracking stats for a scan
  const getScanTrackingStats = useCallback((scan: SavedScan) => {
    const findings = scan.trackedFindings || [];
    return getTrackingStats(findings);
  }, []);

  // Get unique scanned URLs
  const getUniqueUrls = useCallback((): string[] => {
    const urls = new Set(scans.map(s => new URL(s.url).hostname));
    return Array.from(urls).sort();
  }, [scans]);

  // Get latest scan for a URL
  const getLatestScan = useCallback((url: string): SavedScan | undefined => {
    const urlScans = scans
      .filter(s => new URL(s.url).hostname === new URL(url).hostname)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return urlScans[0];
  }, [scans]);

  // Refresh scans from storage
  const refresh = useCallback(() => {
    setScans(loadAllScans());
  }, []);

  return {
    scans,
    isLoading,
    addScan,
    removeScan,
    getUrlScans,
    getScanTrackingStats,
    getUniqueUrls,
    getLatestScan,
    refresh,
    regressions,
    getRecentRegressions,
    hasRegression,
  };
}