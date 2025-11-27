// ============================================
// Core Types
// ============================================

export type Severity = 'critical' | 'serious' | 'moderate' | 'minor';

export type IssueStatus = 'new' | 'recurring' | 'fixed';

export type WCAGStandard = 'wcag2a' | 'wcag2aa' | 'wcag21a' | 'wcag21aa' | 'wcag22aa';

// ============================================
// Scan Types
// ============================================

export interface Finding {
  id: string;
  ruleId: string;
  ruleTitle: string;
  description: string;
  impact: Severity;
  selector: string;
  html: string;
  helpUrl: string;
  wcagTags: string[];
  page?: string;
  fixSuggestion?: string;
}

export interface TrackedFinding extends Finding {
  status: IssueStatus;
  fingerprint: string;
  firstSeen?: string;
  lastSeen?: string;
  // False Positive Management
  falsePositive?: boolean;
  falsePositiveReason?: string;
  falsePositiveMarkedAt?: string;
  falsePositiveMarkedBy?: string;
}

export interface ScanResult {
  id: string;
  url: string;
  timestamp: string;
  score: number;
  totalIssues: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  findings: Finding[];
  scanDuration: number;
  viewport?: Viewport;
}

export interface SavedScan extends ScanResult {
  trackedFindings?: TrackedFinding[];
}

// ============================================
// Issue Pattern Types
// ============================================

export interface IssuePattern {
  ruleId: string;
  ruleTitle: string;
  severity: Severity;
  count: number;
  pages: number;
  type: 'template' | 'global' | 'page-specific';
  fixStrategy: string;
}

// ============================================
// Impact Analysis Types
// ============================================

export interface DevTimeEstimate {
  totalHours: number;
  devWeeks: number;
  sprints: number;
  bySeverity: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
}

export interface RiskAssessment {
  level: 'critical' | 'high' | 'medium' | 'low';
  label: string;
  description: string;
}

export interface ImpactAnalysis {
  devTime: DevTimeEstimate;
  riskAssessment: RiskAssessment;
  audienceImpact: string;
  businessMetrics: {
    legalExposure: string;
    userBehavior: string;
    marketSize: string;
    brandRisk: string;
    businessValue: string;
  };
}

// ============================================
// Tracking Types
// ============================================

export interface TrackingStats {
  new: number;
  recurring: number;
  fixed: number;
  total: number;
}

// ============================================
// Report Types
// ============================================

export interface TrendDataPoint {
  date: string;
  fullDate: string;
  score: number;
  issues: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}

export interface ComparisonResult {
  newer: SavedScan;
  older: SavedScan;
  scoreDiff: number;
  issueDiff: number;
  criticalDiff: number;
  seriousDiff: number;
  timeBetween: string;
  improved: boolean;
  unchanged: boolean;
}

// ============================================
// Viewport Types
// ============================================

export type Viewport = 'desktop' | 'tablet' | 'mobile';

export interface ViewportConfig {
  width: number;
  height: number;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
}

export const VIEWPORT_CONFIGS: Record<Viewport, ViewportConfig> = {
  desktop: { width: 1280, height: 720, isMobile: false, hasTouch: false },
  tablet: { width: 768, height: 1024, isMobile: true, hasTouch: true },
  mobile: { width: 375, height: 667, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
};

// ============================================
// False Positive Types
// ============================================

export interface FalsePositiveEntry {
  fingerprint: string;
  ruleId: string;
  reason?: string;
  markedAt: string;
  markedBy?: string;
}

export type {
  SiteStats,
  TopIssue,
  DashboardData,
  DrillDownTarget,
} from './executive';

// Add to existing types/index.ts

// Date range filter types
export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface IssueTrendDataPoint {
  date: string;
  fullDate?: string;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  total: number;
}

export interface AlertSettings {
  regressionThreshold: number;
  recentDays: number;
  showRegressionAlerts: boolean;
}

export interface ScoreGoalSettings {
  scoreGoal: number;
  showScoreGoal: boolean;
  showGoalProgress: boolean;
}

export interface PdfExportSettings {
  includeScoreTrend: boolean;
  includeIssueTrend: boolean;
  includeDistribution: boolean;
  includeStats: boolean;
  includeSummary: boolean;
  companyName: string;
  logoUrl: string;
}

export interface ReportSettings {
  scoreGoal: ScoreGoalSettings;
  pdfExport: PdfExportSettings;
}

export type DateRangeOption = 'all' | '7days' | '30days' | '90days' | 'custom';

export type SortOption = 'newest' | 'oldest' | 'score-high' | 'score-low' | 'issues-high' | 'issues-low';

export * from './jira';
export * from './schedule';
export * from './competitor';
export * from './batch-pr';