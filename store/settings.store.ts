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
  login: (name: string, pin: string) => void;
  logout: () => void;
  hideSplash: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
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
      login: (name: string, pin: string) => {
        set({
          isLoggedIn: true,
          userName: name,
          userPin: pin,
        });
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
