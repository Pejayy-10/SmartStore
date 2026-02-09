/**
 * SmartStore Ingredients Screen
 * List and manage ingredients with search and low stock alerts
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore, useIngredientStore } from "@/store";
import type { Ingredient } from "@/types";
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
  const colorScheme = useColorScheme() ?? "light";
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
        style={[styles.ingredientCard, { backgroundColor: colors.background }]}
        onPress={() => handleEdit(item)}
        activeOpacity={0.7}
      >
        <View style={styles.ingredientInfo}>
          <Text style={[styles.ingredientName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.ingredientDetails, { color: colors.icon }]}>
            {item.quantity_in_stock} {item.unit_type} • ₱
            {item.cost_per_unit.toFixed(2)}/{item.unit_type}
          </Text>
          {item.supplier && (
            <Text style={[styles.supplierText, { color: colors.icon }]}>
              Supplier: {item.supplier}
            </Text>
          )}
        </View>

        <View style={styles.ingredientActions}>
          {isLowStock && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>LOW</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={styles.deleteButton}
          >
            <IconSymbol name="trash" size={20} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Show loading state
  if (isInitializing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Initializing database...
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
        <Text style={[styles.title, { color: colors.text }]}>Ingredients</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.tint }]}
          onPress={handleAdd}
        >
          <IconSymbol name="plus" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View
        style={[styles.searchContainer, { backgroundColor: colors.background }]}
      >
        <IconSymbol name="magnifyingglass" size={20} color={colors.icon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search ingredients..."
          placeholderTextColor={colors.icon}
          value={searchQuery}
          onChangeText={searchIngredients}
        />
      </View>

      {/* Low Stock Alert */}
      {lowStockIngredients.length > 0 && (
        <View style={styles.alertBanner}>
          <IconSymbol
            name="exclamationmark.triangle"
            size={16}
            color="#FFFFFF"
          />
          <Text style={styles.alertText}>
            {lowStockIngredients.length} ingredient
            {lowStockIngredients.length > 1 ? "s" : ""} low on stock
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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color={colors.tint} />
            ) : (
              <>
                <IconSymbol name="leaf" size={48} color={colors.icon} />
                <Text style={[styles.emptyText, { color: colors.icon }]}>
                  No ingredients yet
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                  Tap "Add" to create your first ingredient
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 6,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF8C00",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  alertText: {
    color: "#FFFFFF",
    fontWeight: "600",
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
  dismissText: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  ingredientDetails: {
    fontSize: 14,
  },
  supplierText: {
    fontSize: 12,
    marginTop: 4,
  },
  ingredientActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  lowStockBadge: {
    backgroundColor: "#FF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lowStockText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  deleteButton: {
    padding: 8,
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
