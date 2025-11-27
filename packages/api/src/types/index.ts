export type Severity = 'critical' | 'serious' | 'moderate' | 'minor';

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

export interface ScanRequest {
  url: string;
  standard?: string;
  viewport?: Viewport;
  includeWarnings?: boolean;
}

// Report Settings
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

export * from './jira';
export * from './schedule';
