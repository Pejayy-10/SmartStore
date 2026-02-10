/**
 * SmartStore Expense Store
 * Zustand state management for expenses
 */

import { create } from "zustand";
import { expenseRepository } from "../database/repositories/expense.repository";
import type { Expense, ExpenseInput } from "../types";

interface ExpenseState {
  // State
  expenses: Expense[];
  dailyExpenses: Expense[];
  selectedExpense: Expense | null;
  isLoading: boolean;
  error: string | null;
  dailyTotal: number;
  categoryBreakdown: { category: string; total: number }[];
  selectedDate: string; // YYYY-MM-DD

  // Actions
  fetchExpenses: () => Promise<void>;
  fetchByDate: (date: string) => Promise<void>;
  fetchByDateRange: (startDate: string, endDate: string) => Promise<void>;
  createExpense: (input: ExpenseInput) => Promise<Expense>;
  updateExpense: (
    id: number,
    input: Partial<ExpenseInput>,
  ) => Promise<Expense | null>;
  deleteExpense: (id: number) => Promise<boolean>;
  setSelectedDate: (date: string) => void;
  clearError: () => void;
}

const today = () => new Date().toISOString().split("T")[0];

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  // Initial state
  expenses: [],
  dailyExpenses: [],
  selectedExpense: null,
  isLoading: false,
  error: null,
  dailyTotal: 0,
  categoryBreakdown: [],
  selectedDate: today(),

  // Fetch all expenses
  fetchExpenses: async () => {
    set({ isLoading: true, error: null });
    try {
      const expenses = await expenseRepository.getAll();
      set({ expenses, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch expenses",
        isLoading: false,
      });
    }
  },

  // Fetch expenses by date
  fetchByDate: async (date: string) => {
    set({ isLoading: true, error: null, selectedDate: date });
    try {
      const [dailyExpenses, dailyTotal, categoryBreakdown] = await Promise.all([
        expenseRepository.getByDate(date),
        expenseRepository.getDailyTotal(date),
        expenseRepository.getCategoryBreakdown(date),
      ]);
      set({
        dailyExpenses,
        dailyTotal,
        categoryBreakdown,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch expenses",
        isLoading: false,
      });
    }
  },

  // Fetch expenses by date range
  fetchByDateRange: async (startDate: string, endDate: string) => {
    set({ isLoading: true, error: null });
    try {
      const expenses = await expenseRepository.getByDateRange(
        startDate,
        endDate,
      );
      set({ expenses, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch expenses",
        isLoading: false,
      });
    }
  },

  // Create new expense
  createExpense: async (input: ExpenseInput) => {
    set({ isLoading: true, error: null });
    try {
      const newExpense = await expenseRepository.create(input);
      set((state) => ({
        expenses: [newExpense, ...state.expenses],
        isLoading: false,
      }));
      // Refresh daily view
      get().fetchByDate(get().selectedDate);
      return newExpense;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to create expense",
        isLoading: false,
      });
      throw error;
    }
  },

  // Update expense
  updateExpense: async (id: number, input: Partial<ExpenseInput>) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await expenseRepository.update(id, input);
      if (updated) {
        set((state) => ({
          expenses: state.expenses.map((e) => (e.id === id ? updated : e)),
          isLoading: false,
        }));
        get().fetchByDate(get().selectedDate);
      }
      return updated;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to update expense",
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete expense (soft delete)
  deleteExpense: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const success = await expenseRepository.delete(id);
      if (success) {
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
          dailyExpenses: state.dailyExpenses.filter((e) => e.id !== id),
          isLoading: false,
        }));
        get().fetchByDate(get().selectedDate);
      }
      return success;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete expense",
        isLoading: false,
      });
      return false;
    }
  },

  // Set selected date
  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
    get().fetchByDate(date);
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
