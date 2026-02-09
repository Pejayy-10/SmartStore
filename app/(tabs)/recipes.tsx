/**
 * SmartStore Recipes Screen
 * List and manage recipes with ingredient costs
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore, useRecipeStore } from "@/store";
import type { Recipe } from "@/types";
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
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // App store for initialization
  const { isInitialized, isInitializing, initialize, initError } =
    useAppStore();

  // Recipe store
  const {
    recipes,
    isLoading,
    error,
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

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      searchRecipes(query);
    },
    [searchRecipes],
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecipes();
    setRefreshing(false);
  }, [fetchRecipes]);

  // Handle delete
  const handleDelete = useCallback(
    (recipe: Recipe) => {
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
    (recipe: Recipe) => {
      router.push(`/recipes/${recipe.id}`);
    },
    [router],
  );

  // Render recipe item
  const renderRecipe = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={[styles.recipeCard, { backgroundColor: colors.background }]}
      onPress={() => handleEdit(item)}
      activeOpacity={0.7}
    >
      <View style={styles.recipeInfo}>
        <Text style={[styles.recipeName, { color: colors.text }]}>
          {item.name}
        </Text>
        {item.description && (
          <Text
            style={[styles.recipeDescription, { color: colors.icon }]}
            numberOfLines={1}
          >
            {item.description}
          </Text>
        )}
        <View style={styles.recipeDetails}>
          <View style={styles.detailItem}>
            <IconSymbol name="person.2" size={14} color={colors.icon} />
            <Text style={[styles.detailText, { color: colors.icon }]}>
              {item.servings} servings
            </Text>
          </View>
          <View style={styles.costInfo}>
            <Text style={[styles.costLabel, { color: colors.icon }]}>
              Cost:
            </Text>
            <Text style={[styles.costValue, { color: colors.tint }]}>
              ₱{item.total_cost.toFixed(2)}
            </Text>
            <Text style={[styles.perServing, { color: colors.icon }]}>
              (₱{item.cost_per_serving.toFixed(2)}/serving)
            </Text>
          </View>
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
        <Text style={[styles.title, { color: colors.text }]}>Recipes</Text>
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
          placeholder="Search recipes..."
          placeholderTextColor={colors.icon}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Error Display */}
      {error && (
        <TouchableOpacity style={styles.errorBanner} onPress={clearError}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <Text style={styles.dismissText}>Tap to dismiss</Text>
        </TouchableOpacity>
      )}

      {/* Recipes List */}
      <FlatList
        data={recipes}
        renderItem={renderRecipe}
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
                <IconSymbol name="doc.text" size={48} color={colors.icon} />
                <Text style={[styles.emptyText, { color: colors.icon }]}>
                  No recipes yet
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.icon }]}>
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
  recipeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  recipeDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  recipeDetails: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 13,
  },
  costInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  costLabel: {
    fontSize: 13,
  },
  costValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  perServing: {
    fontSize: 12,
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
