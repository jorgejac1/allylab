/**
 * Tests for Custom Rules API
 */

import { describe, it, expect } from 'vitest';
import { GET, POST } from '@/app/api/rules/route';
import { NextRequest } from 'next/server';

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/rules', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Custom Rules API', () => {
  describe('GET /api/rules', () => {
    it('returns list of rules', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(data.data).toBeInstanceOf(Array);
    });

    it('returns rules with correct structure', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.data.length).toBeGreaterThan(0);
      const rule = data.data[0];
      expect(rule).toHaveProperty('id');
      expect(rule).toHaveProperty('name');
      expect(rule).toHaveProperty('description');
      expect(rule).toHaveProperty('selector');
      expect(rule).toHaveProperty('check');
      expect(rule).toHaveProperty('impact');
      expect(rule).toHaveProperty('tags');
      expect(rule).toHaveProperty('enabled');
      expect(rule).toHaveProperty('createdAt');
      expect(rule).toHaveProperty('updatedAt');
    });

    it('includes mock rules', async () => {
      const response = await GET();
      const data = await response.json();

      const ruleNames = data.data.map((r: { name: string }) => r.name);
      expect(ruleNames).toContain('Brand Color Contrast');
      expect(ruleNames).toContain('Product Image Alt');
    });
  });

  describe('POST /api/rules', () => {
    it('returns 400 when name is missing', async () => {
      const request = createRequest({
        selector: '.test',
        check: 'has-alt',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name, selector, and check are required');
    });

    it('returns 400 when selector is missing', async () => {
      const request = createRequest({
        name: 'Test Rule',
        check: 'has-alt',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name, selector, and check are required');
    });

    it('returns 400 when check is missing', async () => {
      const request = createRequest({
        name: 'Test Rule',
        selector: '.test',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name, selector, and check are required');
    });

    it('creates a rule with minimum fields', async () => {
      const request = createRequest({
        name: 'Test Rule',
        selector: '.test-element',
        check: 'has-alt',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data.name).toBe('Test Rule');
      expect(data.selector).toBe('.test-element');
      expect(data.check).toBe('has-alt');
      expect(data.impact).toBe('moderate'); // default
      expect(data.enabled).toBe(true); // default
    });

    it('creates a rule with all fields', async () => {
      const request = createRequest({
        name: 'Full Test Rule',
        description: 'A complete test rule',
        selector: 'img.hero',
        check: 'alt-length > 5',
        impact: 'critical',
        tags: ['wcag2a', 'images'],
        enabled: false,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('Full Test Rule');
      expect(data.description).toBe('A complete test rule');
      expect(data.selector).toBe('img.hero');
      expect(data.check).toBe('alt-length > 5');
      expect(data.impact).toBe('critical');
      expect(data.tags).toEqual(['wcag2a', 'images']);
      expect(data.enabled).toBe(false);
    });

    it('generates unique IDs', async () => {
      const request1 = createRequest({
        name: 'Rule 1',
        selector: '.a',
        check: 'check-a',
      });

      const response1 = await POST(request1);
      const data1 = await response1.json();

      // Add a small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 5));

      const request2 = createRequest({
        name: 'Rule 2',
        selector: '.b',
        check: 'check-b',
      });

      const response2 = await POST(request2);
      const data2 = await response2.json();

      expect(data1.id).not.toBe(data2.id);
    });

    it('sets timestamps', async () => {
      const before = new Date();
      const request = createRequest({
        name: 'Timestamp Rule',
        selector: '.ts',
        check: 'check',
      });
      const response = await POST(request);
      const data = await response.json();
      const after = new Date();

      const createdAt = new Date(data.createdAt);
      const updatedAt = new Date(data.updatedAt);

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(createdAt.getTime()).toBe(updatedAt.getTime());
    });
  });
});
