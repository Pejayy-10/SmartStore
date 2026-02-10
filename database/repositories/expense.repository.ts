/**
 * SmartStore Expense Repository
 * Data access layer for expenses table
 */

import type { Expense, ExpenseInput } from "../../types";
import { getDatabase, toSQLiteDateTime } from "../database";
import { BaseRepository } from "./base.repository";

export class ExpenseRepository extends BaseRepository<Expense, ExpenseInput> {
  protected tableName = "expenses";

  /**
   * Create a new expense
   */
  async create(input: ExpenseInput): Promise<Expense> {
    const db = await getDatabase();
    const now = toSQLiteDateTime();
    const today = new Date().toISOString().split("T")[0];

    const result = await db.runAsync(
      `INSERT INTO expenses (
        name, category, amount, is_recurring, recurrence_type,
        expense_date, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.name,
        input.category,
        input.amount,
        input.is_recurring ? 1 : 0,
        input.recurrence_type ?? null,
        input.expense_date ?? today,
        input.notes ?? null,
        now,
        now,
      ],
    );

    return (await this.getById(result.lastInsertRowId))!;
  }

  /**
   * Update an existing expense
   */
  async update(
    id: number,
    input: Partial<ExpenseInput>,
  ): Promise<Expense | null> {
    const db = await getDatabase();
    const existing = await this.getById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (input.name !== undefined) {
      updates.push("name = ?");
      values.push(input.name);
    }
    if (input.category !== undefined) {
      updates.push("category = ?");
      values.push(input.category);
    }
    if (input.amount !== undefined) {
      updates.push("amount = ?");
      values.push(input.amount);
    }
    if (input.is_recurring !== undefined) {
      updates.push("is_recurring = ?");
      values.push(input.is_recurring ? 1 : 0);
    }
    if (input.recurrence_type !== undefined) {
      updates.push("recurrence_type = ?");
      values.push(input.recurrence_type ?? null);
    }
    if (input.expense_date !== undefined) {
      updates.push("expense_date = ?");
      values.push(input.expense_date);
    }
    if (input.notes !== undefined) {
      updates.push("notes = ?");
      values.push(input.notes ?? null);
    }

    if (updates.length === 0) return existing;

    updates.push("updated_at = ?");
    values.push(toSQLiteDateTime());
    values.push(id);

    await db.runAsync(
      `UPDATE expenses SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    return this.getById(id);
  }

  /**
   * Get expenses by date
   */
  async getByDate(date: string): Promise<Expense[]> {
    const db = await getDatabase();
    return db.getAllAsync<Expense>(
      `SELECT * FROM expenses
       WHERE expense_date = ? AND is_active = 1
       ORDER BY created_at DESC`,
      [date],
    );
  }

  /**
   * Get expenses by date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    const db = await getDatabase();
    return db.getAllAsync<Expense>(
      `SELECT * FROM expenses
       WHERE expense_date >= ? AND expense_date <= ? AND is_active = 1
       ORDER BY expense_date DESC, created_at DESC`,
      [startDate, endDate],
    );
  }

  /**
   * Get expenses by category
   */
  async getByCategory(category: string): Promise<Expense[]> {
    const db = await getDatabase();
    return db.getAllAsync<Expense>(
      `SELECT * FROM expenses
       WHERE category = ? AND is_active = 1
       ORDER BY expense_date DESC`,
      [category],
    );
  }

  /**
   * Get total expenses for a date
   */
  async getDailyTotal(date: string): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE expense_date = ? AND is_active = 1`,
      [date],
    );
    return result?.total ?? 0;
  }

  /**
   * Get expense breakdown by category for a date
   */
  async getCategoryBreakdown(
    date: string,
  ): Promise<{ category: string; total: number }[]> {
    const db = await getDatabase();
    return db.getAllAsync<{ category: string; total: number }>(
      `SELECT category, COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE expense_date = ? AND is_active = 1
       GROUP BY category
       ORDER BY total DESC`,
      [date],
    );
  }

  /**
   * Get recurring expenses (for auto-generation)
   */
  async getRecurringExpenses(): Promise<Expense[]> {
    const db = await getDatabase();
    return db.getAllAsync<Expense>(
      `SELECT * FROM expenses
       WHERE is_recurring = 1 AND is_active = 1
       ORDER BY name ASC`,
    );
  }
}

// Export singleton instance
export const expenseRepository = new ExpenseRepository();
