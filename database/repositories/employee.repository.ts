/**
 * SmartStore Employee Repository
 * Data access layer for employees table
 */

import type { Employee, EmployeeInput } from "../../types";
import { getDatabase, toSQLiteDateTime } from "../database";
import { BaseRepository } from "./base.repository";

export class EmployeeRepository extends BaseRepository<
  Employee,
  EmployeeInput
> {
  protected tableName = "employees";

  /**
   * Create a new employee
   */
  async create(input: EmployeeInput): Promise<Employee> {
    const db = await getDatabase();
    const now = toSQLiteDateTime();

    const result = await db.runAsync(
      `INSERT INTO employees (
        name, role, wage_type, wage_amount, pin_hash, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.name,
        input.role ?? "staff",
        input.wage_type ?? "daily",
        input.wage_amount,
        input.pin_hash ?? null,
        now,
        now,
      ],
    );

    return (await this.getById(result.lastInsertRowId))!;
  }

  /**
   * Update an existing employee
   */
  async update(
    id: number,
    input: Partial<EmployeeInput>,
  ): Promise<Employee | null> {
    const db = await getDatabase();
    const existing = await this.getById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (input.name !== undefined) {
      updates.push("name = ?");
      values.push(input.name);
    }
    if (input.role !== undefined) {
      updates.push("role = ?");
      values.push(input.role);
    }
    if (input.wage_type !== undefined) {
      updates.push("wage_type = ?");
      values.push(input.wage_type);
    }
    if (input.wage_amount !== undefined) {
      updates.push("wage_amount = ?");
      values.push(input.wage_amount);
    }
    if (input.pin_hash !== undefined) {
      updates.push("pin_hash = ?");
      values.push(input.pin_hash ?? null);
    }

    if (updates.length === 0) return existing;

    updates.push("updated_at = ?");
    values.push(toSQLiteDateTime());
    values.push(id);

    await db.runAsync(
      `UPDATE employees SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    return this.getById(id);
  }

  /**
   * Get all active employees
   */
  async getActiveEmployees(): Promise<Employee[]> {
    const db = await getDatabase();
    return db.getAllAsync<Employee>(
      `SELECT * FROM employees WHERE is_active = 1 ORDER BY name ASC`,
    );
  }

  /**
   * Calculate daily labor cost for all active employees
   */
  async getDailyLaborCost(): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(
        CASE wage_type
          WHEN 'daily' THEN wage_amount
          WHEN 'hourly' THEN wage_amount * 8
          WHEN 'monthly' THEN wage_amount / 30
        END
      ), 0) as total
      FROM employees WHERE is_active = 1`,
    );
    return result?.total ?? 0;
  }
}

// Export singleton instance
export const employeeRepository = new EmployeeRepository();
