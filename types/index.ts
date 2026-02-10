/**
 * SmartStore TypeScript Type Definitions
 * All entity interfaces matching the database schema
 */

// ============================================
// Base Types
// ============================================

/** Base entity with common fields */
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

/** Unit types for ingredients */
export type UnitType =
  | "pcs"
  | "kg"
  | "g"
  | "mg"
  | "l"
  | "ml"
  | "tbsp"
  | "tsp"
  | "cup"
  | "oz";

/** Payment methods */
export type PaymentMethod = "cash" | "gcash" | "maya" | "card" | "other";

/** Transaction types for inventory */
export type TransactionType = "stock_in" | "stock_out" | "adjustment" | "sale";

// ============================================
// Ingredient Module
// ============================================

/** Ingredient - raw materials used in recipes */
export interface Ingredient extends BaseEntity {
  name: string;
  description: string | null;
  cost_per_unit: number;
  unit_type: UnitType;
  quantity_in_stock: number;
  low_stock_threshold: number;
  supplier: string | null;
  expiration_date: string | null;
}

/** Create/Update ingredient DTO */
export interface IngredientInput {
  name: string;
  description?: string | null;
  cost_per_unit: number;
  unit_type: UnitType;
  quantity_in_stock: number;
  low_stock_threshold?: number;
  supplier?: string | null;
  expiration_date?: string | null;
}

// ============================================
// Inventory Module
// ============================================

/** Inventory transaction - stock movements */
export interface InventoryTransaction extends BaseEntity {
  ingredient_id: number;
  transaction_type: TransactionType;
  quantity: number;
  unit_cost: number | null;
  notes: string | null;
  reference_id: number | null; // Links to sale_id if type is 'sale'
}

/** Create inventory transaction DTO */
export interface InventoryTransactionInput {
  ingredient_id: number;
  transaction_type: TransactionType;
  quantity: number;
  unit_cost?: number | null;
  notes?: string | null;
  reference_id?: number | null;
}

// ============================================
// Recipe Module
// ============================================

/** Recipe - product recipes */
export interface Recipe extends BaseEntity {
  name: string;
  description: string | null;
  servings: number;
  total_cost: number; // Calculated from recipe items
  cost_per_serving: number; // total_cost / servings
}

/** Recipe item - ingredients in a recipe */
export interface RecipeItem extends BaseEntity {
  recipe_id: number;
  ingredient_id: number;
  quantity: number;
  unit_type: UnitType;
}

/** Create recipe DTO */
export interface RecipeInput {
  name: string;
  description?: string | null;
  servings: number;
  items: RecipeItemInput[];
}

/** Create recipe item DTO */
export interface RecipeItemInput {
  ingredient_id: number;
  quantity: number;
  unit_type: UnitType;
}

/** Recipe with full ingredient details (for display) */
export interface RecipeWithItems extends Recipe {
  items: (RecipeItem & { ingredient: Ingredient })[];
}

// ============================================
// Product Module
// ============================================

/** Product category */
export type ProductCategory =
  | "food"
  | "beverage"
  | "dessert"
  | "snack"
  | "other";

/** Product - sellable items */
export interface Product extends BaseEntity {
  name: string;
  description: string | null;
  category: ProductCategory;
  selling_price: number;
  recipe_id: number | null; // Optional link to recipe
  is_inventory_tracked: boolean;
  image_uri: string | null;
}

/** Create/Update product DTO */
export interface ProductInput {
  name: string;
  description?: string | null;
  category: ProductCategory;
  selling_price: number;
  recipe_id?: number | null;
  is_inventory_tracked?: boolean;
  image_uri?: string | null;
}

/** Product with recipe details (for display) */
export interface ProductWithRecipe extends Product {
  recipe: Recipe | null;
  profit_margin: number; // selling_price - recipe.cost_per_serving
}

// ============================================
// Sales Module
// ============================================

/** Sale - transaction record */
export interface Sale extends BaseEntity {
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  total: number;
  payment_method: PaymentMethod;
  amount_received: number;
  change_amount: number;
  notes: string | null;
}

/** Sale item - line items in a sale */
export interface SaleItem extends BaseEntity {
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number; // quantity * unit_price
}

/** Create sale DTO */
export interface SaleInput {
  items: SaleItemInput[];
  discount_amount?: number;
  discount_percent?: number;
  payment_method: PaymentMethod;
  amount_received: number;
  notes?: string | null;
}

/** Create sale item DTO */
export interface SaleItemInput {
  product_id: number;
  quantity: number;
  unit_price: number;
}

/** Sale with full details (for receipts) */
export interface SaleWithItems extends Sale {
  items: (SaleItem & { product: Product })[];
}

// ============================================
// Phase 2 Types (Placeholder)
// ============================================

/** Employee (Phase 2) */
export interface Employee extends BaseEntity {
  name: string;
  role: "owner" | "cashier" | "staff";
  wage_type: "hourly" | "daily" | "monthly";
  wage_amount: number;
  pin_hash: string | null; // Hashed PIN for access
}

/** Expense (Phase 2) */
export interface Expense extends BaseEntity {
  name: string;
  category: "rent" | "utilities" | "supplies" | "labor" | "other";
  amount: number;
  is_recurring: boolean;
  recurrence_type: "daily" | "monthly" | null;
  expense_date: string;
  notes: string | null;
}

/** Create/Update expense DTO */
export interface ExpenseInput {
  name: string;
  category: "rent" | "utilities" | "supplies" | "labor" | "other";
  amount: number;
  is_recurring?: boolean;
  recurrence_type?: "daily" | "monthly" | null;
  expense_date?: string;
  notes?: string | null;
}

/** Employee input DTO */
export interface EmployeeInput {
  name: string;
  role?: "owner" | "cashier" | "staff";
  wage_type?: "hourly" | "daily" | "monthly";
  wage_amount: number;
  pin_hash?: string | null;
}

/** Daily profit summary (Phase 2) */
export interface DailyProfitSummary extends BaseEntity {
  date: string;
  total_sales: number;
  ingredient_cost: number;
  labor_cost: number;
  utility_cost: number;
  other_expenses: number;
  net_profit: number;
}
