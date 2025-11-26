import type { Severity } from './index';

export interface SiteStats {
  url: string;
  domain: string;
  latestScore: number;
  latestIssues: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  scanCount: number;
  trend: number[];
  lastScanned: string;
  scoreChange: number;
}

export interface TopIssue {
  ruleId: string;
  title: string;
  count: number;
  severity: Severity;
  affectedSites: number;
}

export interface SeverityCounts {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}

// This matches what useDashboardData() actually returns
export interface DashboardData {
  totalSites: number;
  totalIssues: number;
  totalScans: number;
  avgScore: number;
  severityCounts: SeverityCounts;
  topIssues: TopIssue[];
  siteStats: SiteStats[];
  overallTrend: number[];
  criticalTrend: number[];
}

// For PDF export (subset of DashboardData)
export interface PDFDashboardData {
  averageScore: number;
  totalIssues: number;
  sitesMonitored: number;
  severity: SeverityCounts;
  overallTrend: number[];
  criticalTrend: number[];
}

export interface DrillDownTarget {
  type: 'site' | 'issue';
  url?: string;
  ruleId?: string;
}