/**
 * Tests for GitHub Pull Request API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from '@/app/api/github/pr/route';
import { NextRequest } from 'next/server';

function createPostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/github/pr', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createGetRequest(params: Record<string, string>): NextRequest {
  const url = new URL('http://localhost:3000/api/github/pr');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url, { method: 'GET' });
}

describe('GitHub PR API', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('POST /api/github/pr', () => {
    it('returns 400 when repository is missing', async () => {
      const request = createPostRequest({
        title: 'Fix accessibility issues',
        files: [{ path: 'src/app.tsx', content: 'const x = 1;' }],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Repository is required');
    });

    it('returns 400 when title is missing', async () => {
      const request = createPostRequest({
        repo: 'demo-user/my-website',
        files: [{ path: 'src/app.tsx', content: 'const x = 1;' }],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('PR title is required');
    });

    it('returns 400 when files are missing', async () => {
      const request = createPostRequest({
        repo: 'demo-user/my-website',
        title: 'Fix accessibility issues',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('At least one file is required');
    });

    it('returns 400 when files array is empty', async () => {
      const request = createPostRequest({
        repo: 'demo-user/my-website',
        title: 'Fix accessibility issues',
        files: [],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('At least one file is required');
    });

    it('creates a PR successfully', async () => {
      const request = createPostRequest({
        repo: 'demo-user/my-website',
        title: 'Fix accessibility issues',
        body: 'This PR fixes color contrast issues',
        branch: 'fix/accessibility',
        files: [
          { path: 'src/App.tsx', content: 'const color = "#000";' },
          { path: 'src/styles.css', content: '.text { color: #333; }' },
        ],
      });
      const responsePromise = POST(request);

      await vi.advanceTimersByTimeAsync(2000);

      const response = await responsePromise;
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('number');
      expect(data).toHaveProperty('url');
      expect(data).toHaveProperty('html_url');
      expect(data.title).toBe('Fix accessibility issues');
      expect(data.state).toBe('open');
    });

    it('uses custom base branch when provided', async () => {
      const request = createPostRequest({
        repo: 'demo-user/my-website',
        title: 'Fix accessibility issues',
        branch: 'fix/accessibility',
        baseBranch: 'develop',
        files: [{ path: 'src/App.tsx', content: 'const x = 1;' }],
      });
      const responsePromise = POST(request);

      await vi.advanceTimersByTimeAsync(2000);

      const response = await responsePromise;
      const data = await response.json();

      expect(data.base.ref).toBe('develop');
    });

    it('defaults to main as base branch', async () => {
      const request = createPostRequest({
        repo: 'demo-user/my-website',
        title: 'Fix accessibility issues',
        branch: 'fix/accessibility',
        files: [{ path: 'src/App.tsx', content: 'const x = 1;' }],
      });
      const responsePromise = POST(request);

      await vi.advanceTimersByTimeAsync(2000);

      const response = await responsePromise;
      const data = await response.json();

      expect(data.base.ref).toBe('main');
    });

    it('includes file change counts', async () => {
      const request = createPostRequest({
        repo: 'demo-user/my-website',
        title: 'Fix accessibility issues',
        branch: 'fix/accessibility',
        files: [
          { path: 'src/App.tsx', content: 'line1\nline2\nline3' },
          { path: 'src/index.tsx', content: 'line1\nline2' },
        ],
      });
      const responsePromise = POST(request);

      await vi.advanceTimersByTimeAsync(2000);

      const response = await responsePromise;
      const data = await response.json();

      expect(data.files_changed).toBe(2);
      expect(data.additions).toBe(5); // 3 + 2 lines
    });

    it('generates unique PR IDs', async () => {
      const request1 = createPostRequest({
        repo: 'demo-user/my-website',
        title: 'Fix 1',
        branch: 'fix/1',
        files: [{ path: 'a.txt', content: 'a' }],
      });
      const request2 = createPostRequest({
        repo: 'demo-user/my-website',
        title: 'Fix 2',
        branch: 'fix/2',
        files: [{ path: 'b.txt', content: 'b' }],
      });

      const responsePromise1 = POST(request1);
      await vi.advanceTimersByTimeAsync(2000);
      const response1 = await responsePromise1;
      const data1 = await response1.json();

      await vi.advanceTimersByTimeAsync(100);

      const responsePromise2 = POST(request2);
      await vi.advanceTimersByTimeAsync(2000);
      const response2 = await responsePromise2;
      const data2 = await response2.json();

      expect(data1.id).not.toBe(data2.id);
      expect(data1.number).not.toBe(data2.number);
    });
  });

  describe('GET /api/github/pr', () => {
    it('returns 400 when repo is missing', async () => {
      const request = createGetRequest({ number: '1' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Repository and PR number are required');
    });

    it('returns 400 when PR number is missing', async () => {
      const request = createGetRequest({ repo: 'demo-user/my-website' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Repository and PR number are required');
    });

    it('returns PR status', async () => {
      const request = createGetRequest({
        repo: 'demo-user/my-website',
        number: '1',
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.number).toBe(1);
      expect(data).toHaveProperty('url');
      expect(data).toHaveProperty('state');
      expect(data).toHaveProperty('merged');
      expect(data).toHaveProperty('mergeable');
      expect(data).toHaveProperty('checks');
    });

    it('returns check status information', async () => {
      const request = createGetRequest({
        repo: 'demo-user/my-website',
        number: '5',
      });
      const response = await GET(request);
      const data = await response.json();

      expect(data.checks).toHaveProperty('total');
      expect(data.checks).toHaveProperty('passed');
      expect(data.checks).toHaveProperty('failed');
      expect(data.checks).toHaveProperty('pending');
    });

    it('includes timestamps', async () => {
      const request = createGetRequest({
        repo: 'demo-user/my-website',
        number: '1',
      });
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty('created_at');
      expect(data).toHaveProperty('updated_at');
    });
  });
});
