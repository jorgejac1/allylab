/**
 * GitLab Connection API Tests
 */

import { describe, it, expect } from 'vitest';
import { GET, POST, DELETE } from '@/app/api/gitlab/connection/route';
import { NextRequest } from 'next/server';

describe('GitLab Connection API', () => {
  describe('GET /api/gitlab/connection', () => {
    it('returns current connection status', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('connected');
      expect(data).toHaveProperty('provider', 'gitlab');
    });

    it('includes user data when connected', async () => {
      const response = await GET();
      const data = await response.json();

      // Mock connection always returns connected state
      expect(data.connected).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user).toHaveProperty('id');
      expect(data.user).toHaveProperty('username');
      expect(data.user).toHaveProperty('name');
      expect(data.user).toHaveProperty('avatar_url');
    });

    it('includes projects list when connected', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.projects).toBeDefined();
      expect(Array.isArray(data.projects)).toBe(true);
      expect(data.projects.length).toBeGreaterThan(0);
      expect(data.projects[0]).toHaveProperty('id');
      expect(data.projects[0]).toHaveProperty('name');
      expect(data.projects[0]).toHaveProperty('path_with_namespace');
    });
  });

  describe('POST /api/gitlab/connection', () => {
    it('requires token to be provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/gitlab/connection', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Token is required');
    });

    it('validates GitLab token format (glpat- prefix)', async () => {
      const request = new NextRequest('http://localhost:3000/api/gitlab/connection', {
        method: 'POST',
        body: JSON.stringify({ token: 'glpat-validtokenformat12345' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.connected).toBe(true);
    });

    it('validates legacy token format', async () => {
      const request = new NextRequest('http://localhost:3000/api/gitlab/connection', {
        method: 'POST',
        body: JSON.stringify({ token: 'abcdefghij1234567890' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.connected).toBe(true);
    });

    it('rejects invalid token format', async () => {
      const request = new NextRequest('http://localhost:3000/api/gitlab/connection', {
        method: 'POST',
        body: JSON.stringify({ token: 'short' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid token format');
    });

    it('accepts custom instance URL', async () => {
      const request = new NextRequest('http://localhost:3000/api/gitlab/connection', {
        method: 'POST',
        body: JSON.stringify({
          token: 'glpat-validtokenformat12345',
          instanceUrl: 'https://gitlab.mycompany.com',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.instanceUrl).toBe('https://gitlab.mycompany.com');
    });

    it('validates instance URL format', async () => {
      const request = new NextRequest('http://localhost:3000/api/gitlab/connection', {
        method: 'POST',
        body: JSON.stringify({
          token: 'glpat-validtokenformat12345',
          instanceUrl: 'not-a-valid-url',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid GitLab instance URL');
    });

    it('defaults to gitlab.com if no instance URL provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/gitlab/connection', {
        method: 'POST',
        body: JSON.stringify({ token: 'glpat-validtokenformat12345' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.instanceUrl).toBe('https://gitlab.com');
    });

    it('returns user data on successful connection', async () => {
      const request = new NextRequest('http://localhost:3000/api/gitlab/connection', {
        method: 'POST',
        body: JSON.stringify({ token: 'glpat-validtokenformat12345' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.user).toBeDefined();
      expect(data.user.username).toBeDefined();
      expect(data.projects).toBeDefined();
    });
  });

  describe('DELETE /api/gitlab/connection', () => {
    it('disconnects the GitLab connection', async () => {
      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.connected).toBe(false);
    });
  });
});
