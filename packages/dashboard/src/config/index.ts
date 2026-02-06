/**
 * Centralized configuration for the AllyLab dashboard
 * All hardcoded values should be defined here for easy maintenance
 */

// ============================================
// API Configuration
// ============================================

const isDev = import.meta.env.DEV;

export const API = {
  /** Default API base URL (can be overridden via localStorage) */
  DEFAULT_BASE_URL: import.meta.env.VITE_API_URL || (isDev ? 'http://localhost:3001' : 'https://allylab-api.onrender.com'),

  /** Storage key for custom API URL override */
  STORAGE_KEY: 'allylab_api_url',

  /** API endpoints */
  ENDPOINTS: {
    SCAN: '/api/scan',
    SCAN_JSON: '/api/scan/json',
    FIXES_GENERATE: '/fixes/generate',
    JIRA_CREATE: '/jira/create',
  },
} as const;

// ============================================
// Timing Configuration
// ============================================

export const TIMING = {
  /** Toast notification auto-close duration (ms) */
  TOAST_DURATION: 4000,

  /** Clipboard copy success notification duration (ms) */
  COPY_NOTIFICATION: 2000,

  /** API health check polling interval (ms) */
  HEALTH_CHECK_INTERVAL: 60000,

  /** Date range periods */
  PERIODS: {
    WEEK_MS: 7 * 24 * 60 * 60 * 1000,
    MONTH_MS: 30 * 24 * 60 * 60 * 1000,
    QUARTER_MS: 90 * 24 * 60 * 60 * 1000,
  },
} as const;

// ============================================
// Storage Keys
// ============================================

export const STORAGE_KEYS = {
  /** Saved scan results */
  SCANS: 'allylab_scans',

  /** False positive entries */
  FALSE_POSITIVES: 'allylab_false_positives',

  /** Report configuration */
  REPORT_SETTINGS: 'allylab_report_settings',

  /** Alert thresholds */
  ALERT_SETTINGS: 'allylab_alert_settings',

  /** PR tracking information */
  TRACKED_PRS: 'allylab_tracked_prs',

  /** JIRA configuration */
  JIRA_CONFIG: 'allylab_jira_config',

  /** JIRA field mapping */
  JIRA_MAPPING: 'allylab_jira_mapping',

  /** JIRA issue links */
  JIRA_LINKS: 'allylab_jira_links',

  /** Domain-to-repo mapping */
  DOMAIN_REPOS: 'allylab-domain-repos',

  /** API URL override */
  API_URL: 'allylab_api_url',

  /** Tracked issue fingerprints */
  TRACKED_ISSUES: 'allylab_tracked_issues',

  /** Competitor list */
  COMPETITORS: 'allylab_competitors',

  /** Competitor scan history */
  COMPETITOR_SCANS: 'allylab_competitor_scans',

  /** Application settings */
  SETTINGS: 'allylab_settings',

  /** Authentication profiles for protected page scanning */
  AUTH_PROFILES: 'allylab_auth_profiles',
} as const;

// ============================================
// UI Constants
// ============================================

export const UI = {
  /** Z-index values for stacking context */
  Z_INDEX: {
    DRAWER_OVERLAY: 999,
    DRAWER_CONTENT: 1000,
    MODAL_OVERLAY: 1000,
    MODAL_CONTENT: 1001,
    CONFIRM_DIALOG: 9999,
    TOAST: 10000,
  },

  /** Maximum items to store */
  MAX_SCANS: 100,
} as const;

// ============================================
// Defaults
// ============================================

export const DEFAULTS = {
  /** Scan configuration */
  SCAN: {
    STANDARD: 'wcag21aa',
    VIEWPORT: 'desktop',
  },

  /** Alert settings */
  ALERTS: {
    REGRESSION_THRESHOLD: 5,
    RECENT_DAYS: 7,
    SHOW_REGRESSION_ALERTS: true,
  },

  /** Report settings */
  REPORTS: {
    SCORE_GOAL: 90,
  },

  /** JIRA configuration */
  JIRA: {
    PROJECT_KEY: 'A11Y',
    ISSUE_TYPE: 'Bug',
    SEVERITY_FIELD: 'priority',
    WCAG_TAGS_FIELD: 'labels',
    WCAG_TAG_PREFIX: 'wcag-',
  },
} as const;

// ============================================
// Scoring Thresholds
// ============================================

export const SCORING = {
  /** Score grade thresholds */
  GRADES: {
    A: 90,
    B: 80,
    C: 70,
    D: 60,
  },

  /** Score color thresholds */
  COLORS: {
    GREEN: 90,
    AMBER: 70,
    ORANGE: 50,
  },

  /** Code matching confidence thresholds */
  CONFIDENCE: {
    HIGH: 80,
    MEDIUM: 50,
    LOW: 20,
  },
} as const;
