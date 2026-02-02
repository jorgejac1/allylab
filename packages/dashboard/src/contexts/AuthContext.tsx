import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import type { User, Organization, Role, Permission, NavigationPage } from '../types/auth';
import {
  MOCK_USERS,
  MOCK_ORGANIZATION,
  DEFAULT_USER,
  getUserById,
  getWebsiteSession,
  websiteSessionToUser,
  hasWebsiteSession,
  clearWebsiteSession,
  checkAndStoreSessionFromUrl,
  PLAN_SETTINGS,
} from '../data/mockAuth';
import { hasPermission, canAccessPage, getRolePermissions, getRolePages } from '../utils/permissions';
import { shouldUseMockAuth, authConfig } from '../config/auth';

const STORAGE_KEY = 'allylab_current_user';

interface AuthContextValue {
  // Current user state
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Auth mode
  isMockAuth: boolean;

  // Website session (true if user logged in from website)
  hasWebsiteSession: boolean;

  // User management (for dev mode switching - hidden when using website session)
  allUsers: User[];
  switchUser: (userId: string) => void;

  // Permission checks
  can: (permission: Permission) => boolean;
  canAccessPage: (page: NavigationPage) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;

  // Role info
  role: Role | null;
  permissions: Permission[];
  accessiblePages: NavigationPage[];

  // Auth actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;

