# SmartStore

## Intelligent POS, Inventory, and Business Analytics System

SmartStore is a **smart, offline-first business management system** designed for small store owners, cafés, bakeries, and food businesses. It goes beyond traditional POS systems by accurately calculating **real profit**, factoring in inventory, ingredients, labor, utilities, and operational expenses — all on a single device using SQLite.

---

## 🎯 Project Vision

> **“Not just how much you sold — but how much you actually earned.”**

SmartStore helps small business owners:
- Price products correctly
- Control costs
- Prevent losses
- Make data-driven decisions

All without complex accounting knowledge.

---

## 🧩 Core Modules

### 1. Inventory Management

Tracks all raw materials and stock movements.

**Features:**
- Stock in / stock out logging
- Real-time quantity tracking
- Unit support (pcs, kg, g, ml, tbsp, tsp, etc.)
- Low-stock alerts
- Optional expiration date tracking
- Supplier reference

---

### 2. Ingredient Masterlist

Central registry of all ingredients used in recipes.

**Fields:**
- Ingredient name
- Cost per unit
- Quantity available
- Unit type

**Smart Features:**
- Automatic deduction when products are sold
- Cost updates reflected in recipe calculations

---

### 3. Recipe & Cost Calculator (Key Feature)

Allows owners to build recipes from ingredients and understand true product cost.

**Features:**
- Ingredient-based recipe builder
- Quantity per ingredient
- Automatic total recipe cost
- Cost per serving
- Markup-based selling price suggestion
- Custom selling price override

**Outputs:**
- Cost vs selling price
- Profit per item
- Break-even quantity

---

### 4. Product Masterlist

List of all sellable items.

**Features:**
- Product name & category
- Linked recipe (optional)
- Selling price
- Inventory-tracked toggle
- Product images (optional)

---

### 5. POS Checkout & Receipt System

Designed for fast and simple transactions.

**Features:**
- Cart-based checkout
- Quantity controls
- Discounts (percentage or fixed)
- Multiple payment methods (Cash, GCash, Maya, etc.)
- Auto stock & ingredient deduction
- Digital / printable receipts

---

## 🧠 Smart Business Management

### 6. Employee & Wage Management

Tracks labor costs accurately.

**Features:**
- Employee masterlist
- Wage types: hourly, daily, monthly
- Attendance / work log
- Automatic daily labor cost calculation

---

### 7. Utilities & Expenses Tracking

Captures operational costs.

**Expense Types:**
- Fixed monthly (rent, internet)
- Variable daily (electricity, water, gas)

**Smart Allocation:**
- Monthly expenses are auto-divided into daily costs

---

### 8. Daily Profit Engine (Core Intelligence)

Automatically computes real profit.

**Formula:**
```
Net Profit =
Total Sales
- Ingredient Cost Used
- Labor Cost
- Utility Cost
- Other Expenses
```

**Outputs:**
- Net profit or loss per day
- Cost breakdown

---

## 📊 Reports & Analytics

### Daily / Period Reports
- Sales summary
- Expense summary
- Profit trends
- Ingredient usage

### Filters
- Date range
- Product
- Category
- Payment method

### Export Options
- CSV
- Excel
- PDF

---

## 🔔 Smart Notification System

Useful alerts only:
- Low stock warnings
- High-cost alerts
- Daily profit summary
- Loss detection notifications

(Local notifications only — offline-first)

---

## 🛠 Technology Stack

### Frontend
- React Native (Expo)
- React Navigation
- Zustand or Redux Toolkit
- NativeWind / React Native Paper

### Local Backend
- SQLite (expo-sqlite)
- Offline-first architecture

### Utilities
- Date-fns (date handling)
- Chart libraries (Victory / Recharts)
- Expo Print & Sharing
- Expo Notifications

---

## 🗄 Database Design (High-Level)

**Main Tables:**
- ingredients
- inventory_transactions
- recipes
- recipe_items
- products
- sales
- sale_items
- employees
- attendance
- expenses
- daily_profit_summary
- notifications

---

## 📱 Target Devices

- Tablets (primary POS device)
- Mobile phones (backup / admin use)

Responsive, touch-friendly UI.

---

## 💡 Why SmartStore is Different

| Feature | Typical POS | SmartStore |
|------|-----------|-----------|
| Inventory | ✅ | ✅ |
| Recipe Costing | ❌ | ✅ |
| Labor Cost Tracking | ❌ | ✅ |
| Utility Allocation | ❌ | ✅ |
| Real Profit Calculation | ❌ | ✅ |

---

## 🚀 Monetization Ideas

- One-time license purchase
- Premium analytics unlock
- Custom setup & onboarding
- White-label versions for cafés/bakeries

---

## 📌 Development Roadmap

### Phase 1 – Core POS
- Inventory
- Ingredients
- Recipes
- Products
- Checkout

### Phase 2 – Smart Costing
- Employees & wages
- Utilities & expenses
- Daily profit engine

### Phase 3 – Intelligence Layer
- Analytics
- Notifications
- Advanced reports

---

## 📄 License

Proprietary / Commercial-ready

---

**SmartStore** — *Know your profit. Not just your sales.*

