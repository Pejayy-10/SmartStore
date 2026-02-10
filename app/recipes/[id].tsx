/**
 * SmartStore Edit Recipe Screen
 * Form for editing existing recipes with ingredient selection
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, brand, radius, shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useIngredientStore, useRecipeStore, useSettingsStore } from "@/store";
import type { Ingredient, UnitType } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface RecipeItem {
  ingredientId: number;
  ingredient: Ingredient;
  quantity: number;
  unitType: string;
}

export default function EditRecipeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = parseInt(id || "0", 10);

  const systemColorScheme = useColorScheme() ?? "light";
  const { themeMode } = useSettingsStore();
  const colorScheme = themeMode === "system" ? systemColorScheme : themeMode;
  const colors = Colors[colorScheme];

  const { updateRecipe, deleteRecipe, getRecipe, selectedRecipe, isLoading } =
    useRecipeStore();
  const { ingredients, fetchIngredients } = useIngredientStore();
  const hasLoadedRef = useRef(false);

  // Fetch ingredients and full recipe with items
  useEffect(() => {
    fetchIngredients();
    getRecipe(recipeId);
  }, [fetchIngredients, getRecipe, recipeId]);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState("1");
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [markupPercent, setMarkupPercent] = useState("30");

  // Load recipe data once from selectedRecipe (which has items)
  useEffect(() => {
    if (
      selectedRecipe &&
      selectedRecipe.id === recipeId &&
      !hasLoadedRef.current
    ) {
      setName(selectedRecipe.name);
      setDescription(selectedRecipe.description || "");
      setServings(selectedRecipe.servings.toString());

      // Load recipe items from full recipe data
      if (selectedRecipe.items && selectedRecipe.items.length > 0) {
        const items: RecipeItem[] = selectedRecipe.items
          .map((item) => ({
            ingredientId: item.ingredient_id,
            ingredient: item.ingredient,
            quantity: item.quantity,
            unitType: item.unit_type,
          }))
          .filter((item) => item.ingredient);
        setRecipeItems(items);
      }
      hasLoadedRef.current = true;
    }
  }, [selectedRecipe, recipeId]);

  // Calculate total cost
  const totalCost = recipeItems.reduce((sum, item) => {
    return sum + item.quantity * item.ingredient.cost_per_unit;
  }, 0);

  const servingsNum = parseInt(servings) || 1;
  const costPerServing = totalCost / servingsNum;
  const markupNum = parseFloat(markupPercent) || 0;
  const suggestedSellingPrice = costPerServing * (1 + markupNum / 100);

  // Add ingredient
  const handleAddIngredient = useCallback(
    (ingredient: Ingredient) => {
      const existing = recipeItems.find(
        (i) => i.ingredientId === ingredient.id,
      );
      if (existing) {
        Alert.alert(
          "Already Added",
          "This ingredient is already in the recipe",
        );
        return;
      }

      setRecipeItems([
        ...recipeItems,
        {
          ingredientId: ingredient.id,
          ingredient,
          quantity: 1,
          unitType: ingredient.unit_type,
        },
      ]);
      setShowIngredientPicker(false);
    },
    [recipeItems],
  );

  // Update ingredient quantity
  const handleUpdateQuantity = useCallback(
    (ingredientId: number, quantity: string) => {
      setRecipeItems((items) =>
        items.map((item) =>
          item.ingredientId === ingredientId
            ? { ...item, quantity: parseFloat(quantity) || 0 }
            : item,
        ),
      );
    },
    [],
  );

  // Remove ingredient
  const handleRemoveIngredient = useCallback((ingredientId: number) => {
    setRecipeItems((items) =>
      items.filter((item) => item.ingredientId !== ingredientId),
    );
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter recipe name");
      return;
    }

    if (recipeItems.length === 0) {
      Alert.alert("Error", "Please add at least one ingredient");
      return;
    }

    const success = await updateRecipe(recipeId, {
      name: name.trim(),
      description: description.trim() || undefined,
      servings: servingsNum,
      items: recipeItems.map((item) => ({
        ingredient_id: item.ingredientId,
        quantity: item.quantity,
        unit_type: item.unitType as UnitType,
      })),
    });

    if (success) {
      router.back();
    } else {
      Alert.alert("Error", "Failed to update recipe");
    }
  }, [
    recipeId,
    name,
    description,
    servingsNum,
    recipeItems,
    updateRecipe,
    router,
  ]);

  // Handle delete
  const handleDelete = useCallback(() => {
    Alert.alert(
      "Delete Recipe",
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await deleteRecipe(recipeId);
            if (success) {
              router.back();
            } else {
              Alert.alert("Error", "Failed to delete recipe");
            }
          },
        },
      ],
    );
  }, [recipeId, name, deleteRecipe, router]);

  // Render recipe item
  const renderRecipeItem = ({ item }: { item: RecipeItem }) => (
    <View
      style={[
        styles.recipeItem,
        { backgroundColor: colors.card, borderColor: colors.border },
        shadows.soft,
      ]}
    >
      <View style={styles.recipeItemInfo}>
        <Text style={[styles.recipeItemName, { color: colors.text }]}>
          {item.ingredient.name}
        </Text>
        <Text style={[styles.recipeItemCost, { color: colors.textSecondary }]}>
          ₱{item.ingredient.cost_per_unit.toFixed(2)}/{item.unitType}
        </Text>
      </View>

      <View style={styles.recipeItemControls}>
        <View
          style={[
            styles.quantityInput,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <TextInput
            style={[styles.quantityValue, { color: colors.text }]}
            value={item.quantity.toString()}
            onChangeText={(value) =>
              handleUpdateQuantity(item.ingredientId, value)
            }
            keyboardType="decimal-pad"
          />
          <Text style={[styles.quantityUnit, { color: colors.textSecondary }]}>
            {item.unitType}
          </Text>
        </View>

        <Text style={[styles.itemTotal, { color: brand.primary }]}>
          ₱{(item.quantity * item.ingredient.cost_per_unit).toFixed(2)}
        </Text>

        <TouchableOpacity
          onPress={() => handleRemoveIngredient(item.ingredientId)}
        >
          <IconSymbol name="xmark.circle.fill" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!selectedRecipe || selectedRecipe.id !== recipeId) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={brand.primary} />
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Recipe</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.formContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Recipe Name *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="e.g., Chocolate Cake"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Description
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Optional description"
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Servings */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Servings</Text>
            <View
              style={[
                styles.servingsRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.servingsButton,
                  { backgroundColor: colors.background },
                ]}
                onPress={() =>
                  setServings(Math.max(1, servingsNum - 1).toString())
                }
              >
                <IconSymbol name="minus" size={18} color={brand.primary} />
              </TouchableOpacity>
              <TextInput
                style={[styles.servingsInput, { color: colors.text }]}
                value={servings}
                onChangeText={setServings}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={[
                  styles.servingsButton,
                  { backgroundColor: brand.primaryFaded },
                ]}
                onPress={() => setServings((servingsNum + 1).toString())}
              >
                <IconSymbol name="plus" size={18} color={brand.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Ingredients Section */}
          <View style={styles.ingredientsSection}>
            <View style={styles.ingredientsHeader}>
              <Text style={[styles.label, { color: colors.text }]}>
                Ingredients
              </Text>
              <TouchableOpacity
                style={[
                  styles.addIngredientButton,
                  { backgroundColor: brand.primaryFaded },
                ]}
                onPress={() => setShowIngredientPicker(true)}
              >
                <IconSymbol name="plus" size={16} color={brand.primary} />
                <Text
                  style={[styles.addIngredientText, { color: brand.primary }]}
                >
                  Add
                </Text>
              </TouchableOpacity>
            </View>

            {recipeItems.length === 0 ? (
              <View
                style={[
                  styles.emptyIngredients,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <IconSymbol name="leaf" size={32} color={colors.icon} />
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  No ingredients added yet
                </Text>
                <TouchableOpacity
                  style={[
                    styles.addFirstButton,
                    { backgroundColor: brand.primary },
                  ]}
                  onPress={() => setShowIngredientPicker(true)}
                >
                  <Text style={styles.addFirstText}>Add Ingredient</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={recipeItems}
                renderItem={renderRecipeItem}
                keyExtractor={(item) => item.ingredientId.toString()}
                scrollEnabled={false}
              />
            )}
          </View>

          {/* Markup */}
          {recipeItems.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Markup %
              </Text>
              <View
                style={[
                  styles.input,
                  styles.priceInput,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <TextInput
                  style={[styles.markupValue, { color: colors.text }]}
                  value={markupPercent}
                  onChangeText={setMarkupPercent}
                  keyboardType="decimal-pad"
                  placeholder="30"
                  placeholderTextColor={colors.textTertiary}
                />
                <Text
                  style={[styles.markupUnit, { color: colors.textSecondary }]}
                >
                  %
                </Text>
              </View>
            </View>
          )}

          {/* Cost Summary */}
          {recipeItems.length > 0 && (
            <View
              style={[
                styles.costSummary,
                { backgroundColor: brand.primaryFaded },
              ]}
            >
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: brand.primary }]}>
                  Total Cost
                </Text>
                <Text style={[styles.costValue, { color: brand.primary }]}>
                  ₱{totalCost.toFixed(2)}
                </Text>
              </View>
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: brand.primary }]}>
                  Cost per Serving
                </Text>
                <Text style={[styles.costPerServing, { color: brand.primary }]}>
                  ₱{costPerServing.toFixed(2)}
                </Text>
              </View>
              <View
                style={[
                  styles.costDivider,
                  { backgroundColor: brand.primary + "33" },
                ]}
              />
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: brand.primary }]}>
                  Suggested Selling Price
                </Text>
                <Text style={[styles.suggestedPrice, { color: brand.primary }]}>
                  ₱{suggestedSellingPrice.toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, shadows.glow]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <LinearGradient
            colors={[brand.primary, brand.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButtonGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <IconSymbol name="trash" size={18} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>Delete Recipe</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* Ingredient Picker Modal */}
      <Modal
        visible={showIngredientPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowIngredientPicker(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <TouchableOpacity onPress={() => setShowIngredientPicker(false)}>
              <IconSymbol name="xmark" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Add Ingredient
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <FlatList
            data={ingredients}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.ingredientList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.ingredientOption,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => handleAddIngredient(item)}
              >
                <View style={styles.ingredientOptionInfo}>
                  <Text
                    style={[
                      styles.ingredientOptionName,
                      { color: colors.text },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.ingredientOptionMeta,
                      { color: colors.textSecondary },
                    ]}
                  >
                    ₱{item.cost_per_unit.toFixed(2)}/{item.unit_type} •{" "}
                    {item.quantity_in_stock} in stock
                  </Text>
                </View>
                <IconSymbol
                  name="plus.circle"
                  size={24}
                  color={brand.primary}
                />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyModal}>
                <Text
                  style={[
                    styles.emptyModalText,
                    { color: colors.textSecondary },
                  ]}
                >
                  No ingredients available. Create some first!
                </Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  servingsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  servingsButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  servingsInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
  ingredientsSection: {
    gap: 12,
  },
  ingredientsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addIngredientButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    gap: 6,
  },
  addIngredientText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyIngredients: {
    alignItems: "center",
    padding: 32,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  addFirstButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  addFirstText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  recipeItem: {
    padding: 14,
    marginBottom: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  recipeItemInfo: {
    marginBottom: 10,
  },
  recipeItemName: {
    fontSize: 16,
    fontWeight: "600",
  },
  recipeItemCost: {
    fontSize: 13,
    marginTop: 2,
  },
  recipeItemControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quantityInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flex: 1,
  },
  quantityValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  quantityUnit: {
    fontSize: 12,
    marginLeft: 4,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "700",
    minWidth: 70,
    textAlign: "right",
  },
  costSummary: {
    padding: 16,
    borderRadius: radius.lg,
    gap: 8,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  costLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  costValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  costPerServing: {
    fontSize: 22,
    fontWeight: "800",
  },
  priceInput: {
    flexDirection: "row",
    alignItems: "center",
  },
  markupValue: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  markupUnit: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  costDivider: {
    height: 1,
    marginVertical: 4,
  },
  suggestedPrice: {
    fontSize: 24,
    fontWeight: "800",
  },
  saveButton: {
    margin: 20,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  saveButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    gap: 10,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  ingredientList: {
    padding: 20,
    gap: 10,
  },
  ingredientOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 10,
  },
  ingredientOptionInfo: {
    flex: 1,
  },
  ingredientOptionName: {
    fontSize: 16,
    fontWeight: "600",
  },
  ingredientOptionMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyModal: {
    padding: 40,
    alignItems: "center",
  },
  emptyModalText: {
    fontSize: 14,
    textAlign: "center",
  },
  deleteButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 40,
    paddingVertical: 14,
    gap: 8,
  },
  deleteButtonText: {
    color: "#FF3B30",
    fontSize: 15,
    fontWeight: "600",
  },
});
