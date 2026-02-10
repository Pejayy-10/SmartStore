/**
 * SmartStore Expenses Screen
 * Expense tracking with daily summary, add/edit, and category breakdown
 */

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";
import { IconSymbol } from "../../components/ui/icon-symbol";
import { Colors, brand, radius, shadows } from "../../constants/theme";
import { useExpenseStore, useSettingsStore } from "../../store";
import type { Expense, ExpenseInput } from "../../types";

const EXPENSE_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "rent", label: "Rent" },
  { key: "utilities", label: "Utilities" },
  { key: "supplies", label: "Supplies" },
  { key: "labor", label: "Labor" },
  { key: "other", label: "Other" },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  rent: "#FF6B6B",
  utilities: "#4ECDC4",
  supplies: "#45B7D1",
  labor: "#F7B731",
  other: "#A55EEA",
};

export default function ExpensesScreen() {
  const router = useRouter();
  const systemColorScheme = useColorScheme() ?? "light";
  const { themeMode } = useSettingsStore();
  const colorScheme = themeMode === "system" ? systemColorScheme : themeMode;
  const colors = Colors[colorScheme];

  const {
    dailyExpenses,
    isLoading,
    dailyTotal,
    categoryBreakdown,
    selectedDate,
    fetchByDate,
    createExpense,
    deleteExpense,
    setSelectedDate,
  } = useExpenseStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState<
    "rent" | "utilities" | "supplies" | "labor" | "other"
  >("other");
  const [formNotes, setFormNotes] = useState("");
  const [formIsRecurring, setFormIsRecurring] = useState(false);

  useEffect(() => {
    fetchByDate(selectedDate);
  }, [selectedDate, fetchByDate]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchByDate(selectedDate);
    setRefreshing(false);
  }, [fetchByDate, selectedDate]);

  const filteredExpenses = useMemo(() => {
    if (selectedCategory === "all") return dailyExpenses;
    return dailyExpenses.filter((e) => e.category === selectedCategory);
  }, [dailyExpenses, selectedCategory]);

  const navigateDate = (offset: number) => {
    const current = new Date(selectedDate + "T12:00:00");
    current.setDate(current.getDate() + offset);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    if (dateStr === todayStr) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toISOString().split("T")[0]) return "Yesterday";
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const handleAddExpense = async () => {
    if (!formName.trim()) {
      Alert.alert("Error", "Please enter expense name");
      return;
    }
    const amount = parseFloat(formAmount);
    if (!amount || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    const input: ExpenseInput = {
      name: formName.trim(),
      amount,
      category: formCategory,
      notes: formNotes.trim() || undefined,
      is_recurring: formIsRecurring,
      expense_date: selectedDate,
    };

    try {
      await createExpense(input);
      setShowAddModal(false);
      resetForm();
    } catch {
      Alert.alert("Error", "Failed to add expense");
    }
  };

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert(
      "Delete Expense",
      `Are you sure you want to delete "${expense.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteExpense(expense.id),
        },
      ],
    );
  };

  const resetForm = () => {
    setFormName("");
    setFormAmount("");
    setFormCategory("other");
    setFormNotes("");
    setFormIsRecurring(false);
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <View
      style={[
        styles.expenseCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.expenseCardLeft}>
        <View
          style={[
            styles.categoryDot,
            { backgroundColor: CATEGORY_COLORS[item.category] ?? "#999" },
          ]}
        />
        <View style={styles.expenseInfo}>
          <Text style={[styles.expenseName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text
            style={[styles.expenseCategory, { color: colors.textSecondary }]}
          >
            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            {item.is_recurring ? " • Recurring" : ""}
          </Text>
          {item.notes ? (
            <Text
              style={[styles.expenseNotes, { color: colors.textTertiary }]}
              numberOfLines={1}
            >
              {item.notes}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.expenseCardRight}>
        <Text style={[styles.expenseAmount, { color: "#FF3B30" }]}>
          -${item.amount.toFixed(2)}
        </Text>
        <TouchableOpacity
          onPress={() => handleDeleteExpense(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="trash" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );

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
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={styles.addButton}
        >
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Date Navigator */}
      <View
        style={[
          styles.dateNavigator,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => navigateDate(-1)}>
          <IconSymbol name="chevron.left" size={20} color={brand.primary} />
        </TouchableOpacity>
        <Text style={[styles.dateText, { color: colors.text }]}>
          {formatDate(selectedDate)}
        </Text>
        <TouchableOpacity onPress={() => navigateDate(1)}>
          <IconSymbol name="chevron.right" size={20} color={brand.primary} />
        </TouchableOpacity>
      </View>

      {/* Daily Summary Card */}
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
          Total Expenses
        </Text>
        <Text style={[styles.summaryAmount, { color: "#FF3B30" }]}>
          ${dailyTotal.toFixed(2)}
        </Text>
        {categoryBreakdown.length > 0 && (
          <View style={styles.breakdownRow}>
            {categoryBreakdown.map((cat) => (
              <View key={cat.category} style={styles.breakdownItem}>
                <View
                  style={[
                    styles.breakdownDot,
                    {
                      backgroundColor: CATEGORY_COLORS[cat.category] ?? "#999",
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.breakdownText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {cat.category}: ${cat.total.toFixed(0)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryFilter}
      >
        {EXPENSE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryChip,
              {
                backgroundColor:
                  selectedCategory === cat.key ? brand.primary : colors.card,
                borderColor:
                  selectedCategory === cat.key ? brand.primary : colors.border,
              },
            ]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Text
              style={[
                styles.categoryChipText,
                {
                  color: selectedCategory === cat.key ? "#FFFFFF" : colors.text,
                },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Expense List */}
      <FlatList
        data={filteredExpenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol
              name="dollar.sign.circle.fill"
              size={48}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No expenses for this day
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { borderColor: brand.primary }]}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={[styles.emptyButtonText, { color: brand.primary }]}>
                Add Expense
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add Expense Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          {/* Modal Header */}
          <LinearGradient
            colors={[brand.primary, brand.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalHeader}
          >
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Expense</Text>
            <View style={{ width: 60 }} />
          </LinearGradient>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <ScrollView
              contentContainerStyle={styles.modalForm}
              showsVerticalScrollIndicator={false}
            >
              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Name *
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
                  placeholder="e.g. Electricity bill"
                  placeholderTextColor={colors.textTertiary}
                  value={formName}
                  onChangeText={setFormName}
                />
              </View>

              {/* Amount */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Amount *
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
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  value={formAmount}
                  onChangeText={setFormAmount}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Category */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Category
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {EXPENSE_CATEGORIES.filter((c) => c.key !== "all").map(
                    (cat) => (
                      <TouchableOpacity
                        key={cat.key}
                        style={[
                          styles.categoryChip,
                          {
                            backgroundColor:
                              formCategory === cat.key
                                ? CATEGORY_COLORS[cat.key]
                                : colors.card,
                            borderColor:
                              formCategory === cat.key
                                ? CATEGORY_COLORS[cat.key]
                                : colors.border,
                          },
                        ]}
                        onPress={() =>
                          setFormCategory(
                            cat.key as
                              | "rent"
                              | "utilities"
                              | "supplies"
                              | "labor"
                              | "other",
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            {
                              color:
                                formCategory === cat.key
                                  ? "#FFFFFF"
                                  : colors.text,
                            },
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </ScrollView>
              </View>

              {/* Notes */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Notes
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
                  placeholder="Optional notes"
                  placeholderTextColor={colors.textTertiary}
                  value={formNotes}
                  onChangeText={setFormNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Recurring Toggle */}
              <TouchableOpacity
                style={[
                  styles.toggleRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setFormIsRecurring(!formIsRecurring)}
              >
                <View>
                  <Text style={[styles.toggleLabel, { color: colors.text }]}>
                    Recurring Expense
                  </Text>
                  <Text
                    style={[styles.toggleHint, { color: colors.textTertiary }]}
                  >
                    Auto-added daily
                  </Text>
                </View>
                <View
                  style={[
                    styles.toggle,
                    {
                      backgroundColor: formIsRecurring
                        ? brand.primary
                        : colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      {
                        transform: [{ translateX: formIsRecurring ? 20 : 0 }],
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, shadows.glow]}
              onPress={handleAddExpense}
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
                    <Text style={styles.saveButtonText}>Add Expense</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  addButton: {
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
  dateNavigator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
  },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownText: {
    fontSize: 12,
    fontWeight: "500",
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  expenseCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  expenseCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseName: {
    fontSize: 15,
    fontWeight: "600",
  },
  expenseCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  expenseNotes: {
    fontSize: 11,
    marginTop: 2,
  },
  expenseCardRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
  },
  emptyButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  modalCancel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    width: 60,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalForm: {
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  toggleHint: {
    fontSize: 12,
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 4,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
});
