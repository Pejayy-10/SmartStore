/**
 * SmartStore Settings Screen
 * Theme toggle and user preferences
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, brand, radius, shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSettingsStore, type ThemeMode } from "@/store/settings.store";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  const router = useRouter();
  const systemColorScheme = useColorScheme() ?? "light";

  const { themeMode, setThemeMode, isLoggedIn, userName, logout } =
    useSettingsStore();

  // Determine effective color scheme
  const effectiveScheme =
    themeMode === "system" ? systemColorScheme : themeMode;
  const colors = Colors[effectiveScheme];

  // Theme options
  const themeOptions: { value: ThemeMode; label: string; icon: string }[] = [
    { value: "system", label: "System", icon: "gear" },
    { value: "light", label: "Light", icon: "sun.max.fill" },
    { value: "dark", label: "Dark", icon: "moon.fill" },
  ];

  // Handle logout
  const handleLogout = useCallback(() => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  }, [logout]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <IconSymbol name="chevron.left" size={24} color={brand.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* User Section */}
        {isLoggedIn && (
          <View
            style={[
              styles.section,
              { backgroundColor: colors.card },
              shadows.soft,
            ]}
          >
            <View style={styles.userRow}>
              <View
                style={[styles.avatar, { backgroundColor: brand.primaryFaded }]}
              >
                <Text style={styles.avatarText}>
                  {userName?.charAt(0).toUpperCase() || "?"}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {userName}
                </Text>
                <Text style={[styles.userRole, { color: colors.textTertiary }]}>
                  Store Owner
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Appearance Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            APPEARANCE
          </Text>
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card },
            shadows.soft,
          ]}
        >
          <Text style={[styles.optionLabel, { color: colors.text }]}>
            Theme
          </Text>
          <View style={styles.themeOptions}>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor:
                      themeMode === option.value
                        ? brand.primary
                        : colors.background,
                    borderColor:
                      themeMode === option.value
                        ? brand.primary
                        : colors.border,
                  },
                ]}
                onPress={() => setThemeMode(option.value)}
              >
                <IconSymbol
                  name={option.icon as "gear" | "sun.max.fill" | "moon.fill"}
                  size={20}
                  color={themeMode === option.value ? "#FFFFFF" : colors.icon}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color:
                        themeMode === option.value ? "#FFFFFF" : colors.text,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App Info Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            ABOUT
          </Text>
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card },
            shadows.soft,
          ]}
        >
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.text }]}>
              App Name
            </Text>
            <Text style={[styles.infoValue, { color: colors.textTertiary }]}>
              SmartStore
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.text }]}>
              Versionn
            </Text>
            <Text style={[styles.infoValue, { color: colors.textTertiary }]}>
              1.0.0
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.text }]}>
              Developerr
            </Text>
            <Text style={[styles.infoValue, { color: brand.primary }]}>
              Frandilbert
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        {isLoggedIn && (
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: "#FF3B30" }]}
            onPress={handleLogout}
          >
            <IconSymbol
              name="rectangle.portrait.and.arrow.right"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: brand.primary,
  },
  userInfo: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
  },
  userRole: {
    fontSize: 14,
    marginTop: 2,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 12,
  },
  themeOptions: {
    flexDirection: "row",
    gap: 10,
  },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 15,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: radius.lg,
    marginTop: 16,
    ...shadows.soft,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
  },
});
