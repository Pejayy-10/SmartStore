/**
 * SmartStore Sales History Screen
 * View sales history with filtering and daily summaries
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore, useSalesStore } from "@/store";
import type { PaymentMethod, Sale } from "@/types";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

type FilterPeriod = "today" | "week" | "month" | "all";

export default function SalesScreen() {
  const colorScheme = useColorScheme() ?? "light";
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

  // Initialize database on mount
  useEffect(() => {
    if (!isInitialized && !isInitializing) {
      initialize();
    }
  }, [isInitialized, isInitializing, initialize]);

  // Fetch sales and summary based on filter
  useEffect(() => {
    if (isInitialized) {
      loadSales();
    }
  }, [isInitialized, filterPeriod]);

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

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSales();
    setRefreshing(false);
  }, [loadSales]);

  // Handle void sale
  const handleVoidSale = useCallback(
    (sale: Sale) => {
      Alert.alert(
        "Void Sale",
        `Are you sure you want to void this sale of ₱${sale.total.toFixed(2)}? This action cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Void",
            style: "destructive",
            onPress: async () => {
              const success = await voidSale(sale.id);
              if (success) {
                Alert.alert("Success", "Sale has been voided");
                loadSales();
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

  // Payment method badge
  const getPaymentColor = (method: PaymentMethod) => {
    const colors: Record<PaymentMethod, string> = {
      cash: "#4CAF50",
      card: "#2196F3",
      gcash: "#1E88E5",
      maya: "#7B1FA2",
      other: "#9E9E9E",
    };
    return colors[method] || "#9E9E9E";
  };

  // Render sale item
  const renderSale = ({ item }: { item: Sale }) => (
    <View style={[styles.saleCard, { backgroundColor: colors.background }]}>
      <View style={styles.saleHeader}>
        <View>
          <Text style={[styles.saleTime, { color: colors.text }]}>
            {formatTime(item.created_at)}
          </Text>
          <Text style={[styles.saleDate, { color: colors.icon }]}>
            {formatDate(item.created_at)}
          </Text>
        </View>
        <View
          style={[
            styles.paymentBadge,
            { backgroundColor: getPaymentColor(item.payment_method) },
          ]}
        >
          <Text style={styles.paymentText}>
            {item.payment_method.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.saleDetails}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.icon }]}>
            Subtotal
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            ₱{item.subtotal.toFixed(2)}
          </Text>
        </View>
        {item.discount_amount > 0 && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.icon }]}>
              Discount
            </Text>
            <Text style={[styles.discountValue]}>
              -₱{item.discount_amount.toFixed(2)}
            </Text>
          </View>
        )}
        <View style={[styles.detailRow, styles.totalRow]}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
          <Text style={[styles.totalValue, { color: colors.tint }]}>
            ₱{item.total.toFixed(2)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.voidButton}
        onPress={() => handleVoidSale(item)}
      >
        <IconSymbol name="xmark.circle" size={16} color="#FF4444" />
        <Text style={styles.voidText}>Void</Text>
      </TouchableOpacity>
    </View>
  );

  // Show loading state
  if (isInitializing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Initializing...
        </Text>
      </View>
    );
  }

  // Show init error
  if (initError) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <IconSymbol name="exclamationmark.triangle" size={48} color="#FF4444" />
        <Text style={[styles.errorText, { color: colors.text }]}>
          {initError}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={initialize}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate totals
  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  const totalTransactions = sales.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Sales</Text>
      </View>

      {/* Summary Card */}
      <View
        style={[
          styles.summaryCard,
          { backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "#F8F8F8" },
        ]}
      >
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>
            {filterPeriod === "today" ? "Today's Sales" : "Period Sales"}
          </Text>
          <Text style={[styles.summaryValue, { color: colors.tint }]}>
            ₱{totalSales.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>
            Transactions
          </Text>
          <Text style={[styles.summaryCount, { color: colors.text }]}>
            {totalTransactions}
          </Text>
        </View>
        {dailySummary && filterPeriod === "today" && (
          <>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.icon }]}>
                Avg. Sale
              </Text>
              <Text style={[styles.summaryCount, { color: colors.text }]}>
                ₱
                {totalTransactions > 0
                  ? (totalSales / totalTransactions).toFixed(2)
                  : "0.00"}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Period Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {(["today", "week", "month", "all"] as FilterPeriod[]).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.filterChip,
              filterPeriod === period && { backgroundColor: colors.tint },
            ]}
            onPress={() => setFilterPeriod(period)}
          >
            <Text
              style={[
                styles.filterText,
                filterPeriod === period && { color: "#FFFFFF" },
              ]}
            >
              {period === "today"
                ? "Today"
                : period === "week"
                  ? "This Week"
                  : period === "month"
                    ? "This Month"
                    : "All Time"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color={colors.tint} />
            ) : (
              <>
                <IconSymbol name="doc.text" size={48} color={colors.icon} />
                <Text style={[styles.emptyText, { color: colors.icon }]}>
                  No sales yet
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                  Make your first sale in the POS tab
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
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  summaryCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 8,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "bold",
  },
  summaryCount: {
    fontSize: 20,
    fontWeight: "600",
  },
  filterScroll: {
    maxHeight: 50,
    marginBottom: 12,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  errorBanner: {
    backgroundColor: "#FF4444",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  saleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  saleTime: {
    fontSize: 16,
    fontWeight: "600",
  },
  saleDate: {
    fontSize: 13,
    marginTop: 2,
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  paymentText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  saleDetails: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
  },
  discountValue: {
    fontSize: 14,
    color: "#FF4444",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  voidButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#FFF0F0",
    gap: 6,
  },
  voidText: {
    color: "#FF4444",
    fontWeight: "500",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#0A84FF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
