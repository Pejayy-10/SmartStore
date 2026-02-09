/**
 * SmartStore Base Repository
 * Generic repository pattern for CRUD operations
 * Following PROJECT_RULES.md: All database access through data layer
 */

import type { BaseEntity } from "../../types";
import { getDatabase, toSQLiteDateTime } from "../database";

/**
 * Base repository with common CRUD operations
 * All entities use soft delete (is_active flag)
 */
export abstract class BaseRepository<T extends BaseEntity, TInput> {
  protected abstract tableName: string;

  /**
   * Get all active records
   */
  async getAll(): Promise<T[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<T>(
      `SELECT * FROM ${this.tableName} WHERE is_active = 1 ORDER BY created_at DESC`,
    );
    return result;
  }

  /**
   * Get a single record by ID
   */
  async getById(id: number): Promise<T | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<T>(
      `SELECT * FROM ${this.tableName} WHERE id = ? AND is_active = 1`,
      [id],
    );
    return result ?? null;
  }

  /**
   * Create a new record
   * Subclasses must implement to handle specific fields
   */
  abstract create(input: TInput): Promise<T>;

  /**
   * Update an existing record
   * Subclasses must implement to handle specific fields
   */
  abstract update(id: number, input: Partial<TInput>): Promise<T | null>;

  /**
   * Soft delete a record (sets is_active = 0)
   * Per PROJECT_RULES.md: Never delete records, use soft delete
   */
  async delete(id: number): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync(
      `UPDATE ${this.tableName} SET is_active = 0, updated_at = ? WHERE id = ? AND is_active = 1`,
      [toSQLiteDateTime(), id],
    );
    return result.changes > 0;
  }

  /**
   * Restore a soft-deleted record
   */
  async restore(id: number): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync(
      `UPDATE ${this.tableName} SET is_active = 1, updated_at = ? WHERE id = ?`,
      [toSQLiteDateTime(), id],
    );
    return result.changes > 0;
  }

  /**
   * Count all active records
   */
  async count(): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE is_active = 1`,
    );
    return result?.count ?? 0;
  }

  /**
   * Check if a record exists
   */
  async exists(id: number): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE id = ? AND is_active = 1`,
      [id],
    );
    return (result?.count ?? 0) > 0;
  }

  /**
   * Search records by a field value
   */
  protected async findBy<K extends keyof T>(
    field: K,
    value: T[K],
  ): Promise<T[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<T>(
      `SELECT * FROM ${this.tableName} WHERE ${String(field)} = ? AND is_active = 1`,
      [value as string | number],
    );
    return result;
  }

  /**
   * Search records with LIKE pattern
   */
  protected async searchByName(name: string): Promise<T[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<T>(
      `SELECT * FROM ${this.tableName} WHERE name LIKE ? AND is_active = 1 ORDER BY name`,
      [`%${name}%`],
    );
    return result;
  }
}
