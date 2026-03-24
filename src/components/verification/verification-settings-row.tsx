/**
 * Settings row for selfie verification status.
 *
 * Shows current verification state and action:
 * - Unverified: "Verify Identity" with "Not verified" detail
 * - Verified: "Re-upload Selfie" with "Verified" detail in green
 *
 * Per D-04: user can re-upload selfie from profile settings.
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VerificationSettingsRowProps = {
  readonly isVerified: boolean;
  readonly onVerify: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VerificationSettingsRow({
  isVerified,
  onVerify,
}: VerificationSettingsRowProps) {
  return (
    <Pressable
      style={styles.row}
      onPress={onVerify}
      testID="verification-settings-row"
    >
      <Ionicons
        name="shield-checkmark-outline"
        size={22}
        color="#7c3aed"
        style={styles.icon}
      />

      <Text style={styles.label}>
        {isVerified ? "Re-upload Selfie" : "Verify Identity"}
      </Text>

      <Text
        style={[
          styles.detail,
          isVerified ? styles.detailVerified : styles.detailUnverified,
        ]}
      >
        {isVerified ? "Verified" : "Not verified"}
      </Text>

      <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  icon: {
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
  },
  detail: {
    fontSize: 14,
    marginRight: 8,
  },
  detailVerified: {
    color: "#4ade80",
  },
  detailUnverified: {
    color: "#9ca3af",
  },
});
