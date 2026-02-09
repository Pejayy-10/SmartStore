/**
 * SmartStore Add/Edit Ingredient Screen
 * Form for creating and editing ingredients
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useIngredientStore } from "@/store";
import type { IngredientInput, UnitType } from "@/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const UNIT_TYPES: UnitType[] = [
  "pcs",
  "kg",
  "g",
  "mg",
  "l",
  "ml",
  "tbsp",
  "tsp",
  "cup",
  "oz",
];

export default function IngredientFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEditing = id && id !== "add";

  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const {
    selectedIngredient,
    getIngredient,
    createIngredient,
    updateIngredient,
  } = useIngredientStore();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [unitType, setUnitType] = useState<UnitType>("pcs");
  const [quantityInStock, setQuantityInStock] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [supplier, setSupplier] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load existing ingredient for editing
  useEffect(() => {
    if (isEditing) {
      getIngredient(Number(id));
    }
  }, [isEditing, id, getIngredient]);

  // Populate form when ingredient is loaded
  useEffect(() => {
    if (isEditing && selectedIngredient) {
      setName(selectedIngredient.name);
      setDescription(selectedIngredient.description || "");
      setCostPerUnit(selectedIngredient.cost_per_unit.toString());
      setUnitType(selectedIngredient.unit_type);
      setQuantityInStock(selectedIngredient.quantity_in_stock.toString());
      setLowStockThreshold(selectedIngredient.low_stock_threshold.toString());
      setSupplier(selectedIngredient.supplier || "");
    }
  }, [isEditing, selectedIngredient]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter an ingredient name");
      return false;
    }
    if (!costPerUnit || isNaN(Number(costPerUnit)) || Number(costPerUnit) < 0) {
      Alert.alert("Validation Error", "Please enter a valid cost per unit");
      return false;
    }
    if (
      !quantityInStock ||
      isNaN(Number(quantityInStock)) ||
      Number(quantityInStock) < 0
    ) {
      Alert.alert("Validation Error", "Please enter a valid quantity");
      return false;
    }
    return true;
  }, [name, costPerUnit, quantityInStock]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    setIsSaving(true);

    const input: IngredientInput = {
      name: name.trim(),
      description: description.trim() || null,
      cost_per_unit: Number(costPerUnit),
      unit_type: unitType,
      quantity_in_stock: Number(quantityInStock),
      low_stock_threshold: Number(lowStockThreshold) || 10,
      supplier: supplier.trim() || null,
    };

    try {
      if (isEditing && selectedIngredient) {
        await updateIngredient(selectedIngredient.id, input);
        Alert.alert("Success", "Ingredient updated successfully");
      } else {
        await createIngredient(input);
        Alert.alert("Success", "Ingredient created successfully");
      }
      router.back();
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to save ingredient",
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    validateForm,
    name,
    description,
    costPerUnit,
    unitType,
    quantityInStock,
    lowStockThreshold,
    supplier,
    isEditing,
    selectedIngredient,
    updateIngredient,
    createIngredient,
    router,
  ]);

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
          {isEditing ? "Edit Ingredient" : "Add Ingredient"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
      >
        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Name *</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.icon },
            ]}
            placeholder="e.g., All-Purpose Flour"
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
            placeholder="Optional description"
            placeholderTextColor={colors.icon}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Cost & Unit Row */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>
              Cost per Unit *
            </Text>
            <View
              style={[styles.inputWithPrefix, { borderColor: colors.icon }]}
            >
              <Text style={[styles.prefix, { color: colors.icon }]}>₱</Text>
              <TextInput
                style={[styles.inputNoBorder, { color: colors.text }]}
                placeholder="0.00"
                placeholderTextColor={colors.icon}
                value={costPerUnit}
                onChangeText={setCostPerUnit}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
            <Text style={[styles.label, { color: colors.text }]}>
              Unit Type *
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.unitPicker}
            >
              {UNIT_TYPES.map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.unitOption,
                    unitType === unit && { backgroundColor: colors.tint },
                  ]}
                  onPress={() => setUnitType(unit)}
                >
                  <Text
                    style={[
                      styles.unitOptionText,
                      unitType === unit && styles.unitOptionTextSelected,
                    ]}
                  >
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Quantity & Threshold Row */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>
              Quantity in Stock *
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.icon },
              ]}
              placeholder="0"
              placeholderTextColor={colors.icon}
              value={quantityInStock}
              onChangeText={setQuantityInStock}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
            <Text style={[styles.label, { color: colors.text }]}>
              Low Stock Alert
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.icon },
              ]}
              placeholder="10"
              placeholderTextColor={colors.icon}
              value={lowStockThreshold}
              onChangeText={setLowStockThreshold}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Supplier */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Supplier</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.icon },
            ]}
            placeholder="e.g., ABC Trading"
            placeholderTextColor={colors.icon}
            value={supplier}
            onChangeText={setSupplier}
          />
        </View>
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
                {isEditing ? "Update Ingredient" : "Save Ingredient"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  row: {
    flexDirection: "row",
  },
  inputWithPrefix: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  prefix: {
    fontSize: 16,
    marginRight: 4,
  },
  inputNoBorder: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  unitPicker: {
    flexDirection: "row",
  },
  unitOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "#F0F0F0",
  },
  unitOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  unitOptionTextSelected: {
    color: "#FFFFFF",
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
});
