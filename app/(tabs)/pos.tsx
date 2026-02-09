/**
 * SmartStore POS Screen
 * Point of Sale checkout with product selection and cart
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore, useCartStore, useProductStore } from "@/store";
import type { PaymentMethod, Product } from "@/types";
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
    View,
} from "react-native";

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: "cash", label: "Cash", icon: "banknote" },
  { key: "card", label: "Card", icon: "creditcard" },
  { key: "gcash", label: "GCash", icon: "phone" },
  { key: "maya", label: "Maya", icon: "phone" },
];

export default function POSScreen() {
  const colorScheme = useColorScheme() ?? "light";
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
      style={[styles.productTile, { backgroundColor: colors.background }]}
      onPress={() => addItem(item)}
      activeOpacity={0.7}
    >
      <Text
        style={[styles.productTileName, { color: colors.text }]}
        numberOfLines={2}
      >
        {item.name}
      </Text>
      <Text style={[styles.productTilePrice, { color: colors.tint }]}>
        ₱{item.selling_price.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );

  // Render cart item
  const renderCartItem = ({ item }: { item: (typeof items)[0] }) => (
    <View style={[styles.cartItem, { borderBottomColor: colors.icon }]}>
      <View style={styles.cartItemInfo}>
        <Text
          style={[styles.cartItemName, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.product.name}
        </Text>
        <Text style={[styles.cartItemPrice, { color: colors.icon }]}>
          ₱{item.unitPrice.toFixed(2)} × {item.quantity}
        </Text>
      </View>
      <View style={styles.cartItemActions}>
        <Text style={[styles.cartItemTotal, { color: colors.tint }]}>
          ₱{(item.unitPrice * item.quantity).toFixed(2)}
        </Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => decrementQuantity(item.product.id)}
          >
            <IconSymbol name="minus" size={14} color={colors.tint} />
          </TouchableOpacity>
          <Text style={[styles.quantityText, { color: colors.text }]}>
            {item.quantity}
          </Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => incrementQuantity(item.product.id)}
          >
            <IconSymbol name="plus" size={14} color={colors.tint} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => removeItem(item.product.id)}>
          <IconSymbol name="trash" size={18} color="#FF4444" />
        </TouchableOpacity>
      </View>
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Point of Sale
        </Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={clearCart}>
            <Text style={{ color: "#FF4444", fontWeight: "600" }}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.mainContent}>
        {/* Products Section */}
        <View style={styles.productsSection}>
          {/* Search Bar */}
          <View style={[styles.searchContainer, { borderColor: colors.icon }]}>
            <IconSymbol name="magnifyingglass" size={18} color={colors.icon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search products..."
              placeholderTextColor={colors.icon}
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
                <IconSymbol name="cart" size={40} color={colors.icon} />
                <Text style={[styles.emptyText, { color: colors.icon }]}>
                  No products available
                </Text>
              </View>
            }
          />
        </View>

        {/* Cart Section */}
        <View
          style={[
            styles.cartSection,
            { backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "#F8F8F8" },
          ]}
        >
          <Text style={[styles.cartTitle, { color: colors.text }]}>
            Cart ({itemCount()})
          </Text>

          {items.length === 0 ? (
            <View style={styles.emptyCart}>
              <IconSymbol name="cart" size={32} color={colors.icon} />
              <Text style={[styles.emptyCartText, { color: colors.icon }]}>
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
              <View style={styles.cartSummary}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.icon }]}>
                    Subtotal
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    ₱{subtotal().toFixed(2)}
                  </Text>
                </View>
                {totalDiscount() > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.icon }]}>
                      Discount
                    </Text>
                    <Text style={[styles.summaryValue, { color: "#FF4444" }]}>
                      -₱{totalDiscount().toFixed(2)}
                    </Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>
                    TOTAL
                  </Text>
                  <Text style={[styles.totalValue, { color: colors.tint }]}>
                    ₱{total().toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Checkout Button */}
              <TouchableOpacity
                style={[
                  styles.checkoutButton,
                  { backgroundColor: colors.tint },
                ]}
                onPress={() => setShowCheckout(true)}
              >
                <IconSymbol name="creditcard" size={20} color="#FFFFFF" />
                <Text style={styles.checkoutButtonText}>Checkout</Text>
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
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCheckout(false)}>
              <IconSymbol name="xmark" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Checkout
            </Text>
            <View style={{ width: 24 }} />
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
                  paymentMethod === method.key && {
                    backgroundColor: colors.tint,
                    borderColor: colors.tint,
                  },
                ]}
                onPress={() => setPaymentMethod(method.key)}
              >
                <Text
                  style={[
                    styles.paymentOptionText,
                    paymentMethod === method.key && { color: "#FFFFFF" },
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
          <View style={[styles.amountInput, { borderColor: colors.icon }]}>
            <Text style={[styles.currencyPrefix, { color: colors.icon }]}>
              ₱
            </Text>
            <TextInput
              style={[styles.amountTextInput, { color: colors.text }]}
              placeholder="0.00"
              placeholderTextColor={colors.icon}
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
                style={styles.quickAmountButton}
                onPress={() => handleQuickAmount(amount)}
              >
                <Text style={styles.quickAmountText}>₱{amount}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.quickAmountButton,
                { backgroundColor: colors.tint },
              ]}
              onPress={() => handleQuickAmount(total())}
            >
              <Text style={[styles.quickAmountText, { color: "#FFFFFF" }]}>
                Exact
              </Text>
            </TouchableOpacity>
          </View>

          {/* Change Display */}
          <View style={styles.changeDisplay}>
            <Text style={[styles.changeLabel, { color: colors.icon }]}>
              Change
            </Text>
            <Text
              style={[
                styles.changeValue,
                { color: changeAmount() >= 0 ? "#4CAF50" : "#FF4444" },
              ]}
            >
              ₱{changeAmount().toFixed(2)}
            </Text>
          </View>

          {/* Complete Sale Button */}
          <TouchableOpacity
            style={[
              styles.completeSaleButton,
              { backgroundColor: changeAmount() >= 0 ? colors.tint : "#CCC" },
            ]}
            onPress={handleCheckout}
            disabled={isProcessing || changeAmount() < 0}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.completeSaleText}>Complete Sale</Text>
              </>
            )}
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  mainContent: {
    flex: 1,
    flexDirection: "row",
  },
  productsSection: {
    flex: 1,
    padding: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  productsGrid: {
    gap: 8,
  },
  productTile: {
    flex: 1,
    margin: 4,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    minHeight: 80,
    justifyContent: "space-between",
  },
  productTileName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  productTilePrice: {
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyProducts: {
    alignItems: "center",
    paddingTop: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  cartSection: {
    width: 280,
    padding: 12,
    borderTopLeftRadius: 20,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  emptyCart: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  emptyCartText: {
    fontSize: 14,
  },
  cartList: {
    flex: 1,
  },
  cartItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  cartItemInfo: {
    marginBottom: 6,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: "500",
  },
  cartItemPrice: {
    fontSize: 12,
  },
  cartItemActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cartItemTotal: {
    fontSize: 14,
    fontWeight: "600",
    minWidth: 60,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "600",
    minWidth: 20,
    textAlign: "center",
  },
  cartSummary: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  checkoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
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
    marginBottom: 30,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  paymentMethods: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  paymentOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F8F8F8",
  },
  paymentOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  amountInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  currencyPrefix: {
    fontSize: 20,
    marginRight: 4,
  },
  amountTextInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: "600",
  },
  quickAmounts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  quickAmountButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  changeDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    marginBottom: 24,
  },
  changeLabel: {
    fontSize: 16,
  },
  changeValue: {
    fontSize: 28,
    fontWeight: "bold",
  },
  completeSaleButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeSaleText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
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
