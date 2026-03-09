/**
 * Reusable circular icon button.
 *
 * Renders an Ionicons icon centered in a rounded pressable circle.
 * Used for floating action buttons, toolbars, and navigation.
 */

import { Ionicons } from "@expo/vector-icons";
import { Pressable, type ViewStyle } from "react-native";

import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IconButtonProps = {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly size?: number;
  readonly color?: string;
  readonly bgColor?: string;
  readonly onPress: () => void;
  readonly testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IconButton({
  icon,
  size = 24,
  color = COLORS.white,
  bgColor = "rgba(0,0,0,0.4)",
  onPress,
  testID,
}: IconButtonProps) {
  const buttonSize = size + 16;

  const containerStyle: ViewStyle = {
    width: buttonSize,
    height: buttonSize,
    borderRadius: buttonSize / 2,
    backgroundColor: bgColor,
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <Pressable
      onPress={onPress}
      style={containerStyle}
      testID={testID}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}
