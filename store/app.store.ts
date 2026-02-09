/**
 * SmartStore App Store
 * Global application state (initialization, theme, etc.)
 */

import { create } from "zustand";
import { initializeDatabase } from "../database";

interface AppState {
  // State
  isInitialized: boolean;
  isInitializing: boolean;
  initError: string | null;

  // Actions
  initialize: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  isInitialized: false,
  isInitializing: false,
  initError: null,

  // Initialize app (database, etc.)
  initialize: async () => {
    set({ isInitializing: true, initError: null });
    try {
      await initializeDatabase();
      set({ isInitialized: true, isInitializing: false });
    } catch (error) {
      set({
        initError:
          error instanceof Error ? error.message : "Initialization failed",
        isInitializing: false,
      });
    }
  },
}));
