/**
 * Tests for Custom Rules Test API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/rules/test/route';
import { NextRequest } from 'next/server';

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/rules/test', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Custom Rules Test API', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('POST /api/rules/test', () => {
    it('returns 400 when selector is missing', async () => {
      const request = createRequest({
        check: 'has-alt',
        url: 'https://example.com',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Selector, check, and URL are required');
    });

    it('returns 400 when check is missing', async () => {
      const request = createRequest({
        selector: 'img',
        url: 'https://example.com',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Selector, check, and URL are required');
    });

    it('returns 400 when URL is missing', async () => {
      const request = createRequest({
        selector: 'img',
        check: 'has-alt',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Selector, check, and URL are required');
    });

    it('returns 400 for invalid URL', async () => {
      const request = createRequest({
        selector: 'img',
        check: 'has-alt',
        url: 'not-a-valid-url',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid URL');
    });

    it('returns test results for valid request', async () => {
      const request = createRequest({
        selector: 'img.product',
        check: 'has-alt',
        url: 'https://example.com',
      });
      const responsePromise = POST(request);

      await vi.advanceTimersByTimeAsync(1100);

      const response = await responsePromise;
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('matchedElements');
      expect(data).toHaveProperty('passedElements');
      expect(data).toHaveProperty('failedElements');
      expect(data).toHaveProperty('samples');
    });

    it('returns element counts', async () => {
      const request = createRequest({
        selector: '.test',
        check: 'check',
        url: 'https://example.com',
      });
      const responsePromise = POST(request);

      await vi.advanceTimersByTimeAsync(1100);

      const response = await responsePromise;
      const data = await response.json();

      expect(data.matchedElements).toBeGreaterThanOrEqual(1);
      expect(data.passedElements + data.failedElements).toBe(
        data.matchedElements
      );
    });

    it('returns sample elements', async () => {
      const request = createRequest({
        selector: '.sample',
        check: 'check',
        url: 'https://example.com',
      });
      const responsePromise = POST(request);

      await vi.advanceTimersByTimeAsync(1100);

      const response = await responsePromise;
      const data = await response.json();

      expect(data.samples).toBeInstanceOf(Array);
      expect(data.samples.length).toBeGreaterThanOrEqual(1);

      const sample = data.samples[0];
      expect(sample).toHaveProperty('html');
      expect(sample).toHaveProperty('passed');
    });

    it('includes failure reason when element fails', async () => {
      const request = createRequest({
        selector: '.failed',
        check: 'color-contrast >= 4.5',
        url: 'https://example.com',
      });
      const responsePromise = POST(request);

      await vi.advanceTimersByTimeAsync(1100);

      const response = await responsePromise;
      const data = await response.json();

      // At least one sample should exist
      expect(data.samples.length).toBeGreaterThan(0);
      // Failed samples have a reason
      const failedSample = data.samples.find(
        (s: { passed: boolean }) => !s.passed
      );
      if (failedSample) {
        expect(failedSample).toHaveProperty('reason');
      }
    });
  });
});
