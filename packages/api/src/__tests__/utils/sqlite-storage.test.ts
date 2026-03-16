import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteStorage } from '../../utils/sqlite-storage';

interface TestItem {
  id: string;
  name: string;
  value: number;
}

describe('SQLiteStorage', () => {
  let storage: SQLiteStorage<TestItem>;

  beforeEach(() => {
    storage = new SQLiteStorage<TestItem>({ tableName: 'test_items', dbPath: ':memory:' });
  });

  afterEach(async () => {
    await storage.close();
  });

  // =========================================================================
  // CRUD operations
  // =========================================================================

  describe('set and get', () => {
    it('should store and retrieve an item', async () => {
      const item: TestItem = { id: '1', name: 'alpha', value: 10 };
      await storage.set('1', item);

      const result = await storage.get('1');
      expect(result).toEqual(item);
    });

    it('should return undefined for non-existent item', async () => {
      const result = await storage.get('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should overwrite an existing item', async () => {
      await storage.set('1', { id: '1', name: 'alpha', value: 10 });
      await storage.set('1', { id: '1', name: 'alpha-updated', value: 20 });

      const result = await storage.get('1');
      expect(result).toEqual({ id: '1', name: 'alpha-updated', value: 20 });
    });
  });

  describe('getAll', () => {
    it('should return all items', async () => {
      await storage.set('1', { id: '1', name: 'alpha', value: 10 });
      await storage.set('2', { id: '2', name: 'beta', value: 20 });
      await storage.set('3', { id: '3', name: 'gamma', value: 30 });

      const items = await storage.getAll();
      expect(items).toHaveLength(3);
      expect(items.map(i => i.id).sort()).toEqual(['1', '2', '3']);
    });

    it('should return empty array when no items', async () => {
      const items = await storage.getAll();
      expect(items).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete an existing item and return true', async () => {
      await storage.set('1', { id: '1', name: 'alpha', value: 10 });

      const deleted = await storage.delete('1');
      expect(deleted).toBe(true);

      const result = await storage.get('1');
      expect(result).toBeUndefined();
    });

    it('should return false when deleting non-existent item', async () => {
      const deleted = await storage.delete('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('has', () => {
    it('should return true for existing item', async () => {
      await storage.set('1', { id: '1', name: 'alpha', value: 10 });
      expect(await storage.has('1')).toBe(true);
    });

    it('should return false for non-existent item', async () => {
      expect(await storage.has('nonexistent')).toBe(false);
    });
  });

  // =========================================================================
  // Query
  // =========================================================================

  describe('query', () => {
    beforeEach(async () => {
      await storage.set('1', { id: '1', name: 'alpha', value: 10 });
      await storage.set('2', { id: '2', name: 'beta', value: 20 });
      await storage.set('3', { id: '3', name: 'gamma', value: 30 });
      await storage.set('4', { id: '4', name: 'delta', value: 40 });
      await storage.set('5', { id: '5', name: 'epsilon', value: 50 });
    });

    it('should return all items without options', async () => {
      const result = await storage.query({});
      expect(result.items).toHaveLength(5);
      expect(result.total).toBe(5);
      expect(result.hasMore).toBe(false);
    });

    it('should filter items', async () => {
      const result = await storage.query({
        filter: (item) => item.value > 25,
      });
      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.items.every(i => i.value > 25)).toBe(true);
    });

    it('should sort items', async () => {
      const result = await storage.query({
        sort: (a, b) => b.value - a.value,
      });
      expect(result.items[0].value).toBe(50);
      expect(result.items[4].value).toBe(10);
    });

    it('should paginate with limit', async () => {
      const result = await storage.query({
        sort: (a, b) => a.value - b.value,
        limit: 2,
      });
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.hasMore).toBe(true);
      expect(result.items[0].value).toBe(10);
      expect(result.items[1].value).toBe(20);
    });

    it('should paginate with limit and offset', async () => {
      const result = await storage.query({
        sort: (a, b) => a.value - b.value,
        limit: 2,
        offset: 2,
      });
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.hasMore).toBe(true);
      expect(result.items[0].value).toBe(30);
      expect(result.items[1].value).toBe(40);
    });

    it('should combine filter, sort, and pagination', async () => {
      const result = await storage.query({
        filter: (item) => item.value >= 20,
        sort: (a, b) => b.value - a.value,
        limit: 2,
        offset: 1,
      });
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(4);
      expect(result.hasMore).toBe(true);
      expect(result.items[0].value).toBe(40);
      expect(result.items[1].value).toBe(30);
    });
  });

  // =========================================================================
  // Count and Size
  // =========================================================================

  describe('count', () => {
    beforeEach(async () => {
      await storage.set('1', { id: '1', name: 'alpha', value: 10 });
      await storage.set('2', { id: '2', name: 'beta', value: 20 });
      await storage.set('3', { id: '3', name: 'gamma', value: 30 });
    });

    it('should return total count without filter', async () => {
      expect(await storage.count()).toBe(3);
    });

    it('should return filtered count', async () => {
      expect(await storage.count((item) => item.value > 15)).toBe(2);
    });

    it('should return 0 for empty storage', async () => {
      await storage.clear();
      expect(await storage.count()).toBe(0);
    });
  });

  describe('size', () => {
    it('should return 0 for empty storage', async () => {
      expect(await storage.size()).toBe(0);
    });

    it('should return the number of items', async () => {
      await storage.set('1', { id: '1', name: 'alpha', value: 10 });
      await storage.set('2', { id: '2', name: 'beta', value: 20 });
      expect(await storage.size()).toBe(2);
    });

    it('should update after delete', async () => {
      await storage.set('1', { id: '1', name: 'alpha', value: 10 });
      await storage.set('2', { id: '2', name: 'beta', value: 20 });
      await storage.delete('1');
      expect(await storage.size()).toBe(1);
    });
  });

  // =========================================================================
  // Import
  // =========================================================================

  describe('import', () => {
    it('should import items', async () => {
      const items: TestItem[] = [
        { id: '1', name: 'alpha', value: 10 },
        { id: '2', name: 'beta', value: 20 },
      ];

      const imported = await storage.import(items);
      expect(imported).toBe(2);
      expect(await storage.size()).toBe(2);
    });

    it('should append items when replace is false', async () => {
      await storage.set('existing', { id: 'existing', name: 'existing', value: 0 });

      const items: TestItem[] = [
        { id: '1', name: 'alpha', value: 10 },
        { id: '2', name: 'beta', value: 20 },
      ];

      await storage.import(items, false);
      expect(await storage.size()).toBe(3);

      const existing = await storage.get('existing');
      expect(existing).toBeDefined();
    });

    it('should replace all items when replace is true', async () => {
      await storage.set('existing', { id: 'existing', name: 'existing', value: 0 });

      const items: TestItem[] = [
        { id: '1', name: 'alpha', value: 10 },
        { id: '2', name: 'beta', value: 20 },
      ];

      await storage.import(items, true);
      expect(await storage.size()).toBe(2);

      const existing = await storage.get('existing');
      expect(existing).toBeUndefined();
    });

    it('should skip items without id', async () => {
      const items = [
        { id: '1', name: 'alpha', value: 10 },
        { id: '', name: 'no-id', value: 20 },
      ] as TestItem[];

      const imported = await storage.import(items);
      expect(imported).toBe(1);
    });
  });

  // =========================================================================
  // Clear
  // =========================================================================

  describe('clear', () => {
    it('should remove all items', async () => {
      await storage.set('1', { id: '1', name: 'alpha', value: 10 });
      await storage.set('2', { id: '2', name: 'beta', value: 20 });

      await storage.clear();

      expect(await storage.size()).toBe(0);
      expect(await storage.getAll()).toEqual([]);
    });
  });

  // =========================================================================
  // Flush and Close
  // =========================================================================

  describe('flush', () => {
    it('should be a no-op without errors', async () => {
      await storage.set('1', { id: '1', name: 'alpha', value: 10 });
      await expect(storage.flush()).resolves.toBeUndefined();
    });
  });

  describe('close', () => {
    it('should close the database connection', async () => {
      await storage.set('1', { id: '1', name: 'alpha', value: 10 });
      await storage.close();

      // After close, operations should throw
      await expect(storage.get('1')).rejects.toThrow();
    });
  });
});
