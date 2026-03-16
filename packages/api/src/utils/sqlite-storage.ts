import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import type { IStorage, IEntity, QueryOptions, QueryResult } from '../interfaces/storage.js';

export interface SQLiteStorageOptions {
  tableName: string;
  dbPath?: string;
}

/**
 * SQLite-based storage implementation using better-sqlite3.
 *
 * Uses synchronous better-sqlite3 operations wrapped in async methods
 * to satisfy the IStorage interface contract.
 *
 * Features:
 * - WAL mode for better concurrent read performance
 * - Prepared statements for common operations
 * - JSON serialization of entity data
 * - Transaction support for bulk imports
 *
 * @see IStorage for the interface contract
 * @see interfaces/storage.ts for migration documentation
 */
export class SQLiteStorage<T extends IEntity> implements IStorage<T> {
  private db: Database.Database;
  private tableName: string;

  // Prepared statements
  private stmtGet: Database.Statement;
  private stmtGetAll: Database.Statement;
  private stmtSet: Database.Statement;
  private stmtDelete: Database.Statement;
  private stmtHas: Database.Statement;
  private stmtCount: Database.Statement;
  private stmtClear: Database.Statement;

  constructor(options: SQLiteStorageOptions) {
    // Validate table name to prevent SQL injection
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(options.tableName)) {
      throw new Error(`Invalid table name: "${options.tableName}". Must be alphanumeric with underscores.`);
    }
    this.tableName = options.tableName;
    const dbPath = options.dbPath || join(process.cwd(), 'data', 'allylab.db');

    // Ensure directory exists (skip for in-memory databases)
    if (dbPath !== ':memory:') {
      const dir = join(dbPath, '..');
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }

    this.db = new Database(dbPath);

    // Enable WAL mode for better performance
    this.db.pragma('journal_mode = WAL');

    // Create table if it doesn't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Prepare statements for common operations
    this.stmtGet = this.db.prepare(
      `SELECT data FROM ${this.tableName} WHERE id = ?`
    );
    this.stmtGetAll = this.db.prepare(
      `SELECT data FROM ${this.tableName}`
    );
    this.stmtSet = this.db.prepare(
      `INSERT OR REPLACE INTO ${this.tableName} (id, data, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    );
    this.stmtDelete = this.db.prepare(
      `DELETE FROM ${this.tableName} WHERE id = ?`
    );
    this.stmtHas = this.db.prepare(
      `SELECT 1 FROM ${this.tableName} WHERE id = ?`
    );
    this.stmtCount = this.db.prepare(
      `SELECT COUNT(*) as count FROM ${this.tableName}`
    );
    this.stmtClear = this.db.prepare(
      `DELETE FROM ${this.tableName}`
    );
  }

  async get(id: string): Promise<T | undefined> {
    const row = this.stmtGet.get(id) as { data: string } | undefined;
    if (!row) return undefined;
    return JSON.parse(row.data) as T;
  }

  async getAll(): Promise<T[]> {
    const rows = this.stmtGetAll.all() as { data: string }[];
    return rows.map(row => JSON.parse(row.data) as T);
  }

  async query(options: QueryOptions<T> = {}): Promise<QueryResult<T>> {
    // Get all items and apply filtering/sorting/pagination in JS
    // (matching JsonStorage behavior for compatibility)
    let items = await this.getAll();

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

  async set(id: string, item: T): Promise<void> {
    this.stmtSet.run(id, JSON.stringify(item));
  }

  async delete(id: string): Promise<boolean> {
    const result = this.stmtDelete.run(id);
    return result.changes > 0;
  }

  async has(id: string): Promise<boolean> {
    const row = this.stmtHas.get(id);
    return row !== undefined;
  }

  async count(filter?: (item: T) => boolean): Promise<number> {
    if (filter) {
      // With a filter, we need to load all items and count in JS
      const items = await this.getAll();
      let count = 0;
      for (const item of items) {
        if (filter(item)) count++;
      }
      return count;
    }

    const row = this.stmtCount.get() as { count: number };
    return row.count;
  }

  async size(): Promise<number> {
    const row = this.stmtCount.get() as { count: number };
    return row.count;
  }

  async clear(): Promise<void> {
    this.stmtClear.run();
  }

  async import(items: T[], replace = false): Promise<number> {
    const importTransaction = this.db.transaction((itemsToImport: T[]) => {
      if (replace) {
        this.stmtClear.run();
      }

      let imported = 0;
      for (const item of itemsToImport) {
        if (item.id) {
          this.stmtSet.run(item.id, JSON.stringify(item));
          imported++;
        }
      }
      return imported;
    });

    return importTransaction(items);
  }

  /**
   * No-op for SQLite — writes are immediate
   */
  async flush(): Promise<void> {
    // SQLite writes are immediate, no buffering needed
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    this.db.close();
  }
}
