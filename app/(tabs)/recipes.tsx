/**
 * SmartStore Recipes Screen
 * Professional design with orange theme
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, brand, radius, shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore, useRecipeStore, useSettingsStore } from "@/store";
import type { RecipeWithItems } from "@/types";
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

export default function RecipesScreen() {
  const router = useRouter();
  const systemColorScheme = useColorScheme() ?? "light";
  const { themeMode } = useSettingsStore();
  const colorScheme = themeMode === "system" ? systemColorScheme : themeMode;
  const colors = Colors[colorScheme];

  const [refreshing, setRefreshing] = useState(false);

  // App store for initialization
  const { isInitialized, isInitializing, initialize, initError } =
    useAppStore();

  // Recipe store
  const {
    recipes,
    isLoading,
    error,
    searchQuery,
    fetchRecipes,
    searchRecipes,
    deleteRecipe,
    clearError,
  } = useRecipeStore();

  // Initialize database on mount
  useEffect(() => {
    if (!isInitialized && !isInitializing) {
      initialize();
    }
  }, [isInitialized, isInitializing, initialize]);

  // Fetch recipes when initialized
  useEffect(() => {
    if (isInitialized) {
      fetchRecipes();
    }
  }, [isInitialized, fetchRecipes]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecipes();
    setRefreshing(false);
  }, [fetchRecipes]);

  // Handle delete
  const handleDelete = useCallback(
    (recipe: RecipeWithItems) => {
      Alert.alert(
        "Delete Recipe",
        `Are you sure you want to delete "${recipe.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              const success = await deleteRecipe(recipe.id);
              if (!success) {
                Alert.alert("Error", "Failed to delete recipe");
              }
            },
          },
        ],
      );
    },
    [deleteRecipe],
  );

  // Handle add
  const handleAdd = useCallback(() => {
    router.push("/recipes/add");
  }, [router]);

  // Handle edit
  const handleEdit = useCallback(
    (recipe: RecipeWithItems) => {
      router.push(`/recipes/${recipe.id}`);
    },
    [router],
  );

  // Render recipe item
  const renderRecipe = ({ item }: { item: RecipeWithItems }) => {
    return (
      <TouchableOpacity
        style={[
          styles.recipeCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          shadows.soft,
        ]}
        onPress={() => handleEdit(item)}
        activeOpacity={0.7}
      >
        <View style={styles.recipeContent}>
          <Text
            style={[styles.recipeName, { color: colors.text }]}
            numberOfLines={2}
          >
            {item.name}
          </Text>

          <View style={styles.recipeMeta}>
            <View
              style={[styles.metaChip, { backgroundColor: brand.primaryFaded }]}
            >
              <IconSymbol name="leaf.fill" size={12} color={brand.primary} />
              <Text style={[styles.metaChipText, { color: brand.primary }]}>
                {item.items?.length || 0} items
              </Text>
            </View>
            <View
              style={[styles.metaChip, { backgroundColor: colors.background }]}
            >
              <Text
                style={[styles.metaChipText, { color: colors.textSecondary }]}
              >
                {item.servings} servings
              </Text>
            </View>
          </View>

          <View style={styles.costRow}>
            <View>
              <Text style={[styles.costLabel, { color: colors.textTertiary }]}>
                Total Cost
              </Text>
              <Text style={[styles.costValue, { color: brand.primary }]}>
                ₱{item.total_cost.toFixed(2)}
              </Text>
            </View>
            <View style={styles.costDivider} />
            <View>
              <Text style={[styles.costLabel, { color: colors.textTertiary }]}>
                Per Serving
              </Text>
              <Text style={[styles.costPerServing, { color: colors.text }]}>
                ₱{item.cost_per_serving.toFixed(2)}
              </Text>
            </View>
          </View>
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
            <Text style={styles.title}>Recipes</Text>
            <Text style={styles.subtitle}>
              {recipes.length} recipes created
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
            placeholder="Search recipes..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={searchRecipes}
          />
        </View>
      </View>

      {/* Error Display */}
      {error && (
        <TouchableOpacity style={styles.errorBanner} onPress={clearError}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </TouchableOpacity>
      )}

      {/* Recipes List */}
      <FlatList
        data={recipes}
        renderItem={renderRecipe}
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
                    name="doc.text.fill"
                    size={40}
                    color={brand.primary}
                  />
                </View>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  No recipes yet
                </Text>
                <Text
                  style={[styles.emptySubtext, { color: colors.textSecondary }]}
                >
                  Create recipes to track ingredient costs
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
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  recipeCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  recipeContent: {
    flex: 1,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    paddingRight: 32,
  },
  recipeMeta: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    gap: 5,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  costRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  costLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  costValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  costDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 20,
  },
  costPerServing: {
    fontSize: 16,
    fontWeight: "700",
  },
  deleteButton: {
    position: "absolute",
    top: 16,
    right: 16,
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
