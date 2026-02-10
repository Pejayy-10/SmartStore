/**
 * SmartStore Employee Store
 * Zustand state management for employees
 */

import { create } from "zustand";
import { employeeRepository } from "../database/repositories/employee.repository";
import type { Employee, EmployeeInput } from "../types";

interface EmployeeState {
  // State
  employees: Employee[];
  selectedEmployee: Employee | null;
  isLoading: boolean;
  error: string | null;
  dailyLaborCost: number;

  // Actions
  fetchEmployees: () => Promise<void>;
  fetchDailyLaborCost: () => Promise<void>;
  createEmployee: (input: EmployeeInput) => Promise<Employee>;
  updateEmployee: (
    id: number,
    input: Partial<EmployeeInput>,
  ) => Promise<Employee | null>;
  deleteEmployee: (id: number) => Promise<boolean>;
  setSelectedEmployee: (employee: Employee | null) => void;
  clearError: () => void;
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  // Initial state
  employees: [],
  selectedEmployee: null,
  isLoading: false,
  error: null,
  dailyLaborCost: 0,

  // Fetch all active employees
  fetchEmployees: async () => {
    set({ isLoading: true, error: null });
    try {
      const employees = await employeeRepository.getActiveEmployees();
      set({ employees, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch employees",
        isLoading: false,
      });
    }
  },

  // Fetch daily labor cost
  fetchDailyLaborCost: async () => {
    try {
      const dailyLaborCost = await employeeRepository.getDailyLaborCost();
      set({ dailyLaborCost });
    } catch (error) {
      console.error("Failed to fetch daily labor cost:", error);
    }
  },

  // Create new employee
  createEmployee: async (input: EmployeeInput) => {
    set({ isLoading: true, error: null });
    try {
      const newEmployee = await employeeRepository.create(input);
      set((state) => ({
        employees: [newEmployee, ...state.employees],
        isLoading: false,
      }));
      get().fetchDailyLaborCost();
      return newEmployee;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to create employee",
        isLoading: false,
      });
      throw error;
    }
  },

  // Update employee
  updateEmployee: async (id: number, input: Partial<EmployeeInput>) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await employeeRepository.update(id, input);
      if (updated) {
        set((state) => ({
          employees: state.employees.map((e) => (e.id === id ? updated : e)),
          selectedEmployee:
            state.selectedEmployee?.id === id
              ? updated
              : state.selectedEmployee,
          isLoading: false,
        }));
        get().fetchDailyLaborCost();
      }
      return updated;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to update employee",
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete employee (soft delete)
  deleteEmployee: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const success = await employeeRepository.delete(id);
      if (success) {
        set((state) => ({
          employees: state.employees.filter((e) => e.id !== id),
          selectedEmployee:
            state.selectedEmployee?.id === id ? null : state.selectedEmployee,
          isLoading: false,
        }));
        get().fetchDailyLaborCost();
      }
      return success;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete employee",
        isLoading: false,
      });
      return false;
    }
  },

  // Set selected employee
  setSelectedEmployee: (employee: Employee | null) => {
    set({ selectedEmployee: employee });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
