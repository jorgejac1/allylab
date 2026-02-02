/**
 * Tests for Individual Rule API
 */

import { describe, it, expect } from 'vitest';
import { GET, PUT, DELETE } from '@/app/api/rules/[id]/route';
import { NextRequest } from 'next/server';

function createGetRequest(id: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/rules/${id}`, {
    method: 'GET',
  });
}

function createPutRequest(id: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost:3000/api/rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createDeleteRequest(id: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/rules/${id}`, {
    method: 'DELETE',
  });
}

describe('Individual Rule API', () => {
  describe('GET /api/rules/[id]', () => {
    it('returns a rule by ID', async () => {
      const request = createGetRequest('rule-1');
      const response = await GET(request, {
        params: Promise.resolve({ id: 'rule-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('rule-1');
      expect(data.name).toBe('Brand Color Contrast');
    });

    it('returns 404 for non-existent rule', async () => {
      const request = createGetRequest('non-existent');
      const response = await GET(request, {
        params: Promise.resolve({ id: 'non-existent' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Rule not found');
    });

    it('returns complete rule data', async () => {
      const request = createGetRequest('rule-2');
      const response = await GET(request, {
        params: Promise.resolve({ id: 'rule-2' }),
      });
      const data = await response.json();

      expect(data).toHaveProperty('id', 'rule-2');
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('description');
      expect(data).toHaveProperty('selector');
      expect(data).toHaveProperty('check');
      expect(data).toHaveProperty('impact');
      expect(data).toHaveProperty('tags');
      expect(data).toHaveProperty('enabled');
      expect(data).toHaveProperty('createdAt');
      expect(data).toHaveProperty('updatedAt');
    });
  });

  describe('PUT /api/rules/[id]', () => {
    it('updates a rule partially', async () => {
      const request = createPutRequest('rule-1', { name: 'Updated Name' });
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'rule-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Updated Name');
      // Other fields should remain unchanged
      expect(data.selector).toBe('.brand-text, .brand-bg');
    });

    it('returns 404 for non-existent rule', async () => {
      const request = createPutRequest('non-existent', { name: 'Test' });
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'non-existent' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Rule not found');
    });

    it('updates multiple fields', async () => {
      const request = createPutRequest('rule-2', {
        name: 'New Name',
        description: 'New description',
        impact: 'minor',
        enabled: false,
      });
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'rule-2' }),
      });
      const data = await response.json();

      expect(data.name).toBe('New Name');
      expect(data.description).toBe('New description');
      expect(data.impact).toBe('minor');
      expect(data.enabled).toBe(false);
    });

    it('updates updatedAt timestamp', async () => {
      const request1 = createGetRequest('rule-1');
      const response1 = await GET(request1, {
        params: Promise.resolve({ id: 'rule-1' }),
      });
      const before = await response1.json();

      const request2 = createPutRequest('rule-1', { name: 'Trigger Update' });
      const response2 = await PUT(request2, {
        params: Promise.resolve({ id: 'rule-1' }),
      });
      const after = await response2.json();

      expect(new Date(after.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(before.updatedAt).getTime()
      );
    });

    it('updates selector and check', async () => {
      const request = createPutRequest('rule-1', {
        selector: '.new-selector',
        check: 'new-check',
      });
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'rule-1' }),
      });
      const data = await response.json();

      expect(data.selector).toBe('.new-selector');
      expect(data.check).toBe('new-check');
    });

    it('updates tags', async () => {
      const request = createPutRequest('rule-1', {
        tags: ['new-tag-1', 'new-tag-2'],
      });
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'rule-1' }),
      });
      const data = await response.json();

      expect(data.tags).toEqual(['new-tag-1', 'new-tag-2']);
    });
  });

  describe('DELETE /api/rules/[id]', () => {
    it('deletes a rule', async () => {
      const request = createDeleteRequest('rule-3');
      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'rule-3' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('returns 404 for non-existent rule', async () => {
      const request = createDeleteRequest('non-existent');
      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'non-existent' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Rule not found');
    });
  });
});
