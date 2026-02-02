/**
 * Tests for Scan JSON API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/scan/json/route';
import { NextRequest } from 'next/server';

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/scan/json', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Scan JSON API', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('POST /api/scan/json', () => {
    it('returns 400 when URL is missing', async () => {
      const request = createRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('URL is required');
    });

    it('returns 400 for invalid URL', async () => {
      const request = createRequest({ url: 'not-a-valid-url' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid URL');
    });

    it('returns scan results for valid URL', async () => {
      const request = createRequest({ url: 'https://example.com' });
      const responsePromise = POST(request);

      // Fast-forward through the simulated delay
      await vi.advanceTimersByTimeAsync(3000);

      const response = await responsePromise;
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('url', 'https://example.com');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('score');
      expect(data).toHaveProperty('totalIssues');
      expect(data).toHaveProperty('critical');
      expect(data).toHaveProperty('serious');
      expect(data).toHaveProperty('moderate');
      expect(data).toHaveProperty('minor');
      expect(data).toHaveProperty('findings');
      expect(data).toHaveProperty('scanDuration');
      expect(data).toHaveProperty('viewport');
    });

    it('includes findings in the response', async () => {
      const request = createRequest({ url: 'https://example.com' });
      const responsePromise = POST(request);

      await vi.advanceTimersByTimeAsync(3000);

      const response = await responsePromise;
      const data = await response.json();

      expect(data.findings).toBeInstanceOf(Array);
      expect(data.findings.length).toBeGreaterThanOrEqual(4);
      expect(data.findings.length).toBeLessThanOrEqual(8);

      // Check finding structure
      const finding = data.findings[0];
      expect(finding).toHaveProperty('id');
      expect(finding).toHaveProperty('ruleId');
      expect(finding).toHaveProperty('ruleTitle');
      expect(finding).toHaveProperty('description');
      expect(finding).toHaveProperty('impact');
      expect(finding).toHaveProperty('selector');
      expect(finding).toHaveProperty('html');
      expect(finding).toHaveProperty('helpUrl');
      expect(finding).toHaveProperty('wcagTags');
      expect(finding).toHaveProperty('page', 'https://example.com');
    });

    it('calculates score based on findings', async () => {
      const request = createRequest({ url: 'https://example.com' });
      const responsePromise = POST(request);

      await vi.advanceTimersByTimeAsync(3000);

      const response = await responsePromise;
      const data = await response.json();

      // Score should be between 0 and 100
      expect(data.score).toBeGreaterThanOrEqual(0);
      expect(data.score).toBeLessThanOrEqual(100);

      // Total issues should match sum of severity counts
      expect(data.totalIssues).toBe(
        data.critical + data.serious + data.moderate + data.minor
      );
    });

    it('uses custom viewport when provided', async () => {
      const request = createRequest({
        url: 'https://example.com',
        viewport: { width: 375, height: 667 },
      });
      const responsePromise = POST(request);

      await vi.advanceTimersByTimeAsync(3000);

      const response = await responsePromise;
      const data = await response.json();

      expect(data.viewport).toEqual({ width: 375, height: 667 });
    });

    it('uses default viewport when not provided', async () => {
      const request = createRequest({ url: 'https://example.com' });
      const responsePromise = POST(request);

      await vi.advanceTimersByTimeAsync(3000);

      const response = await responsePromise;
      const data = await response.json();

      expect(data.viewport).toEqual({ width: 1920, height: 1080 });
    });

    it('generates unique scan IDs', async () => {
      const request1 = createRequest({ url: 'https://example.com' });
      const request2 = createRequest({ url: 'https://example.com' });

      const responsePromise1 = POST(request1);
      await vi.advanceTimersByTimeAsync(3000);
      const response1 = await responsePromise1;
      const data1 = await response1.json();

      await vi.advanceTimersByTimeAsync(100);

      const responsePromise2 = POST(request2);
      await vi.advanceTimersByTimeAsync(3000);
      const response2 = await responsePromise2;
      const data2 = await response2.json();

      expect(data1.id).not.toBe(data2.id);
    });
  });
});
