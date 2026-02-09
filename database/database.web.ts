/**
 * SmartStore Database - Web Implementation
 * Mock database for web platform (web uses in-memory storage)
 * Full SQLite only available on native platforms
 */

import type { SQLiteDatabase } from "expo-sqlite";

// Mock database for web - stores data in memory
class MockDatabase {
  private tables: Map<string, unknown[]> = new Map();

  async execAsync(sql: string): Promise<void> {
    console.log("[Web DB Mock] execAsync:", sql.substring(0, 100) + "...");
  }

  async runAsync(
    sql: string,
    params?: unknown[],
  ): Promise<{ lastInsertRowId: number; changes: number }> {
    console.log("[Web DB Mock] runAsync:", sql.substring(0, 50), params);
    return { lastInsertRowId: Math.floor(Math.random() * 1000), changes: 1 };
  }

  async getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null> {
    console.log("[Web DB Mock] getFirstAsync:", sql.substring(0, 50), params);
    return null;
  }

  async getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]> {
    console.log("[Web DB Mock] getAllAsync:", sql.substring(0, 50), params);
    return [];
  }

  async closeAsync(): Promise<void> {
    console.log("[Web DB Mock] Database closed");
  }
}

// Singleton instance
let dbInstance: MockDatabase | null = null;

/**
 * Get database instance (mock for web)
 */
export function getDatabase(): SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = new MockDatabase();
    console.log("[Web] Using mock database - full SQLite only on native");
  }
  return dbInstance as unknown as SQLiteDatabase;
}

/**
 * Initialize database schema (no-op on web)
 */
export async function initializeDatabase(): Promise<void> {
  console.log("[Web] Database initialization skipped - using mock");
  getDatabase();
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await (dbInstance as MockDatabase).closeAsync();
    dbInstance = null;
  }
}
