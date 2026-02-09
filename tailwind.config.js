/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // SmartStore Orange Theme
        primary: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316", // Main orange
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
          950: "#431407",
        },
        // Neutral grays for dark/light
        surface: {
          light: "#FFFFFF",
          dark: "#1C1C1E",
        },
        background: {
          light: "#F5F5F7",
          dark: "#000000",
        },
        card: {
          light: "#FFFFFF",
          dark: "#2C2C2E",
        },
        text: {
          light: "#1C1C1E",
          dark: "#FFFFFF",
        },
        muted: {
          light: "#8E8E93",
          dark: "#98989D",
        },
        border: {
          light: "#E5E5EA",
          dark: "#38383A",
        },
        success: "#34C759",
        warning: "#FF9500",
        error: "#FF3B30",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0, 0, 0, 0.08)",
        medium: "0 4px 16px rgba(0, 0, 0, 0.12)",
        hard: "0 8px 32px rgba(0, 0, 0, 0.16)",
        glow: "0 0 20px rgba(249, 115, 22, 0.3)",
      },
    },
  },
  plugins: [],
};
