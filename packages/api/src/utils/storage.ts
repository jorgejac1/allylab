import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { join } from 'path';
import { storageLogger } from './logger.js';
import type { IStorage, IEntity, QueryOptions, QueryResult } from '../interfaces/storage.js';

export interface StorageOptions {
  filename: string;
  directory?: string;
  /** Debounce writes by this many milliseconds (default: 100) */
  writeDebounce?: number;
}

/**
 * Async JSON storage with in-memory caching and write debouncing
 *
 * Implements IStorage interface for easy migration to database backends.
 * This is the current file-based implementation that can be replaced with
 * SQLite or PostgreSQL implementations in the future.
 *
 * @see IStorage for the interface contract
 * @see interfaces/storage.ts for migration documentation
 */
export class JsonStorage<T extends IEntity> implements IStorage<T> {
  private filePath: string;
  private cache: Map<string, T> = new Map();
  private loadPromise: Promise<void> | null = null;
  private loaded = false;
  private dirty = false;
  private writeDebounce: number;
  private writeTimer: NodeJS.Timeout | null = null;
  private writePromise: Promise<void> | null = null;

  constructor(options: StorageOptions) {
    const dir = options.directory || join(process.cwd(), 'data');
    this.filePath = join(dir, options.filename);
    this.writeDebounce = options.writeDebounce ?? 100;

    // Ensure directory exists (async, won't block)
    this.ensureDir(dir);
  }

  private async ensureDir(dir: string): Promise<void> {
    try {
      await access(dir);
    } catch {
      await mkdir(dir, { recursive: true });
    }
  }

  private async load(): Promise<void> {
    if (this.loaded) return;

    // Prevent concurrent loads
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.doLoad();
    await this.loadPromise;
  }

  private async doLoad(): Promise<void> {
    try {
      const data = await readFile(this.filePath, 'utf-8');
      const items: T[] = JSON.parse(data);
      this.cache = new Map(items.map(item => [item.id, item]));
    } catch (error) {
      // File doesn't exist or is invalid - start with empty cache
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        storageLogger.error({ msg: 'Failed to load storage', path: this.filePath, err: error });
      }
      this.cache = new Map();
    }

    this.loaded = true;
    this.loadPromise = null;
  }

  private scheduleSave(): void {
    this.dirty = true;

    // Clear existing timer
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
    }

    // Debounce writes
    this.writeTimer = setTimeout(() => {
      this.flush();
    }, this.writeDebounce);
  }

  /**
   * Flush pending writes to disk immediately
   */
  async flush(): Promise<void> {
    if (!this.dirty) return;

    // Wait for any in-progress write
    if (this.writePromise) {
      await this.writePromise;
    }

    // Clear timer if pending
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }

    this.dirty = false;
    this.writePromise = this.doSave();

    try {
      await this.writePromise;
    } finally {
      this.writePromise = null;
    }
  }

  private async doSave(): Promise<void> {
    try {
      const items = Array.from(this.cache.values());
      await writeFile(this.filePath, JSON.stringify(items, null, 2), 'utf-8');
    } catch (error) {
      storageLogger.error({ msg: 'Failed to save storage', path: this.filePath, err: error });
    }
  }

  async get(id: string): Promise<T | undefined> {
    await this.load();
    return this.cache.get(id);
  }

  async getAll(): Promise<T[]> {
    await this.load();
    return Array.from(this.cache.values());
  }

  async set(id: string, item: T): Promise<void> {
    await this.load();
    this.cache.set(id, item);
    this.scheduleSave();
  }

  async delete(id: string): Promise<boolean> {
    await this.load();
    const deleted = this.cache.delete(id);
    if (deleted) {
      this.scheduleSave();
    }
    return deleted;
  }

  async has(id: string): Promise<boolean> {
    await this.load();
    return this.cache.has(id);
  }

  async size(): Promise<number> {
    await this.load();
    return this.cache.size;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.loaded = true; // Mark as loaded so we don't try to load old data
    this.scheduleSave();
  }

  /**
   * Bulk import items, optionally replacing all existing data
   */
  async import(items: T[], replace = false): Promise<number> {
    await this.load();

    if (replace) {
      this.cache.clear();
    }

    let imported = 0;
    for (const item of items) {
      if (item.id) {
        this.cache.set(item.id, item);
        imported++;
      }
    }

    this.scheduleSave();
    return imported;
  }

  /**
   * Query items with filtering and pagination
   */
  async query(options: QueryOptions<T> = {}): Promise<QueryResult<T>> {
    await this.load();

    let items = Array.from(this.cache.values());

    // Apply filter
    if (options.filter) {
      items = items.filter(options.filter);
    }

    const total = items.length;

    // Apply sort
    if (options.sort) {
      items.sort(options.sort);
    }

    // Apply pagination
    const offset = options.offset ?? 0;
    const limit = options.limit ?? items.length;
    items = items.slice(offset, offset + limit);

    return {
      items,
      total,
      hasMore: offset + items.length < total,
    };
  }

  /**
   * Count items, optionally filtered
   */
  async count(filter?: (item: T) => boolean): Promise<number> {
    await this.load();

    if (filter) {
      let count = 0;
      for (const item of this.cache.values()) {
        if (filter(item)) count++;
      }
      return count;
    }

    return this.cache.size;
  }

  /**
   * Close the storage (flush pending writes and cleanup)
   */
  async close(): Promise<void> {
    // Clear any pending write timer
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }

    // Flush any pending changes
    await this.flush();

    // Clear the cache
    this.cache.clear();
    this.loaded = false;
  }
}