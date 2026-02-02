import type { User, Organization, PlanSettings, Role, Plan } from '../types/auth';

// Shared storage key with website
const WEBSITE_SESSION_KEY = 'allylab_session';

/**
 * Check URL for session parameter (passed from website login)
 * and store it in localStorage if found
 */
export function checkAndStoreSessionFromUrl(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');

    if (sessionParam) {
      const session = JSON.parse(decodeURIComponent(sessionParam));
      localStorage.setItem(WEBSITE_SESSION_KEY, JSON.stringify(session));

      // Clean up URL by removing session param
      params.delete('session');
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);

      return true;
    }
  } catch (e) {
    console.error('Failed to parse session from URL:', e);
  }

  return false;
}

/**
 * Session format from website mock auth
 */
interface WebsiteSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    organizationId: string;
    organizationName: string;
    plan: Plan;
    avatarUrl?: string;
    createdAt: string;
    lastLoginAt?: string;
  };
  expiresAt: string;
  token: string;
}

/**
 * Check if there's a valid website session
 */
export function getWebsiteSession(): WebsiteSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(WEBSITE_SESSION_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored) as WebsiteSession;

    // Check if expired
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem(WEBSITE_SESSION_KEY);
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Convert website session user to dashboard User format
 */
export function websiteSessionToUser(session: WebsiteSession): User {
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    organizationId: session.user.organizationId,
    avatarUrl: session.user.avatarUrl,
    createdAt: session.user.createdAt,
    lastLoginAt: session.user.lastLoginAt,
  };
}

/**
 * Check if user logged in from website (has valid session)
 */
export function hasWebsiteSession(): boolean {
  return getWebsiteSession() !== null;
}

/**
 * Clear website session (logout)
 */
export function clearWebsiteSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(WEBSITE_SESSION_KEY);
}

/**
 * Plan settings for each subscription tier.
 */
export const PLAN_SETTINGS: Record<string, PlanSettings> = {
  free: {
    maxUsers: 1,
    maxScansPerMonth: 100,
    maxAiFixesPerMonth: 10,
    maxGitHubPRsPerMonth: 5,
    maxCustomRules: 0,
    maxApiRequestsPerHour: 0,
    scheduledScans: false,
    scheduledScanFrequency: 'none',
    jiraIntegration: false,
    slackIntegration: false,
    apiAccess: false,
    ssoEnabled: false,
    selfHosted: false,
    auditLogs: false,
    exportFormats: ['csv'],
  },
  pro: {
    maxUsers: 5,
    maxScansPerMonth: -1, // Unlimited
    maxAiFixesPerMonth: -1,
    maxGitHubPRsPerMonth: -1,
    maxCustomRules: 10,
    maxApiRequestsPerHour: 1000,
    scheduledScans: true,
    scheduledScanFrequency: 'daily',
    jiraIntegration: true,
    slackIntegration: true,
    apiAccess: true,
    ssoEnabled: false,
    selfHosted: false,
    auditLogs: false,
    exportFormats: ['csv', 'pdf', 'excel'],
  },
  team: {
    maxUsers: 20,
    maxScansPerMonth: -1,
    maxAiFixesPerMonth: -1,
    maxGitHubPRsPerMonth: -1,
    maxCustomRules: -1, // Unlimited
    maxApiRequestsPerHour: 5000,
    scheduledScans: true,
    scheduledScanFrequency: 'hourly',
    jiraIntegration: true,
    slackIntegration: true,
    apiAccess: true,
    ssoEnabled: false,
    selfHosted: false,
    auditLogs: false,
    exportFormats: ['csv', 'pdf', 'excel', 'json'],
  },
  enterprise: {
    maxUsers: -1, // Unlimited
    maxScansPerMonth: -1,
    maxAiFixesPerMonth: -1,
    maxGitHubPRsPerMonth: -1,
    maxCustomRules: -1,
    maxApiRequestsPerHour: -1, // Custom
    scheduledScans: true,
    scheduledScanFrequency: 'custom',
    jiraIntegration: true,
    slackIntegration: true,
    apiAccess: true,
    ssoEnabled: true,
    selfHosted: true,
    auditLogs: true,
    exportFormats: ['csv', 'pdf', 'excel', 'json'],
  },
};

/**
 * Mock organization for development.
 */
export const MOCK_ORGANIZATION: Organization = {
  id: 'org_acme',
  name: 'Acme Corp',
  plan: 'team',
  ownerId: 'user_admin',
  createdAt: '2024-01-15T10:00:00Z',
  settings: PLAN_SETTINGS.team,
};

/**
 * Mock users for development.
 * Each represents a different role to test permissions.
 */
export const MOCK_USERS: User[] = [
  {
    id: 'user_admin',
    email: 'admin@acme.com',
    name: 'Alice Admin',
    role: 'admin',
    organizationId: 'org_acme',
    avatarUrl: undefined,
    createdAt: '2024-01-15T10:00:00Z',
    lastLoginAt: '2024-01-30T09:00:00Z',
  },
  {
    id: 'user_manager',
    email: 'manager@acme.com',
    name: 'Mike Manager',
    role: 'manager',
    organizationId: 'org_acme',
    avatarUrl: undefined,
    createdAt: '2024-01-16T10:00:00Z',
    lastLoginAt: '2024-01-30T08:30:00Z',
  },
  {
    id: 'user_dev',
    email: 'dev@acme.com',
    name: 'Dana Developer',
    role: 'developer',
    organizationId: 'org_acme',
    avatarUrl: undefined,
    createdAt: '2024-01-17T10:00:00Z',
    lastLoginAt: '2024-01-30T10:15:00Z',
  },
  {
    id: 'user_viewer',
    email: 'viewer@acme.com',
    name: 'Victor Viewer',
    role: 'viewer',
    organizationId: 'org_acme',
    avatarUrl: undefined,
    createdAt: '2024-01-18T10:00:00Z',
    lastLoginAt: '2024-01-29T14:00:00Z',
  },
  {
    id: 'user_compliance',
    email: 'compliance@acme.com',
    name: 'Carla Compliance',
    role: 'compliance',
    organizationId: 'org_acme',
    avatarUrl: undefined,
    createdAt: '2024-01-19T10:00:00Z',
    lastLoginAt: '2024-01-28T11:00:00Z',
  },
];

/**
 * Default user for initial app load.
 */
export const DEFAULT_USER = MOCK_USERS[0]; // Admin by default

/**
 * Get user by ID.
 */
export function getUserById(id: string): User | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}

/**
 * Get user by email.
 */
export function getUserByEmail(email: string): User | undefined {
  return MOCK_USERS.find((u) => u.email === email);
}

/**
 * Get all users in an organization.
 */
export function getOrganizationUsers(organizationId: string): User[] {
  return MOCK_USERS.filter((u) => u.organizationId === organizationId);
}
