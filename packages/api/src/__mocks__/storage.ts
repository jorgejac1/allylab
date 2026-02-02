import { vi } from 'vitest';

/**
 * In-memory mock storage for testing (async interface)
 */
export class MockJsonStorage<T extends { id: string }> {
  private data: Map<string, T> = new Map();

  constructor(initialData: T[] = []) {
    initialData.forEach(item => this.data.set(item.id, item));
  }

  async get(id: string): Promise<T | undefined> {
    return this.data.get(id);
  }

  async getAll(): Promise<T[]> {
    return Array.from(this.data.values());
  }

  async set(id: string, item: T): Promise<void> {
    this.data.set(id, item);
  }

  async delete(id: string): Promise<boolean> {
    return this.data.delete(id);
  }

  async has(id: string): Promise<boolean> {
    return this.data.has(id);
  }

  async size(): Promise<number> {
    return this.data.size;
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  async flush(): Promise<void> {
    // No-op for mock
  }

  async import(items: T[], replace = false): Promise<number> {
    if (replace) {
      this.data.clear();
    }
    let imported = 0;
    for (const item of items) {
      if (item.id) {
        this.data.set(item.id, item);
        imported++;
      }
    }
    return imported;
  }
}

/**
 * Create a mock storage instance
 */
export function createMockStorage<T extends { id: string }>(initialData: T[] = []) {
  return new MockJsonStorage<T>(initialData);
}

/**
 * Mock the JsonStorage class
 */
export const mockJsonStorage = vi.fn().mockImplementation((_options) => {
  return new MockJsonStorage();
});