import { useState, useEffect, useCallback } from 'react';
import type { SavedScan, ScanResult, TrackedFinding } from '../types';
import { loadAllScans, saveScan, deleteScan, getScansForUrl } from '../utils/storage';
import { getTrackingStats, getPreviousFingerprints } from '../utils/issueTracker';
import { generateFingerprint, generateFindingId } from '../utils/fingerprint';

export function useScans() {
  const [scans, setScans] = useState<SavedScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load scans on mount
  useEffect(() => {
    setScans(loadAllScans());
    setIsLoading(false);
  }, []);

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
  };
}