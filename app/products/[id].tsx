/**
 * SmartStore Add/Edit Product Screen
 * Form for creating and editing products
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useProductStore } from "@/store";
import type { ProductCategory, ProductInput } from "@/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const CATEGORIES: ProductCategory[] = [
  "food",
  "beverage",
  "dessert",
  "snack",
  "other",
];

export default function ProductFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEditing = id && id !== "add";

  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const { selectedProduct, getProduct, createProduct, updateProduct } =
    useProductStore();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ProductCategory>("food");
  const [sellingPrice, setSellingPrice] = useState("");
  const [isInventoryTracked, setIsInventoryTracked] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing product for editing
  useEffect(() => {
    if (isEditing) {
      getProduct(Number(id));
    }
  }, [isEditing, id, getProduct]);

  // Populate form when product is loaded
  useEffect(() => {
    if (isEditing && selectedProduct) {
      setName(selectedProduct.name);
      setDescription(selectedProduct.description || "");
      setCategory(selectedProduct.category);
      setSellingPrice(selectedProduct.selling_price.toString());
      setIsInventoryTracked(selectedProduct.is_inventory_tracked);
    }
  }, [isEditing, selectedProduct]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter a product name");
      return false;
    }
    if (
      !sellingPrice ||
      isNaN(Number(sellingPrice)) ||
      Number(sellingPrice) <= 0
    ) {
      Alert.alert("Validation Error", "Please enter a valid selling price");
      return false;
    }
    return true;
  }, [name, sellingPrice]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    setIsSaving(true);

    const input: ProductInput = {
      name: name.trim(),
      description: description.trim() || null,
      category,
      selling_price: Number(sellingPrice),
      is_inventory_tracked: isInventoryTracked,
    };

    try {
      if (isEditing && selectedProduct) {
        await updateProduct(selectedProduct.id, input);
        Alert.alert("Success", "Product updated successfully");
      } else {
        await createProduct(input);
        Alert.alert("Success", "Product created successfully");
      }
      router.back();
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to save product",
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    validateForm,
    name,
    description,
    category,
    sellingPrice,
    isInventoryTracked,
    isEditing,
    selectedProduct,
    updateProduct,
    createProduct,
    router,
  ]);

  // Category color
  const getCategoryColor = (cat: ProductCategory) => {
    const categoryColors: Record<ProductCategory, string> = {
      food: "#4CAF50",
      beverage: "#2196F3",
      dessert: "#E91E63",
      snack: "#FF9800",
      other: "#9E9E9E",
    };
    return categoryColors[cat];
  };

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
          {isEditing ? "Edit Product" : "Add Product"}
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
            Product Name *
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
            placeholder="Optional description"
            placeholderTextColor={colors.icon}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Category *</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryOption,
                  category === cat && {
                    backgroundColor: getCategoryColor(cat),
                    borderColor: getCategoryColor(cat),
                  },
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    category === cat && styles.categoryOptionTextSelected,
                  ]}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selling Price */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Selling Price *
          </Text>
          <View style={[styles.inputWithPrefix, { borderColor: colors.icon }]}>
            <Text style={[styles.prefix, { color: colors.icon }]}>₱</Text>
            <TextInput
              style={[styles.inputNoBorder, { color: colors.text }]}
              placeholder="0.00"
              placeholderTextColor={colors.icon}
              value={sellingPrice}
              onChangeText={setSellingPrice}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Inventory Tracking */}
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text
              style={[styles.label, { color: colors.text, marginBottom: 0 }]}
            >
              Track Inventory
            </Text>
            <Text style={[styles.switchDescription, { color: colors.icon }]}>
              Deduct ingredients when sold
            </Text>
          </View>
          <Switch
            value={isInventoryTracked}
            onValueChange={setIsInventoryTracked}
            trackColor={{ false: "#E0E0E0", true: colors.tint }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Recipe Info (placeholder for future) */}
        {isInventoryTracked && (
          <View style={[styles.infoBox, { borderColor: colors.icon }]}>
            <IconSymbol name="info.circle" size={20} color={colors.tint} />
            <Text style={[styles.infoText, { color: colors.icon }]}>
              Recipe linking will be available in a future update. For now,
              products can be created without recipes.
            </Text>
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
                {isEditing ? "Update Product" : "Save Product"}
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
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F8F8F8",
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  categoryOptionTextSelected: {
    color: "#FFFFFF",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 8,
  },
  switchInfo: {
    flex: 1,
  },
  switchDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    borderStyle: "dashed",
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
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
