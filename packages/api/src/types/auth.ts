/**
 * Authentication & Authorization Types
 *
 * These types define the user management and RBAC system for AllyLab.
 * Role-based access control with 5 roles and 4 pricing tiers.
 *
 * @see /wiki/User-Roles-Permissions.md for full documentation
 */

// User roles in order of decreasing privilege
export type Role = 'admin' | 'manager' | 'developer' | 'viewer' | 'compliance';

// Pricing tiers
export type Plan = 'free' | 'pro' | 'team' | 'enterprise';

// Plan limits configuration
export interface PlanLimits {
  scansPerMonth: number;
  pagesPerScan: number;
  usersAllowed: number;
  scheduledScans: boolean;
  customRules: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  ssoEnabled: boolean;
  multipleWorkspaces: boolean;
  auditLogs: boolean;
}

// Default limits per plan
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    scansPerMonth: 10,
    pagesPerScan: 5,
    usersAllowed: 1,
    scheduledScans: false,
    customRules: false,
    apiAccess: false,
    prioritySupport: false,
    ssoEnabled: false,
    multipleWorkspaces: false,
    auditLogs: false,
  },
  pro: {
    scansPerMonth: 100,
    pagesPerScan: 25,
    usersAllowed: 1,
    scheduledScans: true,
    customRules: false,
    apiAccess: true,
    prioritySupport: false,
    ssoEnabled: false,
    multipleWorkspaces: false,
    auditLogs: false,
  },
  team: {
    scansPerMonth: 500,
    pagesPerScan: 100,
    usersAllowed: 10,
    scheduledScans: true,
    customRules: true,
    apiAccess: true,
    prioritySupport: true,
    ssoEnabled: false,
    multipleWorkspaces: true,
    auditLogs: true,
  },
  enterprise: {
    scansPerMonth: -1, // Unlimited
    pagesPerScan: -1, // Unlimited
    usersAllowed: -1, // Unlimited
    scheduledScans: true,
    customRules: true,
    apiAccess: true,
    prioritySupport: true,
    ssoEnabled: true,
    multipleWorkspaces: true,
    auditLogs: true,
  },
};

// User entity
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  isActive: boolean;
  // Password hash (never returned in API responses)
  passwordHash?: string;
}

// Organization entity
export interface Organization {
  id: string;
  name: string;
  plan: Plan;
  ownerId: string;
  createdAt: string;
  updatedAt?: string;
  limits: PlanLimits;
  usage: {
    scansThisMonth: number;
    usersCount: number;
  };
  settings: {
    defaultViewport: 'desktop' | 'tablet' | 'mobile';
    defaultStandard: 'wcag2aa' | 'wcag2aaa' | 'wcag21aa' | 'wcag21aaa' | 'wcag22aa';
    notificationsEnabled: boolean;
  };
}

// API response types (without sensitive data)
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface OrganizationResponse {
  id: string;
  name: string;
  plan: Plan;
  ownerId: string;
  createdAt: string;
  limits: PlanLimits;
  usage: {
    scansThisMonth: number;
    usersCount: number;
  };
}

// Permission types
export type Permission =
  // Scan permissions
  | 'scan:run'
  | 'scan:schedule'
  | 'scan:cancel'
  | 'scan:view-history'
  // Findings permissions
  | 'findings:view'
  | 'findings:export'
  | 'findings:mark-false-positive'
  // Fix permissions
  | 'fixes:generate'
  | 'fixes:create-pr'
  | 'fixes:batch-pr'
  // Reports permissions
  | 'reports:view'
  | 'reports:export-pdf'
  | 'reports:view-executive'
  | 'reports:benchmark'
  // Settings permissions
  | 'settings:view'
  | 'settings:edit'
  | 'settings:manage-users'
  | 'settings:manage-integrations'
  | 'settings:manage-custom-rules';

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'scan:run', 'scan:schedule', 'scan:cancel', 'scan:view-history',
    'findings:view', 'findings:export', 'findings:mark-false-positive',
    'fixes:generate', 'fixes:create-pr', 'fixes:batch-pr',
    'reports:view', 'reports:export-pdf', 'reports:view-executive', 'reports:benchmark',
    'settings:view', 'settings:edit', 'settings:manage-users', 'settings:manage-integrations', 'settings:manage-custom-rules',
  ],
  manager: [
    'scan:run', 'scan:schedule', 'scan:cancel', 'scan:view-history',
    'findings:view', 'findings:export', 'findings:mark-false-positive',
    'fixes:generate', 'fixes:create-pr', 'fixes:batch-pr',
    'reports:view', 'reports:export-pdf', 'reports:view-executive', 'reports:benchmark',
    'settings:view', 'settings:edit', 'settings:manage-integrations',
  ],
  developer: [
    'scan:run', 'scan:view-history',
    'findings:view', 'findings:export', 'findings:mark-false-positive',
    'fixes:generate', 'fixes:create-pr',
    'reports:view',
    'settings:view',
  ],
  viewer: [
    'scan:view-history',
    'findings:view',
    'reports:view', 'reports:export-pdf',
    'settings:view',
  ],
  compliance: [
    'scan:view-history',
    'findings:view', 'findings:export',
    'reports:view', 'reports:export-pdf', 'reports:view-executive', 'reports:benchmark',
    'settings:view',
  ],
};

// Check if a role has a specific permission
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// Get all permissions for a role
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

// Convert User to UserResponse (strip sensitive data)
export function toUserResponse(user: User): UserResponse {
  const { passwordHash: _passwordHash, updatedAt: _updatedAt, ...response } = user;
  void _passwordHash;
  void _updatedAt;
  return response;
}

// Convert Organization to OrganizationResponse
export function toOrganizationResponse(org: Organization): OrganizationResponse {
  const { updatedAt: _updatedAt, settings: _settings, ...response } = org;
  void _updatedAt;
  void _settings;
  return response;
}
