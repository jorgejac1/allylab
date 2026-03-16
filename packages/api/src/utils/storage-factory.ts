import { JsonStorage } from './storage.js';
import { SQLiteStorage } from './sqlite-storage.js';
import type { IEntity, IStorage } from '../interfaces/storage.js';

/**
 * Create a storage instance based on the STORAGE_TYPE environment variable.
 *
 * Defaults to JSON file-based storage for backward compatibility.
 * Set STORAGE_TYPE=sqlite to use SQLite storage.
 *
 * @param config.tableName - Table name for SQLite / used to derive filename
 * @param config.filename - Explicit filename for JSON storage (overrides tableName-based default)
 * @param config.dbPath - Custom database path for SQLite storage
 */
export function createStorage<T extends IEntity>(config: {
  tableName: string;
  filename?: string;
  dbPath?: string;
}): IStorage<T> & { size(): Promise<number> } {
  const storageType = process.env.STORAGE_TYPE || 'json';

  if (storageType === 'sqlite') {
    return new SQLiteStorage<T>({ tableName: config.tableName, dbPath: config.dbPath });
  }

  // Default to JSON storage
  return new JsonStorage<T>({ filename: config.filename || `${config.tableName}.json` }) as IStorage<T> & { size(): Promise<number> };
}
