/**
 * Reusable overflow menu component.
 *
 * Renders a 3-dot (ellipsis-horizontal) icon button that opens a dropdown
 * with configurable menu items. Invisible backdrop for outside-tap dismiss.
 *
 * Extracted from chat-header.tsx pattern per D-10.
 */

import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { OverflowMenuItem } from "@/types/safety";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OverflowMenuProps = {
  readonly items: readonly OverflowMenuItem[];
  readonly testIDPrefix?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OverflowMenu({ items, testIDPrefix }: OverflowMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleItemPress = useCallback(
    (onPress: () => void) => {
      setMenuOpen(false);
      onPress();
    },
    [],
  );

  const buttonTestID = testIDPrefix
    ? `${testIDPrefix}-overflow`
    : "overflow-menu-button";

  return (
    <View style={styles.container}>
      {/* Overflow trigger button */}
      <Pressable
        onPress={toggleMenu}
        style={styles.overflowButton}
        testID={buttonTestID}
        accessibilityRole="button"
        accessibilityLabel="More options"
      >
        <Ionicons name="ellipsis-horizontal" size={22} color="#111827" />
      </Pressable>

      {/* Dropdown */}
      {menuOpen && (
        <>
          {/* Invisible backdrop to close menu on tap outside */}
          <Pressable
            style={styles.menuBackdrop}
            onPress={closeMenu}
            testID="overflow-backdrop"
          />
          <View style={styles.menuDropdown}>
            {items.map((item, index) => (
              <View key={item.label}>
                {index > 0 && <View style={styles.menuSeparator} />}
                <Pressable
                  style={styles.menuItem}
                  onPress={() => handleItemPress(item.onPress)}
                  testID={`overflow-item-${item.label.toLowerCase()}`}
                  accessibilityLabel={item.label}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={item.icon as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={item.destructive ? "#ef4444" : "#374151"}
                  />
                  <Text
                    style={[
                      styles.menuLabel,
                      item.destructive === true && styles.menuLabelDanger,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles (exact copy from chat-header.tsx pattern)
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  overflowButton: {
    padding: 4,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  menuDropdown: {
    position: "absolute",
    top: 44,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuLabel: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  menuLabelDanger: {
    color: "#ef4444",
  },
  menuSeparator: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 8,
  },
});
