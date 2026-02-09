/**
 * SmartStore Products Screen
 * Professional design with orange theme
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, brand, radius, shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore, useProductStore, useSettingsStore } from "@/store";
import type { Product, ProductCategory } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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

const CATEGORIES: { key: ProductCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "food", label: "Food" },
  { key: "beverage", label: "Drinks" },
  { key: "dessert", label: "Dessert" },
  { key: "snack", label: "Snack" },
  { key: "other", label: "Other" },
];

export default function ProductsScreen() {
  const router = useRouter();
  const systemColorScheme = useColorScheme() ?? "light";
  const { themeMode } = useSettingsStore();
  const colorScheme = themeMode === "system" ? systemColorScheme : themeMode;
  const colors = Colors[colorScheme];

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    ProductCategory | "all"
  >("all");

  // App store for initialization
  const { isInitialized, isInitializing, initialize, initError } =
    useAppStore();

  // Product store
  const {
    products,
    isLoading,
    error,
    fetchProducts,
    deleteProduct,
    clearError,
  } = useProductStore();

  // Initialize database on mount
  useEffect(() => {
    if (!isInitialized && !isInitializing) {
      initialize();
    }
  }, [isInitialized, isInitializing, initialize]);

  // Fetch products when initialized
  useEffect(() => {
    if (isInitialized) {
      fetchProducts();
    }
  }, [isInitialized, fetchProducts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(query));
    }

    return filtered;
  }, [products, selectedCategory, searchQuery]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [fetchProducts]);

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

  // Render product item
  const renderProduct = ({ item }: { item: Product }) => {
    return (
      <TouchableOpacity
        style={[
          styles.productCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          shadows.soft,
        ]}
        onPress={() => handleEdit(item)}
        activeOpacity={0.7}
      >
        <View style={styles.productContent}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: brand.primaryFaded },
            ]}
          >
            <Text style={[styles.categoryText, { color: brand.primary }]}>
              {item.category}
            </Text>
          </View>
          <Text
            style={[styles.productName, { color: colors.text }]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          {item.description && (
            <Text
              style={[styles.productDesc, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.description}
            </Text>
          )}
          <Text style={[styles.productPrice, { color: brand.primary }]}>
            ₱{item.selling_price.toFixed(2)}
          </Text>
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
            <Text style={styles.title}>Products</Text>
            <Text style={styles.subtitle}>
              {products.length} products available
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
            placeholder="Search products..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryWrapper}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryTab,
                {
                  backgroundColor:
                    selectedCategory === item.key ? brand.primary : colors.card,
                  borderColor:
                    selectedCategory === item.key
                      ? brand.primary
                      : colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(item.key)}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  {
                    color:
                      selectedCategory === item.key ? "#FFFFFF" : colors.text,
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

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        numColumns={2}
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
                    name="cart.fill"
                    size={40}
                    color={brand.primary}
                  />
                </View>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  No products yet
                </Text>
                <Text
                  style={[styles.emptySubtext, { color: colors.textSecondary }]}
                >
                  Tap the + button to add your first product
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
    paddingHorizontal: 16,
    paddingTop: 16,
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
  categoryWrapper: {
    paddingVertical: 12,
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryTabText: {
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
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  productCard: {
    flex: 1,
    margin: 4,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 140,
  },
  productContent: {
    flex: 1,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  productDesc: {
    fontSize: 12,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: "auto",
  },
  deleteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 6,
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
