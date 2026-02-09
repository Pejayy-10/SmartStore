/**
 * SmartStore Add/Edit Recipe Screen
 * Form for creating and editing recipes with ingredient selection
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useIngredientStore, useRecipeStore } from "@/store";
import type { Ingredient, RecipeInput, RecipeItemInput } from "@/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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

interface RecipeItemState {
  ingredient: Ingredient;
  quantity: string;
}

export default function RecipeFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEditing = id && id !== "add";

  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const { selectedRecipe, getRecipe, createRecipe, updateRecipe } =
    useRecipeStore();

  const { ingredients, fetchIngredients } = useIngredientStore();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState("1");
  const [recipeItems, setRecipeItems] = useState<RecipeItemState[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);

  // Load ingredients on mount
  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  // Load existing recipe for editing
  useEffect(() => {
    if (isEditing) {
      getRecipe(Number(id));
    }
  }, [isEditing, id, getRecipe]);

  // Populate form when recipe is loaded
  useEffect(() => {
    if (isEditing && selectedRecipe) {
      setName(selectedRecipe.name);
      setDescription(selectedRecipe.description || "");
      setServings(selectedRecipe.servings.toString());

      // Convert items to state format
      if (selectedRecipe.items) {
        const items: RecipeItemState[] = selectedRecipe.items.map((item) => ({
          ingredient: item.ingredient,
          quantity: item.quantity.toString(),
        }));
        setRecipeItems(items);
      }
    }
  }, [isEditing, selectedRecipe]);

  // Calculate total cost
  const totalCost = recipeItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    return sum + qty * item.ingredient.cost_per_unit;
  }, 0);

  const costPerServing = totalCost / (parseInt(servings) || 1);

  // Add ingredient
  const handleAddIngredient = useCallback(
    (ingredient: Ingredient) => {
      // Check if already added
      const exists = recipeItems.some(
        (item) => item.ingredient.id === ingredient.id,
      );
      if (exists) {
        Alert.alert(
          "Already Added",
          "This ingredient is already in the recipe",
        );
        return;
      }

      setRecipeItems((prev) => [...prev, { ingredient, quantity: "1" }]);
      setShowIngredientPicker(false);
    },
    [recipeItems],
  );

  // Remove ingredient
  const handleRemoveIngredient = useCallback((ingredientId: number) => {
    setRecipeItems((prev) =>
      prev.filter((item) => item.ingredient.id !== ingredientId),
    );
  }, []);

  // Update quantity
  const handleQuantityChange = useCallback(
    (ingredientId: number, quantity: string) => {
      setRecipeItems((prev) =>
        prev.map((item) =>
          item.ingredient.id === ingredientId ? { ...item, quantity } : item,
        ),
      );
    },
    [],
  );

  // Validate form
  const validateForm = useCallback((): boolean => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter a recipe name");
      return false;
    }
    if (recipeItems.length === 0) {
      Alert.alert("Validation Error", "Please add at least one ingredient");
      return false;
    }
    if (!servings || parseInt(servings) <= 0) {
      Alert.alert("Validation Error", "Please enter valid servings");
      return false;
    }
    return true;
  }, [name, recipeItems, servings]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    setIsSaving(true);

    const items: RecipeItemInput[] = recipeItems.map((item) => ({
      ingredient_id: item.ingredient.id,
      quantity: parseFloat(item.quantity) || 0,
      unit_type: item.ingredient.unit_type,
    }));

    const input: RecipeInput = {
      name: name.trim(),
      description: description.trim() || null,
      servings: parseInt(servings) || 1,
      items,
    };

    try {
      if (isEditing && selectedRecipe) {
        await updateRecipe(selectedRecipe.id, input);
        Alert.alert("Success", "Recipe updated successfully");
      } else {
        await createRecipe(input);
        Alert.alert("Success", "Recipe created successfully");
      }
      router.back();
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to save recipe",
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    validateForm,
    recipeItems,
    name,
    description,
    servings,
    isEditing,
    selectedRecipe,
    updateRecipe,
    createRecipe,
    router,
  ]);

  // Available ingredients (not yet added)
  const availableIngredients = ingredients.filter(
    (ing) => !recipeItems.some((item) => item.ingredient.id === ing.id),
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.tint} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {isEditing ? "Edit Recipe" : "New Recipe"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
      >
        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Recipe Name *
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.icon },
            ]}
            placeholder="e.g., Iced Latte"
            placeholderTextColor={colors.icon}
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
              { color: colors.text, borderColor: colors.icon },
            ]}
            placeholder="Optional preparation notes"
            placeholderTextColor={colors.icon}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Servings */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Servings *</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.icon, width: 100 },
            ]}
            placeholder="1"
            placeholderTextColor={colors.icon}
            value={servings}
            onChangeText={setServings}
            keyboardType="number-pad"
          />
        </View>

        {/* Ingredients Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Ingredients
          </Text>
          <TouchableOpacity
            style={[
              styles.addIngredientButton,
              { backgroundColor: colors.tint },
            ]}
            onPress={() => setShowIngredientPicker(true)}
          >
            <IconSymbol name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.addIngredientText}>Add</Text>
          </TouchableOpacity>
        </View>

        {recipeItems.length === 0 ? (
          <View style={[styles.emptyIngredients, { borderColor: colors.icon }]}>
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              No ingredients added yet
            </Text>
          </View>
        ) : (
          recipeItems.map((item) => (
            <View
              key={item.ingredient.id}
              style={[styles.ingredientRow, { borderColor: colors.icon }]}
            >
              <View style={styles.ingredientInfo}>
                <Text style={[styles.ingredientName, { color: colors.text }]}>
                  {item.ingredient.name}
                </Text>
                <Text style={[styles.ingredientCost, { color: colors.icon }]}>
                  ₱{item.ingredient.cost_per_unit.toFixed(2)}/
                  {item.ingredient.unit_type}
                </Text>
              </View>
              <View style={styles.quantitySection}>
                <TextInput
                  style={[
                    styles.quantityInput,
                    { color: colors.text, borderColor: colors.icon },
                  ]}
                  value={item.quantity}
                  onChangeText={(value) =>
                    handleQuantityChange(item.ingredient.id, value)
                  }
                  keyboardType="decimal-pad"
                />
                <Text style={[styles.unitLabel, { color: colors.icon }]}>
                  {item.ingredient.unit_type}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveIngredient(item.ingredient.id)}
              >
                <IconSymbol
                  name="xmark.circle.fill"
                  size={24}
                  color="#FF4444"
                />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Cost Summary */}
        {recipeItems.length > 0 && (
          <View
            style={[
              styles.costSummary,
              {
                backgroundColor: colorScheme === "dark" ? "#1C1C1E" : "#F8F8F8",
              },
            ]}
          >
            <View style={styles.costRow}>
              <Text style={[styles.costLabel, { color: colors.text }]}>
                Total Cost
              </Text>
              <Text style={[styles.costValue, { color: colors.tint }]}>
                ₱{totalCost.toFixed(2)}
              </Text>
            </View>
            <View style={styles.costRow}>
              <Text style={[styles.costLabel, { color: colors.icon }]}>
                Cost per Serving
              </Text>
              <Text style={[styles.costPerServing, { color: colors.text }]}>
                ₱{costPerServing.toFixed(2)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.tint }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <IconSymbol name="checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {isEditing ? "Update Recipe" : "Save Recipe"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Ingredient Picker Modal */}
      <Modal
        visible={showIngredientPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowIngredientPicker(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowIngredientPicker(false)}>
              <IconSymbol name="xmark" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Ingredient
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <FlatList
            data={availableIngredients}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.modalList}
            ListEmptyComponent={
              <View style={styles.emptyModal}>
                <Text style={[styles.emptyText, { color: colors.icon }]}>
                  No ingredients available. Add ingredients first.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.ingredientOption, { borderColor: colors.icon }]}
                onPress={() => handleAddIngredient(item)}
              >
                <View>
                  <Text style={[styles.optionName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.optionDetails, { color: colors.icon }]}>
                    ₱{item.cost_per_unit.toFixed(2)}/{item.unit_type} •{" "}
                    {item.quantity_in_stock} in stock
                  </Text>
                </View>
                <IconSymbol name="plus.circle" size={24} color={colors.tint} />
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  addIngredientButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 4,
  },
  addIngredientText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  emptyIngredients: {
    padding: 24,
    borderWidth: 1,
    borderRadius: 10,
    borderStyle: "dashed",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: "500",
  },
  ingredientCost: {
    fontSize: 12,
    marginTop: 2,
  },
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quantityInput: {
    width: 60,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    textAlign: "center",
  },
  unitLabel: {
    fontSize: 13,
    minWidth: 30,
  },
  costSummary: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  costLabel: {
    fontSize: 15,
  },
  costValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  costPerServing: {
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
  saveButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalList: {
    padding: 16,
  },
  emptyModal: {
    alignItems: "center",
    padding: 40,
  },
  ingredientOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
  },
  optionName: {
    fontSize: 16,
    fontWeight: "500",
  },
  optionDetails: {
    fontSize: 13,
    marginTop: 2,
  },
});
