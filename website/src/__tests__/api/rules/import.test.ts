/**
 * Tests for Custom Rules Import API
 */

import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/rules/import/route';
import { NextRequest } from 'next/server';

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/rules/import', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Custom Rules Import API', () => {
  describe('POST /api/rules/import', () => {
    it('returns 400 when rules array is missing', async () => {
      const request = createRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        'Invalid import format. Expected { rules: [...] }'
      );
    });

    it('returns 400 when rules is not an array', async () => {
      const request = createRequest({ rules: 'not-an-array' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        'Invalid import format. Expected { rules: [...] }'
      );
    });

    it('returns 400 when rules array is empty', async () => {
      const request = createRequest({ rules: [] });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No rules to import');
    });

    it('imports valid rules', async () => {
      const request = createRequest({
        rules: [
          {
            name: 'Test Rule',
            selector: '.test',
            check: 'has-alt',
          },
        ],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.imported).toBe(1);
      expect(data.skipped).toBe(0);
    });

    it('imports multiple valid rules', async () => {
      const request = createRequest({
        rules: [
          { name: 'Rule 1', selector: '.a', check: 'check-a' },
          { name: 'Rule 2', selector: '.b', check: 'check-b' },
          { name: 'Rule 3', selector: '.c', check: 'check-c' },
        ],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(data.imported).toBe(3);
      expect(data.rules).toHaveLength(3);
    });

    it('skips rules without name', async () => {
      const request = createRequest({
        rules: [
          { name: 'Valid', selector: '.a', check: 'check-a' },
          { selector: '.b', check: 'check-b' }, // missing name
        ],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(data.imported).toBe(1);
      expect(data.skipped).toBe(1);
      expect(data.errors).toContain('Rule 2: name is required');
    });

    it('skips rules without selector', async () => {
      const request = createRequest({
        rules: [
          { name: 'Valid', selector: '.a', check: 'check-a' },
          { name: 'Invalid', check: 'check-b' }, // missing selector
        ],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(data.imported).toBe(1);
      expect(data.skipped).toBe(1);
      expect(data.errors).toContain('Rule 2: selector is required');
    });

    it('skips rules without check', async () => {
      const request = createRequest({
        rules: [
          { name: 'Valid', selector: '.a', check: 'check-a' },
          { name: 'Invalid', selector: '.b' }, // missing check
        ],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(data.imported).toBe(1);
      expect(data.skipped).toBe(1);
      expect(data.errors).toContain('Rule 2: check is required');
    });

    it('returns 400 when all rules are invalid', async () => {
      const request = createRequest({
        rules: [
          { selector: '.a' }, // missing name and check
          { name: 'Test' }, // missing selector and check
        ],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No valid rules found');
      expect(data.details).toBeInstanceOf(Array);
    });

    it('generates IDs for imported rules', async () => {
      const request = createRequest({
        rules: [{ name: 'Test', selector: '.a', check: 'check' }],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(data.rules[0]).toHaveProperty('id');
      expect(data.rules[0].id).toMatch(/^rule-imported-/);
    });

    it('sets timestamps for imported rules', async () => {
      const request = createRequest({
        rules: [{ name: 'Test', selector: '.a', check: 'check' }],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(data.rules[0]).toHaveProperty('createdAt');
      expect(data.rules[0]).toHaveProperty('updatedAt');
    });

    it('uses default values for optional fields', async () => {
      const request = createRequest({
        rules: [{ name: 'Test', selector: '.a', check: 'check' }],
      });
      const response = await POST(request);
      const data = await response.json();

      const rule = data.rules[0];
      expect(rule.description).toBe('');
      expect(rule.impact).toBe('moderate');
      expect(rule.tags).toEqual([]);
      expect(rule.enabled).toBe(true);
    });

    it('preserves provided optional fields', async () => {
      const request = createRequest({
        rules: [
          {
            name: 'Test',
            description: 'Test description',
            selector: '.a',
            check: 'check',
            impact: 'critical',
            tags: ['wcag2a', 'test'],
            enabled: false,
          },
        ],
      });
      const response = await POST(request);
      const data = await response.json();

      const rule = data.rules[0];
      expect(rule.description).toBe('Test description');
      expect(rule.impact).toBe('critical');
      expect(rule.tags).toEqual(['wcag2a', 'test']);
      expect(rule.enabled).toBe(false);
    });

    it('accepts version field in import data', async () => {
      const request = createRequest({
        version: '1.0',
        rules: [{ name: 'Test', selector: '.a', check: 'check' }],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
