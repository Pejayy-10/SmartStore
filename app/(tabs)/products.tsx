/**
 * SmartStore Products Screen
 * List and manage products with category filtering
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore, useProductStore } from "@/store";
import type { Product, ProductCategory } from "@/types";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const CATEGORIES: { key: ProductCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "food", label: "Food" },
  { key: "beverage", label: "Beverage" },
  { key: "dessert", label: "Dessert" },
  { key: "snack", label: "Snack" },
  { key: "other", label: "Other" },
];

export default function ProductsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    ProductCategory | "all"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  // App store for initialization
  const { isInitialized, isInitializing, initialize, initError } =
    useAppStore();

  // Product store
  const {
    products,
    isLoading,
    error,
    fetchProducts,
    fetchByCategory,
    searchProducts,
    deleteProduct,
    clearError,
  } = useProductStore();

  // Initialize database on mount
  useEffect(() => {
    if (!isInitialized && !isInitializing) {
      initialize();
    }
  }, [isInitialized, isInitializing, initialize]);

  // Fetch products when initialized or category changes
  useEffect(() => {
    if (isInitialized) {
      if (selectedCategory === "all") {
        fetchProducts();
      } else {
        fetchByCategory(selectedCategory);
      }
    }
  }, [isInitialized, selectedCategory, fetchProducts, fetchByCategory]);

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (query.trim()) {
        searchProducts(query);
      } else if (selectedCategory === "all") {
        fetchProducts();
      } else {
        fetchByCategory(selectedCategory);
      }
    },
    [selectedCategory, searchProducts, fetchProducts, fetchByCategory],
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (selectedCategory === "all") {
      await fetchProducts();
    } else {
      await fetchByCategory(selectedCategory);
    }
    setRefreshing(false);
  }, [selectedCategory, fetchProducts, fetchByCategory]);

  // Handle delete
  const handleDelete = useCallback(
    (product: Product) => {
      Alert.alert(
        "Delete Product",
        `Are you sure you want to delete "${product.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              const success = await deleteProduct(product.id);
              if (!success) {
                Alert.alert("Error", "Failed to delete product");
              }
            },
          },
        ],
      );
    },
    [deleteProduct],
  );

  // Handle add
  const handleAdd = useCallback(() => {
    router.push("/products/add");
  }, [router]);

  // Handle edit
  const handleEdit = useCallback(
    (product: Product) => {
      router.push(`/products/${product.id}`);
    },
    [router],
  );

  // Category badge color
  const getCategoryColor = (category: ProductCategory) => {
    const categoryColors: Record<ProductCategory, string> = {
      food: "#4CAF50",
      beverage: "#2196F3",
      dessert: "#E91E63",
      snack: "#FF9800",
      other: "#9E9E9E",
    };
    return categoryColors[category] || "#9E9E9E";
  };

  // Render product item
  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: colors.background }]}
      onPress={() => handleEdit(item)}
      activeOpacity={0.7}
    >
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={[styles.productName, { color: colors.text }]}>
            {item.name}
          </Text>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: getCategoryColor(item.category) },
            ]}
          >
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
        {item.description && (
          <Text
            style={[styles.productDescription, { color: colors.icon }]}
            numberOfLines={1}
          >
            {item.description}
          </Text>
        )}
        <View style={styles.priceRow}>
          <Text style={[styles.productPrice, { color: colors.tint }]}>
            ₱{item.selling_price.toFixed(2)}
          </Text>
          {item.is_inventory_tracked && (
            <View style={styles.trackedBadge}>
              <IconSymbol name="cube" size={12} color="#666" />
              <Text style={styles.trackedText}>Tracked</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        onPress={() => handleDelete(item)}
        style={styles.deleteButton}
      >
        <IconSymbol name="trash" size={20} color="#FF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
        <Text style={[styles.title, { color: colors.text }]}>Products</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.tint }]}
          onPress={handleAdd}
        >
          <IconSymbol name="plus" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { borderColor: colors.icon }]}>
        <IconSymbol name="magnifyingglass" size={20} color={colors.icon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search products..."
          placeholderTextColor={colors.icon}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryChip,
              selectedCategory === cat.key && { backgroundColor: colors.tint },
            ]}
            onPress={() => {
              setSelectedCategory(cat.key);
              setSearchQuery("");
            }}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat.key && styles.categoryChipTextSelected,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Error Display */}
      {error && (
        <TouchableOpacity style={styles.errorBanner} onPress={clearError}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <Text style={styles.dismissText}>Tap to dismiss</Text>
        </TouchableOpacity>
      )}

      {/* Products List */}
      <FlatList
        data={products}
        renderItem={renderProduct}
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
                <IconSymbol name="cart" size={48} color={colors.icon} />
                <Text style={[styles.emptyText, { color: colors.icon }]}>
                  No products yet
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                  Tap &quot;Add&quot; to create your first product
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
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoryScroll: {
    maxHeight: 50,
    marginBottom: 12,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  categoryChipTextSelected: {
    color: "#FFFFFF",
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
  productCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  productInfo: {
    flex: 1,
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  productName: {
    fontSize: 17,
    fontWeight: "600",
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  productDescription: {
    fontSize: 14,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
  },
  trackedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  trackedText: {
    fontSize: 11,
    color: "#666",
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
