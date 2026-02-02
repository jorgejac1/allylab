import { useMemo } from 'react';
import type { SavedScan, TrendDataPoint, IssueTrendDataPoint } from '../types';

export interface TrendAggregateStats {
  currentScore: number;
  avgScore: number;
  scoreImprovement: number;
  totalScans: number;
  totalIssuesFixed: number;
  issueChange: number;
  latestIssues: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  issueChanges: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
}

export interface TrendDataResult {
  filteredScans: SavedScan[];
  scoreTrendData: TrendDataPoint[];
  issueTrendData: IssueTrendDataPoint[];
  aggregateStats: TrendAggregateStats | null;
}

export function useTrendData(scans: SavedScan[], url?: string): TrendDataResult {
  // Filter scans by URL if provided
  const filteredScans = useMemo(() => {
    let result = [...scans];
    if (url) {
      result = result.filter(
        (s) => new URL(s.url).hostname === new URL(url).hostname
      );
    }
    return result.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [scans, url]);

  // Generate score trend data
  const scoreTrendData: TrendDataPoint[] = useMemo(() => {
    return filteredScans.slice(-20).map((scan) => ({
      date: new Date(scan.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      fullDate: scan.timestamp,
      score: scan.score,
      issues: scan.totalIssues,
      critical: scan.critical,
      serious: scan.serious,
      moderate: scan.moderate,
      minor: scan.minor,
    }));
  }, [filteredScans]);

  // Generate issue trend data
  const issueTrendData: IssueTrendDataPoint[] = useMemo(() => {
    return filteredScans.slice(-20).map((scan) => ({
      date: new Date(scan.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      fullDate: scan.timestamp,
      critical: scan.critical,
      serious: scan.serious,
      moderate: scan.moderate,
      minor: scan.minor,
      total: scan.totalIssues,
    }));
  }, [filteredScans]);

  // Calculate aggregate stats
  const aggregateStats = useMemo<TrendAggregateStats | null>(() => {
    if (filteredScans.length === 0) return null;

    const latest = filteredScans[filteredScans.length - 1];
    const first = filteredScans[0];

    const avgScore = Math.round(
      filteredScans.reduce((sum, s) => sum + s.score, 0) / filteredScans.length
    );

    const totalIssuesFixed =
      first.totalIssues - latest.totalIssues > 0
        ? first.totalIssues - latest.totalIssues
        : 0;

    // Calculate issue changes
    const criticalChange = latest.critical - first.critical;
    const seriousChange = latest.serious - first.serious;
    const moderateChange = latest.moderate - first.moderate;
    const minorChange = latest.minor - first.minor;

    return {
      currentScore: latest.score,
      avgScore,
      scoreImprovement: latest.score - first.score,
      totalScans: filteredScans.length,
      totalIssuesFixed,
      issueChange: latest.totalIssues - first.totalIssues,
      latestIssues: {
        critical: latest.critical,
        serious: latest.serious,
        moderate: latest.moderate,
        minor: latest.minor,
      },
      issueChanges: {
        critical: criticalChange,
        serious: seriousChange,
        moderate: moderateChange,
        minor: minorChange,
      },
    };
  }, [filteredScans]);

  return {
    filteredScans,
    scoreTrendData,
    issueTrendData,
    aggregateStats,
  };
}
