/**
 * SmartStore Recipe Repository
 * Data access layer for recipes and recipe_items tables
 */

import type {
    Ingredient,
    Recipe,
    RecipeInput,
    RecipeItem,
    RecipeItemInput,
    RecipeWithItems
} from "../../types";
import { getDatabase, toSQLiteDateTime, withTransaction } from "../database";
import { BaseRepository } from "./base.repository";

export class RecipeRepository extends BaseRepository<Recipe, RecipeInput> {
  protected tableName = "recipes";

  /**
   * Create a new recipe with its items
   * Uses transaction for data integrity
   */
  async create(input: RecipeInput): Promise<Recipe> {
    return withTransaction(async (db) => {
      const now = toSQLiteDateTime();

      // Calculate total cost from items
      const totalCost = await this.calculateTotalCost(input.items);
      const costPerServing = totalCost / input.servings;

      // Create the recipe
      const result = await db.runAsync(
        `INSERT INTO recipes (
          name, description, servings, total_cost, cost_per_serving,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          input.name,
          input.description ?? null,
          input.servings,
          totalCost,
          costPerServing,
          now,
          now,
        ],
      );

      const recipeId = result.lastInsertRowId;

      // Create recipe items
      for (const item of input.items) {
        await db.runAsync(
          `INSERT INTO recipe_items (
            recipe_id, ingredient_id, quantity, unit_type,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            recipeId,
            item.ingredient_id,
            item.quantity,
            item.unit_type,
            now,
            now,
          ],
        );
      }

      return (await this.getById(recipeId))!;
    });
  }

  /**
   * Update a recipe and optionally its items
   */
  async update(
    id: number,
    input: Partial<RecipeInput>,
  ): Promise<Recipe | null> {
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
    if (input.servings !== undefined) {
      updates.push("servings = ?");
      values.push(input.servings);
    }

    // If items are provided, recalculate costs
    if (input.items) {
      const totalCost = await this.calculateTotalCost(input.items);
      const servings = input.servings ?? existing.servings;
      updates.push("total_cost = ?");
      values.push(totalCost);
      updates.push("cost_per_serving = ?");
      values.push(totalCost / servings);

      // Update items in transaction
      await this.updateItems(id, input.items);
    }

    if (updates.length > 0) {
      updates.push("updated_at = ?");
      values.push(toSQLiteDateTime());
      values.push(id);

      await db.runAsync(
        `UPDATE recipes SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );
    }

    return this.getById(id);
  }

  /**
   * Get recipe with all items and ingredient details
   */
  async getWithItems(id: number): Promise<RecipeWithItems | null> {
    const recipe = await this.getById(id);
    if (!recipe) return null;

    const db = await getDatabase();
    const items = await db.getAllAsync<RecipeItem & { ingredient: Ingredient }>(
      `SELECT ri.*, 
        i.id as ingredient_id,
        i.name as ingredient_name,
        i.cost_per_unit as ingredient_cost_per_unit,
        i.unit_type as ingredient_unit_type
       FROM recipe_items ri
       JOIN ingredients i ON ri.ingredient_id = i.id
       WHERE ri.recipe_id = ? AND ri.is_active = 1`,
      [id],
    );

    // Transform the flat result into nested structure
    const transformedItems = items.map((item) => ({
      ...item,
      ingredient: {
        id: item.ingredient_id,
        name: (item as unknown as { ingredient_name: string }).ingredient_name,
        cost_per_unit: (item as unknown as { ingredient_cost_per_unit: number })
          .ingredient_cost_per_unit,
        unit_type: (item as unknown as { ingredient_unit_type: string })
          .ingredient_unit_type,
      } as Ingredient,
    }));

    return {
      ...recipe,
      items: transformedItems,
    };
  }

  /**
   * Search recipes by name
   */
  async search(query: string): Promise<Recipe[]> {
    return this.searchByName(query);
  }

  /**
   * Recalculate and update recipe costs (when ingredient prices change)
   */
  async recalculateCost(id: number): Promise<Recipe | null> {
    const recipeWithItems = await this.getWithItems(id);
    if (!recipeWithItems) return null;

    const items: RecipeItemInput[] = recipeWithItems.items.map((item) => ({
      ingredient_id: item.ingredient_id,
      quantity: item.quantity,
      unit_type: item.unit_type,
    }));

    const totalCost = await this.calculateTotalCost(items);
    const costPerServing = totalCost / recipeWithItems.servings;

    const db = await getDatabase();
    await db.runAsync(
      `UPDATE recipes SET total_cost = ?, cost_per_serving = ?, updated_at = ? WHERE id = ?`,
      [totalCost, costPerServing, toSQLiteDateTime(), id],
    );

    return this.getById(id);
  }

  /**
   * Calculate total cost from recipe items
   */
  private async calculateTotalCost(items: RecipeItemInput[]): Promise<number> {
    const db = await getDatabase();
    let totalCost = 0;

    for (const item of items) {
      const ingredient = await db.getFirstAsync<{ cost_per_unit: number }>(
        `SELECT cost_per_unit FROM ingredients WHERE id = ?`,
        [item.ingredient_id],
      );
      if (ingredient) {
        totalCost += ingredient.cost_per_unit * item.quantity;
      }
    }

    return totalCost;
  }

  /**
   * Update recipe items (soft delete old, insert new)
   */
  private async updateItems(
    recipeId: number,
    items: RecipeItemInput[],
  ): Promise<void> {
    await withTransaction(async (db) => {
      const now = toSQLiteDateTime();

      // Soft delete existing items
      await db.runAsync(
        `UPDATE recipe_items SET is_active = 0, updated_at = ? WHERE recipe_id = ?`,
        [now, recipeId],
      );

      // Insert new items
      for (const item of items) {
        await db.runAsync(
          `INSERT INTO recipe_items (
            recipe_id, ingredient_id, quantity, unit_type,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            recipeId,
            item.ingredient_id,
            item.quantity,
            item.unit_type,
            now,
            now,
          ],
        );
      }
    });
  }
}

// Export singleton instance
export const recipeRepository = new RecipeRepository();
