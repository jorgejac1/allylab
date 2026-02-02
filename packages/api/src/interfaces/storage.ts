/**
 * Storage Interface
 *
 * Defines the contract for storage implementations, allowing easy swapping
 * between different backends (JSON files, SQLite, PostgreSQL, etc.)
 *
 * Migration Path:
 * 1. Current: JsonStorage (file-based with in-memory cache)
 * 2. Next: SQLiteStorage (embedded database)
 * 3. Scale: PostgresStorage (production database)
 *
 * To implement a new storage backend:
 * 1. Create a class that implements IStorage<T>
 * 2. Implement all methods according to the interface
 * 3. Replace the storage instance in the service that uses it
 */

/**
 * Base entity interface - all stored entities must have an ID
 */
export interface IEntity {
  id: string;
}

/**
 * Query options for filtering and pagination
 */
export interface QueryOptions<T> {
  /** Filter function to apply */
  filter?: (item: T) => boolean;
  /** Sort function to apply */
  sort?: (a: T, b: T) => number;
  /** Maximum number of items to return */
  limit?: number;
  /** Number of items to skip */
  offset?: number;
}

/**
 * Query result with pagination info
 */
export interface QueryResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

/**
 * Storage interface for CRUD operations
 */
export interface IStorage<T extends IEntity> {
  /**
   * Get a single item by ID
   */
  get(id: string): Promise<T | undefined>;

  /**
   * Get all items (with optional query options)
   */
  getAll(options?: QueryOptions<T>): Promise<T[]>;

  /**
   * Query items with filtering and pagination
   */
  query(options: QueryOptions<T>): Promise<QueryResult<T>>;

  /**
   * Create or update an item
   */
  set(id: string, item: T): Promise<void>;

  /**
   * Delete an item by ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check if an item exists
   */
  has(id: string): Promise<boolean>;

  /**
   * Get the total count of items
   */
  count(filter?: (item: T) => boolean): Promise<number>;

  /**
   * Clear all items
   */
  clear(): Promise<void>;

  /**
   * Bulk import items
   * @param items Items to import
   * @param replace If true, replace all existing items
   * @returns Number of items imported
   */
  import(items: T[], replace?: boolean): Promise<number>;

  /**
   * Flush any pending writes to the storage backend
   */
  flush(): Promise<void>;

  /**
   * Close the storage connection (for cleanup)
   */
  close(): Promise<void>;
}

/**
 * Storage factory type for creating storage instances
 */
export type StorageFactory<T extends IEntity> = (options: {
  name: string;
  [key: string]: unknown;
}) => IStorage<T>;

/**
 * Configuration for storage backends
 */
export interface StorageConfig {
  /** Storage type: 'json', 'sqlite', 'postgres' */
  type: 'json' | 'sqlite' | 'postgres';
  /** Connection string for database backends */
  connectionString?: string;
  /** Base directory for file-based storage */
  directory?: string;
  /** Additional options */
  options?: Record<string, unknown>;
}

/**
 * Migration helper types
 */
export interface MigrationContext {
  fromVersion: string;
  toVersion: string;
  storage: IStorage<IEntity>;
}

export type MigrationFn = (context: MigrationContext) => Promise<void>;

/**
 * Migration registry for schema versioning
 */
export interface Migration {
  version: string;
  description: string;
  up: MigrationFn;
  down: MigrationFn;
}
