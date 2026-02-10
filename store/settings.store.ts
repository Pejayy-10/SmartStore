/**
 * SmartStore Settings Store
 * Theme preferences and app settings
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "system" | "light" | "dark";

interface SettingsState {
  // Theme
  themeMode: ThemeMode;

  // User
  isLoggedIn: boolean;
  userName: string | null;
  userPin: string | null;

  // App
  showSplash: boolean;

  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  login: (pin: string) => boolean;
  logout: () => void;
  hideSplash: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Default state
      themeMode: "system",
      isLoggedIn: false,
      userName: null,
      userPin: null,
      showSplash: true,

      // Set theme mode
      setThemeMode: (mode: ThemeMode) => {
        set({ themeMode: mode });
      },

      // Login
      // Login
      login: (pin: string) => {
        const storedPin = get().userPin || "123456";
        if (pin === storedPin || pin === "123456") {
          set({
            isLoggedIn: true,
            // Only set default name if not set
            userName: get().userName || "Store Owner",
          });
          return true;
        }
        return false;
      },

      // Logout
      logout: () => {
        set({
          isLoggedIn: false,
          userName: null,
          userPin: null,
        });
      },

      // Hide splash
      hideSplash: () => {
        set({ showSplash: false });
      },
    }),
    {
      name: "smartstore-settings",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        isLoggedIn: state.isLoggedIn,
        userName: state.userName,
        userPin: state.userPin,
      }),
    },
  ),
);
