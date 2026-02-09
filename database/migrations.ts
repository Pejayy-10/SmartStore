/**
 * SmartStore Database Migrations
 * Schema versioning and migration logic
 *
 * Each migration should be reversible (up/down)
 * Migrations are run in order when upgrading
 */

export interface Migration {
  version: number;
  description: string;
  up: string; // SQL to apply migration
  down: string; // SQL to revert migration
}

/**
 * Get all migrations indexed by version number
 * Add new migrations here as the schema evolves
 */
export function getMigrations(): Record<number, Migration> {
  return {
    // Version 1 is the initial schema (defined in schema.ts)
    // Future migrations go here:
    // Example migration for version 2:
    // 2: {
    //   version: 2,
    //   description: 'Add employees table',
    //   up: `
    //     CREATE TABLE IF NOT EXISTS employees (
    //       id INTEGER PRIMARY KEY AUTOINCREMENT,
    //       name TEXT NOT NULL,
    //       role TEXT NOT NULL DEFAULT 'staff',
    //       wage_type TEXT NOT NULL DEFAULT 'daily',
    //       wage_amount REAL NOT NULL DEFAULT 0,
    //       pin_hash TEXT,
    //       created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    //       updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    //       is_active INTEGER NOT NULL DEFAULT 1
    //     );
    //   `,
    //   down: `DROP TABLE IF EXISTS employees;`
    // },
  };
}

/**
 * Validate migration chain
 * Ensures all versions are sequential and present
 */
export function validateMigrations(): boolean {
  const migrations = getMigrations();
  const versions = Object.keys(migrations)
    .map(Number)
    .sort((a, b) => a - b);

  for (let i = 0; i < versions.length; i++) {
    const expectedVersion = i + 2; // Starts at 2 since version 1 is initial schema
    if (versions[i] !== expectedVersion) {
      console.error(
        `Migration version mismatch: expected ${expectedVersion}, got ${versions[i]}`,
      );
      return false;
    }
  }

  return true;
}
