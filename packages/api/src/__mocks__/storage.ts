import { vi } from 'vitest';

/**
 * In-memory mock storage for testing
 */
export class MockJsonStorage<T extends { id: string }> {
  private data: Map<string, T> = new Map();

  constructor(initialData: T[] = []) {
    initialData.forEach(item => this.data.set(item.id, item));
  }

  get(id: string): T | undefined {
    return this.data.get(id);
  }

  getAll(): T[] {
    return Array.from(this.data.values());
  }

  set(id: string, item: T): void {
    this.data.set(id, item);
  }

  delete(id: string): boolean {
    return this.data.delete(id);
  }

  has(id: string): boolean {
    return this.data.has(id);
  }

  size(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  import(items: T[], replace = false): number {
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