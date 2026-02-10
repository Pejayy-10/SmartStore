// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

export type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  "cart.fill": "shopping-cart",
  "list.bullet": "list",
  "cube.box.fill": "inventory",
  "chart.bar.fill": "bar-chart",
  "gearshape.fill": "settings",
  gear: "settings",

  // Actions
  plus: "add",
  "plus.circle.fill": "add-circle",
  minus: "remove",
  pencil: "edit",
  trash: "delete",
  checkmark: "check",
  xmark: "close",
  "xmark.circle.fill": "cancel",
  "chevron.left": "chevron-left",
  "chevron.right": "chevron-right",
  magnifyingglass: "search",
  "arrow.right.circle.fill": "arrow-forward",

  // Objects
  "tag.fill": "local-offer",
  "creditcard.fill": "credit-card",
  "banknote.fill": "attach-money",
  "phone.fill": "smartphone",
  "person.fill": "person",
  "lock.fill": "lock",
  "doc.text.fill": "receipt",
  "leaf.fill": "eco",
  "box.truck.fill": "local-shipping",
  "exclamationmark.triangle.fill": "warning",
  "rectangle.portrait.and.arrow.right": "logout",
  cart: "shopping-cart",

  // Misc
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "sun.max.fill": "light-mode",
  "moon.fill": "dark-mode",

  // Food/Drink placeholders (using generic icons)
  "cup.and.saucer.fill": "local-cafe",
  "fork.knife": "restaurant",
  "birthday.cake.fill": "cake",
  leaf: "eco",
  "plus.circle": "add-circle-outline",
  "checkmark.circle.fill": "check-circle",

  // Phase 2 icons
  "dollar.sign.circle.fill": "attach-money",
  "person.2.fill": "people",
  "chart.pie.fill": "pie-chart",
  "bell.fill": "notifications",
  "arrow.triangle.2.circlepath": "sync",
  calendar: "event",
  "clock.fill": "schedule",
  "tray.full.fill": "inbox",
} as const;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}
