/**
 * SmartStore Ingredients (Stock) Screen
 * Inventory management with professional UI
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, brand, radius, shadows, spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useIngredientStore, useSettingsStore } from "@/store";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function IngredientsScreen() {
  const router = useRouter();
  const systemColorScheme = useColorScheme() ?? "light";
  const { themeMode } = useSettingsStore();
  const colorScheme = themeMode === "system" ? systemColorScheme : themeMode;
  const colors = Colors[colorScheme];

  const { ingredients, isLoading, fetchIngredients, updateStock } =
    useIngredientStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Stock modal state
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [stockModalType, setStockModalType] = useState<"in" | "out">("in");
  const [stockModalIngredient, setStockModalIngredient] = useState<any>(null);
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockNote, setStockNote] = useState("");

  // Initial fetch
  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchIngredients();
    setRefreshing(false);
  }, [fetchIngredients]);

  const handleEdit = (ingredient: any) => {
    router.push({
      pathname: "/ingredients/[id]",
      params: { id: ingredient.id },
    });
  };

  const handleAdd = () => {
    router.push("/ingredients/add");
  };

  const openStockModal = (ingredient: any, type: "in" | "out") => {
    setStockModalIngredient(ingredient);
    setStockModalType(type);
    setStockQuantity("");
    setStockNote("");
    setStockModalVisible(true);
  };

  const handleStockAdjust = useCallback(async () => {
    const qty = parseFloat(stockQuantity) || 0;
    if (qty <= 0) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }

    const change = stockModalType === "in" ? qty : -qty;
    const success = await updateStock(stockModalIngredient.id, change);

    if (success) {
      setStockModalVisible(false);
      await fetchIngredients();
    } else {
      Alert.alert("Error", "Failed to update stock");
    }
  }, [
    stockQuantity,
    stockModalType,
    stockModalIngredient,
    updateStock,
    fetchIngredients,
  ]);

  // Filter ingredients
  const filteredIngredients = useMemo(() => {
    if (!searchQuery.trim()) return ingredients;
    return ingredients.filter((i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [ingredients, searchQuery]);

  // Statistics
  const lowStockCount = useMemo(() => {
    return ingredients.filter(
      (i) => i.quantity_in_stock <= i.low_stock_threshold,
    ).length;
  }, [ingredients]);

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isLowStock = item.quantity_in_stock <= item.low_stock_threshold;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 30).springify()}
        style={{ marginBottom: spacing.md }}
      >
        <TouchableOpacity
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            shadows.soft,
            isLowStock && { borderColor: "#FF3B30", borderWidth: 1 },
          ]}
          onPress={() => handleEdit(item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardContent}>
            <View style={styles.itemInfo}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isLowStock
                      ? "#FFE5E5"
                      : brand.primaryFaded,
                  },
                ]}
              >
                <IconSymbol
                  name={
                    isLowStock
                      ? "exclamationmark.triangle.fill"
                      : "cube.box.fill"
                  }
                  size={20}
                  color={isLowStock ? "#FF3B30" : brand.primary}
                />
              </View>
              <View>
                <Text style={[styles.itemName, { color: colors.text }]}>
                  {item.name}
                </Text>
                <Text
                  style={[styles.itemSupplier, { color: colors.textSecondary }]}
                >
                  {item.supplier || "Unknown Supplier"}
                </Text>
              </View>
            </View>

            <View style={styles.stockInfo}>
              <Text
                style={[
                  styles.stockValue,
                  { color: isLowStock ? "#FF3B30" : colors.text },
                ]}
              >
                {item.quantity_in_stock} {item.unit}
              </Text>
              <Text style={[styles.costValue, { color: colors.textTertiary }]}>
                ₱{item.cost_per_unit.toFixed(2)}/{item.unit}
              </Text>
            </View>
          </View>

          {/* Progress Bar for Stock */}
          <View
            style={[styles.progressBarBg, { backgroundColor: colors.border }]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min((item.quantity_in_stock / (item.low_stock_threshold * 3)) * 100, 100)}%`,
                  backgroundColor: isLowStock ? "#FF3B30" : "#34C759",
                },
              ]}
            />
          </View>

          {/* Quick Stock Buttons */}
          <View style={styles.stockButtons}>
            <TouchableOpacity
              style={[styles.stockBtn, { backgroundColor: "#E8F5E9" }]}
              onPress={(e) => {
                e.stopPropagation();
                openStockModal(item, "in");
              }}
            >
              <IconSymbol name="plus" size={14} color="#2E7D32" />
              <Text style={[styles.stockBtnText, { color: "#2E7D32" }]}>
                Stock In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stockBtn, { backgroundColor: "#FFE5E5" }]}
              onPress={(e) => {
                e.stopPropagation();
                openStockModal(item, "out");
              }}
            >
              <IconSymbol name="minus" size={14} color="#FF3B30" />
              <Text style={[styles.stockBtnText, { color: "#FF3B30" }]}>
                Stock Out
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
          <Text style={styles.title}>Inventory</Text>
          <TouchableOpacity
            style={[styles.addButton, shadows.soft]}
            onPress={handleAdd}
          >
            <IconSymbol name="plus" size={20} color={brand.primary} />
            <Text style={styles.addButtonText}>Stock In</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statBadge,
              { backgroundColor: "rgba(255,255,255,0.2)" },
            ]}
          >
            <Text style={styles.statLabel}>Total Items</Text>
            <Text style={styles.statValue}>{ingredients.length}</Text>
          </View>
          <View
            style={[
              styles.statBadge,
              {
                backgroundColor:
                  lowStockCount > 0 ? "#FF3B30" : "rgba(255,255,255,0.2)",
              },
            ]}
          >
            <Text style={styles.statLabel}>Low Stock</Text>
            <Text style={styles.statValue}>{lowStockCount}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.background },
            shadows.soft,
          ]}
        >
          <IconSymbol
            name="magnifyingglass"
            size={18}
            color={colors.textTertiary}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search ingredients..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </LinearGradient>

      {/* List */}
      <FlatList
        data={filteredIngredients}
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
                name="cube.box.fill"
                size={48}
                color={colors.textTertiary}
              />
              <Text
                style={[styles.emptyStateText, { color: colors.textSecondary }]}
              >
                Inventory is empty
              </Text>
            </View>
          ) : null
        }
      />

      {/* Stock Adjustment Modal */}
      <Modal
        visible={stockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStockModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.stockModal,
              { backgroundColor: colors.card },
              shadows.soft,
            ]}
          >
            <Text style={[styles.stockModalTitle, { color: colors.text }]}>
              {stockModalType === "in" ? "Stock In" : "Stock Out"}
            </Text>
            {stockModalIngredient && (
              <Text
                style={[styles.stockModalSub, { color: colors.textSecondary }]}
              >
                {stockModalIngredient.name} — Current:{" "}
                {stockModalIngredient.quantity_in_stock}{" "}
                {stockModalIngredient.unit_type}
              </Text>
            )}

            <View
              style={[
                styles.stockModalInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <TextInput
                style={[styles.stockModalValue, { color: colors.text }]}
                placeholder="Quantity"
                placeholderTextColor={colors.textTertiary}
                value={stockQuantity}
                onChangeText={setStockQuantity}
                keyboardType="decimal-pad"
                autoFocus
              />
              {stockModalIngredient && (
                <Text
                  style={[
                    styles.stockModalUnit,
                    { color: colors.textSecondary },
                  ]}
                >
                  {stockModalIngredient.unit_type}
                </Text>
              )}
            </View>

            <TextInput
              style={[
                styles.stockModalNote,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Note (optional)"
              placeholderTextColor={colors.textTertiary}
              value={stockNote}
              onChangeText={setStockNote}
            />

            <View style={styles.stockModalActions}>
              <TouchableOpacity
                style={[
                  styles.stockModalBtn,
                  { backgroundColor: colors.background },
                ]}
                onPress={() => setStockModalVisible(false)}
              >
                <Text
                  style={[styles.stockModalBtnText, { color: colors.text }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.stockModalBtn,
                  {
                    backgroundColor:
                      stockModalType === "in" ? "#2E7D32" : "#FF3B30",
                  },
                ]}
                onPress={handleStockAdjust}
              >
                <Text style={[styles.stockModalBtnText, { color: "#FFFFFF" }]}>
                  {stockModalType === "in" ? "Add Stock" : "Remove Stock"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    gap: 6,
  },
  addButtonText: {
    color: brand.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statBadge: {
    flex: 1,
    padding: 12,
    borderRadius: radius.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
    opacity: 0.9,
  },
  statValue: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 18,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 48,
    borderRadius: radius.full,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  card: {
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
  },
  itemSupplier: {
    fontSize: 12,
  },
  stockInfo: {
    alignItems: "flex-end",
  },
  stockValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  costValue: {
    fontSize: 12,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
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
  stockButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  stockBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: radius.md,
    gap: 6,
  },
  stockBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  stockModal: {
    width: "100%",
    borderRadius: radius.xl,
    padding: 24,
    gap: 16,
  },
  stockModalTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  stockModalSub: {
    fontSize: 14,
    textAlign: "center",
  },
  stockModalInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  stockModalValue: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  stockModalUnit: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  stockModalNote: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  stockModalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  stockModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: "center",
  },
  stockModalBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
