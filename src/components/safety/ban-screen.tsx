/**
 * Permanent ban full-screen replacement per D-08.
 *
 * Replaces the entire app when enforcement state is "permanent_ban".
 * No navigation, no tabs -- only a sign-out button.
 */

import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BanScreenProps = {
  readonly onSignOut: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BanScreen({ onSignOut }: BanScreenProps) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      {/* Icon */}
      <Ionicons name="close-circle" size={64} color="#ef4444" />

      {/* Title */}
      <Text style={styles.title}>Account Permanently Suspended</Text>

      {/* Body */}
      <Text style={styles.body}>
        Your account has been permanently suspended for violating community
        guidelines. This decision is final.
      </Text>

      {/* Sign out button */}
      <Pressable
        style={styles.signOutButton}
        onPress={onSignOut}
        testID="ban-screen-sign-out"
        accessibilityRole="button"
        accessibilityLabel="Sign Out"
      >
        <Text style={styles.signOutLabel}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginTop: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    color: "#4b5563",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 24,
  },
  signOutButton: {
    borderWidth: 2,
    borderColor: "#ef4444",
    borderRadius: 12,
    height: 48,
    minWidth: 200,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
  },
  signOutLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ef4444",
  },
});
