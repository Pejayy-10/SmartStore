import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { brand, Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSettingsStore } from "@/store";

export default function TabLayout() {
  const systemColorScheme = useColorScheme();
  const { themeMode } = useSettingsStore();

  // Determine effective color scheme
  const colorScheme =
    themeMode === "system" ? (systemColorScheme ?? "light") : themeMode;

  const colors = Colors[colorScheme];

  return (
    <View style={styles.container}>
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
