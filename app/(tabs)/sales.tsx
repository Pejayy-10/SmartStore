/**
 * SmartStore Sales History Screen
 * Transaction log with tappable cards, detail modal, and void functionality
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, brand, radius, shadows, spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSalesStore, useSettingsStore } from "@/store";
import type { SaleWithItems } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInUp, SlideInDown } from "react-native-reanimated";

export default function SalesScreen() {
  const systemColorScheme = useColorScheme() ?? "light";
  const { themeMode } = useSettingsStore();
  const colorScheme = themeMode === "system" ? systemColorScheme : themeMode;
  const colors = Colors[colorScheme];

  const router = useRouter();
  const {
    sales,
    dailySummary,
    selectedSale,
    isLoading,
    fetchSales,
    fetchDailySummary,
    getSaleDetails,
    voidSale,
  } = useSalesStore();
  const [refreshing, setRefreshing] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    fetchSales();
    const today = new Date().toISOString().split("T")[0];
    fetchDailySummary(today);
  }, [fetchSales, fetchDailySummary]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSales();
    const today = new Date().toISOString().split("T")[0];
    await fetchDailySummary(today);
    setRefreshing(false);
  }, [fetchSales, fetchDailySummary]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatDetailDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSalePress = async (saleId: number) => {
    await getSaleDetails(saleId);
    setDetailModalVisible(true);
  };

  const handleVoidSale = (sale: SaleWithItems) => {
    Alert.alert(
      "Void Sale",
      `Are you sure you want to void Sale #${sale.id.toString().padStart(6, "0")}?\n\nTotal: ₱${(sale.total ?? (sale as any).total_amount ?? 0).toFixed(2)}\n\nThis will reverse any inventory deductions and remove the sale from records.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Void Sale",
          style: "destructive",
          onPress: async () => {
            const success = await voidSale(sale.id);
            if (success) {
              setDetailModalVisible(false);
              Alert.alert("Success", "Sale has been voided successfully.");
            } else {
              Alert.alert("Error", "Failed to void sale. Please try again.");
            }
          },
        },
      ],
    );
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "cash":
        return "banknote.fill" as const;
      case "card":
        return "creditcard.fill" as const;
      default:
        return "phone.fill" as const;
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const total = item.total ?? item.total_amount ?? 0;
    const saleDate = item.sale_date ?? item.created_at ?? "";
    const isVoided = item.status === "voided";

    return (
      <Animated.View
        entering={FadeInUp.delay(index * 20).springify()}
        style={{ marginBottom: spacing.sm }}
      >
        <TouchableOpacity
          style={[
            styles.saleCard,
            { backgroundColor: colors.card, borderColor: colors.border },
            shadows.soft,
            isVoided && { opacity: 0.5 },
          ]}
          onPress={() => handleSalePress(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.saleHeader}>
            <View style={styles.saleInfo}>
              <Text style={[styles.saleTime, { color: colors.textSecondary }]}>
                {formatTime(saleDate)}
              </Text>
              <Text style={[styles.saleDate, { color: colors.textTertiary }]}>
                {formatFullDate(saleDate)}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={[
                  styles.saleAmount,
                  { color: isVoided ? "#FF3B30" : brand.primary },
                  isVoided && { textDecorationLine: "line-through" },
                ]}
              >
                ₱{total.toFixed(2)}
              </Text>
              {isVoided && (
                <Text
                  style={{ fontSize: 10, color: "#FF3B30", fontWeight: "700" }}
                >
                  VOIDED
                </Text>
              )}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.saleDetails}>
            <View style={styles.paymentBadge}>
              <IconSymbol
                name={getPaymentIcon(item.payment_method)}
                size={12}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.paymentText, { color: colors.textSecondary }]}
              >
                {item.payment_method?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.saleFooterRight}>
              <Text
                style={[styles.transactionId, { color: colors.textTertiary }]}
              >
                #{item.id.toString().padStart(6, "0")}
              </Text>
              <IconSymbol
                name="chevron.right"
                size={14}
                color={colors.textTertiary}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ── Sale Detail Modal ──────────────────────────────────────────────
  const DetailModal = () => {
    if (!selectedSale) return null;

    const sale = selectedSale;
    const total = sale.total ?? (sale as any).total_amount ?? 0;
    const subtotal = sale.subtotal ?? (sale as any).subtotal_amount ?? total;
    const discount = sale.discount_amount ?? 0;
    const received = sale.amount_received ?? total;
    const change = sale.change_amount ?? 0;
    const saleDate = (sale as any).sale_date ?? sale.created_at ?? "";

    return (
      <Modal
        visible={detailModalVisible}
        animationType="none"
        transparent
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={SlideInDown.springify().damping(20)}
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalDragHandle}>
              <View
                style={[styles.dragBar, { backgroundColor: colors.border }]}
              />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {/* Receipt Header */}
              <View style={styles.receiptHeader}>
                <View
                  style={[
                    styles.receiptIconBox,
                    { backgroundColor: brand.primaryFaded },
                  ]}
                >
                  <IconSymbol
                    name="doc.text.fill"
                    size={28}
                    color={brand.primary}
                  />
                </View>
                <Text style={[styles.receiptTitle, { color: colors.text }]}>
                  Sale #{sale.id.toString().padStart(6, "0")}
                </Text>
                <Text
                  style={[styles.receiptDate, { color: colors.textSecondary }]}
                >
                  {formatDetailDate(saleDate)} • {formatTime(saleDate)}
                </Text>
              </View>

              {/* Payment Method Badge */}
              <View
                style={[
                  styles.paymentMethodCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.paymentMethodRow}>
                  <IconSymbol
                    name={getPaymentIcon(sale.payment_method)}
                    size={18}
                    color={brand.primary}
                  />
                  <Text
                    style={[styles.paymentMethodText, { color: colors.text }]}
                  >
                    {sale.payment_method?.toUpperCase()}
                  </Text>
                </View>
                {sale.notes ? (
                  <Text
                    style={[styles.saleNotes, { color: colors.textSecondary }]}
                  >
                    {sale.notes}
                  </Text>
                ) : null}
              </View>

              {/* Line Items */}
              <View
                style={[
                  styles.lineItemsCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.lineItemsTitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  ITEMS
                </Text>

                {sale.items && sale.items.length > 0 ? (
                  sale.items.map((lineItem, idx) => (
                    <View
                      key={lineItem.id ?? idx}
                      style={[
                        styles.lineItemRow,
                        idx < sale.items.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.lineItemLeft}>
                        <View
                          style={[
                            styles.lineItemQtyBadge,
                            { backgroundColor: brand.primaryFaded },
                          ]}
                        >
                          <Text
                            style={[
                              styles.lineItemQtyText,
                              { color: brand.primary },
                            ]}
                          >
                            {lineItem.quantity}×
                          </Text>
                        </View>
                        <View style={styles.lineItemInfo}>
                          <Text
                            style={[
                              styles.lineItemName,
                              { color: colors.text },
                            ]}
                            numberOfLines={1}
                          >
                            {lineItem.product?.name ?? "Unknown Product"}
                          </Text>
                          <Text
                            style={[
                              styles.lineItemUnitPrice,
                              { color: colors.textTertiary },
                            ]}
                          >
                            ₱{lineItem.unit_price.toFixed(2)} each
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.lineItemSubtotal,
                          { color: colors.text },
                        ]}
                      >
                        ₱{lineItem.subtotal.toFixed(2)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text
                    style={[styles.noItemsText, { color: colors.textTertiary }]}
                  >
                    No line items available
                  </Text>
                )}
              </View>

              {/* Totals Breakdown */}
              <View
                style={[
                  styles.totalsCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>
                    Subtotal
                  </Text>
                  <Text style={[styles.totalValue, { color: colors.text }]}>
                    ₱{subtotal.toFixed(2)}
                  </Text>
                </View>

                {discount > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: colors.text }]}>
                      Discount
                    </Text>
                    <Text style={[styles.totalValue, { color: "#FF3B30" }]}>
                      -₱{discount.toFixed(2)}
                    </Text>
                  </View>
                )}

                <View
                  style={[
                    styles.totalDivider,
                    { backgroundColor: colors.border },
                  ]}
                />

                <View style={styles.totalRow}>
                  <Text
                    style={[
                      styles.totalLabel,
                      { color: colors.text, fontWeight: "800", fontSize: 18 },
                    ]}
                  >
                    Total
                  </Text>
                  <Text
                    style={[
                      styles.totalValue,
                      {
                        color: brand.primary,
                        fontWeight: "800",
                        fontSize: 22,
                      },
                    ]}
                  >
                    ₱{total.toFixed(2)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.totalDivider,
                    { backgroundColor: colors.border },
                  ]}
                />

                <View style={styles.totalRow}>
                  <Text
                    style={[styles.totalLabel, { color: colors.textSecondary }]}
                  >
                    Received
                  </Text>
                  <Text
                    style={[styles.totalValue, { color: colors.textSecondary }]}
                  >
                    ₱{received.toFixed(2)}
                  </Text>
                </View>

                {change > 0 && (
                  <View style={styles.totalRow}>
                    <Text
                      style={[
                        styles.totalLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Change
                    </Text>
                    <Text style={[styles.totalValue, { color: "#34C759" }]}>
                      ₱{change.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setDetailModalVisible(false)}
                >
                  <Text
                    style={[styles.closeButtonText, { color: colors.text }]}
                  >
                    Close
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.voidButton}
                  onPress={() => handleVoidSale(sale)}
                >
                  <IconSymbol
                    name="xmark.circle.fill"
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.voidButtonText}>Void Sale</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[brand.primary, brand.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.title}>Sales History</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push("/reports" as any)}
        >
          <IconSymbol name="chart.pie.fill" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card },
            shadows.medium,
          ]}
        >
          <View
            style={[styles.iconBox, { backgroundColor: brand.primaryFaded }]}
          >
            <IconSymbol name="chart.bar.fill" size={20} color={brand.primary} />
          </View>
          <View>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Revenue
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ₱{dailySummary?.totalSales.toFixed(2) || "0.00"}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card },
            shadows.medium,
          ]}
        >
          <View style={[styles.iconBox, { backgroundColor: "#E8F5E9" }]}>
            <IconSymbol name="list.bullet" size={20} color="#2E7D32" />
          </View>
          <View>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Transactions
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {dailySummary?.transactionCount || 0}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={sales}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={brand.primary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <IconSymbol
                name="chart.bar.fill"
                size={48}
                color={colors.textTertiary}
              />
              <Text
                style={[styles.emptyStateText, { color: colors.textSecondary }]}
              >
                No sales recorded yet
              </Text>
            </View>
          ) : null
        }
      />

      {/* Sale Detail Modal */}
      <DetailModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    marginBottom: -20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  headerButton: {
    position: "absolute",
    right: 20,
    top: 60,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  saleCard: {
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
  },
  saleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  saleInfo: {
    gap: 2,
  },
  saleTime: {
    fontSize: 16,
    fontWeight: "700",
  },
  saleDate: {
    fontSize: 12,
  },
  saleAmount: {
    fontSize: 18,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  saleDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: "600",
  },
  saleFooterRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  transactionId: {
    fontSize: 12,
    fontFamily: "monospace",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
  },

  // ── Detail Modal Styles ──────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingHorizontal: 20,
  },
  modalDragHandle: {
    alignItems: "center",
    paddingVertical: 12,
  },
  dragBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },

  // Receipt Header
  receiptHeader: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  receiptIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  receiptTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  receiptDate: {
    fontSize: 14,
  },

  // Payment Method
  paymentMethodCard: {
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 12,
  },
  paymentMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  paymentMethodText: {
    fontSize: 15,
    fontWeight: "600",
  },
  saleNotes: {
    fontSize: 13,
    marginTop: 8,
    fontStyle: "italic",
  },

  // Line Items
  lineItemsCard: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 12,
  },
  lineItemsTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  lineItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  lineItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  lineItemQtyBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  lineItemQtyText: {
    fontSize: 14,
    fontWeight: "800",
  },
  lineItemInfo: {
    flex: 1,
    gap: 2,
  },
  lineItemName: {
    fontSize: 15,
    fontWeight: "600",
  },
  lineItemUnitPrice: {
    fontSize: 12,
  },
  lineItemSubtotal: {
    fontSize: 15,
    fontWeight: "700",
  },
  noItemsText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },

  // Totals
  totalsCard: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  totalLabel: {
    fontSize: 15,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  totalDivider: {
    height: 1,
    marginVertical: 8,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  closeButton: {
    flex: 1,
    height: 50,
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  voidButton: {
    flex: 1,
    height: 50,
    borderRadius: radius.lg,
    backgroundColor: "#FF3B30",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  voidButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
