import { useMemo, useState, useCallback, useEffect } from 'react';
import { loadAllScans } from '../utils/storage';
import { getDomain } from '../utils/scoreUtils';
import type { SavedScan, Severity, DashboardData, SiteStats, TopIssue } from '../types';

/**
 * Hook to compute dashboard data from localStorage scans.
 * Data is refreshed when:
 * - Component mounts
 * - refresh() is called
 * - Storage event is triggered (cross-tab sync)
 */
export function useDashboardData(): DashboardData & { refresh: () => void } {
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setVersion(v => v + 1);
  }, []);

  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'allylab-scans' || e.key === null) {
        refresh();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refresh]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- version is intentionally used to trigger recomputation on refresh()
  const data = useMemo(() => computeDashboardData(loadAllScans()), [version]);

  return { ...data, refresh };
}

function computeDashboardData(allScans: SavedScan[]): DashboardData {
  if (allScans.length === 0) {
    return {
      totalSites: 0,
      totalIssues: 0,
      totalScans: 0,
      avgScore: 0,
      severityCounts: { critical: 0, serious: 0, moderate: 0, minor: 0 },
      topIssues: [],
      siteStats: [],
      overallTrend: [],
      criticalTrend: [],
    };
  }

  // Group scans by URL
  const scansByUrl = new Map<string, SavedScan[]>();
  for (const scan of allScans) {
    if (!scansByUrl.has(scan.url)) {
      scansByUrl.set(scan.url, []);
    }
    scansByUrl.get(scan.url)!.push(scan);
  }

  // Sort each URL's scans by date (newest first)
  for (const scans of scansByUrl.values()) {
    scans.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Compute aggregates
  const siteStats: SiteStats[] = [];
  const severityCounts: Record<Severity, number> = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  const issueCounter = new Map<string, { title: string; count: number; severity: Severity; sites: Set<string> }>();
  let totalLatestIssues = 0;
  let totalLatestScore = 0;

  for (const [url, scans] of scansByUrl) {
    const latest = scans[0];
    const previous = scans[1];

    const trendScans = scans.slice(0, 7).reverse();
    const trend = trendScans.map(s => s.score);
    const scoreChange = previous ? latest.score - previous.score : 0;

    severityCounts.critical += latest.critical;
    severityCounts.serious += latest.serious;
    severityCounts.moderate += latest.moderate;
    severityCounts.minor += latest.minor;
    totalLatestIssues += latest.totalIssues;
    totalLatestScore += latest.score;

    for (const finding of latest.findings) {
      const key = finding.ruleId;
      if (!issueCounter.has(key)) {
        issueCounter.set(key, {
          title: finding.ruleTitle,
          count: 0,
          severity: finding.impact,
          sites: new Set()
        });
      }
      const entry = issueCounter.get(key)!;
      entry.count++;
      entry.sites.add(url);
    }

    siteStats.push({
      url,
      domain: getDomain(url),
      latestScore: latest.score,
      latestIssues: latest.totalIssues,
      critical: latest.critical,
      serious: latest.serious,
      moderate: latest.moderate,
      minor: latest.minor,
      scanCount: scans.length,
      trend,
      lastScanned: latest.timestamp,
      scoreChange,
    });
  }

  siteStats.sort((a, b) => a.latestScore - b.latestScore);

  const topIssues: TopIssue[] = Array.from(issueCounter.entries())
    .map(([ruleId, data]) => ({
      ruleId,
      title: data.title,
      count: data.count,
      severity: data.severity,
      affectedSites: data.sites.size,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const allScansSorted = [...allScans].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const last10Scans = allScansSorted.slice(-10);

  return {
    totalSites: scansByUrl.size,
    totalIssues: totalLatestIssues,
    totalScans: allScans.length,
    avgScore: Math.round(totalLatestScore / scansByUrl.size),
    severityCounts,
    topIssues,
    siteStats,
    overallTrend: last10Scans.map(s => s.score),
    criticalTrend: last10Scans.map(s => s.critical),
  };
}
