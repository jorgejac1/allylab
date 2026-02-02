import type { Role, Permission, NavigationPage } from '../types/auth';

/**
 * Permissions granted to each role.
 * Admin has all permissions, others have subsets.
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    // Scanning
    'scan:run',
    'scan:schedule',
    // Findings
    'findings:view',
    'findings:mark-false-positive',
    // AI Fixes
    'fixes:generate',
    'fixes:create-pr',
    'fixes:batch-pr',
    // Reports
    'reports:view',
    'reports:export',
    // Executive
    'executive:view',
    'benchmark:view',
    // Rules
    'rules:view',
    'rules:create',
    'rules:edit',
    'rules:delete',
    // Integrations
    'github:connect',
    'jira:connect',
    'jira:export',
    'webhooks:manage',
    // Admin
    'users:view',
    'users:invite',
    'users:remove',
    'users:change-role',
    'billing:view',
    'billing:manage',
    'audit-logs:view',
    'settings:view',
    'settings:edit',
  ],

  manager: [
    // Scanning
    'scan:run',
    'scan:schedule',
    // Findings
    'findings:view',
    'findings:mark-false-positive',
    // Reports
    'reports:view',
    'reports:export',
    // Executive
    'executive:view',
    'benchmark:view',
    // Rules
    'rules:view',
    'rules:create',
    'rules:edit',
    'rules:delete',
    // Integrations
    'jira:connect',
    'jira:export',
    'webhooks:manage',
    // Admin (limited)
    'users:view',
    'audit-logs:view',
    'settings:view',
  ],

  developer: [
    // Scanning
    'scan:run',
    'scan:schedule',
    // Findings
    'findings:view',
    'findings:mark-false-positive',
    // AI Fixes
    'fixes:generate',
    'fixes:create-pr',
    'fixes:batch-pr',
    // Reports
    'reports:view',
    'reports:export',
    // Rules
    'rules:view',
    'rules:create',
    'rules:edit',
    'rules:delete',
    // Integrations
    'github:connect',
    'jira:export',
    // Settings (limited)
    'settings:view',
  ],

  viewer: [
    // Findings (read-only)
    'findings:view',
    // Reports
    'reports:view',
    'reports:export',
    // Executive
    'executive:view',
    'benchmark:view',
  ],

  compliance: [
    // Findings (read-only)
    'findings:view',
    // Reports
    'reports:view',
    'reports:export',
    // Executive
    'executive:view',
    'benchmark:view',
    // Integrations (JIRA only)
    'jira:export',
    // Audit
    'audit-logs:view',
  ],
};

/**
 * Navigation pages accessible by each role.
 */
const ROLE_PAGES: Record<Role, NavigationPage[]> = {
  admin: ['scan', 'site-scan', 'reports', 'executive', 'benchmark', 'settings'],
  manager: ['scan', 'site-scan', 'reports', 'executive', 'benchmark', 'settings'],
  developer: ['scan', 'site-scan', 'reports', 'settings'],
  viewer: ['reports', 'executive', 'benchmark'],
  compliance: ['reports', 'executive', 'benchmark'],
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role can access a specific page.
 */
export function canAccessPage(role: Role, page: NavigationPage): boolean {
  return ROLE_PAGES[role]?.includes(page) ?? false;
}

/**
 * Get all permissions for a role.
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Get all accessible pages for a role.
 */
export function getRolePages(role: Role): NavigationPage[] {
  return ROLE_PAGES[role] ?? [];
}

/**
 * Check if a role can perform any of the given permissions.
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if a role can perform all of the given permissions.
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Role display names for UI.
 */
export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  developer: 'Developer',
  viewer: 'Viewer',
  compliance: 'Compliance',
};

/**
 * Role descriptions for UI.
 */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: 'Full access to all features including user management and billing',
  manager: 'Team oversight, reports, trends, and executive dashboards',
  developer: 'Scanning, AI fixes, GitHub integration, and code features',
  viewer: 'Read-only access to reports and dashboards',
  compliance: 'Reports, exports, and audit logs for compliance needs',
};
