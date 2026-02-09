/**
 * SmartStore Product Repository
 * Data access layer for products table
 */

import type {
    Product,
    ProductCategory,
    ProductInput,
    ProductWithRecipe,
    Recipe,
} from "../../types";
import { getDatabase, toSQLiteDateTime } from "../database";
import { BaseRepository } from "./base.repository";

export class ProductRepository extends BaseRepository<Product, ProductInput> {
  protected tableName = "products";

  /**
   * Create a new product
   */
  async create(input: ProductInput): Promise<Product> {
    const db = await getDatabase();
    const now = toSQLiteDateTime();

    const result = await db.runAsync(
      `INSERT INTO products (
        name, description, category, selling_price, recipe_id,
        is_inventory_tracked, image_uri, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.name,
        input.description ?? null,
        input.category,
        input.selling_price,
        input.recipe_id ?? null,
        input.is_inventory_tracked !== false ? 1 : 0,
        input.image_uri ?? null,
        now,
        now,
      ],
    );

    return (await this.getById(result.lastInsertRowId))!;
  }

  /**
   * Update an existing product
   */
  async update(
    id: number,
    input: Partial<ProductInput>,
  ): Promise<Product | null> {
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
    if (input.category !== undefined) {
      updates.push("category = ?");
      values.push(input.category);
    }
    if (input.selling_price !== undefined) {
      updates.push("selling_price = ?");
      values.push(input.selling_price);
    }
    if (input.recipe_id !== undefined) {
      updates.push("recipe_id = ?");
      values.push(input.recipe_id);
    }
    if (input.is_inventory_tracked !== undefined) {
      updates.push("is_inventory_tracked = ?");
      values.push(input.is_inventory_tracked ? 1 : 0);
    }
    if (input.image_uri !== undefined) {
      updates.push("image_uri = ?");
      values.push(input.image_uri);
    }

    if (updates.length === 0) return existing;

    updates.push("updated_at = ?");
    values.push(toSQLiteDateTime());
    values.push(id);

    await db.runAsync(
      `UPDATE products SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    return this.getById(id);
  }

  /**
   * Get products by category
   */
  async getByCategory(category: ProductCategory): Promise<Product[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<Product>(
      `SELECT * FROM products 
       WHERE category = ? AND is_active = 1 
       ORDER BY name ASC`,
      [category],
    );
    return result;
  }

  /**
   * Search products by name
   */
  async search(query: string): Promise<Product[]> {
    return this.searchByName(query);
  }

  /**
   * Get product with recipe details
   */
  async getWithRecipe(id: number): Promise<ProductWithRecipe | null> {
    const product = await this.getById(id);
    if (!product) return null;

    let recipe: Recipe | null = null;
    let profitMargin = product.selling_price;

    if (product.recipe_id) {
      const db = await getDatabase();
      recipe = await db.getFirstAsync<Recipe>(
        `SELECT * FROM recipes WHERE id = ? AND is_active = 1`,
        [product.recipe_id],
      );

      if (recipe) {
        profitMargin = product.selling_price - recipe.cost_per_serving;
      }
    }

    return {
      ...product,
      recipe,
      profit_margin: profitMargin,
    };
  }

  /**
   * Get all products with their profit margins
   */
  async getAllWithProfitMargins(): Promise<ProductWithRecipe[]> {
    const db = await getDatabase();
    const products = await db.getAllAsync<Product & { recipe_cost?: number }>(
      `SELECT p.*, r.cost_per_serving as recipe_cost
       FROM products p
       LEFT JOIN recipes r ON p.recipe_id = r.id AND r.is_active = 1
       WHERE p.is_active = 1
       ORDER BY p.name ASC`,
    );

    return products.map((product) => ({
      ...product,
      recipe: null, // Not loading full recipe for performance
      profit_margin: product.selling_price - (product.recipe_cost ?? 0),
    }));
  }

  /**
   * Get products for POS (only active, ordered for quick selection)
   */
  async getForPOS(): Promise<Product[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<Product>(
      `SELECT * FROM products 
       WHERE is_active = 1 
       ORDER BY category, name ASC`,
    );
    return result;
  }
}

// Export singleton instance
export const productRepository = new ProductRepository();
