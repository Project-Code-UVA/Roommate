/**
 * Photo indicator: small dots showing current photo position.
 *
 * Centered row of dots beneath the Dynamic Island / notch.
 * Active dot is white; inactive dots are semi-transparent.
 */

import { View, StyleSheet } from "react-native";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PhotoIndicatorProps = {
  readonly total: number;
  readonly current: number;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PhotoIndicator({ total, current }: PhotoIndicatorProps) {
  if (total <= 1) return null;

  return (
    <View style={styles.container} testID="photo-indicator">
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === current ? styles.active : styles.inactive,
          ]}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  active: {
    backgroundColor: "#fff",
  },
  inactive: {
    backgroundColor: "rgba(255,255,255,0.4)",
  },
});
