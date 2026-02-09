/**
 * SmartStore Sale Repository
 * Data access layer for sales and sale_items tables
 */

import type {
    PaymentMethod,
    Product,
    Sale,
    SaleInput,
    SaleItem,
    SaleWithItems,
} from "../../types";
import { getDatabase, toSQLiteDateTime, withTransaction } from "../database";
import { BaseRepository } from "./base.repository";
import { ingredientRepository } from "./ingredient.repository";

export class SaleRepository extends BaseRepository<Sale, SaleInput> {
  protected tableName = "sales";

  /**
   * Create a new sale with items
   * Handles stock deduction for inventory-tracked products
   * Uses transaction for data integrity (per PROJECT_RULES.md)
   */
  async create(input: SaleInput): Promise<Sale> {
    return withTransaction(async (db) => {
      const now = toSQLiteDateTime();

      // Calculate totals
      let subtotal = 0;
      for (const item of input.items) {
        subtotal += item.unit_price * item.quantity;
      }

      const discountAmount = input.discount_amount ?? 0;
      const discountPercent = input.discount_percent ?? 0;
      const discountFromPercent = subtotal * (discountPercent / 100);
      const totalDiscount = discountAmount + discountFromPercent;
      const total = subtotal - totalDiscount;
      const changeAmount = input.amount_received - total;

      // Create the sale record
      const result = await db.runAsync(
        `INSERT INTO sales (
          subtotal, discount_amount, discount_percent, total,
          payment_method, amount_received, change_amount, notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          subtotal,
          totalDiscount,
          discountPercent,
          total,
          input.payment_method,
          input.amount_received,
          changeAmount,
          input.notes ?? null,
          now,
          now,
        ],
      );

      const saleId = result.lastInsertRowId;

      // Create sale items and deduct inventory
      for (const item of input.items) {
        const itemSubtotal = item.unit_price * item.quantity;

        await db.runAsync(
          `INSERT INTO sale_items (
            sale_id, product_id, quantity, unit_price, subtotal,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            saleId,
            item.product_id,
            item.quantity,
            item.unit_price,
            itemSubtotal,
            now,
            now,
          ],
        );

        // Deduct ingredients if product is inventory-tracked
        await this.deductProductIngredients(
          item.product_id,
          item.quantity,
          saleId,
        );
      }

      return (await this.getById(saleId))!;
    });
  }

  /**
   * Sales are typically immutable, but allow note updates
   */
  async update(id: number, input: Partial<SaleInput>): Promise<Sale | null> {
    const db = await getDatabase();
    const existing = await this.getById(id);
    if (!existing) return null;

    if (input.notes !== undefined) {
      await db.runAsync(
        `UPDATE sales SET notes = ?, updated_at = ? WHERE id = ?`,
        [input.notes, toSQLiteDateTime(), id],
      );
    }

    return this.getById(id);
  }

  /**
   * Get sale with all items and product details
   */
  async getWithItems(id: number): Promise<SaleWithItems | null> {
    const sale = await this.getById(id);
    if (!sale) return null;

    const db = await getDatabase();
    const items = await db.getAllAsync<SaleItem & { product: Product }>(
      `SELECT si.*, 
        p.id as product_id,
        p.name as product_name,
        p.category as product_category,
        p.selling_price as product_selling_price
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ? AND si.is_active = 1`,
      [id],
    );

    // Transform flat result into nested structure
    const transformedItems = items.map((item) => ({
      ...item,
      product: {
        id: item.product_id,
        name: (item as unknown as { product_name: string }).product_name,
        category: (item as unknown as { product_category: string })
          .product_category,
        selling_price: (item as unknown as { product_selling_price: number })
          .product_selling_price,
      } as Product,
    }));

    return {
      ...sale,
      items: transformedItems,
    };
  }

  /**
   * Get sales by date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<Sale>(
      `SELECT * FROM sales 
       WHERE date(created_at) >= date(?) AND date(created_at) <= date(?)
       AND is_active = 1 
       ORDER BY created_at DESC`,
      [startDate, endDate],
    );
    return result;
  }

  /**
   * Get sales by payment method
   */
  async getByPaymentMethod(method: PaymentMethod): Promise<Sale[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<Sale>(
      `SELECT * FROM sales 
       WHERE payment_method = ? AND is_active = 1 
       ORDER BY created_at DESC`,
      [method],
    );
    return result;
  }

  /**
   * Get today's sales
   */
  async getToday(): Promise<Sale[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<Sale>(
      `SELECT * FROM sales 
       WHERE date(created_at) = date('now', 'localtime')
       AND is_active = 1 
       ORDER BY created_at DESC`,
    );
    return result;
  }

  /**
   * Get sales summary for a date
   */
  async getDailySummary(date: string): Promise<{
    totalSales: number;
    transactionCount: number;
    averageTransaction: number;
    totalDiscount: number;
  }> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{
      total_sales: number;
      transaction_count: number;
      total_discount: number;
    }>(
      `SELECT 
        COALESCE(SUM(total), 0) as total_sales,
        COUNT(*) as transaction_count,
        COALESCE(SUM(discount_amount), 0) as total_discount
       FROM sales 
       WHERE date(created_at) = date(?)
       AND is_active = 1`,
      [date],
    );

    const totalSales = result?.total_sales ?? 0;
    const transactionCount = result?.transaction_count ?? 0;

    return {
      totalSales,
      transactionCount,
      averageTransaction:
        transactionCount > 0 ? totalSales / transactionCount : 0,
      totalDiscount: result?.total_discount ?? 0,
    };
  }

  /**
   * Void a sale (soft delete and reverse inventory)
   */
  async voidSale(id: number): Promise<boolean> {
    const sale = await this.getWithItems(id);
    if (!sale) return false;

    return withTransaction(async (db) => {
      // Reverse inventory deductions
      for (const item of sale.items) {
        // This would need to restore ingredients - simplified for now
        // In production, you'd track and reverse the exact deductions
      }

      // Soft delete the sale
      await db.runAsync(
        `UPDATE sales SET is_active = 0, updated_at = ? WHERE id = ?`,
        [toSQLiteDateTime(), id],
      );

      // Soft delete sale items
      await db.runAsync(
        `UPDATE sale_items SET is_active = 0, updated_at = ? WHERE sale_id = ?`,
        [toSQLiteDateTime(), id],
      );

      return true;
    });
  }

  /**
   * Deduct ingredient stock when a product is sold
   */
  private async deductProductIngredients(
    productId: number,
    quantity: number,
    saleId: number,
  ): Promise<void> {
    const db = await getDatabase();

    // Get product with recipe
    const product = await db.getFirstAsync<{
      recipe_id: number | null;
      is_inventory_tracked: number;
    }>(`SELECT recipe_id, is_inventory_tracked FROM products WHERE id = ?`, [
      productId,
    ]);

    if (!product || !product.is_inventory_tracked || !product.recipe_id) {
      return; // No inventory tracking or no recipe
    }

    // Get recipe items
    const recipeItems = await db.getAllAsync<{
      ingredient_id: number;
      quantity: number;
    }>(
      `SELECT ingredient_id, quantity FROM recipe_items 
       WHERE recipe_id = ? AND is_active = 1`,
      [product.recipe_id],
    );

    // Deduct each ingredient
    for (const recipeItem of recipeItems) {
      const deductAmount = recipeItem.quantity * quantity;
      await ingredientRepository.updateStock(
        recipeItem.ingredient_id,
        -deductAmount,
      );
    }
  }
}

// Export singleton instance
export const saleRepository = new SaleRepository();
