/**
 * SmartStore POS Screen
 * Professional Point of Sale checkout with orange theme
 * Responsive layout for mobile and tablet
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { brand, Colors, radius, shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    useAppStore,
    useCartStore,
    useProductStore,
    useSettingsStore,
} from "@/store";
import type { PaymentMethod, Product } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: "cash", label: "Cash", icon: "banknote.fill" },
  { key: "card", label: "Card", icon: "creditcard.fill" },
  { key: "gcash", label: "GCash", icon: "phone.fill" },
  { key: "maya", label: "Maya", icon: "phone.fill" },
];

export default function POSScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768; // Simple breakpoint

  const systemColorScheme = useColorScheme() ?? "light";
  const { themeMode } = useSettingsStore();
  const colorScheme = themeMode === "system" ? systemColorScheme : themeMode;
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [amountInput, setAmountInput] = useState("");

  // App store
  const { isInitialized, isInitializing, initialize, initError } =
    useAppStore();
  const { products, fetchForPOS } = useProductStore();
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

  useEffect(() => {
    if (!isInitialized && !isInitializing) initialize();
  }, [isInitialized, isInitializing, initialize]);

  useEffect(() => {
    if (isInitialized) fetchForPOS();
  }, [isInitialized, fetchForPOS]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query),
    );
  }, [products, searchQuery]);

  const handleAmountChange = useCallback(
    (value: string) => {
      setAmountInput(value);
      setAmountReceived(parseFloat(value) || 0);
    },
    [setAmountReceived],
  );

  const handleQuickAmount = useCallback(
    (amount: number) => {
      setAmountInput(amount.toString());
      setAmountReceived(amount);
    },
    [setAmountReceived],
  );

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

  // Components
  const ProductCard = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[
        styles.productTile,
        { backgroundColor: colors.card, borderColor: colors.border },
        shadows.soft,
      ]}
      onPress={() => addItem(item)}
      activeOpacity={0.7}
    >
      {item.image_uri ? (
        <>
          <Image
            source={{ uri: item.image_uri }}
            style={styles.productTileImage}
          />
          <View style={styles.productTileOverlay} />
        </>
      ) : null}
      <View style={styles.productHeader}>
        <View
          style={[
            styles.productCategory,
            { backgroundColor: brand.primaryFaded },
          ]}
        >
          <Text style={[styles.productCategoryText, { color: brand.primary }]}>
            {item.category.slice(0, 10)}
          </Text>
        </View>
        <Text style={[styles.productPrice, { color: brand.primary }]}>
          ₱{item.selling_price.toFixed(0)}
        </Text>
      </View>
      <Text
        style={[
          styles.productName,
          { color: item.image_uri ? "#FFFFFF" : colors.text },
        ]}
        numberOfLines={2}
      >
        {item.name}
      </Text>
      {item.is_inventory_tracked && (
        <Text
          style={[
            styles.stockLabel,
            {
              color: item.image_uri
                ? "rgba(255,255,255,0.7)"
                : colors.textTertiary,
            },
          ]}
        >
          Tracked
        </Text>
      )}
    </TouchableOpacity>
  );

  const CartItem = ({ item }: { item: (typeof items)[0] }) => (
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
        <Text style={[styles.cartItemTotal, { color: brand.primary }]}>
          ₱{(item.unitPrice * item.quantity).toFixed(2)}
        </Text>
      </View>
    </View>
  );

  const CartView = () => (
    <View style={styles.cartContent}>
      <View style={styles.cartHeader}>
        <View style={styles.cartHeaderLeft}>
          <IconSymbol name="cart.fill" size={20} color={brand.primary} />
          <Text style={[styles.cartTitle, { color: colors.text }]}>
            Current Order ({itemCount()})
          </Text>
        </View>
        {items.length > 0 && (
          <TouchableOpacity onPress={clearCart}>
            <Text style={[styles.clearText, { color: "#FF3B30" }]}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyCart}>
          <IconSymbol name="cart" size={48} color={colors.icon} />
          <Text style={[styles.emptyCartText, { color: colors.textSecondary }]}>
            Cart is empty
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={({ item }) => <CartItem item={item} />}
          keyExtractor={(item) => item.product.id.toString()}
          style={styles.cartList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {items.length > 0 && (
        <View
          style={[
            styles.cartFooter,
            { backgroundColor: colors.card, borderTopColor: colors.border },
          ]}
        >
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: brand.primary }]}>
              ₱{total().toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.checkoutButton, shadows.glow]}
            onPress={() => {
              setShowCartModal(false);
              setShowCheckout(true);
            }}
          >
            <LinearGradient
              colors={[brand.primary, brand.primaryDark]}
              style={styles.checkoutGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.checkoutText}>
                Charge ₱{total().toFixed(2)}
              </Text>
              <IconSymbol
                name="arrow.right.circle.fill"
                size={20}
                color="#FFFFFF"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (isInitializing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={brand.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      {/* Header */}
      <LinearGradient
        colors={[brand.primary, brand.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>
            Point of Sale
          </Text>
          <TouchableOpacity onPress={() => router.push("/settings")}>
            <IconSymbol name="gearshape.fill" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View
          style={[styles.searchBar, { backgroundColor: colors.background }]}
        >
          <IconSymbol
            name="magnifyingglass"
            size={18}
            color={colors.textTertiary}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search products..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Product Grid */}
        <View style={styles.gridContainer}>
          <FlatList
            data={filteredProducts}
            renderItem={({ item }) => <ProductCard item={item} />}
            keyExtractor={(item) => item.id.toString()}
            numColumns={isTablet ? 3 : 2}
            contentContainerStyle={styles.gridContent}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Tablet Cart (Side Panel) */}
        {isTablet && (
          <View
            style={[
              styles.sidePanel,
              { backgroundColor: colors.card, borderLeftColor: colors.border },
            ]}
          >
            <CartView />
          </View>
        )}
      </View>

      {/* Mobile Floating Cart Button */}
      {!isTablet && items.length > 0 && (
        <Animated.View
          entering={SlideInDown.springify()}
          style={styles.floatingCartContainer}
        >
          <TouchableOpacity
            style={[styles.floatingCartButton, shadows.glow]}
            onPress={() => setShowCartModal(true)}
          >
            <LinearGradient
              colors={[brand.primary, brand.primaryDark]}
              style={styles.floatingCartGradient}
            >
              <View style={styles.cartCountBadge}>
                <Text style={styles.cartCountText}>{itemCount()}</Text>
              </View>
              <Text style={styles.viewCartText}>View Cart</Text>
              <Text style={styles.cartTotalText}>₱{total().toFixed(2)}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Mobile Cart Modal */}
      <Modal
        visible={showCartModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCartModal(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <View
            style={[styles.modalHandle, { backgroundColor: colors.border }]}
          />
          <CartView />
        </View>
      </Modal>

      {/* Checkout Modal (Global) */}
      <Modal
        visible={showCheckout}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowCheckout(false)}
      >
        <View
          style={[styles.checkoutModal, { backgroundColor: colors.background }]}
        >
          <View
            style={[
              styles.checkoutHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <TouchableOpacity onPress={() => setShowCheckout(false)}>
              <Text style={{ color: brand.primary, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.checkoutTitle, { color: colors.text }]}>
              Checkout
            </Text>
            <View style={{ width: 50 }} />
          </View>
          <View style={styles.checkoutBody}>
            <View
              style={[
                styles.totalDisplay,
                { backgroundColor: brand.primaryFaded },
              ]}
            >
              <Text style={[styles.totalLabelLarge, { color: brand.primary }]}>
                Total Amount
              </Text>
              <Text style={[styles.totalValueLarge, { color: brand.primary }]}>
                ₱{total().toFixed(2)}
              </Text>
            </View>

            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Payment Method
            </Text>
            <View style={styles.paymentGrid}>
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
                  ]}
                  onPress={() => setPaymentMethod(method.key)}
                >
                  {/* @ts-ignore - Ensure icons exist in IconSymbol */}
                  <IconSymbol
                    name={method.icon as any}
                    size={24}
                    color={
                      paymentMethod === method.key ? brand.primary : colors.text
                    }
                  />
                  <Text
                    style={[
                      styles.paymentText,
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

            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Amount Received
            </Text>
            <View
              style={[
                styles.amountInputContainer,
                { backgroundColor: colors.card, borderColor: brand.primary },
              ]}
            >
              <Text style={[styles.currencySymbol, { color: brand.primary }]}>
                ₱
              </Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                value={amountInput}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            <View style={styles.quickAmountGrid}>
              {[100, 500, 1000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.quickAmountChip,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleQuickAmount(amt)}
                >
                  <Text
                    style={[styles.quickAmountText, { color: colors.text }]}
                  >
                    ₱{amt}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.quickAmountChip,
                  {
                    backgroundColor: brand.primaryFaded,
                    borderColor: brand.primary,
                  },
                ]}
                onPress={() => handleQuickAmount(total())}
              >
                <Text
                  style={[styles.quickAmountText, { color: brand.primary }]}
                >
                  Exact
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.changeContainer,
                {
                  backgroundColor:
                    (parseFloat(amountInput) || 0) - total() >= 0
                      ? colors.card
                      : "#FFEBEE",
                },
              ]}
            >
              <Text
                style={[styles.changeLabel, { color: colors.textSecondary }]}
              >
                Change
              </Text>
              <Text
                style={[
                  styles.changeValue,
                  {
                    color:
                      (parseFloat(amountInput) || 0) - total() >= 0
                        ? brand.primary
                        : "#FF3B30",
                  },
                ]}
              >
                ₱{Math.abs((parseFloat(amountInput) || 0) - total()).toFixed(2)}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.checkoutFooter,
              {
                borderTopColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.completeButton,
                { opacity: changeAmount() >= 0 ? 1 : 0.5 },
              ]}
              onPress={handleCheckout}
              disabled={changeAmount() < 0 || isProcessing}
            >
              <LinearGradient
                colors={[brand.primary, brand.primaryDark]}
                style={styles.completeGradient}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.completeText}>Complete Sale</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: "800" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
    borderRadius: radius.md,
    marginTop: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16, height: "100%" },
  content: { flex: 1, flexDirection: "row" },
  gridContainer: { flex: 1 },
  gridContent: { padding: 12, paddingBottom: 100 },
  gridRow: { justifyContent: "space-between" },

  // Product Card
  productTile: {
    flex: 1,
    margin: 6,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 140,
    justifyContent: "space-between",
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  productCategory: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  productCategoryText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  productPrice: { fontSize: 16, fontWeight: "800" },
  productName: { fontSize: 15, fontWeight: "600", marginTop: 8 },
  stockLabel: { fontSize: 12, marginTop: 4 },

  // Side Panel (Tablet)
  sidePanel: { width: 350, borderLeftWidth: 1 },

  // Cart
  cartContent: { flex: 1 },
  cartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  cartHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  cartTitle: { fontSize: 18, fontWeight: "700" },
  clearText: { fontSize: 14, fontWeight: "600" },
  emptyCart: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyCartText: { fontSize: 16 },
  cartList: { flex: 1 },
  cartItem: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 16, fontWeight: "600" },
  cartItemPrice: { fontSize: 13, marginTop: 2 },
  cartItemActions: { alignItems: "flex-end", gap: 4 },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "600",
    minWidth: 20,
    textAlign: "center",
  },
  cartItemTotal: { fontSize: 15, fontWeight: "700" },

  // Cart Footer
  cartFooter: { padding: 16, borderTopWidth: 1 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  totalLabel: { fontSize: 18, fontWeight: "600" },
  totalValue: { fontSize: 24, fontWeight: "800" },
  checkoutButton: { borderRadius: radius.full, overflow: "hidden" },
  checkoutGradient: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  checkoutText: { color: "#FFF", fontSize: 18, fontWeight: "700" },

  // Floating Cart (Mobile)
  floatingCartContainer: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
  },
  floatingCartButton: { borderRadius: radius.full, overflow: "hidden" },
  floatingCartGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  cartCountBadge: {
    backgroundColor: "#FFF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  cartCountText: { color: brand.primary, fontWeight: "800", fontSize: 14 },
  viewCartText: { flex: 1, color: "#FFF", fontSize: 16, fontWeight: "600" },
  cartTotalText: { color: "#FFF", fontSize: 18, fontWeight: "800" },

  // Cart Modal
  modalContainer: { flex: 1, paddingTop: 12 },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },

  // Checkout Modal
  checkoutModal: { flex: 1 },
  checkoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    marginTop: 10,
  },
  checkoutTitle: { fontSize: 18, fontWeight: "700" },
  checkoutBody: { flex: 1, padding: 20 },
  totalDisplay: {
    padding: 24,
    borderRadius: radius.xl,
    alignItems: "center",
    marginBottom: 24,
  },
  totalLabelLarge: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  totalValueLarge: { fontSize: 40, fontWeight: "800", marginBottom: 4 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 12,
    marginTop: 12,
  },
  paymentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  paymentOption: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: radius.lg,
    gap: 8,
  },
  paymentText: { fontSize: 14, fontWeight: "600" },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: radius.xl,
    paddingHorizontal: 16,
    height: 60,
    marginTop: 8,
  },
  currencySymbol: { fontSize: 24, fontWeight: "800", marginRight: 8 },
  amountInput: { flex: 1, fontSize: 24, fontWeight: "700", height: "100%" },
  quickAmountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  quickAmountChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  quickAmountText: { fontWeight: "600" },
  changeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: radius.lg,
    marginTop: 24,
  },
  changeLabel: { fontSize: 16, fontWeight: "600" },
  changeValue: { fontSize: 20, fontWeight: "800" },
  checkoutFooter: { padding: 20, paddingBottom: 40, borderTopWidth: 1 },
  completeButton: { borderRadius: radius.full, overflow: "hidden" },
  completeGradient: { paddingVertical: 18, alignItems: "center" },
  completeText: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  productTileImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  productTileOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
});
