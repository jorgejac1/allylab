/**
 * Mock Auth System for Development
 *
 * Provides a simple localStorage-based auth system for development/demo.
 * Sessions are shared with the dashboard via localStorage.
 */

// Shared storage key with dashboard
export const AUTH_STORAGE_KEY = 'allylab_session';
export const USERS_STORAGE_KEY = 'allylab_users';

export type Role = 'admin' | 'manager' | 'developer' | 'viewer' | 'compliance';
export type Plan = 'free' | 'pro' | 'team' | 'enterprise';

export interface MockUser {
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
}

export interface MockSession {
  user: MockUser;
  expiresAt: string;
  token: string;
}

// Default mock users (same as dashboard but with passwords for login)
export const MOCK_USERS: Array<MockUser & { password: string }> = [
  {
    id: 'user_admin',
    email: 'admin@acme.com',
    password: 'admin123',
    name: 'Alice Admin',
    role: 'admin',
    organizationId: 'org_acme',
    organizationName: 'Acme Corp',
    plan: 'team',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'user_manager',
    email: 'manager@acme.com',
    password: 'manager123',
    name: 'Mike Manager',
    role: 'manager',
    organizationId: 'org_acme',
    organizationName: 'Acme Corp',
    plan: 'team',
    createdAt: '2024-01-16T10:00:00Z',
  },
  {
    id: 'user_dev',
    email: 'dev@acme.com',
    password: 'dev123',
    name: 'Dana Developer',
    role: 'developer',
    organizationId: 'org_acme',
    organizationName: 'Acme Corp',
    plan: 'team',
    createdAt: '2024-01-17T10:00:00Z',
  },
  {
    id: 'user_viewer',
    email: 'viewer@acme.com',
    password: 'viewer123',
    name: 'Victor Viewer',
    role: 'viewer',
    organizationId: 'org_acme',
    organizationName: 'Acme Corp',
    plan: 'team',
    createdAt: '2024-01-18T10:00:00Z',
  },
  {
    id: 'user_compliance',
    email: 'compliance@acme.com',
    password: 'compliance123',
    name: 'Carla Compliance',
    role: 'compliance',
    organizationId: 'org_acme',
    organizationName: 'Acme Corp',
    plan: 'team',
    createdAt: '2024-01-19T10:00:00Z',
  },
];

// Demo accounts that are shown on the login page
export const DEMO_ACCOUNTS = MOCK_USERS.map(({ password, ...user }) => ({
  ...user,
  password,
}));

/**
 * Generate a mock token
 */
function generateToken(): string {
  return `mock_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get all registered users (mock + custom)
 */
export function getAllUsers(): Array<MockUser & { password: string }> {
  if (typeof window === 'undefined') return MOCK_USERS;

  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (stored) {
      const customUsers = JSON.parse(stored) as Array<MockUser & { password: string }>;
      return [...MOCK_USERS, ...customUsers];
    }
  } catch {
    // Ignore parse errors
  }
  return MOCK_USERS;
}

/**
 * Register a new user (sign up)
 */
export function registerUser(
  email: string,
  password: string,
  name: string
): { success: boolean; error?: string; user?: MockUser } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Cannot register on server side' };
  }

  const allUsers = getAllUsers();

  // Check if email already exists
  if (allUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: 'Email already registered' };
  }

  // Create new user
  const newUser: MockUser & { password: string } = {
    id: `user_${Date.now()}`,
    email: email.toLowerCase(),
    password,
    name,
    role: 'viewer', // New users start as viewers
    organizationId: `org_${Date.now()}`,
    organizationName: `${name}'s Organization`,
    plan: 'free', // New users start on free plan
    createdAt: new Date().toISOString(),
  };

  // Save to localStorage
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    const customUsers = stored ? JSON.parse(stored) : [];
    customUsers.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(customUsers));
  } catch {
    return { success: false, error: 'Failed to save user' };
  }

  const { password: _, ...userWithoutPassword } = newUser;
  return { success: true, user: userWithoutPassword };
}

/**
 * Authenticate a user (sign in)
 * @param rememberMe - If true, session lasts 30 days; otherwise 24 hours
 */
export function authenticateUser(
  email: string,
  password: string,
  rememberMe: boolean = false
): { success: boolean; error?: string; session?: MockSession } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Cannot authenticate on server side' };
  }

  const allUsers = getAllUsers();
  const user = allUsers.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    return { success: false, error: 'Invalid email or password' };
  }

  // Session duration: 30 days if rememberMe, otherwise 24 hours
  const sessionDuration = rememberMe
    ? 30 * 24 * 60 * 60 * 1000  // 30 days
    : 24 * 60 * 60 * 1000;      // 24 hours

  // Create session
  const { password: _, ...userWithoutPassword } = user;
  const session: MockSession = {
    user: {
      ...userWithoutPassword,
      lastLoginAt: new Date().toISOString(),
    },
    expiresAt: new Date(Date.now() + sessionDuration).toISOString(),
    token: generateToken(),
  };

  // Save session
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));

  return { success: true, session };
}

/**
 * Get current session
 */
export function getSession(): MockSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored) as MockSession;

    // Check if expired
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): MockUser | null {
  const session = getSession();
  return session?.user ?? null;
}

/**
 * Sign out
 */
export function signOut(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getSession() !== null;
}

/**
 * Update session user (for role switching in dashboard)
 */
export function updateSessionUser(userId: string): boolean {
  if (typeof window === 'undefined') return false;

  const session = getSession();
  if (!session) return false;

  const allUsers = getAllUsers();
  const user = allUsers.find(u => u.id === userId);
  if (!user) return false;

  const { password: _, ...userWithoutPassword } = user;
  const updatedSession: MockSession = {
    ...session,
    user: userWithoutPassword,
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedSession));
  return true;
}

/**
 * Role labels for display
 */
export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  developer: 'Developer',
  viewer: 'Viewer',
  compliance: 'Compliance Officer',
};

/**
 * Plan labels for display
 */
export const PLAN_LABELS: Record<Plan, string> = {
  free: 'Free',
  pro: 'Pro',
  team: 'Team',
  enterprise: 'Enterprise',
};
