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
    2: {
      version: 2,
      description: "Add employees and expenses tables",
      up: `
        CREATE TABLE IF NOT EXISTS employees (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'cashier', 'staff')),
          wage_type TEXT NOT NULL DEFAULT 'daily' CHECK (wage_type IN ('hourly', 'daily', 'monthly')),
          wage_amount REAL NOT NULL DEFAULT 0,
          pin_hash TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          is_active INTEGER NOT NULL DEFAULT 1
        );

        CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);
        CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);

        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('rent', 'utilities', 'supplies', 'labor', 'other')),
          amount REAL NOT NULL DEFAULT 0,
          is_recurring INTEGER NOT NULL DEFAULT 0,
          recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'monthly') OR recurrence_type IS NULL),
          expense_date TEXT NOT NULL DEFAULT (date('now', 'localtime')),
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          is_active INTEGER NOT NULL DEFAULT 1
        );

        CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
        CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
        CREATE INDEX IF NOT EXISTS idx_expenses_active ON expenses(is_active);
      `,
      down: `
        DROP TABLE IF EXISTS expenses;
        DROP TABLE IF EXISTS employees;
      `,
    },
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
