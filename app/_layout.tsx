import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import "../global.css";

import LoginScreen from "@/components/login-screen";
import SplashScreen from "@/components/splash-screen";
import { brand } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSettingsStore } from "@/store";

// Custom themes with orange accent
const OrangeLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: brand.primary,
    background: "#F5F5F7",
    card: "#FFFFFF",
    text: "#1C1C1E",
    border: "#E5E5EA",
  },
};

const OrangeDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: brand.primary,
    background: "#000000",
    card: "#1C1C1E",
    text: "#FFFFFF",
    border: "#38383A",
  },
};

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const { themeMode, showSplash, hideSplash, isLoggedIn } = useSettingsStore();

  // Determine effective color scheme
  const effectiveScheme =
    themeMode === "system" ? systemColorScheme : themeMode;

  // Show splash on first load
  const [showingSplash, setShowingSplash] = useState(true);

  useEffect(() => {
    // Auto-hide splash after it's been shown once
    if (!showSplash) {
      setShowingSplash(false);
    }
  }, [showSplash]);

  const handleSplashFinish = () => {
    setShowingSplash(false);
    hideSplash();
  };

  // Show splash screen
  if (showingSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <ThemeProvider
      value={effectiveScheme === "dark" ? OrangeDarkTheme : OrangeLightTheme}
    >
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings"
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
        <Stack.Screen name="ingredients" options={{ headerShown: false }} />
        <Stack.Screen name="products" options={{ headerShown: false }} />
        <Stack.Screen name="recipes" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={effectiveScheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}
