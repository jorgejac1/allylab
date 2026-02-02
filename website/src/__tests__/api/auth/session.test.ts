/**
 * Tests for Auth Session API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/auth/session/route';

describe('Auth Session API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('GET /api/auth/session', () => {
    it('returns demo session when Clerk is not configured', async () => {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(true);
      expect(data.mode).toBe('demo');
    });

    it('returns demo user in demo mode', async () => {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

      const response = await GET();
      const data = await response.json();

      expect(data.user).toEqual({
        id: 'user_demo',
        email: 'demo@allylab.com',
        name: 'Demo User',
        role: 'admin',
      });
    });

    it('returns demo organization in demo mode', async () => {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

      const response = await GET();
      const data = await response.json();

      expect(data.organization).toEqual({
        id: 'org_demo',
        name: 'Demo Organization',
        plan: 'team',
      });
    });

    it('includes dashboard URL in demo mode', async () => {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      process.env.NEXT_PUBLIC_DASHBOARD_URL = 'https://dashboard.example.com';

      const response = await GET();
      const data = await response.json();

      expect(data.dashboardUrl).toBe('https://dashboard.example.com');
    });

    it('uses default dashboard URL when not configured', async () => {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      delete process.env.NEXT_PUBLIC_DASHBOARD_URL;

      const response = await GET();
      const data = await response.json();

      expect(data.dashboardUrl).toBe('http://localhost:5173');
    });

    it('returns unauthenticated when Clerk is configured but user not logged in', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';

      const response = await GET();
      const data = await response.json();

      expect(data.authenticated).toBe(false);
      expect(data.loginUrl).toBe('/sign-in');
    });
  });
});
