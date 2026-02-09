/**
 * SmartStore Database Initialization
 * Handles database connection and setup using expo-sqlite
 */

import * as SQLite from "expo-sqlite";
import { SCHEMA_SQL, SCHEMA_VERSION } from "./schema";

const DATABASE_NAME = "smartstore.db";

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get the database instance (singleton pattern)
 * Opens the database if not already open
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  // Enable foreign keys
  await db.execAsync("PRAGMA foreign_keys = ON;");

  return db;
}

/**
 * Initialize the database with schema
 * Should be called once on app startup
 */
export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();

  try {
    // Check current schema version
    const currentVersion = await getCurrentSchemaVersion(database);

    if (currentVersion === 0) {
      // Fresh install - create all tables
      console.log("[Database] Initializing fresh database...");
      await database.execAsync(SCHEMA_SQL);
      await setSchemaVersion(database, SCHEMA_VERSION);
      console.log(
        `[Database] Schema version ${SCHEMA_VERSION} initialized successfully`,
      );
    } else if (currentVersion < SCHEMA_VERSION) {
      // Need to run migrations
      console.log(
        `[Database] Migrating from version ${currentVersion} to ${SCHEMA_VERSION}...`,
      );
      await runMigrations(database, currentVersion, SCHEMA_VERSION);
      console.log("[Database] Migrations completed successfully");
    } else {
      console.log(
        `[Database] Schema is up to date (version ${currentVersion})`,
      );
    }
  } catch (error) {
    console.error("[Database] Initialization error:", error);
    throw error;
  }
}

/**
 * Get current schema version from database
 */
async function getCurrentSchemaVersion(
  database: SQLite.SQLiteDatabase,
): Promise<number> {
  try {
    // Check if schema_version table exists
    const result = await database.getFirstAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'`,
    );

    if (!result) {
      return 0; // No version table = fresh database
    }

    // Get the highest version number
    const versionResult = await database.getFirstAsync<{ version: number }>(
      `SELECT MAX(version) as version FROM schema_version`,
    );

    return versionResult?.version ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Set schema version after successful migration/initialization
 */
async function setSchemaVersion(
  database: SQLite.SQLiteDatabase,
  version: number,
): Promise<void> {
  await database.runAsync(`INSERT INTO schema_version (version) VALUES (?)`, [
    version,
  ]);
}

/**
 * Run migrations from one version to another
 * Migrations are defined in migrations.ts
 */
async function runMigrations(
  database: SQLite.SQLiteDatabase,
  fromVersion: number,
  toVersion: number,
): Promise<void> {
  const { getMigrations } = await import("./migrations");
  const migrations = getMigrations();

  for (let version = fromVersion + 1; version <= toVersion; version++) {
    const migration = migrations[version];

    if (!migration) {
      throw new Error(`Migration for version ${version} not found`);
    }

    console.log(`[Database] Running migration to version ${version}...`);

    // Run migration in a transaction
    await database.withTransactionAsync(async () => {
      await database.execAsync(migration.up);
      await setSchemaVersion(database, version);
    });
  }
}

/**
 * Close the database connection
 * Should be called on app exit or when cleaning up
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
    console.log("[Database] Connection closed");
  }
}

/**
 * Execute a query with transaction support
 * Use for multi-step write operations (per PROJECT_RULES.md)
 */
export async function withTransaction<T>(
  callback: (db: SQLite.SQLiteDatabase) => Promise<T>,
): Promise<T> {
  const database = await getDatabase();
  let result: T;

  await database.withTransactionAsync(async () => {
    result = await callback(database);
  });

  return result!;
}

/**
 * Utility to format Date to SQLite datetime string
 */
export function toSQLiteDateTime(date: Date = new Date()): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}
