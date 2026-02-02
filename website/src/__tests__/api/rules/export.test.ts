/**
 * Tests for Custom Rules Export API
 */

import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/rules/export/route';

describe('Custom Rules Export API', () => {
  describe('GET /api/rules/export', () => {
    it('returns JSON file download response', async () => {
      const response = await GET();

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Content-Disposition')).toBe(
        'attachment; filename="allylab-rules.json"'
      );
    });

    it('returns export data with version', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('version', '1.0');
    });

    it('includes export timestamp', async () => {
      const before = new Date();
      const response = await GET();
      const data = await response.json();
      const after = new Date();

      expect(data).toHaveProperty('exportedAt');
      const exportedAt = new Date(data.exportedAt);
      expect(exportedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(exportedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('includes rules array', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('rules');
      expect(data.rules).toBeInstanceOf(Array);
      expect(data.rules.length).toBeGreaterThan(0);
    });

    it('exports rules without IDs', async () => {
      const response = await GET();
      const data = await response.json();

      data.rules.forEach((rule: Record<string, unknown>) => {
        expect(rule).not.toHaveProperty('id');
      });
    });

    it('exports rules with required fields', async () => {
      const response = await GET();
      const data = await response.json();

      data.rules.forEach((rule: Record<string, unknown>) => {
        expect(rule).toHaveProperty('name');
        expect(rule).toHaveProperty('selector');
        expect(rule).toHaveProperty('check');
        expect(rule).toHaveProperty('impact');
        expect(rule).toHaveProperty('tags');
        expect(rule).toHaveProperty('enabled');
      });
    });

    it('exports valid rule data', async () => {
      const response = await GET();
      const data = await response.json();

      const rule = data.rules[0];
      expect(typeof rule.name).toBe('string');
      expect(typeof rule.selector).toBe('string');
      expect(typeof rule.check).toBe('string');
      expect(['critical', 'serious', 'moderate', 'minor']).toContain(
        rule.impact
      );
      expect(rule.tags).toBeInstanceOf(Array);
      expect(typeof rule.enabled).toBe('boolean');
    });
  });
});
