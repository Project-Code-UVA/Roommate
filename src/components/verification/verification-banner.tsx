/**
 * Post-onboarding verification nudge banner.
 *
 * Horizontal banner encouraging users to verify their identity
 * with a selfie for a verified badge. Dismissable via X button.
 * Per D-02: shows after onboarding, user can skip.
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
    <View style={styles.banner} testID="verification-banner">
      {/* Dismiss X */}
      <Pressable
        style={styles.dismissButton}
        onPress={onDismiss}
        testID="verification-banner-dismiss"
        accessibilityLabel="Dismiss verification banner"
        accessibilityRole="button"
      >
        <Ionicons name="close" size={18} color="#9ca3af" />
      </Pressable>

      {/* Shield icon */}
      <Ionicons
        name="shield-checkmark-outline"
        size={24}
        color="#7c3aed"
        style={styles.shieldIcon}
      />

      {/* Text section */}
      <View style={styles.textSection}>
        <Text style={styles.heading}>Build trust with verification</Text>
        <Text style={styles.body}>
          Take a quick selfie to get a verified badge on your profile.
        </Text>
      </View>

      {/* CTA button */}
      <Pressable style={styles.ctaButton} onPress={onVerify}>
        <Text style={styles.ctaText}>Verify Now</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#f5f3ff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 8,
  },
  dismissButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
    padding: 4,
  },
  shieldIcon: {
    marginRight: 12,
  },
  textSection: {
    flex: 1,
  },
  heading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  body: {
    fontSize: 13,
    fontWeight: "400",
    color: "#4b5563",
    marginTop: 2,
  },
  ctaButton: {
    backgroundColor: "#7c3aed",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
  },
  ctaText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
