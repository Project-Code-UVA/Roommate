/**
 * Post-onboarding verification nudge — compact inline strip.
 *
 * Shown inside the profile ScrollView so it doesn't steal above-fold space.
 * Per D-02: dismissable, user can skip.
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VerificationBannerProps = {
  readonly onVerify: () => void;
  readonly onDismiss: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VerificationBanner({
  onVerify,
  onDismiss,
}: VerificationBannerProps) {
  return (
    <LinearGradient
      colors={["#f5f3ff", "#ede9fe"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.strip}
      testID="verification-banner"
    >
      <Ionicons name="shield-checkmark-outline" size={18} color="#7c3aed" />
      <Text style={styles.text} numberOfLines={1}>
        Add a verified badge to your profile
      </Text>
      <Pressable
        style={styles.verifyPill}
        onPress={onVerify}
        testID="verification-banner-verify"
        accessibilityLabel="Verify your identity"
        accessibilityRole="button"
      >
        <Text style={styles.verifyText}>Verify</Text>
      </Pressable>
      <Pressable
        style={styles.dismissButton}
        onPress={onDismiss}
        testID="verification-banner-dismiss"
        accessibilityLabel="Dismiss verification banner"
        accessibilityRole="button"
      >
        <Ionicons name="close" size={16} color="#9ca3af" />
      </Pressable>
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#4c1d95",
  },
  verifyPill: {
    backgroundColor: "#7c3aed",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  verifyText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  dismissButton: {
    padding: 2,
  },
});
