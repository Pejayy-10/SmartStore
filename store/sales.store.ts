/**
 * SmartStore Sales Store
 * Zustand state management for sales history and reports
 */

import { create } from "zustand";
import { saleRepository } from "../database";
import type { PaymentMethod, Sale, SaleWithItems } from "../types";

interface DailySummary {
  totalSales: number;
  transactionCount: number;
  averageTransaction: number;
  totalDiscount: number;
}

interface SalesState {
  // State
  sales: Sale[];
  todaySales: Sale[];
  selectedSale: SaleWithItems | null;
  dailySummary: DailySummary | null;
  isLoading: boolean;
  error: string | null;
  dateFilter: { start: string; end: string } | null;

  // Actions
  fetchSales: () => Promise<void>;
  fetchTodaySales: () => Promise<void>;
  fetchByDateRange: (startDate: string, endDate: string) => Promise<void>;
  fetchByPaymentMethod: (method: PaymentMethod) => Promise<void>;
  fetchDailySummary: (date: string) => Promise<DailySummary>;
  getSaleDetails: (id: number) => Promise<SaleWithItems | null>;
  voidSale: (id: number) => Promise<boolean>;
  setDateFilter: (start: string, end: string) => void;
  clearDateFilter: () => void;
  clearError: () => void;
}

export const useSalesStore = create<SalesState>((set, get) => ({
  // Initial state
  sales: [],
  todaySales: [],
  selectedSale: null,
  dailySummary: null,
  isLoading: false,
  error: null,
  dateFilter: null,

  // Fetch all sales
  fetchSales: async () => {
    set({ isLoading: true, error: null });
    try {
      const sales = await saleRepository.getAll();
      set({ sales, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch sales",
        isLoading: false,
      });
    }
  },

  // Fetch today's sales
  fetchTodaySales: async () => {
    set({ isLoading: true, error: null });
    try {
      const todaySales = await saleRepository.getToday();
      set({ todaySales, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch today sales",
        isLoading: false,
      });
    }
  },

  // Fetch by date range
  fetchByDateRange: async (startDate: string, endDate: string) => {
    set({
      isLoading: true,
      error: null,
      dateFilter: { start: startDate, end: endDate },
    });
    try {
      const sales = await saleRepository.getByDateRange(startDate, endDate);
      set({ sales, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch sales",
        isLoading: false,
      });
    }
  },

  // Fetch by payment method
  fetchByPaymentMethod: async (method: PaymentMethod) => {
    set({ isLoading: true, error: null });
    try {
      const sales = await saleRepository.getByPaymentMethod(method);
      set({ sales, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch sales",
        isLoading: false,
      });
    }
  },

  // Fetch daily summary
  fetchDailySummary: async (date: string) => {
    try {
      const summary = await saleRepository.getDailySummary(date);
      set({ dailySummary: summary });
      return summary;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch summary",
      });
      return {
        totalSales: 0,
        transactionCount: 0,
        averageTransaction: 0,
        totalDiscount: 0,
      };
    }
  },

  // Get sale details
  getSaleDetails: async (id: number) => {
    try {
      const sale = await saleRepository.getWithItems(id);
      if (sale) {
        set({ selectedSale: sale });
      }
      return sale;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to get sale details",
      });
      return null;
    }
  },

  // Void a sale
  voidSale: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const success = await saleRepository.voidSale(id);
      if (success) {
        set((state) => ({
          sales: state.sales.filter((s) => s.id !== id),
          todaySales: state.todaySales.filter((s) => s.id !== id),
          selectedSale:
            state.selectedSale?.id === id ? null : state.selectedSale,
          isLoading: false,
        }));
        // Refresh daily summary
        const today = new Date().toISOString().split("T")[0];
        get().fetchDailySummary(today);
      }
      return success;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to void sale",
        isLoading: false,
      });
      return false;
    }
  },

  // Set date filter
  setDateFilter: (start: string, end: string) => {
    set({ dateFilter: { start, end } });
  },

  // Clear date filter
  clearDateFilter: () => {
    set({ dateFilter: null });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
