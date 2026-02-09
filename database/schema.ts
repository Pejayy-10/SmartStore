/**
 * SmartStore Database Schema
 * SQLite table definitions with versioning support
 */

export const SCHEMA_VERSION = 1;

/**
 * All SQL statements to create Phase 1 tables
 * Following PROJECT_RULES.md:
 * - Soft delete via is_active flag
 * - Foreign key relationships
 * - Timestamps (created_at, updated_at)
 */
export const SCHEMA_SQL = `
-- ============================================
-- Ingredients Table
-- ============================================
CREATE TABLE IF NOT EXISTS ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  cost_per_unit REAL NOT NULL DEFAULT 0,
  unit_type TEXT NOT NULL DEFAULT 'pcs',
  quantity_in_stock REAL NOT NULL DEFAULT 0,
  low_stock_threshold REAL NOT NULL DEFAULT 10,
  supplier TEXT,
  expiration_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_active ON ingredients(is_active);

-- ============================================
-- Inventory Transactions Table
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ingredient_id INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('stock_in', 'stock_out', 'adjustment', 'sale')),
  quantity REAL NOT NULL,
  unit_cost REAL,
  notes TEXT,
  reference_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_ingredient ON inventory_transactions(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(created_at);

-- ============================================
-- Recipes Table
-- ============================================
CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  servings INTEGER NOT NULL DEFAULT 1,
  total_cost REAL NOT NULL DEFAULT 0,
  cost_per_serving REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name);
CREATE INDEX IF NOT EXISTS idx_recipes_active ON recipes(is_active);

-- ============================================
-- Recipe Items Table (Junction table)
-- ============================================
CREATE TABLE IF NOT EXISTS recipe_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  ingredient_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  unit_type TEXT NOT NULL DEFAULT 'pcs',
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_items_recipe ON recipe_items(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_items_ingredient ON recipe_items(ingredient_id);

-- ============================================
-- Products Table
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('food', 'beverage', 'dessert', 'snack', 'other')),
  selling_price REAL NOT NULL DEFAULT 0,
  recipe_id INTEGER,
  is_inventory_tracked INTEGER NOT NULL DEFAULT 1,
  image_uri TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- ============================================
-- Sales Table
-- ============================================
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subtotal REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  discount_percent REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'gcash', 'maya', 'card', 'other')),
  amount_received REAL NOT NULL DEFAULT 0,
  change_amount REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_active ON sales(is_active);

-- ============================================
-- Sale Items Table
-- ============================================
CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  subtotal REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (sale_id) REFERENCES sales(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

-- ============================================
-- Schema Version Table (for migrations)
-- ============================================
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
`;

/**
 * Individual table creation statements (for reference)
 */
export const TABLES = {
  ingredients: "ingredients",
  inventory_transactions: "inventory_transactions",
  recipes: "recipes",
  recipe_items: "recipe_items",
  products: "products",
  sales: "sales",
  sale_items: "sale_items",
  schema_version: "schema_version",
} as const;

export type TableName = keyof typeof TABLES;
