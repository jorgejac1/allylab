/**
 * Migration script: JSON files -> SQLite database
 *
 * Reads all .json files from the data directory and imports each one
 * into a corresponding SQLite table. Table names are derived from
 * the JSON filenames (e.g., users.json -> users table).
 *
 * Usage:
 *   npx tsx src/scripts/migrate-json-to-sqlite.ts
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { SQLiteStorage } from '../utils/sqlite-storage.js';

interface EntityWithId {
  id: string;
  [key: string]: unknown;
}

async function migrate() {
  const dataDir = join(process.cwd(), 'data');

  console.log(`Reading JSON files from: ${dataDir}`);

  let files: string[];
  try {
    files = await readdir(dataDir);
  } catch {
    console.error(`Could not read data directory: ${dataDir}`);
    console.error('Make sure you run this script from the packages/api directory.');
    process.exit(1);
  }

  const jsonFiles = files.filter(f => f.endsWith('.json'));

  if (jsonFiles.length === 0) {
    console.log('No JSON files found in data directory. Nothing to migrate.');
    return;
  }

  console.log(`Found ${jsonFiles.length} JSON file(s): ${jsonFiles.join(', ')}`);

  for (const file of jsonFiles) {
    const tableName = file.replace('.json', '');
    const filePath = join(dataDir, file);

    try {
      const content = await readFile(filePath, 'utf-8');
      const items: unknown = JSON.parse(content);

      if (!Array.isArray(items)) {
        console.log(`Skipping ${file}: content is not an array`);
        continue;
      }

      // Filter to only items with an id field
      const validItems = items.filter(
        (item): item is EntityWithId =>
          typeof item === 'object' && item !== null && typeof (item as Record<string, unknown>).id === 'string'
      );

      if (validItems.length === 0) {
        console.log(`Skipping ${file}: no valid items with id field`);
        continue;
      }

      const storage = new SQLiteStorage<EntityWithId>({ tableName });
      await storage.import(validItems, true);
      console.log(`Migrated ${validItems.length} items to table: ${tableName}`);
      await storage.close();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error migrating ${file}: ${message}`);
    }
  }

  console.log('Migration complete!');
}

migrate().catch(console.error);
