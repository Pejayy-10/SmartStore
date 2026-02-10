/**
 * SmartStore Products Screen
 * Professional product management with responsive layout
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, brand, radius, shadows, spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useProductStore, useSettingsStore } from "@/store";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const CATEGORIES = [
  { key: "all", label: "All Items", icon: "list.bullet" },
  { key: "food", label: "Food", icon: "fork.knife" },
  { key: "beverage", label: "Beverages", icon: "cup.and.saucer.fill" },
  { key: "dessert", label: "Desserts", icon: "birthday.cake.fill" },
  { key: "snack", label: "Snacks", icon: "birthday.cake.fill" },
  { key: "other", label: "Other", icon: "tag.fill" },
];

export default function ProductsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const systemColorScheme = useColorScheme() ?? "light";
  const { themeMode } = useSettingsStore();
  const colorScheme = themeMode === "system" ? systemColorScheme : themeMode;
  const colors = Colors[colorScheme];

  const { products, isLoading, fetchProducts } = useProductStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [fetchProducts]);

  const handleEdit = (product: any) => {
    router.push({
      pathname: "/products/[id]",
      params: { id: product.id },
    });
  };

  const handleAdd = () => {
    router.push("/products/add");
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={{
        width: isTablet ? "32%" : "100%", // Responsive grid for tablet
        marginBottom: spacing.md,
      }}
    >
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
          shadows.soft,
        ]}
        onPress={() => handleEdit(item)}
        activeOpacity={0.7}
      >
        {item.image_uri ? (
          <>
            <Image source={{ uri: item.image_uri }} style={styles.cardImage} />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.8)"]}
              style={StyleSheet.absoluteFillObject}
            />
          </>
        ) : null}

        <View style={styles.cardPadding}>
          <View style={styles.cardHeader}>
            {!item.image_uri ? (
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: brand.primaryFaded },
                ]}
              >
                <IconSymbol name="tag.fill" size={20} color={brand.primary} />
              </View>
            ) : (
              <View style={{ flex: 1 }} /> // Spacer to push price tag to right
            )}

            <View style={styles.priceTag}>
              <Text style={[styles.priceText, { color: brand.primary }]}>
                ₱{item.selling_price.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            <Text
              style={[
                styles.productName,
                { color: item.image_uri ? "#FFFFFF" : colors.text },
              ]}
            >
              {item.name}
            </Text>
            <Text
              style={[
                styles.productCategory,
                { color: item.image_uri ? "#E0E0E0" : colors.textSecondary },
              ]}
            >
              {item.category
                ? item.category.charAt(0).toUpperCase() + item.category.slice(1)
                : "Uncategorized"}
            </Text>

            {item.is_inventory_tracked === 1 && (
              <Text
                style={[
                  styles.stockText,
                  {
                    color: item.image_uri
                      ? "rgba(255,255,255,0.6)"
                      : colors.textTertiary,
                  },
                ]}
              >
                Inventory Tracked
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

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
          <Text style={styles.title}>Products</Text>
          <TouchableOpacity
            style={[styles.addButton, shadows.soft]}
            onPress={handleAdd}
          >
            <IconSymbol name="plus" size={20} color={brand.primary} />
            <Text style={styles.addButtonText}>Add New</Text>
          </TouchableOpacity>
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
            placeholder="Search products..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <IconSymbol
                name="xmark.circle.fill"
                size={16}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          data={CATEGORIES}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
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
              <IconSymbol
                // @ts-ignore
                name={item.icon}
                size={14}
                color={
                  selectedCategory === item.key
                    ? "#FFFFFF"
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.categoryText,
                  {
                    color:
                      selectedCategory === item.key
                        ? "#FFFFFF"
                        : colors.textSecondary,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Product List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={
          isTablet ? { justifyContent: "space-between" } : undefined
        }
        numColumns={isTablet ? 3 : 1}
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
              <IconSymbol name="cart" size={48} color={colors.textTertiary} />
              <Text
                style={[styles.emptyStateText, { color: colors.textSecondary }]}
              >
                No products found
              </Text>
              <TouchableOpacity
                style={[
                  styles.emptyStateButton,
                  { backgroundColor: brand.primary },
                ]}
                onPress={handleAdd}
              >
                <Text style={styles.emptyStateButtonText}>
                  Add Your First Product
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {isLoading && !refreshing && (
        <View
          style={[
            styles.loadingOverlay,
            { backgroundColor: colors.background },
          ]}
        >
          <ActivityIndicator size="large" color={brand.primary} />
        </View>
      )}
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
  categoryContainer: {
    paddingVertical: 16,
  },
  categoryList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden", // Ensure image doesn't bleed
  },
  cardPadding: {
    padding: 16,
    flex: 1,
    justifyContent: "space-between",
    gap: 12,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  priceTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#F2F2F7",
  },
  priceText: {
    fontWeight: "800",
    fontSize: 14,
  },
  cardContent: {
    gap: 4,
  },
  productName: {
    fontSize: 17,
    fontWeight: "700",
  },
  productCategory: {
    fontSize: 13,
  },
  stockContainer: {
    marginTop: 8,
    flexDirection: "row",
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    gap: 4,
  },
  stockText: {
    fontSize: 12,
    fontWeight: "600",
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
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.full,
  },
  emptyStateButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
