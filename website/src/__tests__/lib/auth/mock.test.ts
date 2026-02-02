/**
 * Tests for Mock Auth Utilities
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AUTH_STORAGE_KEY,
  USERS_STORAGE_KEY,
  MOCK_USERS,
  DEMO_ACCOUNTS,
  getAllUsers,
  registerUser,
  authenticateUser,
  getSession,
  getCurrentUser,
  signOut,
  isAuthenticated,
  updateSessionUser,
} from '@/lib/auth/mock';

// Mock localStorage
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Mock Auth Utilities', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('MOCK_USERS', () => {
    it('contains 5 default users', () => {
      expect(MOCK_USERS).toHaveLength(5);
    });

    it('each user has required fields', () => {
      MOCK_USERS.forEach((user) => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('password');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('organizationId');
        expect(user).toHaveProperty('organizationName');
        expect(user).toHaveProperty('plan');
      });
    });

    it('includes all 5 roles', () => {
      const roles = MOCK_USERS.map((u) => u.role);
      expect(roles).toContain('admin');
      expect(roles).toContain('manager');
      expect(roles).toContain('developer');
      expect(roles).toContain('viewer');
      expect(roles).toContain('compliance');
    });
  });

  describe('DEMO_ACCOUNTS', () => {
    it('matches MOCK_USERS', () => {
      expect(DEMO_ACCOUNTS).toHaveLength(MOCK_USERS.length);
    });

    it('includes passwords for demo login', () => {
      DEMO_ACCOUNTS.forEach((account) => {
        expect(account).toHaveProperty('password');
      });
    });
  });

  describe('getAllUsers', () => {
    it('returns mock users when no custom users exist', () => {
      const users = getAllUsers();
      expect(users).toHaveLength(MOCK_USERS.length);
    });

    it('includes custom registered users', () => {
      const customUsers = [
        {
          id: 'custom_user',
          email: 'custom@example.com',
          password: 'pass123',
          name: 'Custom User',
          role: 'viewer' as const,
          organizationId: 'org_custom',
          organizationName: 'Custom Org',
          plan: 'free' as const,
          createdAt: new Date().toISOString(),
        },
      ];
      mockStorage[USERS_STORAGE_KEY] = JSON.stringify(customUsers);

      const users = getAllUsers();
      expect(users).toHaveLength(MOCK_USERS.length + 1);
    });
  });

  describe('registerUser', () => {
    it('successfully registers a new user', () => {
      const result = registerUser('newuser@test.com', 'password123', 'New User');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('newuser@test.com');
      expect(result.user?.name).toBe('New User');
      expect(result.user?.role).toBe('viewer'); // Default role
      expect(result.user?.plan).toBe('free'); // Default plan
    });

    it('returns error for duplicate email', () => {
      const result = registerUser('admin@acme.com', 'password', 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already registered');
    });

    it('stores new user in localStorage', () => {
      registerUser('stored@test.com', 'pass', 'Stored User');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        USERS_STORAGE_KEY,
        expect.any(String)
      );
    });
  });

  describe('authenticateUser', () => {
    it('successfully authenticates with correct credentials', () => {
      const result = authenticateUser('admin@acme.com', 'admin123');

      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.session?.user.email).toBe('admin@acme.com');
      expect(result.session?.token).toMatch(/^mock_/);
    });

    it('returns error for incorrect password', () => {
      const result = authenticateUser('admin@acme.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('returns error for non-existent email', () => {
      const result = authenticateUser('nonexistent@test.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('stores session in localStorage', () => {
      authenticateUser('admin@acme.com', 'admin123');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        AUTH_STORAGE_KEY,
        expect.any(String)
      );
    });

    it('session expires in 24 hours by default', () => {
      const result = authenticateUser('admin@acme.com', 'admin123');

      const expiresAt = new Date(result.session!.expiresAt);
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();
      const hours = diff / (1000 * 60 * 60);

      expect(hours).toBeCloseTo(24, 0);
    });

    it('session expires in 30 days with rememberMe', () => {
      const result = authenticateUser('admin@acme.com', 'admin123', true);

      const expiresAt = new Date(result.session!.expiresAt);
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();
      const days = diff / (1000 * 60 * 60 * 24);

      expect(days).toBeCloseTo(30, 0);
    });
  });

  describe('getSession', () => {
    it('returns null when no session exists', () => {
      const session = getSession();
      expect(session).toBeNull();
    });

    it('returns session when valid', () => {
      authenticateUser('admin@acme.com', 'admin123');
      const session = getSession();

      expect(session).not.toBeNull();
      expect(session?.user.email).toBe('admin@acme.com');
    });

    it('returns null for expired session', () => {
      const expiredSession = {
        user: MOCK_USERS[0],
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        token: 'mock_expired',
      };
      mockStorage[AUTH_STORAGE_KEY] = JSON.stringify(expiredSession);

      const session = getSession();
      expect(session).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('returns null when not authenticated', () => {
      const user = getCurrentUser();
      expect(user).toBeNull();
    });

    it('returns user when authenticated', () => {
      authenticateUser('dev@acme.com', 'dev123');
      const user = getCurrentUser();

      expect(user).not.toBeNull();
      expect(user?.email).toBe('dev@acme.com');
      expect(user?.role).toBe('developer');
    });
  });

  describe('signOut', () => {
    it('clears session from localStorage', () => {
      authenticateUser('admin@acme.com', 'admin123');
      signOut();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(AUTH_STORAGE_KEY);
    });

    it('makes isAuthenticated return false', () => {
      authenticateUser('admin@acme.com', 'admin123');
      expect(isAuthenticated()).toBe(true);

      signOut();
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('returns false when not authenticated', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('returns true when authenticated', () => {
      authenticateUser('admin@acme.com', 'admin123');
      expect(isAuthenticated()).toBe(true);
    });
  });

  describe('updateSessionUser', () => {
    it('returns false when no session exists', () => {
      const result = updateSessionUser('user_dev');
      expect(result).toBe(false);
    });

    it('updates session user successfully', () => {
      authenticateUser('admin@acme.com', 'admin123');
      const result = updateSessionUser('user_dev');

      expect(result).toBe(true);

      const session = getSession();
      expect(session?.user.id).toBe('user_dev');
      expect(session?.user.role).toBe('developer');
    });

    it('returns false for non-existent user', () => {
      authenticateUser('admin@acme.com', 'admin123');
      const result = updateSessionUser('nonexistent_user');

      expect(result).toBe(false);
    });
  });
});
