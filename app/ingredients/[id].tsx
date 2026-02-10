/**
 * SmartStore Edit Ingredient Screen
 * Form for editing existing ingredients
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, brand, radius, shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useIngredientStore, useSettingsStore } from "@/store";
import type { UnitType } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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

export default function EditIngredientScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ingredientId = parseInt(id || "0", 10);

  const systemColorScheme = useColorScheme() ?? "light";
  const { themeMode } = useSettingsStore();
  const colorScheme = themeMode === "system" ? systemColorScheme : themeMode;
  const colors = Colors[colorScheme];

  const {
    ingredients,
    updateIngredient,
    deleteIngredient,
    updateStock,
    isLoading,
  } = useIngredientStore();
  const ingredient = ingredients.find((i) => i.id === ingredientId);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [unitType, setUnitType] = useState("pcs");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [supplier, setSupplier] = useState("");

  // Stock modal state
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [stockModalType, setStockModalType] = useState<"in" | "out">("in");
  const [stockQty, setStockQty] = useState("");
  const [stockNote, setStockNote] = useState("");

  // Load ingredient data
  useEffect(() => {
    if (ingredient) {
      setName(ingredient.name);
      setDescription(ingredient.description || "");
      setCostPerUnit(ingredient.cost_per_unit.toString());
      setUnitType(ingredient.unit_type);
      setLowStockThreshold(ingredient.low_stock_threshold.toString());
      setSupplier(ingredient.supplier || "");
    }
  }, [ingredient]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter ingredient name");
      return;
    }

    const cost = parseFloat(costPerUnit) || 0;
    const threshold = parseFloat(lowStockThreshold) || 10;

    const success = await updateIngredient(ingredientId, {
      name: name.trim(),
      description: description.trim() || undefined,
      cost_per_unit: cost,
      unit_type: unitType as UnitType,
      low_stock_threshold: threshold,
      supplier: supplier.trim() || undefined,
    });

    if (success) {
      router.back();
    } else {
      Alert.alert("Error", "Failed to update ingredient");
    }
  }, [
    ingredientId,
    name,
    description,
    costPerUnit,
    unitType,
    lowStockThreshold,
    supplier,
    updateIngredient,
    router,
  ]);

  // Handle delete
  const handleDelete = useCallback(() => {
    Alert.alert(
      "Delete Ingredient",
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await deleteIngredient(ingredientId);
            if (success) {
              router.back();
            } else {
              Alert.alert("Error", "Failed to delete ingredient");
            }
          },
        },
      ],
    );
  }, [ingredientId, name, deleteIngredient, router]);

  if (!ingredient) {
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
        <Text style={styles.title}>Edit Ingredient</Text>
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

          {/* Current Stock (Read-Only) */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Current Stock
            </Text>
            <View
              style={[
                styles.input,
                styles.readOnlyStock,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.readOnlyValue, { color: colors.text }]}>
                {ingredient.quantity_in_stock} {ingredient.unit_type}
              </Text>
            </View>
            <View style={styles.stockActions}>
              <TouchableOpacity
                style={[styles.stockActionBtn, { backgroundColor: "#E8F5E9" }]}
                onPress={() => {
                  setStockModalType("in");
                  setStockQty("");
                  setStockNote("");
                  setStockModalVisible(true);
                }}
              >
                <IconSymbol name="plus" size={16} color="#2E7D32" />
                <Text style={[styles.stockActionText, { color: "#2E7D32" }]}>
                  Stock In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stockActionBtn, { backgroundColor: "#FFE5E5" }]}
                onPress={() => {
                  setStockModalType("out");
                  setStockQty("");
                  setStockNote("");
                  setStockModalVisible(true);
                }}
              >
                <IconSymbol name="minus" size={16} color="#FF3B30" />
                <Text style={[styles.stockActionText, { color: "#FF3B30" }]}>
                  Stock Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Low Stock Alert */}
          <View style={styles.inputGroup}>
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
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <IconSymbol name="trash" size={18} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>Delete Ingredient</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* Stock Adjustment Modal */}
      <Modal
        visible={stockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStockModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.stockModal,
              { backgroundColor: colors.card },
              shadows.soft,
            ]}
          >
            <Text style={[styles.stockModalTitle, { color: colors.text }]}>
              {stockModalType === "in" ? "Stock In" : "Stock Out"}
            </Text>
            <Text
              style={[styles.stockModalSub, { color: colors.textSecondary }]}
            >
              {ingredient.name} — Current: {ingredient.quantity_in_stock}{" "}
              {ingredient.unit_type}
            </Text>

            <View
              style={[
                styles.stockModalInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <TextInput
                style={[styles.stockModalValue, { color: colors.text }]}
                placeholder="Quantity"
                placeholderTextColor={colors.textTertiary}
                value={stockQty}
                onChangeText={setStockQty}
                keyboardType="decimal-pad"
                autoFocus
              />
              <Text
                style={[styles.stockModalUnit, { color: colors.textSecondary }]}
              >
                {ingredient.unit_type}
              </Text>
            </View>

            <TextInput
              style={[
                styles.stockModalNote,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Note (optional)"
              placeholderTextColor={colors.textTertiary}
              value={stockNote}
              onChangeText={setStockNote}
            />

            <View style={styles.stockModalActions}>
              <TouchableOpacity
                style={[
                  styles.stockModalBtn,
                  { backgroundColor: colors.background },
                ]}
                onPress={() => setStockModalVisible(false)}
              >
                <Text
                  style={[styles.stockModalBtnText, { color: colors.text }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.stockModalBtn,
                  {
                    backgroundColor:
                      stockModalType === "in" ? "#2E7D32" : "#FF3B30",
                  },
                ]}
                onPress={async () => {
                  const qty = parseFloat(stockQty) || 0;
                  if (qty <= 0) {
                    Alert.alert("Error", "Please enter a valid quantity");
                    return;
                  }
                  const change = stockModalType === "in" ? qty : -qty;
                  const success = await updateStock(ingredientId, change);
                  if (success) {
                    setStockModalVisible(false);
                  } else {
                    Alert.alert("Error", "Failed to update stock");
                  }
                }}
              >
                <Text style={[styles.stockModalBtnText, { color: "#FFFFFF" }]}>
                  {stockModalType === "in" ? "Add Stock" : "Remove Stock"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  readOnlyStock: {
    justifyContent: "center",
  },
  readOnlyValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  stockActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  stockActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: radius.md,
    gap: 6,
  },
  stockActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  stockModal: {
    width: "100%",
    borderRadius: radius.xl,
    padding: 24,
    gap: 16,
  },
  stockModalTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  stockModalSub: {
    fontSize: 14,
    textAlign: "center",
  },
  stockModalInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  stockModalValue: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  stockModalUnit: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  stockModalNote: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  stockModalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  stockModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: "center",
  },
  stockModalBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
