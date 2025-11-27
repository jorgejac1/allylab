import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface StorageOptions {
  filename: string;
  directory?: string;
}

export class JsonStorage<T extends { id: string }> {
  private filePath: string;
  private cache: Map<string, T> = new Map();
  private loaded = false;

  constructor(options: StorageOptions) {
    const dir = options.directory || join(process.cwd(), 'data');
    this.filePath = join(dir, options.filename);
    
    // Ensure directory exists
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  private load(): void {
    if (this.loaded) return;
    
    try {
      if (existsSync(this.filePath)) {
        const data = readFileSync(this.filePath, 'utf-8');
        const items: T[] = JSON.parse(data);
        this.cache = new Map(items.map(item => [item.id, item]));
      }
    } catch (error) {
      console.error(`[Storage] Failed to load ${this.filePath}:`, error);
      this.cache = new Map();
    }
    
    this.loaded = true;
  }

  private save(): void {
    try {
      const items = Array.from(this.cache.values());
      writeFileSync(this.filePath, JSON.stringify(items, null, 2), 'utf-8');
    } catch (error) {
      console.error(`[Storage] Failed to save ${this.filePath}:`, error);
    }
  }

  get(id: string): T | undefined {
    this.load();
    return this.cache.get(id);
  }

  getAll(): T[] {
    this.load();
    return Array.from(this.cache.values());
  }

  set(id: string, item: T): void {
    this.load();
    this.cache.set(id, item);
    this.save();
  }

  delete(id: string): boolean {
    this.load();
    const deleted = this.cache.delete(id);
    if (deleted) {
      this.save();
    }
    return deleted;
  }

  has(id: string): boolean {
    this.load();
    return this.cache.has(id);
  }

  size(): number {
    this.load();
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
    this.save();
  }

  /**
   * Bulk import items, optionally replacing all existing data
   */
  import(items: T[], replace = false): number {
    this.load();
    
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
    
    this.save();
    return imported;
  }
}