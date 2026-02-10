/**
 * SmartStore Reports Dashboard
 * Daily profit breakdown, break-even analysis, best sellers, peak hours
 */

import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { IconSymbol } from "../components/ui/icon-symbol";
import { Colors, brand, radius } from "../constants/theme";
import { useIngredientStore, useReportStore, useSettingsStore } from "../store";

export default function ReportsScreen() {
  const router = useRouter();
  const systemColorScheme = useColorScheme() ?? "light";
  const { themeMode } = useSettingsStore();
  const colorScheme = themeMode === "system" ? systemColorScheme : themeMode;
  const colors = Colors[colorScheme];

  const {
    dailyReport,
    weeklyTrend,
    breakEven,
    bestSellers,
    peakHours,
    selectedDate,
    isLoading,
    fetchAll,
    setSelectedDate,
  } = useReportStore();

  const loadReports = useCallback(() => {
    fetchAll(selectedDate);
  }, [fetchAll, selectedDate]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const navigateDate = (offset: number) => {
    const current = new Date(selectedDate + "T12:00:00");
    current.setDate(current.getDate() + offset);
    const newDate = current.toISOString().split("T")[0];
    setSelectedDate(newDate);
    fetchAll(newDate);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    const todayStr = new Date().toISOString().split("T")[0];
    if (dateStr === todayStr) return "Today";
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const peakHour = useMemo(() => {
    if (peakHours.length === 0) return null;
    return peakHours.reduce((max, h) => (h.count > max.count ? h : max));
  }, [peakHours]);

  // Smart Insights
  const { fetchIngredients, fetchLowStock, lowStockIngredients } =
    useIngredientStore();

  useEffect(() => {
    fetchIngredients();
    fetchLowStock();
  }, [fetchIngredients, fetchLowStock]);

  const insights = useMemo(() => {
    const list: { icon: string; color: string; text: string }[] = [];

    // Profitability insight
    if (dailyReport) {
      if (dailyReport.netProfit > 0) {
        const margin = (
          (dailyReport.netProfit / (dailyReport.totalRevenue || 1)) *
          100
        ).toFixed(0);
        list.push({
          icon: "✅",
          color: "#34C759",
          text: `Profit margin is ${margin}% today — keep it up!`,
        });
      } else if (dailyReport.totalRevenue > 0) {
        list.push({
          icon: "⚠️",
          color: "#FF9500",
          text: "You're operating at a loss today. Review expenses or increase sales volume.",
        });
      }
    }

    // Break-even status
    if (breakEven) {
      if (!breakEven.isAboveBreakEven && breakEven.breakEvenSales > 0) {
        const gap = breakEven.breakEvenSales - breakEven.currentDailySales;
        list.push({
          icon: "📊",
          color: "#FF3B30",
          text: `You need ~${gap.toFixed(0)} more daily sales to break even.`,
        });
      } else if (breakEven.isAboveBreakEven) {
        list.push({
          icon: "🎯",
          color: "#34C759",
          text: "You're above break-even — every sale is pure profit!",
        });
      }
    }

    // Low stock warning
    if (lowStockIngredients.length > 0) {
      list.push({
        icon: "📦",
        color: "#FF9500",
        text: `${lowStockIngredients.length} ingredient${lowStockIngredients.length > 1 ? "s" : ""} running low. Restock soon!`,
      });
    }

    // Best seller insight
    if (bestSellers.length > 0) {
      list.push({
        icon: "🏆",
        color: "#007AFF",
        text: `Top seller: ${bestSellers[0].productName} with ${bestSellers[0].quantitySold} sold in 30 days.`,
      });
    }

    // Peak hour insight
    if (peakHour) {
      list.push({
        icon: "⏰",
        color: "#5856D6",
        text: `Peak business hour is ${peakHour.hour}:00–${peakHour.hour + 1}:00. Schedule staff accordingly.`,
      });
    }

    return list;
  }, [dailyReport, breakEven, lowStockIngredients, bestSellers, peakHour]);

  if (isLoading && !dailyReport) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={brand.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <LinearGradient
        colors={[brand.primary, brand.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Reports</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Navigator */}
        <View
          style={[
            styles.dateNavigator,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity onPress={() => navigateDate(-1)}>
            <IconSymbol name="chevron.left" size={20} color={brand.primary} />
          </TouchableOpacity>
          <Text style={[styles.dateText, { color: colors.text }]}>
            {formatDate(selectedDate)}
          </Text>
          <TouchableOpacity onPress={() => navigateDate(1)}>
            <IconSymbol name="chevron.right" size={20} color={brand.primary} />
          </TouchableOpacity>
        </View>

        {/* Profit Summary */}
        {dailyReport && (
          <View
            style={[
              styles.profitCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Daily Profit
            </Text>
            <Text
              style={[
                styles.profitAmount,
                {
                  color: dailyReport.netProfit >= 0 ? "#34C759" : "#FF3B30",
                },
              ]}
            >
              {dailyReport.netProfit >= 0 ? "+" : ""}$
              {dailyReport.netProfit.toFixed(2)}
            </Text>

            {/* Breakdown */}
            <View style={styles.breakdownContainer}>
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: colors.text }]}>
                  Revenue
                </Text>
                <Text style={[styles.breakdownValue, { color: "#34C759" }]}>
                  +${dailyReport.totalRevenue.toFixed(2)}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: colors.text }]}>
                  Cost of Goods
                </Text>
                <Text style={[styles.breakdownValue, { color: "#FF3B30" }]}>
                  -${dailyReport.totalCOGS.toFixed(2)}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: colors.text }]}>
                  Expenses
                </Text>
                <Text style={[styles.breakdownValue, { color: "#FF3B30" }]}>
                  -${dailyReport.totalExpenses.toFixed(2)}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: colors.text }]}>
                  Labor
                </Text>
                <Text style={[styles.breakdownValue, { color: "#FF3B30" }]}>
                  -${dailyReport.laborCost.toFixed(2)}
                </Text>
              </View>
              <View
                style={[
                  styles.breakdownDivider,
                  { backgroundColor: colors.border },
                ]}
              />
              <View style={styles.breakdownRow}>
                <Text
                  style={[
                    styles.breakdownLabel,
                    { color: colors.text, fontWeight: "700" },
                  ]}
                >
                  Transactions
                </Text>
                <Text style={[styles.breakdownValue, { color: colors.text }]}>
                  {dailyReport.transactionCount}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text
                  style={[
                    styles.breakdownLabel,
                    { color: colors.text, fontWeight: "700" },
                  ]}
                >
                  Avg Order
                </Text>
                <Text style={[styles.breakdownValue, { color: colors.text }]}>
                  ${dailyReport.avgOrderValue.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => router.push("/expenses" as any)}
          >
            <IconSymbol
              name="dollar.sign.circle.fill"
              size={28}
              color="#FF6B6B"
            />
            <Text style={[styles.actionLabel, { color: colors.text }]}>
              Expenses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => router.push("/employees" as any)}
          >
            <IconSymbol name="person.2.fill" size={28} color="#4ECDC4" />
            <Text style={[styles.actionLabel, { color: colors.text }]}>
              Employees
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Trend */}
        {weeklyTrend.length > 0 && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              7-Day Revenue Trend
            </Text>
            <View style={styles.trendContainer}>
              {weeklyTrend.map((day, idx) => {
                const maxRevenue = Math.max(
                  ...weeklyTrend.map((d) => d.totalRevenue),
                  1,
                );
                const height = (day.totalRevenue / maxRevenue) * 60;
                const dayLabel = new Date(
                  day.date + "T12:00:00",
                ).toLocaleDateString("en-US", { weekday: "narrow" });
                return (
                  <View key={idx} style={styles.trendBar}>
                    <Text
                      style={[
                        styles.trendValue,
                        { color: colors.textTertiary },
                      ]}
                    >
                      ${day.totalRevenue.toFixed(0)}
                    </Text>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(height, 4),
                          backgroundColor:
                            day.netProfit >= 0 ? brand.primary : "#FF3B30",
                        },
                      ]}
                    />
                    <Text
                      style={[styles.trendDay, { color: colors.textSecondary }]}
                    >
                      {dayLabel}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Break-Even */}
        {breakEven && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Break-Even Analysis
            </Text>
            <View style={styles.breakEvenGrid}>
              <View style={styles.breakEvenItem}>
                <Text style={[styles.breakEvenValue, { color: colors.text }]}>
                  ${breakEven.dailyFixedCosts.toFixed(2)}
                </Text>
                <Text
                  style={[
                    styles.breakEvenLabel,
                    { color: colors.textTertiary },
                  ]}
                >
                  Daily Fixed Costs
                </Text>
              </View>
              <View style={styles.breakEvenItem}>
                <Text style={[styles.breakEvenValue, { color: brand.primary }]}>
                  {breakEven.breakEvenSales}
                </Text>
                <Text
                  style={[
                    styles.breakEvenLabel,
                    { color: colors.textTertiary },
                  ]}
                >
                  Sales to Break Even
                </Text>
              </View>
              <View style={styles.breakEvenItem}>
                <Text
                  style={[
                    styles.breakEvenValue,
                    {
                      color: breakEven.isAboveBreakEven ? "#34C759" : "#FF3B30",
                    },
                  ]}
                >
                  {breakEven.currentDailySales.toFixed(0)}
                </Text>
                <Text
                  style={[
                    styles.breakEvenLabel,
                    { color: colors.textTertiary },
                  ]}
                >
                  Avg Daily Sales
                </Text>
              </View>
              <View style={styles.breakEvenItem}>
                <Text
                  style={[
                    styles.breakEvenValue,
                    {
                      color: breakEven.isAboveBreakEven ? "#34C759" : "#FF3B30",
                    },
                  ]}
                >
                  {breakEven.isAboveBreakEven ? "Above" : "Below"}
                </Text>
                <Text
                  style={[
                    styles.breakEvenLabel,
                    { color: colors.textTertiary },
                  ]}
                >
                  Status
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Best Sellers */}
        {bestSellers.length > 0 && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Best Sellers (30 Days)
            </Text>
            {bestSellers.map((item, idx) => (
              <View key={idx} style={styles.sellerRow}>
                <View style={styles.sellerLeft}>
                  <Text style={[styles.sellerRank, { color: brand.primary }]}>
                    #{idx + 1}
                  </Text>
                  <Text style={[styles.sellerName, { color: colors.text }]}>
                    {item.productName}
                  </Text>
                </View>
                <View style={styles.sellerRight}>
                  <Text
                    style={[styles.sellerQty, { color: colors.textSecondary }]}
                  >
                    {item.quantitySold} sold
                  </Text>
                  <Text style={[styles.sellerRevenue, { color: "#34C759" }]}>
                    ${item.revenue.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Peak Hours */}
        {peakHour && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Peak Hours
            </Text>
            <Text style={[styles.peakHourText, { color: colors.text }]}>
              Busiest hour:{" "}
              <Text style={{ color: brand.primary, fontWeight: "800" }}>
                {peakHour.hour}:00 - {peakHour.hour + 1}:00
              </Text>
            </Text>
            <Text
              style={[styles.peakHourDetail, { color: colors.textSecondary }]}
            >
              {peakHour.count} orders • ${peakHour.revenue.toFixed(2)} revenue
            </Text>
          </View>
        )}

        {/* Smart Insights */}
        {insights.length > 0 && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Smart Insights
            </Text>
            {insights.map((insight, idx) => (
              <View key={idx} style={styles.insightRow}>
                <Text style={styles.insightIcon}>{insight.icon}</Text>
                <Text style={[styles.insightText, { color: colors.text }]}>
                  {insight.text}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  dateNavigator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Profit Card
  profitCard: {
    padding: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  profitAmount: {
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 16,
  },
  breakdownContainer: {
    width: "100%",
    gap: 8,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 14,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  breakdownDivider: {
    height: 1,
    marginVertical: 4,
  },
  // Quick Actions
  quickActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Trend
  card: {
    padding: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  trendContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 100,
    marginTop: 8,
  },
  trendBar: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  trendValue: {
    fontSize: 9,
    marginBottom: 4,
  },
  bar: {
    width: 24,
    borderRadius: 4,
    minHeight: 4,
  },
  trendDay: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "500",
  },
  // Break-Even
  breakEvenGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  },
  breakEvenItem: {
    width: "47%",
    alignItems: "center",
    paddingVertical: 12,
  },
  breakEvenValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  breakEvenLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  // Best Sellers
  sellerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  sellerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  sellerRank: {
    fontSize: 14,
    fontWeight: "800",
    width: 24,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  sellerRight: {
    alignItems: "flex-end",
  },
  sellerQty: {
    fontSize: 12,
  },
  sellerRevenue: {
    fontSize: 14,
    fontWeight: "700",
  },
  // Peak Hours
  peakHourText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 4,
  },
  peakHourDetail: {
    fontSize: 13,
    marginTop: 4,
  },
  // Smart Insights
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 8,
  },
  insightIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
