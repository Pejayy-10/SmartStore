/**
 * SmartStore Theme Configuration
 * Orange color scheme with dark/light mode support
 */

// Main brand colors
export const brand = {
  primary: "#F97316",
  primaryLight: "#FB923C",
  primaryDark: "#EA580C",
  primaryFaded: "rgba(249, 115, 22, 0.1)",
  primaryGlow: "rgba(249, 115, 22, 0.3)",
};

// Semantic colors
export const semantic = {
  success: "#34C759",
  warning: "#FF9500",
  error: "#FF3B30",
  info: "#007AFF",
};

// Light theme
export const light = {
  // Backgrounds
  background: "#F5F5F7",
  surface: "#FFFFFF",
  card: "#FFFFFF",

  // Text
  text: "#1C1C1E",
  textSecondary: "#636366",
  textTertiary: "#8E8E93",

  // Borders
  border: "#E5E5EA",
  borderLight: "#F2F2F7",

  // Interactive
  tint: brand.primary,
  icon: "#8E8E93",
  tabIconDefault: "#8E8E93",
  tabIconSelected: brand.primary,

  // Overlays
  overlay: "rgba(0, 0, 0, 0.4)",
  shadow: "rgba(0, 0, 0, 0.08)",
};

// Dark theme
export const dark = {
  // Backgrounds
  background: "#000000",
  surface: "#1C1C1E",
  card: "#2C2C2E",

  // Text
  text: "#FFFFFF",
  textSecondary: "#EBEBF5",
  textTertiary: "#98989D",

  // Borders
  border: "#38383A",
  borderLight: "#2C2C2E",

  // Interactive
  tint: brand.primary,
  icon: "#98989D",
  tabIconDefault: "#98989D",
  tabIconSelected: brand.primary,

  // Overlays
  overlay: "rgba(0, 0, 0, 0.7)",
  shadow: "rgba(0, 0, 0, 0.3)",
};

// Combined Colors export (for backwards compatibility)
export const Colors = {
  light,
  dark,
  brand,
  semantic,
};

// Shadow styles for different elevations
export const shadows = {
  soft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  hard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 8,
  },
  glow: {
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
};

// Border radius presets
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  full: 9999,
};

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
};

export default Colors;
