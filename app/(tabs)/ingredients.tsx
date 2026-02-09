/**
 * SmartStore Ingredients Screen
 * Professional design with orange theme
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, brand, radius, shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore, useIngredientStore, useSettingsStore } from "@/store";
import type { Ingredient } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function IngredientsScreen() {
  const router = useRouter();
  const systemColorScheme = useColorScheme() ?? "light";
  const { themeMode } = useSettingsStore();
  const colorScheme = themeMode === "system" ? systemColorScheme : themeMode;
  const colors = Colors[colorScheme];

  const [refreshing, setRefreshing] = useState(false);

  // App store for initialization
  const { isInitialized, isInitializing, initialize, initError } =
    useAppStore();

  // Ingredient store
  const {
    ingredients,
    lowStockIngredients,
    isLoading,
    error,
    searchQuery,
    fetchIngredients,
    fetchLowStock,
    searchIngredients,
    deleteIngredient,
    clearError,
  } = useIngredientStore();

  // Initialize database on mount
  useEffect(() => {
    if (!isInitialized && !isInitializing) {
      initialize();
    }
  }, [isInitialized, isInitializing, initialize]);

  // Fetch ingredients when initialized
  useEffect(() => {
    if (isInitialized) {
      fetchIngredients();
      fetchLowStock();
    }
  }, [isInitialized, fetchIngredients, fetchLowStock]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchIngredients();
    await fetchLowStock();
    setRefreshing(false);
  }, [fetchIngredients, fetchLowStock]);

  // Handle delete
  const handleDelete = useCallback(
    (ingredient: Ingredient) => {
      Alert.alert(
        "Delete Ingredient",
        `Are you sure you want to delete "${ingredient.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              const success = await deleteIngredient(ingredient.id);
              if (!success) {
                Alert.alert("Error", "Failed to delete ingredient");
              }
            },
          },
        ],
      );
    },
    [deleteIngredient],
  );

  // Handle add
  const handleAdd = useCallback(() => {
    router.push("/ingredients/add");
  }, [router]);

  // Handle edit
  const handleEdit = useCallback(
    (ingredient: Ingredient) => {
      router.push(`/ingredients/${ingredient.id}`);
    },
    [router],
  );

  // Render ingredient item
  const renderIngredient = ({ item }: { item: Ingredient }) => {
    const isLowStock = item.quantity_in_stock <= item.low_stock_threshold;

    return (
      <TouchableOpacity
        style={[
          styles.ingredientCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          shadows.soft,
        ]}
        onPress={() => handleEdit(item)}
        activeOpacity={0.7}
      >
        <View style={styles.ingredientInfo}>
          <View style={styles.ingredientHeader}>
            <Text style={[styles.ingredientName, { color: colors.text }]}>
              {item.name}
            </Text>
            {isLowStock && (
              <View style={styles.lowStockBadge}>
                <Text style={styles.lowStockText}>LOW</Text>
              </View>
            )}
          </View>
          <View style={styles.ingredientMeta}>
            <View
              style={[styles.metaChip, { backgroundColor: brand.primaryFaded }]}
            >
              <Text style={[styles.metaChipText, { color: brand.primary }]}>
                {item.quantity_in_stock} {item.unit_type}
              </Text>
            </View>
            <Text style={[styles.priceText, { color: colors.textSecondary }]}>
              ₱{item.cost_per_unit.toFixed(2)}/{item.unit_type}
            </Text>
          </View>
          {item.supplier && (
            <Text style={[styles.supplierText, { color: colors.textTertiary }]}>
              Supplier: {item.supplier}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => handleDelete(item)}
          style={styles.deleteButton}
        >
          <IconSymbol name="trash" size={18} color="#FF3B30" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
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
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Ingredients</Text>
            <Text style={styles.subtitle}>
              {ingredients.length} items in stock
            </Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <IconSymbol name="plus" size={20} color={brand.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
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
            placeholder="Search ingredients..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={searchIngredients}
          />
        </View>
      </View>

      {/* Low Stock Alert */}
      {lowStockIngredients.length > 0 && (
        <View style={[styles.alertBanner, shadows.soft]}>
          <IconSymbol
            name="exclamationmark.triangle"
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.alertText}>
            {lowStockIngredients.length} ingredient
            {lowStockIngredients.length > 1 ? "s" : ""} running low
          </Text>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <TouchableOpacity style={styles.errorBanner} onPress={clearError}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <Text style={styles.dismissText}>Tap to dismiss</Text>
        </TouchableOpacity>
      )}

      {/* Ingredients List */}
      <FlatList
        data={ingredients}
        renderItem={renderIngredient}
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
                    name="leaf.fill"
                    size={40}
                    color={brand.primary}
                  />
                </View>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  No ingredients yet
                </Text>
                <Text
                  style={[styles.emptySubtext, { color: colors.textSecondary }]}
                >
                  Tap the + button to add your first ingredient
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
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  searchWrapper: {
    padding: 16,
    marginTop: -12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF9500",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    gap: 10,
  },
  alertText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
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
  dismissText: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.8,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  ingredientCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginBottom: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  ingredientName: {
    fontSize: 17,
    fontWeight: "700",
  },
  ingredientMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metaChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  metaChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  priceText: {
    fontSize: 14,
  },
  supplierText: {
    fontSize: 12,
    marginTop: 8,
  },
  lowStockBadge: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  lowStockText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  deleteButton: {
    padding: 10,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
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
    paddingHorizontal: 40,
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
