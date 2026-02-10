/**
 * SmartStore Recipes Screen
 * Recipe management with professional UI
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, brand, radius, shadows, spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRecipeStore, useSettingsStore } from "@/store";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function RecipesScreen() {
  const router = useRouter();
  const systemColorScheme = useColorScheme() ?? "light";
  const { themeMode } = useSettingsStore();
  const colorScheme = themeMode === "system" ? systemColorScheme : themeMode;
  const colors = Colors[colorScheme];

  const { recipes, isLoading, fetchRecipes } = useRecipeStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecipes();
    setRefreshing(false);
  }, [fetchRecipes]);

  const handleEdit = (recipe: any) => {
    router.push({
      pathname: "/recipes/[id]",
      params: { id: recipe.id },
    });
  };

  const handleAdd = () => {
    router.push("/recipes/add");
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={{ marginBottom: spacing.md }}
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
        <View style={styles.cardHeader}>
          <Text style={[styles.recipeName, { color: colors.text }]}>
            {item.name}
          </Text>
          <View
            style={[
              styles.servingsBadge,
              { backgroundColor: brand.primaryFaded },
            ]}
          >
            <Text style={[styles.servingsText, { color: brand.primary }]}>
              {item.servings} servings
            </Text>
          </View>
        </View>

        <Text
          style={[styles.recipeDescription, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {item.description || "No description provided."}
        </Text>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.costRow}>
          <View>
            <Text style={[styles.costLabel, { color: colors.textTertiary }]}>
              Total Cost
            </Text>
            <Text style={[styles.costValue, { color: colors.text }]}>
              ₱{item.total_cost.toFixed(2)}
            </Text>
          </View>

          <View
            style={[styles.verticalDivider, { backgroundColor: colors.border }]}
          />

          <View>
            <Text style={[styles.costLabel, { color: colors.textTertiary }]}>
              Per Serving
            </Text>
            <Text style={[styles.costValuePrimary, { color: brand.primary }]}>
              ₱{item.cost_per_serving.toFixed(2)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[brand.primary, brand.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>Recipes</Text>
          <TouchableOpacity
            style={[styles.addButton, shadows.soft]}
            onPress={handleAdd}
          >
            <IconSymbol name="plus" size={20} color={brand.primary} />
            <Text style={styles.addButtonText}>Add Recipe</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={recipes}
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
                name="doc.text.fill"
                size={48}
                color={colors.textTertiary}
              />
              <Text
                style={[styles.emptyStateText, { color: colors.textSecondary }]}
              >
                No recipes created yet
              </Text>
            </View>
          ) : null
        }
      />
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
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  servingsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  servingsText: {
    fontSize: 12,
    fontWeight: "600",
  },
  recipeDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    width: "100%",
    marginBottom: 16,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  verticalDivider: {
    width: 1,
    height: 30,
  },
  costLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  costValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  costValuePrimary: {
    fontSize: 20,
    fontWeight: "800",
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
});
