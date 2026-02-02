/**
 * User roles in the AllyLab platform.
 * Each role has different permissions and access levels.
 */
export type Role = 'admin' | 'manager' | 'developer' | 'viewer' | 'compliance';

/**
 * Subscription plans with different feature limits.
 */
export type Plan = 'free' | 'pro' | 'team' | 'enterprise';

/**
 * User account in the platform.
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

/**
 * Organization/team account.
 */
export interface Organization {
  id: string;
  name: string;
  plan: Plan;
  ownerId: string;
  createdAt: string;
  settings: PlanSettings;
}

/**
 * Feature limits based on plan.
 */
export interface PlanSettings {
  maxUsers: number;
  maxScansPerMonth: number;
  maxAiFixesPerMonth: number;
  maxGitHubPRsPerMonth: number;
  maxCustomRules: number;
  maxApiRequestsPerHour: number;
  scheduledScans: boolean;
  scheduledScanFrequency: 'none' | 'daily' | 'hourly' | 'custom';
  jiraIntegration: boolean;
  slackIntegration: boolean;
  apiAccess: boolean;
  ssoEnabled: boolean;
  selfHosted: boolean;
  auditLogs: boolean;
  exportFormats: ('csv' | 'pdf' | 'excel' | 'json')[];
}

/**
 * Invitation to join an organization.
 */
export interface Invitation {
  id: string;
  email: string;
  role: Role;
  organizationId: string;
  invitedBy: string;
  expiresAt: string;
  acceptedAt?: string;
}

/**
 * Actions that can be performed in the platform.
 */
export type Permission =
  // Scanning
  | 'scan:run'
  | 'scan:schedule'
  // Findings
  | 'findings:view'
  | 'findings:mark-false-positive'
  // AI Fixes
  | 'fixes:generate'
  | 'fixes:create-pr'
  | 'fixes:batch-pr'
  // Reports
  | 'reports:view'
  | 'reports:export'
  // Executive
  | 'executive:view'
  | 'benchmark:view'
  // Rules
  | 'rules:view'
  | 'rules:create'
  | 'rules:edit'
  | 'rules:delete'
  // Integrations
  | 'github:connect'
  | 'jira:connect'
  | 'jira:export'
  | 'webhooks:manage'
  // Admin
  | 'users:view'
  | 'users:invite'
  | 'users:remove'
  | 'users:change-role'
  | 'billing:view'
  | 'billing:manage'
  | 'audit-logs:view'
  | 'settings:view'
  | 'settings:edit';

/**
 * Navigation pages in the dashboard.
 */
export type NavigationPage =
  | 'scan'
  | 'site-scan'
  | 'reports'
  | 'executive'
  | 'benchmark'
  | 'settings';

// ============================================
// Authentication Profiles for Protected Page Scanning
// ============================================

/**
 * Cookie for authenticated scanning
 */
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

/**
 * Login flow step for automated login
 */
export interface LoginStep {
  action: 'goto' | 'fill' | 'click' | 'wait' | 'waitForNavigation';
  selector?: string;
  value?: string;
  url?: string;
  timeout?: number;
}

/**
 * Login flow configuration
 */
export interface LoginFlowConfig {
  loginUrl: string;
  steps: LoginStep[];
  successIndicator: {
    type: 'url-contains' | 'selector-exists' | 'cookie-exists';
    value: string;
  };
}

/**
 * Playwright storage state (cookies + localStorage)
 */
export interface StorageState {
  cookies: AuthCookie[];
  origins?: Array<{
    origin: string;
    localStorage: Array<{ name: string; value: string }>;
  }>;
}

/**
 * Authentication options passed to scan API
 */
export interface ScanAuthOptions {
  cookies?: AuthCookie[];
  headers?: Record<string, string>;
  storageState?: StorageState;
  basicAuth?: { username: string; password: string };
  loginFlow?: LoginFlowConfig;
}

/**
 * Authentication method type
 */
export type AuthMethod = 'cookies' | 'headers' | 'storage-state' | 'login-flow' | 'basic-auth';

/**
 * Result of testing an auth profile
 */
export interface AuthProfileTestResult {
  success: boolean;
  message: string;
  statusCode?: number;
  testedAt: string;
}

/**
 * Saved authentication profile
 */
export interface AuthProfile {
  id: string;
  name: string;
  description?: string;
  domains: string[];  // e.g., ["*.americanexpress.com", "global.americanexpress.com"]
  method: AuthMethod;

  // Method-specific configuration (only one populated based on method)
  cookies?: AuthCookie[];
  headers?: Record<string, string>;
  storageState?: StorageState;
  loginFlow?: LoginFlowConfig;
  basicAuth?: { username: string; password: string };

  enabled: boolean;
  createdAt: string;
  updatedAt?: string;
  lastUsed?: string;

  // Test tracking for expiration warnings
  lastTested?: string;
  lastTestResult?: AuthProfileTestResult;
}

/**
 * Profile health status
 */
export type ProfileHealth = 'healthy' | 'warning' | 'expired' | 'untested';

/**
 * Profile health check result
 */
export interface ProfileHealthCheck {
  status: ProfileHealth;
  message: string;
  daysSinceTest?: number;
  daysSinceUse?: number;
}
