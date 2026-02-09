/**
 * SmartStore Inventory Transaction Repository
 * Data access layer for inventory_transactions table
 */

import type {
    InventoryTransaction,
    InventoryTransactionInput,
    TransactionType,
} from "../../types";
import { getDatabase, toSQLiteDateTime, withTransaction } from "../database";
import { BaseRepository } from "./base.repository";
import { ingredientRepository } from "./ingredient.repository";

export class InventoryTransactionRepository extends BaseRepository<
  InventoryTransaction,
  InventoryTransactionInput
> {
  protected tableName = "inventory_transactions";

  /**
   * Create a new inventory transaction and update ingredient stock
   * Uses transaction for data integrity (per PROJECT_RULES.md)
   */
  async create(
    input: InventoryTransactionInput,
  ): Promise<InventoryTransaction> {
    return withTransaction(async (db) => {
      const now = toSQLiteDateTime();

      // Create the transaction record
      const result = await db.runAsync(
        `INSERT INTO inventory_transactions (
          ingredient_id, transaction_type, quantity, unit_cost,
          notes, reference_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.ingredient_id,
          input.transaction_type,
          input.quantity,
          input.unit_cost ?? null,
          input.notes ?? null,
          input.reference_id ?? null,
          now,
          now,
        ],
      );

      // Update ingredient stock based on transaction type
      const stockChange = this.calculateStockChange(
        input.transaction_type,
        input.quantity,
      );
      await ingredientRepository.updateStock(input.ingredient_id, stockChange);

      return (await this.getById(result.lastInsertRowId))!;
    });
  }

  /**
   * Update is not typically used for transactions (they're immutable)
   * But implementing for completeness
   */
  async update(
    id: number,
    input: Partial<InventoryTransactionInput>,
  ): Promise<InventoryTransaction | null> {
    const db = await getDatabase();
    const existing = await this.getById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (input.notes !== undefined) {
      updates.push("notes = ?");
      values.push(input.notes);
    }

    if (updates.length === 0) return existing;

    updates.push("updated_at = ?");
    values.push(toSQLiteDateTime());
    values.push(id);

    await db.runAsync(
      `UPDATE inventory_transactions SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    return this.getById(id);
  }

  /**
   * Get transactions for a specific ingredient
   */
  async getByIngredient(ingredientId: number): Promise<InventoryTransaction[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<InventoryTransaction>(
      `SELECT * FROM inventory_transactions 
       WHERE ingredient_id = ? AND is_active = 1 
       ORDER BY created_at DESC`,
      [ingredientId],
    );
    return result;
  }

  /**
   * Get transactions by type
   */
  async getByType(type: TransactionType): Promise<InventoryTransaction[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<InventoryTransaction>(
      `SELECT * FROM inventory_transactions 
       WHERE transaction_type = ? AND is_active = 1 
       ORDER BY created_at DESC`,
      [type],
    );
    return result;
  }

  /**
   * Get transactions within a date range
   */
  async getByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<InventoryTransaction[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<InventoryTransaction>(
      `SELECT * FROM inventory_transactions 
       WHERE date(created_at) >= date(?) AND date(created_at) <= date(?)
       AND is_active = 1 
       ORDER BY created_at DESC`,
      [startDate, endDate],
    );
    return result;
  }

  /**
   * Calculate stock change based on transaction type
   */
  private calculateStockChange(
    type: TransactionType,
    quantity: number,
  ): number {
    switch (type) {
      case "stock_in":
        return quantity; // Add to stock
      case "stock_out":
      case "sale":
        return -quantity; // Remove from stock
      case "adjustment":
        return quantity; // Can be positive or negative
      default:
        return 0;
    }
  }
}

// Export singleton instance
export const inventoryTransactionRepository =
  new InventoryTransactionRepository();
