import { describe, it, expect } from 'vitest';
import {
  parsePaginationParams,
  paginate,
  getPaginationFromQuery,
} from '../../utils/pagination';

describe('utils/pagination', () => {
  describe('parsePaginationParams', () => {
    it('returns default values when no params provided', () => {
      const result = parsePaginationParams({});
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('handles null query', () => {
      const result = parsePaginationParams(null);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('handles undefined query', () => {
      const result = parsePaginationParams(undefined);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('parses limit parameter', () => {
      const result = parsePaginationParams({ limit: '10' });
      expect(result.limit).toBe(10);
    });

    it('caps limit at maxLimit', () => {
      const result = parsePaginationParams({ limit: '1000' }, { maxLimit: 50 });
      expect(result.limit).toBe(50);
    });

    it('uses custom defaultLimit', () => {
      const result = parsePaginationParams({}, { defaultLimit: 50 });
      expect(result.limit).toBe(50);
    });

    it('parses offset parameter', () => {
      const result = parsePaginationParams({ offset: '20' });
      expect(result.offset).toBe(20);
    });

    it('converts page to offset (1-indexed)', () => {
      const result = parsePaginationParams({ page: '3', limit: '10' });
      expect(result.offset).toBe(20); // (3-1) * 10
    });

    it('prefers offset over page when both provided', () => {
      const result = parsePaginationParams({ offset: '5', page: '3', limit: '10' });
      expect(result.offset).toBe(5);
    });

    it('handles invalid limit gracefully', () => {
      const result = parsePaginationParams({ limit: 'invalid' });
      expect(result.limit).toBe(20);
    });

    it('handles invalid offset gracefully', () => {
      const result = parsePaginationParams({ offset: 'invalid' });
      expect(result.offset).toBe(0);
    });

    it('handles negative limit', () => {
      const result = parsePaginationParams({ limit: '-5' });
      expect(result.limit).toBe(20);
    });

    it('handles negative offset', () => {
      const result = parsePaginationParams({ offset: '-10' });
      expect(result.offset).toBe(0);
    });

    it('handles page 0 (invalid)', () => {
      const result = parsePaginationParams({ page: '0' });
      expect(result.offset).toBe(0);
    });

    it('handles page 1', () => {
      const result = parsePaginationParams({ page: '1', limit: '10' });
      expect(result.offset).toBe(0);
    });
  });

  describe('paginate', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    it('returns first page of items', () => {
      const result = paginate(items, { limit: 3, offset: 0 });
      expect(result.items).toEqual([1, 2, 3]);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.hasMore).toBe(true);
    });

    it('returns second page of items', () => {
      const result = paginate(items, { limit: 3, offset: 3 });
      expect(result.items).toEqual([4, 5, 6]);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.hasMore).toBe(true);
    });

    it('returns last page with fewer items', () => {
      const result = paginate(items, { limit: 3, offset: 9 });
      expect(result.items).toEqual([10]);
      expect(result.pagination.page).toBe(4);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('returns empty array when offset exceeds total', () => {
      const result = paginate(items, { limit: 3, offset: 100 });
      expect(result.items).toEqual([]);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('calculates totalPages correctly', () => {
      const result = paginate(items, { limit: 3, offset: 0 });
      expect(result.pagination.totalPages).toBe(4); // 10 items / 3 per page = 4 pages
    });

    it('includes total count', () => {
      const result = paginate(items, { limit: 5, offset: 0 });
      expect(result.pagination.total).toBe(10);
    });

    it('handles empty array', () => {
      const result = paginate([], { limit: 10, offset: 0 });
      expect(result.items).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('handles limit larger than total items', () => {
      const result = paginate(items, { limit: 100, offset: 0 });
      expect(result.items).toEqual(items);
      expect(result.pagination.hasMore).toBe(false);
    });
  });

  describe('getPaginationFromQuery', () => {
    it('extracts pagination from query object', () => {
      const query = { limit: '5', offset: '10' };
      const result = getPaginationFromQuery(query);
      expect(result.limit).toBe(5);
      expect(result.offset).toBe(10);
    });

    it('passes options through', () => {
      const query = { limit: '200' };
      const result = getPaginationFromQuery(query, { maxLimit: 50 });
      expect(result.limit).toBe(50);
    });
  });
});
