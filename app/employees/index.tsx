/**
 * SmartStore Employees Screen
 * Employee management with list, add, and edit functionality
 */

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
import { useEmployeeStore, useSettingsStore } from "../../store";
import type { Employee, EmployeeInput } from "../../types";

const ROLES = [
  { key: "staff", label: "Staff" },
  { key: "cashier", label: "Cashier" },
  { key: "owner", label: "Owner" },
] as const;

const WAGE_TYPES = [
  { key: "daily", label: "Daily" },
  { key: "hourly", label: "Hourly" },
  { key: "monthly", label: "Monthly" },
] as const;

const ROLE_COLORS: Record<string, string> = {
  owner: "#FF6B6B",
  cashier: "#4ECDC4",
  staff: "#45B7D1",
};

export default function EmployeesScreen() {
  const router = useRouter();
  const systemColorScheme = useColorScheme() ?? "light";
  const { themeMode } = useSettingsStore();
  const colorScheme = themeMode === "system" ? systemColorScheme : themeMode;
  const colors = Colors[colorScheme];

  const {
    employees,
    isLoading,
    dailyLaborCost,
    fetchEmployees,
    fetchDailyLaborCost,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  } = useEmployeeStore();

  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState<"owner" | "cashier" | "staff">(
    "staff",
  );
  const [formWageType, setFormWageType] = useState<
    "hourly" | "daily" | "monthly"
  >("daily");
  const [formWageAmount, setFormWageAmount] = useState("");

  useEffect(() => {
    fetchEmployees();
    fetchDailyLaborCost();
  }, [fetchEmployees, fetchDailyLaborCost]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEmployees();
    await fetchDailyLaborCost();
    setRefreshing(false);
  }, [fetchEmployees, fetchDailyLaborCost]);

  const openAddModal = () => {
    setEditingEmployee(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormName(employee.name);
    setFormRole(employee.role);
    setFormWageType(employee.wage_type);
    setFormWageAmount(employee.wage_amount.toString());
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert("Error", "Please enter employee name");
      return;
    }
    const wage = parseFloat(formWageAmount);
    if (!wage || wage <= 0) {
      Alert.alert("Error", "Please enter a valid wage amount");
      return;
    }

    const input: EmployeeInput = {
      name: formName.trim(),
      role: formRole,
      wage_type: formWageType,
      wage_amount: wage,
    };

    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, input);
      } else {
        await createEmployee(input);
      }
      setShowModal(false);
      resetForm();
    } catch {
      Alert.alert(
        "Error",
        `Failed to ${editingEmployee ? "update" : "add"} employee`,
      );
    }
  };

  const handleDelete = (employee: Employee) => {
    Alert.alert(
      "Remove Employee",
      `Are you sure you want to remove "${employee.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => deleteEmployee(employee.id),
        },
      ],
    );
  };

  const resetForm = () => {
    setFormName("");
    setFormRole("staff");
    setFormWageType("daily");
    setFormWageAmount("");
  };

  const getWageDisplay = (employee: Employee) => {
    const suffix =
      employee.wage_type === "hourly"
        ? "/hr"
        : employee.wage_type === "daily"
          ? "/day"
          : "/mo";
    return `$${employee.wage_amount.toFixed(2)}${suffix}`;
  };

  const renderEmployee = ({ item }: { item: Employee }) => (
    <TouchableOpacity
      style={[
        styles.employeeCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      onPress={() => openEditModal(item)}
      activeOpacity={0.7}
    >
      <View style={styles.employeeLeft}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: ROLE_COLORS[item.role] ?? "#999" },
          ]}
        >
          <Text style={styles.avatarText}>
            {item.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </Text>
        </View>
        <View style={styles.employeeInfo}>
          <Text style={[styles.employeeName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text
            style={[
              styles.employeeRole,
              { color: ROLE_COLORS[item.role] ?? colors.textSecondary },
            ]}
          >
            {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
          </Text>
        </View>
      </View>
      <View style={styles.employeeRight}>
        <Text style={[styles.employeeWage, { color: colors.text }]}>
          {getWageDisplay(item)}
        </Text>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="trash" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
        <Text style={styles.title}>Employees</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Daily Labor Cost Summary */}
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Active Staff
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {employees.length}
            </Text>
          </View>
          <View
            style={[styles.summaryDivider, { backgroundColor: colors.border }]}
          />
          <View style={styles.summaryItem}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Est. Daily Labor
            </Text>
            <Text style={[styles.summaryValue, { color: brand.primary }]}>
              ${dailyLaborCost.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Employee List */}
      <FlatList
        data={employees}
        renderItem={renderEmployee}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol
              name="person.fill"
              size={48}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No employees yet
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { borderColor: brand.primary }]}
              onPress={openAddModal}
            >
              <Text style={[styles.emptyButtonText, { color: brand.primary }]}>
                Add Employee
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <LinearGradient
            colors={[brand.primary, brand.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalHeader}
          >
            <TouchableOpacity
              onPress={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingEmployee ? "Edit Employee" : "New Employee"}
            </Text>
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
                  placeholder="Employee name"
                  placeholderTextColor={colors.textTertiary}
                  value={formName}
                  onChangeText={setFormName}
                />
              </View>

              {/* Role */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Role</Text>
                <View style={styles.chipRow}>
                  {ROLES.map((role) => (
                    <TouchableOpacity
                      key={role.key}
                      style={[
                        styles.chip,
                        {
                          backgroundColor:
                            formRole === role.key
                              ? ROLE_COLORS[role.key]
                              : colors.card,
                          borderColor:
                            formRole === role.key
                              ? ROLE_COLORS[role.key]
                              : colors.border,
                        },
                      ]}
                      onPress={() => setFormRole(role.key)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color:
                              formRole === role.key ? "#FFFFFF" : colors.text,
                          },
                        ]}
                      >
                        {role.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Wage Type */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Wage Type
                </Text>
                <View style={styles.chipRow}>
                  {WAGE_TYPES.map((wt) => (
                    <TouchableOpacity
                      key={wt.key}
                      style={[
                        styles.chip,
                        {
                          backgroundColor:
                            formWageType === wt.key
                              ? brand.primary
                              : colors.card,
                          borderColor:
                            formWageType === wt.key
                              ? brand.primary
                              : colors.border,
                        },
                      ]}
                      onPress={() => setFormWageType(wt.key)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color:
                              formWageType === wt.key ? "#FFFFFF" : colors.text,
                          },
                        ]}
                      >
                        {wt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Wage Amount */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Wage Amount *
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
                  value={formWageAmount}
                  onChangeText={setFormWageAmount}
                  keyboardType="decimal-pad"
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
                    <Text style={styles.saveButtonText}>
                      {editingEmployee ? "Save Changes" : "Add Employee"}
                    </Text>
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
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    height: 40,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  employeeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  employeeLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "600",
  },
  employeeRole: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  employeeRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  employeeWage: {
    fontSize: 15,
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
  // Modal
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
  chipRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
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
