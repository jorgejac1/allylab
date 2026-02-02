/**
 * GitLab Merge Request API Tests
 */

import { describe, it, expect } from 'vitest';
import { GET, POST } from '@/app/api/gitlab/mr/route';
import { NextRequest } from 'next/server';

describe('GitLab Merge Request API', () => {
  describe('POST /api/gitlab/mr', () => {
    it('creates a merge request successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/gitlab/mr', {
        method: 'POST',
        body: JSON.stringify({
          project: 'demo-user/my-website',
          title: 'Fix: Accessibility improvements',
          description: 'This MR fixes accessibility issues found by AllyLab',
          sourceBranch: 'fix/a11y-improvements',
          targetBranch: 'main',
          files: [
            { path: 'src/index.html', content: '<html lang="en">...</html>' },
          ],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('iid');
      expect(data).toHaveProperty('web_url');
      expect(data).toHaveProperty('state', 'opened');
    });

    it('requires project to be specified', async () => {
      const request = new NextRequest('http://localhost:3000/api/gitlab/mr', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Fix: Accessibility improvements',
          sourceBranch: 'fix/a11y-improvements',
          files: [{ path: 'src/index.html', content: 'content' }],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Project is required');
    });

    it('requires title to be specified', async () => {
      const request = new NextRequest('http://localhost:3000/api/gitlab/mr', {
        method: 'POST',
        body: JSON.stringify({
          project: 'demo-user/my-website',
          sourceBranch: 'fix/a11y-improvements',
          files: [{ path: 'src/index.html', content: 'content' }],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('MR title is required');
    });

    it('requires source branch to be specified', async () => {
      const request = new NextRequest('http://localhost:3000/api/gitlab/mr', {
        method: 'POST',
        body: JSON.stringify({
          project: 'demo-user/my-website',
          title: 'Fix: Accessibility improvements',
          files: [{ path: 'src/index.html', content: 'content' }],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Source branch is required');
    });

    it('requires at least one file to be specified', async () => {
      const request = new NextRequest('http://localhost:3000/api/gitlab/mr', {
        method: 'POST',
        body: JSON.stringify({
          project: 'demo-user/my-website',
          title: 'Fix: Accessibility improvements',
          sourceBranch: 'fix/a11y-improvements',
          files: [],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('At least one file is required');
    });

    it('defaults target branch to main', async () => {
      const request = new NextRequest('http://localhost:3000/api/gitlab/mr', {
        method: 'POST',
        body: JSON.stringify({
          project: 'demo-user/my-website',
          title: 'Fix: Accessibility improvements',
          sourceBranch: 'fix/a11y-improvements',
          files: [{ path: 'src/index.html', content: 'content' }],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.target_branch).toBe('main');
    });

    it('supports custom instance URL', async () => {
      const request = new NextRequest('http://localhost:3000/api/gitlab/mr', {
        method: 'POST',
        body: JSON.stringify({
          project: 'demo-user/my-website',
          title: 'Fix: Accessibility improvements',
          sourceBranch: 'fix/a11y-improvements',
          files: [{ path: 'src/index.html', content: 'content' }],
          instanceUrl: 'https://gitlab.mycompany.com',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.web_url).toContain('gitlab.mycompany.com');
    });

    it('includes MR metadata in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/gitlab/mr', {
        method: 'POST',
        body: JSON.stringify({
          project: 'demo-user/my-website',
          title: 'Fix: Accessibility improvements',
          description: 'Test description',
          sourceBranch: 'fix/a11y-improvements',
          files: [{ path: 'src/index.html', content: 'content' }],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('iid');
      expect(data).toHaveProperty('project_id');
      expect(data).toHaveProperty('author');
      expect(data).toHaveProperty('created_at');
      expect(data).toHaveProperty('merge_status');
      expect(data).toHaveProperty('has_conflicts');
      expect(data).toHaveProperty('diff_refs');
    });

    it('counts the changes correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/gitlab/mr', {
        method: 'POST',
        body: JSON.stringify({
          project: 'demo-user/my-website',
          title: 'Fix: Accessibility improvements',
          sourceBranch: 'fix/a11y-improvements',
          files: [
            { path: 'src/index.html', content: 'content1' },
            { path: 'src/page.html', content: 'content2' },
            { path: 'src/styles.css', content: 'content3' },
          ],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.changes_count).toBe('3');
    });
  });

  describe('GET /api/gitlab/mr', () => {
    it('returns MR status for valid project and IID', async () => {
      const url = new URL('http://localhost:3000/api/gitlab/mr');
      url.searchParams.set('project', 'demo-user/my-website');
      url.searchParams.set('iid', '123');

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('iid');
      expect(data).toHaveProperty('state');
      expect(data).toHaveProperty('web_url');
    });

    it('requires project to be specified', async () => {
      const url = new URL('http://localhost:3000/api/gitlab/mr');
      url.searchParams.set('iid', '123');

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Project and MR IID are required');
    });

    it('requires MR IID to be specified', async () => {
      const url = new URL('http://localhost:3000/api/gitlab/mr');
      url.searchParams.set('project', 'demo-user/my-website');

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Project and MR IID are required');
    });

    it('uses custom instance URL if provided', async () => {
      const url = new URL('http://localhost:3000/api/gitlab/mr');
      url.searchParams.set('project', 'demo-user/my-website');
      url.searchParams.set('iid', '123');
      url.searchParams.set('instanceUrl', 'https://gitlab.mycompany.com');

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.web_url).toContain('gitlab.mycompany.com');
    });

    it('returns pipeline information', async () => {
      const url = new URL('http://localhost:3000/api/gitlab/mr');
      url.searchParams.set('project', 'demo-user/my-website');
      url.searchParams.set('iid', '123');

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty('pipeline');
      expect(data.pipeline).toHaveProperty('id');
      expect(data.pipeline).toHaveProperty('status');
      expect(data.pipeline).toHaveProperty('web_url');
    });

    it('returns approval information', async () => {
      const url = new URL('http://localhost:3000/api/gitlab/mr');
      url.searchParams.set('project', 'demo-user/my-website');
      url.searchParams.set('iid', '123');

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty('approvals_required');
      expect(data).toHaveProperty('approvals_left');
    });
  });
});
