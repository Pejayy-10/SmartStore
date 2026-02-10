/**
 * SmartStore Add Ingredient Screen
 * Form for creating new ingredients
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, brand, radius, shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useIngredientStore, useSettingsStore } from "@/store";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
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

const UNIT_TYPES = [
  "pcs",
  "kg",
  "g",
  "L",
  "mL",
  "oz",
  "lb",
  "cup",
  "tbsp",
  "tsp",
];

export default function AddIngredientScreen() {
  const router = useRouter();
  const systemColorScheme = useColorScheme() ?? "light";
  const { themeMode } = useSettingsStore();
  const colorScheme = themeMode === "system" ? systemColorScheme : themeMode;
  const colors = Colors[colorScheme];

  const { createIngredient, isLoading } = useIngredientStore();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [unitType, setUnitType] = useState("pcs");
  const [quantityInStock, setQuantityInStock] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [supplier, setSupplier] = useState("");

  // Handle save
  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter ingredient name");
      return;
    }

    const cost = parseFloat(costPerUnit) || 0;
    const quantity = parseFloat(quantityInStock) || 0;
    const threshold = parseFloat(lowStockThreshold) || 10;

    const success = await createIngredient({
      name: name.trim(),
      description: description.trim() || undefined,
      cost_per_unit: cost,
      unit_type: unitType,
      quantity_in_stock: quantity,
      low_stock_threshold: threshold,
      supplier: supplier.trim() || undefined,
    });

    if (success) {
      router.back();
    } else {
      Alert.alert("Error", "Failed to create ingredient");
    }
  }, [
    name,
    description,
    costPerUnit,
    unitType,
    quantityInStock,
    lowStockThreshold,
    supplier,
    createIngredient,
    router,
  ]);

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
        <Text style={styles.title}>New Ingredient</Text>
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
            <Text style={[styles.label, { color: colors.text }]}>Name *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Ingredient name"
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
              numberOfLines={3}
            />
          </View>

          {/* Cost and Unit Row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>
                Cost per Unit
              </Text>
              <View
                style={[
                  styles.input,
                  styles.priceInput,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.currencyPrefix, { color: brand.primary }]}>
                  ₱
                </Text>
                <TextInput
                  style={[styles.priceValue, { color: colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  value={costPerUnit}
                  onChangeText={setCostPerUnit}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>
                Unit Type
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.unitList}
              >
                {UNIT_TYPES.map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.unitChip,
                      {
                        backgroundColor:
                          unitType === unit ? brand.primary : colors.card,
                        borderColor:
                          unitType === unit ? brand.primary : colors.border,
                      },
                    ]}
                    onPress={() => setUnitType(unit)}
                  >
                    <Text
                      style={[
                        styles.unitChipText,
                        { color: unitType === unit ? "#FFFFFF" : colors.text },
                      ]}
                    >
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Quantity Row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>
                Current Stock
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
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                value={quantityInStock}
                onChangeText={setQuantityInStock}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>
                Low Stock Alert
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
                placeholder="10"
                placeholderTextColor={colors.textTertiary}
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
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Optional supplier name"
              placeholderTextColor={colors.textTertiary}
              value={supplier}
              onChangeText={setSupplier}
            />
          </View>
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
                <Text style={styles.saveButtonText}>Save Ingredient</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    minHeight: 100,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  priceInput: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: "700",
    marginRight: 4,
  },
  priceValue: {
    flex: 1,
    fontSize: 16,
  },
  unitList: {
    gap: 8,
    paddingVertical: 4,
  },
  unitChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  unitChipText: {
    fontSize: 14,
    fontWeight: "600",
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
});
