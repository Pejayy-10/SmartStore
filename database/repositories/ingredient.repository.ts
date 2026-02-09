/**
 * SmartStore Ingredient Repository
 * Data access layer for ingredients table
 */

import type { Ingredient, IngredientInput } from "../../types";
import { getDatabase, toSQLiteDateTime } from "../database";
import { BaseRepository } from "./base.repository";

export class IngredientRepository extends BaseRepository<
  Ingredient,
  IngredientInput
> {
  protected tableName = "ingredients";

  /**
   * Create a new ingredient
   */
  async create(input: IngredientInput): Promise<Ingredient> {
    const db = await getDatabase();
    const now = toSQLiteDateTime();

    const result = await db.runAsync(
      `INSERT INTO ingredients (
        name, description, cost_per_unit, unit_type, 
        quantity_in_stock, low_stock_threshold, supplier, 
        expiration_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.name,
        input.description ?? null,
        input.cost_per_unit,
        input.unit_type,
        input.quantity_in_stock,
        input.low_stock_threshold ?? 10,
        input.supplier ?? null,
        input.expiration_date ?? null,
        now,
        now,
      ],
    );

    return (await this.getById(result.lastInsertRowId))!;
  }

  /**
   * Update an existing ingredient
   */
  async update(
    id: number,
    input: Partial<IngredientInput>,
  ): Promise<Ingredient | null> {
    const db = await getDatabase();
    const existing = await this.getById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (input.name !== undefined) {
      updates.push("name = ?");
      values.push(input.name);
    }
    if (input.description !== undefined) {
      updates.push("description = ?");
      values.push(input.description);
    }
    if (input.cost_per_unit !== undefined) {
      updates.push("cost_per_unit = ?");
      values.push(input.cost_per_unit);
    }
    if (input.unit_type !== undefined) {
      updates.push("unit_type = ?");
      values.push(input.unit_type);
    }
    if (input.quantity_in_stock !== undefined) {
      updates.push("quantity_in_stock = ?");
      values.push(input.quantity_in_stock);
    }
    if (input.low_stock_threshold !== undefined) {
      updates.push("low_stock_threshold = ?");
      values.push(input.low_stock_threshold);
    }
    if (input.supplier !== undefined) {
      updates.push("supplier = ?");
      values.push(input.supplier);
    }
    if (input.expiration_date !== undefined) {
      updates.push("expiration_date = ?");
      values.push(input.expiration_date);
    }

    if (updates.length === 0) return existing;

    updates.push("updated_at = ?");
    values.push(toSQLiteDateTime());
    values.push(id);

    await db.runAsync(
      `UPDATE ingredients SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    return this.getById(id);
  }

  /**
   * Get ingredients with low stock
   */
  async getLowStock(): Promise<Ingredient[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<Ingredient>(
      `SELECT * FROM ingredients 
       WHERE quantity_in_stock <= low_stock_threshold 
       AND is_active = 1 
       ORDER BY quantity_in_stock ASC`,
    );
    return result;
  }

  /**
   * Search ingredients by name
   */
  async search(query: string): Promise<Ingredient[]> {
    return this.searchByName(query);
  }

  /**
   * Update stock quantity (used after sales or stock adjustments)
   */
  async updateStock(id: number, quantityChange: number): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync(
      `UPDATE ingredients 
       SET quantity_in_stock = quantity_in_stock + ?, updated_at = ? 
       WHERE id = ? AND is_active = 1`,
      [quantityChange, toSQLiteDateTime(), id],
    );
    return result.changes > 0;
  }

  /**
   * Get ingredients expiring soon (within days)
   */
  async getExpiringSoon(days: number = 7): Promise<Ingredient[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<Ingredient>(
      `SELECT * FROM ingredients 
       WHERE expiration_date IS NOT NULL 
       AND date(expiration_date) <= date('now', '+' || ? || ' days')
       AND is_active = 1 
       ORDER BY expiration_date ASC`,
      [days],
    );
    return result;
  }
}

// Export singleton instance
export const ingredientRepository = new IngredientRepository();
