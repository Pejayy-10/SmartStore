/**
 * SmartStore Professional Login Screen
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { brand, Colors, shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSettingsStore } from "@/store";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Animated, {
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const PIN_LENGTH = 6;

export default function LoginScreen() {
  const systemColorScheme = useColorScheme() ?? "light";
  const { themeMode, login } = useSettingsStore();
  const colorScheme = themeMode === "system" ? systemColorScheme : themeMode;
  const colors = Colors[colorScheme];

  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const shakeTranslateX = useSharedValue(0);

  const handlePress = useCallback(
    (key: string) => {
      if (isLoading) return;

      if (key === "backspace") {
        setPin((prev) => prev.slice(0, -1));
      } else if (pin.length < PIN_LENGTH) {
        const newPin = pin + key;
        setPin(newPin);

        if (newPin.length === PIN_LENGTH) {
          handleLogin(newPin);
        }
      }
    },
    [pin, isLoading],
  );

  const handleLogin = async (enteredPin: string) => {
    setIsLoading(true);
    // Simulate API delay for polish
    setTimeout(async () => {
      const success = await login(enteredPin);
      if (!success) {
        setIsLoading(false);
        setPin("");
        triggerShake();
        Alert.alert("Invalid PIN", "Please try again (Default: 123456)");
      }
    }, 500);
  };

  const triggerShake = () => {
    shakeTranslateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  };

  const shakeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeTranslateX.value }],
    };
  });

  const renderPinDot = (index: number) => {
    const isFilled = index < pin.length;
    return (
      <View
        key={index}
        style={[
          styles.pinDot,
          {
            borderColor: isFilled ? brand.primary : colors.border,
            backgroundColor: isFilled ? brand.primary : "transparent",
          },
        ]}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      {/* Background decoration */}
      <View style={styles.backgroundDecor} pointerEvents="none">
        <LinearGradient
          colors={[brand.primaryFaded, "transparent"]}
          style={styles.gradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      <View style={styles.content}>
        {/* Logo Section */}
        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={styles.logoSection}
        >
          <View style={[styles.logoContainer, shadows.glow]}>
            <LinearGradient
              colors={[brand.primary, brand.primaryDark]}
              style={styles.logoGradient}
            >
              <IconSymbol name="cart.fill" size={40} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>
            SmartStore
          </Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Professional POS System
          </Text>
        </Animated.View>

        {/* PIN Display */}
        <Animated.View
          style={[styles.pinDisplayContainer, shakeStyle]}
          entering={FadeInDown.delay(400).springify()}
        >
          <Text style={[styles.enterPinText, { color: colors.textSecondary }]}>
            Enter Access PIN
          </Text>
          <View style={styles.pinDotsContainer}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => renderPinDot(i))}
          </View>
        </Animated.View>

        {/* Keypad */}
        <Animated.View
          style={styles.keypad}
          entering={FadeInDown.delay(600).springify()}
        >
          {[
            ["1", "2", "3"],
            ["4", "5", "6"],
            ["7", "8", "9"],
            ["empty", "0", "backspace"],
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((key) => {
                if (key === "empty")
                  return <View key={key} style={styles.key} />;

                if (key === "backspace") {
                  return (
                    <TouchableOpacity
                      key={key}
                      style={styles.key}
                      onPress={() => handlePress(key)}
                      disabled={isLoading}
                    >
                      <IconSymbol
                        name="chevron.left"
                        size={28}
                        color={colors.text}
                      />
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.key,
                      { backgroundColor: colors.card },
                      shadows.soft,
                    ]}
                    onPress={() => handlePress(key)}
                    disabled={isLoading}
                  >
                    <Text style={[styles.keyText, { color: colors.text }]}>
                      {key}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </Animated.View>

        {/* Loading Overlay */}
        {isLoading && (
          <View
            style={[styles.loadingOverlay, { backgroundColor: colors.overlay }]}
          >
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Authenticating...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundDecor: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  gradient: {
    height: 300,
    width: "100%",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: "center",
    marginTop: 20,
  },
  logoContainer: {
    padding: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginBottom: 16,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    marginTop: 4,
    fontWeight: "500",
  },
  pinDisplayContainer: {
    alignItems: "center",
    gap: 20,
  },
  enterPinText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  pinDotsContainer: {
    flexDirection: "row",
    gap: 16,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  keypad: {
    gap: 20,
    paddingHorizontal: 20,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  keyText: {
    fontSize: 28,
    fontWeight: "500",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    backdropFilter: "blur(10px)",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
  },
});
