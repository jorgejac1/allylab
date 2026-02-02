/**
 * Tests for GitHub Connection API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST, DELETE } from '@/app/api/github/connection/route';
import { NextRequest } from 'next/server';

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/github/connection', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GitHub Connection API', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('GET /api/github/connection', () => {
    it('returns mock connection status', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.connected).toBe(true);
    });

    it('returns user information', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.user).toEqual({
        login: 'demo-user',
        avatar_url: 'https://avatars.githubusercontent.com/u/12345?v=4',
        name: 'Demo User',
      });
    });

    it('returns list of repositories', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.repos).toBeInstanceOf(Array);
      expect(data.repos.length).toBe(3);
      expect(data.repos[0]).toEqual({
        id: 1,
        name: 'my-website',
        full_name: 'demo-user/my-website',
        private: false,
      });
    });
  });

  describe('POST /api/github/connection', () => {
    it('returns 400 when token is missing', async () => {
      const request = createRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Token is required');
    });

    it('returns 400 for invalid token format', async () => {
      const request = createRequest({ token: 'invalid-token' });
      const responsePromise = POST(request);

      await vi.advanceTimersByTimeAsync(600);

      const response = await responsePromise;
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid token format');
    });

    it('accepts token starting with ghp_', async () => {
      const request = createRequest({ token: 'ghp_testtoken123' });
      const responsePromise = POST(request);

      await vi.advanceTimersByTimeAsync(600);

      const response = await responsePromise;
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.connected).toBe(true);
    });

    it('accepts token starting with github_pat_', async () => {
      const request = createRequest({ token: 'github_pat_testtoken123' });
      const responsePromise = POST(request);

      await vi.advanceTimersByTimeAsync(600);

      const response = await responsePromise;
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.connected).toBe(true);
    });

    it('returns user and repos on successful connection', async () => {
      const request = createRequest({ token: 'ghp_testtoken123' });
      const responsePromise = POST(request);

      await vi.advanceTimersByTimeAsync(600);

      const response = await responsePromise;
      const data = await response.json();

      expect(data.user).toHaveProperty('login');
      expect(data.repos).toBeInstanceOf(Array);
    });
  });

  describe('DELETE /api/github/connection', () => {
    it('disconnects the GitHub connection', async () => {
      const responsePromise = DELETE();

      await vi.advanceTimersByTimeAsync(400);

      const response = await responsePromise;
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.connected).toBe(false);
    });
  });
});
