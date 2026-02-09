/**
 * SmartStore Products Stack Layout
 * Handles product list and detail navigation
 */

import { Stack } from "expo-router";

export default function ProductsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
