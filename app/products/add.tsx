/**
 * SmartStore Add Product Screen
 * Form for creating new products
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, brand, radius, shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useProductStore, useRecipeStore, useSettingsStore } from "@/store";
import type { ProductCategory } from "@/types";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const CATEGORIES: { key: ProductCategory; label: string }[] = [
  { key: "food", label: "Food" },
  { key: "beverage", label: "Beverage" },
  { key: "dessert", label: "Dessert" },
  { key: "snack", label: "Snack" },
  { key: "other", label: "Other" },
];

export default function AddProductScreen() {
  const router = useRouter();
  const systemColorScheme = useColorScheme() ?? "light";
  const { themeMode } = useSettingsStore();
  const colorScheme = themeMode === "system" ? systemColorScheme : themeMode;
  const colors = Colors[colorScheme];

  const { createProduct, isLoading } = useProductStore();
  const { recipes, fetchRecipes } = useRecipeStore();

  // Fetch recipes for linking
  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ProductCategory>("food");
  const [sellingPrice, setSellingPrice] = useState("");
  const [recipeId, setRecipeId] = useState<number | null>(null);
  const [isInventoryTracked, setIsInventoryTracked] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Image picker
  const pickImage = useCallback(async () => {
    Alert.alert("Product Photo", "Choose a source", [
      {
        text: "Camera",
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) {
            Alert.alert(
              "Permission needed",
              "Camera access is required to take photos.",
            );
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.7,
            allowsEditing: true,
            aspect: [1, 1],
          });
          if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
          }
        },
      },
      {
        text: "Gallery",
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            Alert.alert(
              "Permission needed",
              "Gallery access is required to pick photos.",
            );
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.7,
            allowsEditing: true,
            aspect: [1, 1],
          });
          if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter product name");
      return;
    }

    const price = parseFloat(sellingPrice) || 0;
    if (price <= 0) {
      Alert.alert("Error", "Please enter a valid selling price");
      return;
    }

    const success = await createProduct({
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      selling_price: price,
      recipe_id: recipeId || undefined,
      is_inventory_tracked: isInventoryTracked,
      image_uri: imageUri,
    });

    if (success) {
      router.back();
    } else {
      Alert.alert("Error", "Failed to create product");
    }
  }, [
    name,
    description,
    category,
    sellingPrice,
    recipeId,
    isInventoryTracked,
    imageUri,
    createProduct,
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
        <Text style={styles.title}>New Product</Text>
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
          {/* Product Image */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Photo</Text>
            <TouchableOpacity
              style={[
                styles.imagePicker,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <IconSymbol
                    name="plus.circle.fill"
                    size={36}
                    color={brand.primary}
                  />
                  <Text
                    style={[
                      styles.imagePlaceholderText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Add Photo
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {imageUri && (
              <TouchableOpacity onPress={() => setImageUri(null)}>
                <Text
                  style={{ color: "#FF3B30", fontSize: 13, fontWeight: "600" }}
                >
                  Remove Photo
                </Text>
              </TouchableOpacity>
            )}
          </View>

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
              placeholder="Product name"
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

          {/* Price */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Selling Price *
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
                value={sellingPrice}
                onChangeText={setSellingPrice}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor:
                        category === cat.key ? brand.primary : colors.card,
                      borderColor:
                        category === cat.key ? brand.primary : colors.border,
                    },
                  ]}
                  onPress={() => setCategory(cat.key)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: category === cat.key ? "#FFFFFF" : colors.text },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recipe Link */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Link to Recipe (Optional)
            </Text>
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              Link a recipe to track ingredient costs
            </Text>
            <View style={styles.recipeList}>
              <TouchableOpacity
                style={[
                  styles.recipeChip,
                  {
                    backgroundColor:
                      recipeId === null ? brand.primary : colors.card,
                    borderColor:
                      recipeId === null ? brand.primary : colors.border,
                  },
                ]}
                onPress={() => setRecipeId(null)}
              >
                <Text
                  style={[
                    styles.recipeChipText,
                    { color: recipeId === null ? "#FFFFFF" : colors.text },
                  ]}
                >
                  None
                </Text>
              </TouchableOpacity>
              {recipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={[
                    styles.recipeChip,
                    {
                      backgroundColor:
                        recipeId === recipe.id ? brand.primary : colors.card,
                      borderColor:
                        recipeId === recipe.id ? brand.primary : colors.border,
                    },
                  ]}
                  onPress={() => setRecipeId(recipe.id)}
                >
                  <Text
                    style={[
                      styles.recipeChipText,
                      {
                        color: recipeId === recipe.id ? "#FFFFFF" : colors.text,
                      },
                    ]}
                  >
                    {recipe.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Inventory Tracking */}
          <TouchableOpacity
            style={[
              styles.toggleRow,
              { backgroundColor: colors.card, borderColor: colors.border },
              shadows.soft,
            ]}
            onPress={() => setIsInventoryTracked(!isInventoryTracked)}
          >
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>
                Track Inventory
              </Text>
              <Text
                style={[styles.toggleDesc, { color: colors.textSecondary }]}
              >
                Deduct ingredients from stock when sold
              </Text>
            </View>
            <View
              style={[
                styles.toggle,
                {
                  backgroundColor: isInventoryTracked
                    ? brand.primary
                    : colors.background,
                },
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  { transform: [{ translateX: isInventoryTracked ? 20 : 0 }] },
                ]}
              />
            </View>
          </TouchableOpacity>
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
                <Text style={styles.saveButtonText}>Create Product</Text>
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
  helpText: {
    fontSize: 12,
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
  priceInput: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: "700",
    marginRight: 4,
  },
  priceValue: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  recipeList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  recipeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  recipeChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 12,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
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
  imagePicker: {
    width: "100%",
    height: 160,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: radius.lg,
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
