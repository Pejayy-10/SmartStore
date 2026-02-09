/**
 * SmartStore POS Screen
 * Professional Point of Sale checkout with orange theme
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, brand, radius, shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    useAppStore,
    useCartStore,
    useProductStore,
    useSettingsStore,
} from "@/store";
import type { PaymentMethod, Product } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: "cash", label: "Cash", icon: "banknote" },
  { key: "card", label: "Card", icon: "creditcard" },
  { key: "gcash", label: "GCash", icon: "phone" },
  { key: "maya", label: "Maya", icon: "phone" },
];

export default function POSScreen() {
  const systemColorScheme = useColorScheme() ?? "light";
  const { themeMode } = useSettingsStore();
  const colorScheme = themeMode === "system" ? systemColorScheme : themeMode;
  const colors = Colors[colorScheme];

  const [searchQuery, setSearchQuery] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [amountInput, setAmountInput] = useState("");

  // App store for initialization
  const { isInitialized, isInitializing, initialize, initError } =
    useAppStore();

  // Product store
  const { products, fetchForPOS } = useProductStore();

  // Cart store
  const {
    items,
    paymentMethod,
    isProcessing,
    subtotal,
    totalDiscount,
    total,
    changeAmount,
    itemCount,
    addItem,
    removeItem,
    incrementQuantity,
    decrementQuantity,
    setPaymentMethod,
    setAmountReceived,
    clearCart,
    checkout,
  } = useCartStore();

  // Initialize database on mount
  useEffect(() => {
    if (!isInitialized && !isInitializing) {
      initialize();
    }
  }, [isInitialized, isInitializing, initialize]);

  // Fetch products for POS when initialized
  useEffect(() => {
    if (isInitialized) {
      fetchForPOS();
    }
  }, [isInitialized, fetchForPOS]);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query),
    );
  }, [products, searchQuery]);

  // Handle amount input
  const handleAmountChange = useCallback(
    (value: string) => {
      setAmountInput(value);
      const amount = parseFloat(value) || 0;
      setAmountReceived(amount);
    },
    [setAmountReceived],
  );

  // Quick amount buttons
  const handleQuickAmount = useCallback(
    (amount: number) => {
      setAmountInput(amount.toString());
      setAmountReceived(amount);
    },
    [setAmountReceived],
  );

  // Handle checkout
  const handleCheckout = useCallback(async () => {
    try {
      await checkout();
      setShowCheckout(false);
      setAmountInput("");
      Alert.alert("Success", "Sale completed successfully!");
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Checkout failed",
      );
    }
  }, [checkout]);

  // Render product grid item
  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[
        styles.productTile,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        shadows.soft,
      ]}
      onPress={() => addItem(item)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.productCategory,
          { backgroundColor: brand.primaryFaded },
        ]}
      >
        <Text style={[styles.productCategoryText, { color: brand.primary }]}>
          {item.category}
        </Text>
      </View>
      <Text
        style={[styles.productTileName, { color: colors.text }]}
        numberOfLines={2}
      >
        {item.name}
      </Text>
      <Text style={[styles.productTilePrice, { color: brand.primary }]}>
        ₱{item.selling_price.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );

  // Render cart item
  const renderCartItem = ({ item }: { item: (typeof items)[0] }) => (
    <View style={[styles.cartItem, { borderBottomColor: colors.border }]}>
      <View style={styles.cartItemInfo}>
        <Text
          style={[styles.cartItemName, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.product.name}
        </Text>
        <Text style={[styles.cartItemPrice, { color: colors.textSecondary }]}>
          ₱{item.unitPrice.toFixed(2)} × {item.quantity}
        </Text>
      </View>
      <View style={styles.cartItemActions}>
        <Text style={[styles.cartItemTotal, { color: brand.primary }]}>
          ₱{(item.unitPrice * item.quantity).toFixed(2)}
        </Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={[
              styles.quantityButton,
              { backgroundColor: colors.background },
            ]}
            onPress={() => decrementQuantity(item.product.id)}
          >
            <IconSymbol name="minus" size={14} color={brand.primary} />
          </TouchableOpacity>
          <Text style={[styles.quantityText, { color: colors.text }]}>
            {item.quantity}
          </Text>
          <TouchableOpacity
            style={[
              styles.quantityButton,
              { backgroundColor: brand.primaryFaded },
            ]}
            onPress={() => incrementQuantity(item.product.id)}
          >
            <IconSymbol name="plus" size={14} color={brand.primary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => removeItem(item.product.id)}>
          <IconSymbol name="trash" size={18} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Show loading state
  if (isInitializing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={brand.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading products...
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
        <View style={styles.headerContent}>
          <Text style={styles.title}>Point of Sale</Text>
          {items.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearCart}>
              <Text style={styles.clearButtonText}>Clear Cart</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <View style={styles.mainContent}>
        {/* Products Section */}
        <View style={styles.productsSection}>
          {/* Search Bar */}
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
              shadows.soft,
            ]}
          >
            <IconSymbol name="magnifyingglass" size={18} color={colors.icon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search products..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Products Grid */}
          <FlatList
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.productsGrid}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyProducts}>
                <IconSymbol name="cart" size={48} color={colors.icon} />
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  No products available
                </Text>
                <Text
                  style={[styles.emptySubtext, { color: colors.textTertiary }]}
                >
                  Add products in the Products tab
                </Text>
              </View>
            }
          />
        </View>

        {/* Cart Section */}
        <View
          style={[
            styles.cartSection,
            { backgroundColor: colors.card },
            shadows.medium,
          ]}
        >
          <View style={styles.cartHeader}>
            <IconSymbol name="cart.fill" size={20} color={brand.primary} />
            <Text style={[styles.cartTitle, { color: colors.text }]}>
              Cart ({itemCount()})
            </Text>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyCart}>
              <IconSymbol name="cart" size={40} color={colors.icon} />
              <Text
                style={[styles.emptyCartText, { color: colors.textSecondary }]}
              >
                Tap products to add
              </Text>
            </View>
          ) : (
            <>
              <FlatList
                data={items}
                renderItem={renderCartItem}
                keyExtractor={(item) => item.product.id.toString()}
                style={styles.cartList}
                showsVerticalScrollIndicator={false}
              />

              {/* Cart Summary */}
              <View
                style={[styles.cartSummary, { borderTopColor: colors.border }]}
              >
                <View style={styles.summaryRow}>
                  <Text
                    style={[
                      styles.summaryLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Subtotal
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    ₱{subtotal().toFixed(2)}
                  </Text>
                </View>
                {totalDiscount() > 0 && (
                  <View style={styles.summaryRow}>
                    <Text
                      style={[
                        styles.summaryLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Discount
                    </Text>
                    <Text style={[styles.summaryValue, { color: "#34C759" }]}>
                      -₱{totalDiscount().toFixed(2)}
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.summaryRow,
                    styles.totalRow,
                    { borderTopColor: colors.border },
                  ]}
                >
                  <Text style={[styles.totalLabel, { color: colors.text }]}>
                    TOTAL
                  </Text>
                  <Text style={[styles.totalValue, { color: brand.primary }]}>
                    ₱{total().toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Checkout Button */}
              <TouchableOpacity
                style={[styles.checkoutButton, shadows.glow]}
                onPress={() => setShowCheckout(true)}
              >
                <LinearGradient
                  colors={[brand.primary, brand.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.checkoutButtonGradient}
                >
                  <IconSymbol name="creditcard" size={20} color="#FFFFFF" />
                  <Text style={styles.checkoutButtonText}>Checkout</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Checkout Modal */}
      <Modal
        visible={showCheckout}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCheckout(false)}
      >
        <View
          style={[styles.checkoutModal, { backgroundColor: colors.background }]}
        >
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <TouchableOpacity onPress={() => setShowCheckout(false)}>
              <IconSymbol name="xmark" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Checkout
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Total Display */}
          <View
            style={[
              styles.totalDisplay,
              { backgroundColor: brand.primaryFaded },
            ]}
          >
            <Text style={[styles.totalDisplayLabel, { color: brand.primary }]}>
              Total Amount
            </Text>
            <Text style={[styles.totalDisplayValue, { color: brand.primary }]}>
              ₱{total().toFixed(2)}
            </Text>
          </View>

          {/* Payment Method */}
          <Text style={[styles.sectionLabel, { color: colors.text }]}>
            Payment Method
          </Text>
          <View style={styles.paymentMethods}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.key}
                style={[
                  styles.paymentOption,
                  {
                    backgroundColor: colors.card,
                    borderColor:
                      paymentMethod === method.key
                        ? brand.primary
                        : colors.border,
                    borderWidth: paymentMethod === method.key ? 2 : 1,
                  },
                  paymentMethod === method.key && shadows.soft,
                ]}
                onPress={() => setPaymentMethod(method.key)}
              >
                <Text
                  style={[
                    styles.paymentOptionText,
                    {
                      color:
                        paymentMethod === method.key
                          ? brand.primary
                          : colors.text,
                    },
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount */}
          <Text style={[styles.sectionLabel, { color: colors.text }]}>
            Amount Received
          </Text>
          <View
            style={[
              styles.amountInput,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.currencyPrefix, { color: brand.primary }]}>
              ₱
            </Text>
            <TextInput
              style={[styles.amountTextInput, { color: colors.text }]}
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              value={amountInput}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmounts}>
            {[100, 200, 500, 1000].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.quickAmountButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => handleQuickAmount(amount)}
              >
                <Text style={[styles.quickAmountText, { color: colors.text }]}>
                  ₱{amount}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.quickAmountButton,
                {
                  backgroundColor: brand.primaryFaded,
                  borderColor: brand.primary,
                },
              ]}
              onPress={() => handleQuickAmount(total())}
            >
              <Text
                style={[
                  styles.quickAmountText,
                  { color: brand.primary, fontWeight: "700" },
                ]}
              >
                Exact
              </Text>
            </TouchableOpacity>
          </View>

          {/* Change Display */}
          <View
            style={[
              styles.changeDisplay,
              { backgroundColor: changeAmount() >= 0 ? "#E8F5E9" : "#FFEBEE" },
            ]}
          >
            <Text
              style={[
                styles.changeLabel,
                { color: changeAmount() >= 0 ? "#2E7D32" : "#C62828" },
              ]}
            >
              Change
            </Text>
            <Text
              style={[
                styles.changeValue,
                { color: changeAmount() >= 0 ? "#2E7D32" : "#C62828" },
              ]}
            >
              ₱{Math.abs(changeAmount()).toFixed(2)}
            </Text>
          </View>

          {/* Complete Sale Button */}
          <TouchableOpacity
            style={[
              styles.completeSaleButton,
              changeAmount() >= 0 ? shadows.glow : {},
            ]}
            onPress={handleCheckout}
            disabled={isProcessing || changeAmount() < 0}
          >
            <LinearGradient
              colors={
                changeAmount() >= 0
                  ? [brand.primary, brand.primaryDark]
                  : ["#CCC", "#AAA"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.completeSaleGradient}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <IconSymbol
                    name="checkmark.circle.fill"
                    size={22}
                    color="#FFFFFF"
                  />
                  <Text style={styles.completeSaleText}>Complete Sale</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  clearButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  clearButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  mainContent: {
    flex: 1,
    flexDirection: "row",
  },
  productsSection: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  productsGrid: {
    gap: 12,
    paddingBottom: 20,
  },
  productTile: {
    flex: 1,
    margin: 4,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 110,
    justifyContent: "space-between",
  },
  productCategory: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginBottom: 8,
  },
  productCategoryText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  productTileName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  productTilePrice: {
    fontSize: 18,
    fontWeight: "800",
  },
  emptyProducts: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
  },
  cartSection: {
    width: 320,
    padding: 16,
    borderTopLeftRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
  },
  cartHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyCart: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyCartText: {
    fontSize: 15,
  },
  cartList: {
    flex: 1,
  },
  cartItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cartItemInfo: {
    marginBottom: 8,
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: "600",
  },
  cartItemPrice: {
    fontSize: 13,
    marginTop: 2,
  },
  cartItemActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cartItemTotal: {
    fontSize: 16,
    fontWeight: "700",
    minWidth: 80,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "700",
    minWidth: 24,
    textAlign: "center",
  },
  cartSummary: {
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  checkoutButton: {
    marginTop: 16,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  checkoutButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 10,
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  checkoutModal: {
    flex: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  totalDisplay: {
    padding: 20,
    borderRadius: radius.lg,
    alignItems: "center",
    marginBottom: 24,
  },
  totalDisplayLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  totalDisplayValue: {
    fontSize: 36,
    fontWeight: "800",
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  paymentMethods: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  paymentOption: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  paymentOptionText: {
    fontSize: 15,
    fontWeight: "600",
  },
  amountInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: "700",
    marginRight: 8,
  },
  amountTextInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 28,
    fontWeight: "700",
  },
  quickAmounts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  quickAmountButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  quickAmountText: {
    fontSize: 15,
    fontWeight: "600",
  },
  changeDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: radius.lg,
    marginBottom: 24,
  },
  changeLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  changeValue: {
    fontSize: 32,
    fontWeight: "800",
  },
  completeSaleButton: {
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  completeSaleGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    gap: 10,
  },
  completeSaleText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
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
