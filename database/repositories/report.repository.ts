/**
 * SmartStore Report Repository
 * Data access layer for aggregated reporting queries
 * Computes daily profit, break-even, best sellers, peak hours, trends
 */

import { getDatabase } from "../database";

export interface DailyReport {
  date: string;
  totalRevenue: number;
  totalCOGS: number;
  totalExpenses: number;
  laborCost: number;
  netProfit: number;
  transactionCount: number;
  avgOrderValue: number;
}

export interface BreakEvenResult {
  dailyFixedCosts: number;
  avgRevenuePerSale: number;
  avgCostPerSale: number;
  contributionMargin: number;
  breakEvenSales: number;
  breakEvenRevenue: number;
  currentDailySales: number;
  isAboveBreakEven: boolean;
}

export interface BestSeller {
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface HourlySales {
  hour: number;
  count: number;
  revenue: number;
}

export class ReportRepository {
  /**
   * Get daily profit summary
   */
  async getDailyReport(date: string): Promise<DailyReport> {
    const db = await getDatabase();

    // Revenue from sales
    const revenueResult = await db.getFirstAsync<{
      total: number;
      count: number;
    }>(
      `SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count
       FROM sales
       WHERE date(created_at) = ? AND status = 'completed'`,
      [date],
    );

    // COGS (cost of goods sold) — from recipe ingredients
    const cogsResult = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(
        si.quantity * COALESCE(
          (SELECT ri.quantity * i.cost_per_unit
           FROM recipe_items ri
           JOIN ingredients i ON i.id = ri.ingredient_id
           JOIN recipes r ON r.id = ri.recipe_id
           JOIN products p ON p.recipe_id = r.id
           WHERE p.id = si.product_id
          ), 0)
       ), 0) as total
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       WHERE date(s.created_at) = ? AND s.status = 'completed'`,
      [date],
    );

    // Expenses
    const expenseResult = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE expense_date = ? AND is_active = 1`,
      [date],
    );

    // Labor cost
    const laborResult = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(
        CASE wage_type
          WHEN 'daily' THEN wage_amount
          WHEN 'hourly' THEN wage_amount * 8
          WHEN 'monthly' THEN wage_amount / 30
        END
      ), 0) as total
      FROM employees WHERE is_active = 1`,
    );

    const totalRevenue = revenueResult?.total ?? 0;
    const totalCOGS = cogsResult?.total ?? 0;
    const totalExpenses = expenseResult?.total ?? 0;
    const laborCost = laborResult?.total ?? 0;
    const transactionCount = revenueResult?.count ?? 0;

    return {
      date,
      totalRevenue,
      totalCOGS,
      totalExpenses,
      laborCost,
      netProfit: totalRevenue - totalCOGS - totalExpenses - laborCost,
      transactionCount,
      avgOrderValue: transactionCount > 0 ? totalRevenue / transactionCount : 0,
    };
  }

  /**
   * Break-even analysis
   */
  async getBreakEvenAnalysis(): Promise<BreakEvenResult> {
    const db = await getDatabase();

    // Daily fixed costs: recurring expenses + labor
    const fixedExpenses = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses WHERE is_recurring = 1 AND is_active = 1`,
    );

    const laborCost = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(
        CASE wage_type
          WHEN 'daily' THEN wage_amount
          WHEN 'hourly' THEN wage_amount * 8
          WHEN 'monthly' THEN wage_amount / 30
        END
      ), 0) as total
      FROM employees WHERE is_active = 1`,
    );

    const dailyFixedCosts =
      (fixedExpenses?.total ?? 0) + (laborCost?.total ?? 0);

    // Average sales data (last 30 days)
    const salesData = await db.getFirstAsync<{
      avgRevenue: number;
      avgCount: number;
      totalDays: number;
    }>(
      `SELECT 
        COALESCE(AVG(daily_total), 0) as avgRevenue,
        COALESCE(AVG(daily_count), 0) as avgCount,
        COUNT(*) as totalDays
       FROM (
         SELECT date(created_at) as sale_date,
                SUM(total_amount) as daily_total,
                COUNT(*) as daily_count
         FROM sales
         WHERE status = 'completed'
           AND created_at >= datetime('now', '-30 days')
         GROUP BY date(created_at)
       )`,
    );

    const avgRevenuePerSale =
      (salesData?.avgCount ?? 0) > 0
        ? (salesData?.avgRevenue ?? 0) / (salesData?.avgCount ?? 1)
        : 0;

    // Avg COGS per sale (simplified)
    const avgCOGS = await db.getFirstAsync<{ avg: number }>(
      `SELECT COALESCE(AVG(total_amount * 0.4), 0) as avg
       FROM sales WHERE status = 'completed'
       AND created_at >= datetime('now', '-30 days')`,
    );

    const avgCostPerSale = avgCOGS?.avg ?? 0;
    const contributionMargin = avgRevenuePerSale - avgCostPerSale;
    const breakEvenSales =
      contributionMargin > 0
        ? Math.ceil(dailyFixedCosts / contributionMargin)
        : 0;

    return {
      dailyFixedCosts,
      avgRevenuePerSale,
      avgCostPerSale,
      contributionMargin,
      breakEvenSales,
      breakEvenRevenue: breakEvenSales * avgRevenuePerSale,
      currentDailySales: salesData?.avgCount ?? 0,
      isAboveBreakEven: (salesData?.avgCount ?? 0) > breakEvenSales,
    };
  }

  /**
   * Best sellers (top 5, last 30 days)
   */
  async getBestSellers(limit = 5): Promise<BestSeller[]> {
    const db = await getDatabase();
    return db.getAllAsync<BestSeller>(
      `SELECT p.name as productName,
              SUM(si.quantity) as quantitySold,
              SUM(si.subtotal) as revenue
       FROM sale_items si
       JOIN products p ON p.id = si.product_id
       JOIN sales s ON s.id = si.sale_id
       WHERE s.status = 'completed'
         AND s.created_at >= datetime('now', '-30 days')
       GROUP BY si.product_id
       ORDER BY quantitySold DESC
       LIMIT ?`,
      [limit],
    );
  }

  /**
   * Peak hours (last 30 days)
   */
  async getPeakHours(): Promise<HourlySales[]> {
    const db = await getDatabase();
    return db.getAllAsync<HourlySales>(
      `SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour,
              COUNT(*) as count,
              SUM(total_amount) as revenue
       FROM sales
       WHERE status = 'completed'
         AND created_at >= datetime('now', '-30 days')
       GROUP BY hour
       ORDER BY hour ASC`,
    );
  }

  /**
   * Weekly trend (last 7 days)
   */
  async getWeeklyTrend(): Promise<DailyReport[]> {
    const reports: DailyReport[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const report = await this.getDailyReport(dateStr);
      reports.push(report);
    }
    return reports;
  }
}

export const reportRepository = new ReportRepository();
