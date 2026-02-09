/**
 * SmartStore Sales Screen
 * Professional design with orange theme
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, brand, radius, shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore, useSalesStore, useSettingsStore } from "@/store";
import type { PaymentMethod, Sale } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type FilterPeriod = "today" | "week" | "month" | "all";

const FILTER_OPTIONS: { key: FilterPeriod; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "all", label: "All" },
];

const PAYMENT_COLORS: Record<PaymentMethod, string> = {
  cash: "#34C759",
  card: "#007AFF",
  gcash: "#0066FF",
  maya: "#00B900",
  other: "#8E8E93",
};

export default function SalesScreen() {
  const systemColorScheme = useColorScheme() ?? "light";
  const { themeMode } = useSettingsStore();
  const colorScheme = themeMode === "system" ? systemColorScheme : themeMode;
  const colors = Colors[colorScheme];

  const [refreshing, setRefreshing] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("today");

  // App store for initialization
  const { isInitialized, isInitializing, initialize, initError } =
    useAppStore();

  // Sales store
  const {
    sales,
    dailySummary,
    isLoading,
    error,
    fetchSales,
    fetchByDateRange,
    fetchDailySummary,
    voidSale,
    clearError,
  } = useSalesStore();

  // Get today's date
  const getTodayDate = () => new Date().toISOString().split("T")[0];

  // Load sales based on filter
  const loadSales = useCallback(async () => {
    const today = getTodayDate();

    if (filterPeriod === "today") {
      await fetchByDateRange(today, today);
      await fetchDailySummary(today);
    } else if (filterPeriod === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      await fetchByDateRange(weekAgo.toISOString().split("T")[0], today);
      await fetchDailySummary(today);
    } else if (filterPeriod === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      await fetchByDateRange(monthAgo.toISOString().split("T")[0], today);
      await fetchDailySummary(today);
    } else {
      await fetchSales();
      await fetchDailySummary(today);
    }
  }, [filterPeriod, fetchSales, fetchByDateRange, fetchDailySummary]);

  // Initialize database on mount
  useEffect(() => {
    if (!isInitialized && !isInitializing) {
      initialize();
    }
  }, [isInitialized, isInitializing, initialize]);

  // Fetch sales when initialized
  useEffect(() => {
    if (isInitialized) {
      loadSales();
    }
  }, [isInitialized]);

  // Reload when filter changes
  useEffect(() => {
    if (isInitialized) {
      loadSales();
    }
  }, [filterPeriod]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSales();
    setRefreshing(false);
  }, [loadSales]);

  // Handle void
  const handleVoid = useCallback(
    (sale: Sale) => {
      Alert.alert(
        "Void Sale",
        `Are you sure you want to void sale #${sale.id}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Void",
            style: "destructive",
            onPress: async () => {
              const success = await voidSale(sale.id);
              if (success) {
                await loadSales();
              } else {
                Alert.alert("Error", "Failed to void sale");
              }
            },
          },
        ],
      );
    },
    [voidSale, loadSales],
  );

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Render sale item
  const renderSale = ({ item }: { item: Sale }) => {
    return (
      <View
        style={[
          styles.saleCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          shadows.soft,
        ]}
      >
        <View style={styles.saleHeader}>
          <View style={styles.saleIdContainer}>
            <Text style={[styles.saleId, { color: colors.text }]}>
              #{item.id}
            </Text>
            <Text style={[styles.saleTime, { color: colors.textTertiary }]}>
              {formatTime(item.created_at)}
            </Text>
          </View>
          <View
            style={[
              styles.paymentBadge,
              { backgroundColor: PAYMENT_COLORS[item.payment_method] },
            ]}
          >
            <Text style={styles.paymentBadgeText}>
              {item.payment_method.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.saleDetails}>
          <View style={styles.saleRow}>
            <Text style={[styles.saleLabel, { color: colors.textSecondary }]}>
              Total
            </Text>
            <Text style={[styles.saleTotal, { color: brand.primary }]}>
              ₱{item.total.toFixed(2)}
            </Text>
          </View>
          {item.discount_amount > 0 && (
            <View style={styles.saleRow}>
              <Text style={[styles.saleLabel, { color: colors.textSecondary }]}>
                Discount
              </Text>
              <Text style={[styles.saleDiscount, { color: "#34C759" }]}>
                -₱{item.discount_amount.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.voidButton}
          onPress={() => handleVoid(item)}
        >
          <Text style={styles.voidButtonText}>Void</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Calculate summary stats
  const summaryStats = {
    totalSales: dailySummary?.total_sales || 0,
    transactionCount: dailySummary?.transaction_count || 0,
    avgSale: dailySummary?.transaction_count
      ? dailySummary.total_sales / dailySummary.transaction_count
      : 0,
  };

  // Show loading state
  if (isInitializing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={brand.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading...
        </Text>
      </View>
    );
  }

  // Show init error
  if (initError) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <IconSymbol name="exclamationmark.triangle" size={48} color="#FF3B30" />
        <Text style={[styles.errorText, { color: colors.text }]}>
          {initError}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: brand.primary }]}
          onPress={initialize}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[brand.primary, brand.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.title}>Sales History</Text>
        <Text style={styles.subtitle}>{sales.length} transactions</Text>
      </LinearGradient>

      {/* Summary Cards */}
      <View style={styles.summaryWrapper}>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card },
            shadows.medium,
          ]}
        >
          <View style={styles.summaryItem}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Total Sales
            </Text>
            <Text style={[styles.summaryValue, { color: brand.primary }]}>
              ₱{summaryStats.totalSales.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Transactions
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {summaryStats.transactionCount}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Average
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ₱{summaryStats.avgSale.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterWrapper}>
        <FlatList
          horizontal
          data={FILTER_OPTIONS}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                {
                  backgroundColor:
                    filterPeriod === item.key ? brand.primary : colors.card,
                  borderColor:
                    filterPeriod === item.key ? brand.primary : colors.border,
                },
              ]}
              onPress={() => setFilterPeriod(item.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  {
                    color: filterPeriod === item.key ? "#FFFFFF" : colors.text,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Error Display */}
      {error && (
        <TouchableOpacity style={styles.errorBanner} onPress={clearError}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </TouchableOpacity>
      )}

      {/* Sales List */}
      <FlatList
        data={sales}
        renderItem={renderSale}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={brand.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color={brand.primary} />
            ) : (
              <>
                <View
                  style={[
                    styles.emptyIcon,
                    { backgroundColor: brand.primaryFaded },
                  ]}
                >
                  <IconSymbol
                    name="chart.bar.fill"
                    size={40}
                    color={brand.primary}
                  />
                </View>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  No sales yet
                </Text>
                <Text
                  style={[styles.emptySubtext, { color: colors.textSecondary }]}
                >
                  Complete your first sale in the POS tab
                </Text>
              </>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  header: {
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  summaryWrapper: {
    paddingHorizontal: 16,
    marginTop: -12,
  },
  summaryCard: {
    flexDirection: "row",
    padding: 20,
    borderRadius: radius.xl,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "#E0E0E0",
  },
  filterWrapper: {
    paddingVertical: 16,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: 8,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  errorBanner: {
    backgroundColor: "#FF3B30",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  errorBannerText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  saleCard: {
    padding: 16,
    marginBottom: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  saleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  saleIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  saleId: {
    fontSize: 16,
    fontWeight: "700",
  },
  saleTime: {
    fontSize: 13,
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  paymentBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  saleDetails: {
    gap: 6,
  },
  saleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  saleLabel: {
    fontSize: 14,
  },
  saleTotal: {
    fontSize: 20,
    fontWeight: "800",
  },
  saleDiscount: {
    fontSize: 14,
    fontWeight: "600",
  },
  voidButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: "#FFEBEE",
  },
  voidButtonText: {
    color: "#FF3B30",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: radius.lg,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