  // Redirect to website for login (production mode)
  redirectToLogin: () => void;
  redirectToSignup: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

// Check URL for session parameter on module load (before React renders)
if (typeof window !== 'undefined') {
  checkAndStoreSessionFromUrl();
}

/**
 * Mock Auth Provider for development
 * Checks for website session first, falls back to user switcher
 */
function MockAuthProvider({ children }: AuthProviderProps) {
  // Check if user came from website login
  const [isFromWebsite, setIsFromWebsite] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return hasWebsiteSession();
  });

  // Initialize user from website session, localStorage, or default
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return DEFAULT_USER;

    // First, check for website session (may have just been stored from URL)
    const websiteSession = getWebsiteSession();
    if (websiteSession) {
      return websiteSessionToUser(websiteSession);
    }

    // Fall back to stored user selection
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const storedUser = getUserById(stored);
      if (storedUser) return storedUser;
    }
    return DEFAULT_USER;
  });

  // Build organization from website session or use mock
  const [organization, setOrganization] = useState<Organization | null>(() => {
    if (typeof window === 'undefined') return MOCK_ORGANIZATION;

    const websiteSession = getWebsiteSession();
    if (websiteSession) {
      const plan = websiteSession.user.plan || 'free';
      return {
        id: websiteSession.user.organizationId,
        name: websiteSession.user.organizationName,
        plan,
        ownerId: websiteSession.user.id,
        createdAt: websiteSession.user.createdAt,
        settings: PLAN_SETTINGS[plan] || PLAN_SETTINGS.free,
      };
    }
    return MOCK_ORGANIZATION;
  });

  // Listen for website session changes (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'allylab_session') {
        const websiteSession = getWebsiteSession();
        if (websiteSession) {
          setUser(websiteSessionToUser(websiteSession));
          setIsFromWebsite(true);
          const plan = websiteSession.user.plan || 'free';
          setOrganization({
            id: websiteSession.user.organizationId,
            name: websiteSession.user.organizationName,
            plan,
            ownerId: websiteSession.user.id,
            createdAt: websiteSession.user.createdAt,
            settings: PLAN_SETTINGS[plan] || PLAN_SETTINGS.free,
          });
        } else {
          // Website session cleared, fall back to default
          setUser(DEFAULT_USER);
          setOrganization(MOCK_ORGANIZATION);
          setIsFromWebsite(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Persist user selection to localStorage (only when not using website session)
  useEffect(() => {
    if (user && !isFromWebsite) {
      localStorage.setItem(STORAGE_KEY, user.id);
    } else if (!user) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user, isFromWebsite]);

  // Session expiry check - periodically check if session has expired
  useEffect(() => {
    if (!isFromWebsite) return; // Only check for website sessions

    const checkSessionExpiry = () => {
      const session = getWebsiteSession();
      if (!session) {
        // Session expired or cleared
        console.log('[Auth] Session expired, logging out');
        clearWebsiteSession();
        setUser(DEFAULT_USER);
        setOrganization(MOCK_ORGANIZATION);
        setIsFromWebsite(false);
        // Redirect to sign-in
        window.location.href = `${authConfig.websiteUrl}/sign-in?expired=true`;
        return;
      }

      // Check if session is about to expire (within 5 minutes)
      const expiresAt = new Date(session.expiresAt).getTime();
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (expiresAt - now < fiveMinutes && expiresAt > now) {
        // Session expiring soon - could show a warning toast here
        console.log('[Auth] Session expiring in less than 5 minutes');
      }
    };

    // Check immediately and then every minute
    checkSessionExpiry();
    const interval = setInterval(checkSessionExpiry, 60 * 1000);

    return () => clearInterval(interval);
  }, [isFromWebsite]);

  // Switch to a different user (dev mode - disabled when using website session)
  const switchUser = useCallback((userId: string) => {
    if (isFromWebsite) {
      console.log('[Auth] User switching disabled when logged in from website');
      return;
    }
    const newUser = getUserById(userId);
    if (newUser) {
      setUser(newUser);
    }
  }, [isFromWebsite]);

  // Mock login (always succeeds with mock users)
  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    const foundUser = MOCK_USERS.find((u) => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      setIsFromWebsite(false);
      return true;
    }
    return false;
  }, []);

  // Logout
  const logout = useCallback(() => {
    // Clear both website session and local storage
    clearWebsiteSession();
    setUser(null);
    setIsFromWebsite(false);
    localStorage.removeItem(STORAGE_KEY);
    // Redirect to website sign-out (which clears session there too)
    window.location.href = `${authConfig.websiteUrl}/sign-out`;
  }, []);

  // Permission check functions
  const can = useCallback(
    (permission: Permission): boolean => {
      if (!user) return false;
      return hasPermission(user.role, permission);
    },
    [user]
  );

  const canAccess = useCallback(
    (page: NavigationPage): boolean => {
      if (!user) return false;
      return canAccessPage(user.role, page);
    },
    [user]
  );

  const hasAny = useCallback(
    (permissions: Permission[]): boolean => {
      if (!user) return false;
      return permissions.some((p) => hasPermission(user.role, p));
    },
    [user]
  );

  const hasAll = useCallback(
    (permissions: Permission[]): boolean => {
      if (!user) return false;
      return permissions.every((p) => hasPermission(user.role, p));
    },
    [user]
  );

  // Redirects (no-op in mock mode)
  const redirectToLogin = useCallback(() => {
    console.log('[Mock Auth] Would redirect to login');
  }, []);

  const redirectToSignup = useCallback(() => {
    console.log('[Mock Auth] Would redirect to signup');
  }, []);

  // Memoized values
  const role = user?.role ?? null;
  const permissions = useMemo(() => (role ? getRolePermissions(role) : []), [role]);
  const accessiblePages = useMemo(() => (role ? getRolePages(role) : []), [role]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      organization,
      isAuthenticated: !!user,
      isLoading: false,
      isMockAuth: true,
      hasWebsiteSession: isFromWebsite,
      // Only show user switcher when NOT using website session
      allUsers: isFromWebsite ? [] : MOCK_USERS,
      switchUser,
      can,
      canAccessPage: canAccess,
      hasAnyPermission: hasAny,
      hasAllPermissions: hasAll,
      role,
      permissions,
      accessiblePages,
      login,
      logout,
      redirectToLogin,
      redirectToSignup,
    }),
    [
      user,
      organization,
      isFromWebsite,
      switchUser,
      can,
      canAccess,
      hasAny,
      hasAll,
      role,
      permissions,
      accessiblePages,
      login,
      logout,
      redirectToLogin,
      redirectToSignup,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Production Auth Provider using Clerk
 * Fetches user data from API after Clerk authentication
 */
function ClerkAuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data from API on mount
  useEffect(() => {
    async function fetchUserData() {
      try {
        // Check for session passed via URL (cross-origin redirect)
        const params = new URLSearchParams(window.location.search);
        const sessionParam = params.get('session');
        const token = sessionParam ? JSON.parse(decodeURIComponent(sessionParam)).token : null;

        // Clean URL if session param was present
        if (sessionParam) {
          const url = new URL(window.location.href);
          url.searchParams.delete('session');
          window.history.replaceState({}, '', url.toString());
        }

        // Build headers - include token if we got one from URL
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Fetch current user from API (uses cookie or Authorization header)
        const response = await fetch(`${authConfig.apiUrl}/auth/me`, {
          credentials: 'include',
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            // Map API user to dashboard user format
            const apiUser = data.user;
            const mappedUser: User = {
              id: apiUser.id,
              email: apiUser.email,
              name: apiUser.name,
              role: apiUser.role as Role,
              avatarUrl: apiUser.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${apiUser.name}`,
              organizationId: apiUser.organizationId,
              createdAt: apiUser.createdAt || new Date().toISOString(),
            };
            setUser(mappedUser);

            if (data.organization) {
              const plan = data.organization.plan || 'free';
              setOrganization({
                id: data.organization.id,
                name: data.organization.name,
                plan,
                ownerId: apiUser.id,
                createdAt: new Date().toISOString(),
                settings: PLAN_SETTINGS[plan] || PLAN_SETTINGS.free,
              });
            }
          }
        } else if (response.status === 401) {
          // Not authenticated - redirect to login
          window.location.href = `${authConfig.websiteUrl}/sign-in?redirect=${encodeURIComponent(window.location.href)}`;
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, []);

  // Login - redirect to website
  const login = useCallback(async (_email: string, _password: string): Promise<boolean> => {
    window.location.href = `${authConfig.websiteUrl}/sign-in`;
    return false;
  }, []);

  // Logout - call API to clear cookie, then redirect to website
  const logout = useCallback(async () => {
    try {
      await fetch(`${authConfig.apiUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Failed to logout from API:', error);
    }
    window.location.href = `${authConfig.websiteUrl}/sign-out`;
  }, []);

  const redirectToLogin = useCallback(() => {
    window.location.href = `${authConfig.websiteUrl}/sign-in?redirect=${encodeURIComponent(window.location.href)}`;
  }, []);

  const redirectToSignup = useCallback(() => {
    window.location.href = `${authConfig.websiteUrl}/sign-up`;
  }, []);

  // Permission check functions
  const can = useCallback(
    (permission: Permission): boolean => {
      if (!user) return false;
      return hasPermission(user.role, permission);
    },
    [user]
  );

  const canAccess = useCallback(
    (page: NavigationPage): boolean => {
      if (!user) return false;
      return canAccessPage(user.role, page);
    },
    [user]
  );

  const hasAny = useCallback(
    (permissions: Permission[]): boolean => {
      if (!user) return false;
      return permissions.some((p) => hasPermission(user.role, p));
    },
    [user]
  );

  const hasAll = useCallback(
    (permissions: Permission[]): boolean => {
      if (!user) return false;
      return permissions.every((p) => hasPermission(user.role, p));
    },
    [user]
  );

  // Switch user is disabled in production
  const switchUser = useCallback((_userId: string) => {
    console.warn('User switching is only available in development mode');
  }, []);

  // Memoized values
  const role = user?.role ?? null;
  const permissions = useMemo(() => (role ? getRolePermissions(role) : []), [role]);
  const accessiblePages = useMemo(() => (role ? getRolePages(role) : []), [role]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      organization,
      isAuthenticated: !!user,
      isLoading,
      isMockAuth: false,
      hasWebsiteSession: false, // Production uses Clerk, not website session
      allUsers: [], // No user switching in production
      switchUser,
      can,
      canAccessPage: canAccess,
      hasAnyPermission: hasAny,
      hasAllPermissions: hasAll,
      role,
      permissions,
      accessiblePages,
      login,
      logout,
      redirectToLogin,
      redirectToSignup,
    }),
    [
      user,
      organization,
      isLoading,
      switchUser,
      can,
      canAccess,
      hasAny,
      hasAll,
      role,
      permissions,
      accessiblePages,
      login,
      logout,
      redirectToLogin,
      redirectToSignup,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Main Auth Provider that switches between mock and production modes
 */
export function AuthProvider({ children }: AuthProviderProps) {
  if (shouldUseMockAuth()) {
    return <MockAuthProvider>{children}</MockAuthProvider>;
  }
  return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
}

/**
 * Hook to access the auth context.
 * Must be used within an AuthProvider.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to check a specific permission.
 * Returns a boolean indicating if the current user has the permission.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function usePermission(permission: Permission): boolean {
  const { can } = useAuth();
  return can(permission);
}

/**
 * Hook to check multiple permissions.
 * Returns an object with hasAny and hasAll boolean values.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function usePermissions(permissions: Permission[]): { hasAny: boolean; hasAll: boolean } {
  const { hasAnyPermission, hasAllPermissions } = useAuth();
  return {
    hasAny: hasAnyPermission(permissions),
    hasAll: hasAllPermissions(permissions),
  };
}

/**
 * Hook to get the current user's role.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useRole(): Role | null {
  const { role } = useAuth();
  return role;
}
