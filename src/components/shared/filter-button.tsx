/**
 * FilterButton — header button that opens the FilterSheet.
 *
 * Renders a filter icon with a small badge showing the number of active
 * filter categories. Uses the same visual language as other header chips
 * (Discovery count badge, Explore sparkles) — rounded pill background.
 */

import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterButtonProps = {
  readonly activeCount: number;
  readonly onPress: () => void;
  readonly testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FilterButton({
  activeCount,
  onPress,
  testID = "filter-button",
}: FilterButtonProps) {
  const active = activeCount > 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        active ? `Filters, ${activeCount} active` : "Filters"
      }
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        active && styles.buttonActive,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name="options-outline"
        size={18}
        color={active ? "#fff" : COLORS.primary[600]}
      />
      {active && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{activeCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  button: {
    height: 36,
    width: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary[100],
  },
  buttonActive: {
    backgroundColor: COLORS.primary[600],
  },
  pressed: {
    opacity: 0.75,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 12,
  },
});
