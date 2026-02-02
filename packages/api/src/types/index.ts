export type Severity = 'critical' | 'serious' | 'moderate' | 'minor';

export type Viewport = 'desktop' | 'tablet' | 'mobile';

export type FindingSource = 'axe-core' | 'custom-rule';

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
  helpUrl?: string;
  wcagTags: string[];
  page?: string;
  source?: FindingSource;
  screenshot?: string;  // base64 PNG of the element
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
  customRulesCount?: number;
}

// Authentication types for scanning protected pages
export interface AuthCookie {
  name: string;
  value: string;
  domain: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export interface LoginStep {
  action: 'goto' | 'fill' | 'click' | 'wait' | 'waitForNavigation';
  selector?: string;
  value?: string;
  url?: string;
  timeout?: number;
}

export interface LoginFlowConfig {
  loginUrl: string;
  steps: LoginStep[];
  successIndicator: {
    type: 'url-contains' | 'selector-exists' | 'cookie-exists';
    value: string;
  };
}

export interface StorageState {
  cookies: AuthCookie[];
  origins?: Array<{
    origin: string;
    localStorage: Array<{ name: string; value: string }>;
  }>;
}

export interface ScanAuthOptions {
  cookies?: AuthCookie[];
  headers?: Record<string, string>;
  storageState?: StorageState;
  basicAuth?: { username: string; password: string };
  loginFlow?: LoginFlowConfig;
}

export interface ScanRequest {
  url: string;
  standard?: string;
  viewport?: Viewport;
  includeWarnings?: boolean;
  includeCustomRules?: boolean;
  auth?: ScanAuthOptions;
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
export * from './rules';
export * from './auth';