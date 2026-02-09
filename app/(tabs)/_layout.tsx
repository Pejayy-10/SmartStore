import { Tabs, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { brand, Colors, shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSettingsStore } from "@/store";

export default function TabLayout() {
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const { themeMode } = useSettingsStore();

  // Determine effective color scheme
  const colorScheme =
    themeMode === "system" ? (systemColorScheme ?? "light") : themeMode;

  const colors = Colors[colorScheme];

  return (
    <View style={styles.container}>
      {/* Settings button */}
      <TouchableOpacity
        style={[
          styles.settingsButton,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          shadows.soft,
        ]}
        onPress={() => router.push("/settings")}
      >
        <IconSymbol name="gear" size={22} color={brand.primary} />
      </TouchableOpacity>

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: brand.primary,
          tabBarInactiveTintColor: colors.icon,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingTop: 8,
            paddingBottom: 8,
            height: 65,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: 4,
          },
          headerShown: false,
          tabBarButton: HapticTab,
        }}
      >
        {/* Hide default screens */}
        <Tabs.Screen
          name="index"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            href: null, // Hide from tab bar
          }}
        />

        {/* Main app screens */}
        <Tabs.Screen
          name="pos"
          options={{
            title: "POS",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={[styles.iconContainer, focused && styles.iconFocused]}
              >
                <IconSymbol size={26} name="creditcard.fill" color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="products"
          options={{
            title: "Products",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={[styles.iconContainer, focused && styles.iconFocused]}
              >
                <IconSymbol size={26} name="cart.fill" color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="ingredients"
          options={{
            title: "Stock",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={[styles.iconContainer, focused && styles.iconFocused]}
              >
                <IconSymbol size={26} name="leaf.fill" color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="recipes"
          options={{
            title: "Recipes",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={[styles.iconContainer, focused && styles.iconFocused]}
              >
                <IconSymbol size={26} name="doc.text.fill" color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="sales"
          options={{
            title: "Sales",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={[styles.iconContainer, focused && styles.iconFocused]}
              >
                <IconSymbol size={26} name="chart.bar.fill" color={color} />
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsButton: {
    position: "absolute",
    top: 56,
    right: 16,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  iconFocused: {
    backgroundColor: "rgba(249, 115, 22, 0.1)",
  },
});
