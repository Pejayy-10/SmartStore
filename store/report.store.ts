/**
 * SmartStore Report Store
 * Zustand state management for reports and analytics
 */

import { create } from "zustand";
import {
    reportRepository,
    type BestSeller,
    type BreakEvenResult,
    type DailyReport,
    type HourlySales,
} from "../database/repositories/report.repository";

interface ReportState {
  // State
  dailyReport: DailyReport | null;
  weeklyTrend: DailyReport[];
  breakEven: BreakEvenResult | null;
  bestSellers: BestSeller[];
  peakHours: HourlySales[];
  selectedDate: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDailyReport: (date: string) => Promise<void>;
  fetchWeeklyTrend: () => Promise<void>;
  fetchBreakEven: () => Promise<void>;
  fetchBestSellers: () => Promise<void>;
  fetchPeakHours: () => Promise<void>;
  fetchAll: (date: string) => Promise<void>;
  setSelectedDate: (date: string) => void;
  clearError: () => void;
}

const today = () => new Date().toISOString().split("T")[0];

export const useReportStore = create<ReportState>((set, get) => ({
  // Initial state
  dailyReport: null,
  weeklyTrend: [],
  breakEven: null,
  bestSellers: [],
  peakHours: [],
  selectedDate: today(),
  isLoading: false,
  error: null,

  // Fetch daily report
  fetchDailyReport: async (date: string) => {
    try {
      const dailyReport = await reportRepository.getDailyReport(date);
      set({ dailyReport, selectedDate: date });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch report",
      });
    }
  },

  // Fetch weekly trend
  fetchWeeklyTrend: async () => {
    try {
      const weeklyTrend = await reportRepository.getWeeklyTrend();
      set({ weeklyTrend });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch weekly trend",
      });
    }
  },

  // Fetch break-even analysis
  fetchBreakEven: async () => {
    try {
      const breakEven = await reportRepository.getBreakEvenAnalysis();
      set({ breakEven });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch break-even",
      });
    }
  },

  // Fetch best sellers
  fetchBestSellers: async () => {
    try {
      const bestSellers = await reportRepository.getBestSellers();
      set({ bestSellers });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch best sellers",
      });
    }
  },

  // Fetch peak hours
  fetchPeakHours: async () => {
    try {
      const peakHours = await reportRepository.getPeakHours();
      set({ peakHours });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch peak hours",
      });
    }
  },

  // Fetch all reports
  fetchAll: async (date: string) => {
    set({ isLoading: true, error: null, selectedDate: date });
    try {
      const [dailyReport, weeklyTrend, breakEven, bestSellers, peakHours] =
        await Promise.all([
          reportRepository.getDailyReport(date),
          reportRepository.getWeeklyTrend(),
          reportRepository.getBreakEvenAnalysis(),
          reportRepository.getBestSellers(),
          reportRepository.getPeakHours(),
        ]);
      set({
        dailyReport,
        weeklyTrend,
        breakEven,
        bestSellers,
        peakHours,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch reports",
        isLoading: false,
      });
    }
  },

  // Set selected date
  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
    get().fetchDailyReport(date);
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
