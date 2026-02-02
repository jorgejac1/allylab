'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  type MockUser,
  type MockSession,
  getSession,
  authenticateUser,
  registerUser,
  signOut as mockSignOut,
  isAuthenticated as checkIsAuthenticated,
  AUTH_STORAGE_KEY,
} from './mock';

interface MockAuthContextValue {
  user: MockUser | null;
  session: MockSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
}

const MockAuthContext = createContext<MockAuthContextValue | null>(null);

interface MockAuthProviderProps {
  children: ReactNode;
}

export function MockAuthProvider({ children }: MockAuthProviderProps) {
  const [session, setSession] = useState<MockSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const stored = getSession();
    setSession(stored);
    setIsLoading(false);

    // Listen for storage changes (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_STORAGE_KEY) {
        const newSession = getSession();
        setSession(newSession);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = authenticateUser(email, password);
    if (result.success && result.session) {
      setSession(result.session);
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const result = registerUser(email, password, name);
    if (result.success && result.user) {
      // Auto sign in after registration
      const signInResult = authenticateUser(email, password);
      if (signInResult.success && signInResult.session) {
        setSession(signInResult.session);
        return { success: true };
      }
    }
    return { success: false, error: result.error };
  }, []);

  const signOut = useCallback(() => {
    mockSignOut();
    setSession(null);
  }, []);

  const value = useMemo<MockAuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isAuthenticated: session !== null,
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [session, isLoading, signIn, signUp, signOut]
  );

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
}

export function useMockAuth(): MockAuthContextValue {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
}

// Helper hook for protected pages
export function useRequireAuth(redirectUrl = '/sign-in') {
  const { isAuthenticated, isLoading } = useMockAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = redirectUrl;
    }
  }, [isAuthenticated, isLoading, redirectUrl]);

  return { isAuthenticated, isLoading };
}
