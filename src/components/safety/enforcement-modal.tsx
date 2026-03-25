/**
 * Enforcement state feedback modal.
 *
 * Three variants per UI-SPEC:
 *   - warning: Community guidelines warning (D-07)
 *   - dm_ban: Messaging restricted with end date
 *   - suspension: Account suspended with end date
 *
 * Warning variant requires acknowledgment (no backdrop dismiss).
 * DM ban and suspension variants use gray CTA.
 */

import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EnforcementModalVariant = "warning" | "dm_ban" | "suspension";

type EnforcementModalProps = {
  readonly variant: EnforcementModalVariant;
  readonly endDate: string | null;
  readonly visible: boolean;
  readonly onDismiss: () => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "a future date";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Variant configs
// ---------------------------------------------------------------------------

type VariantConfig = {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly iconColor: string;
  readonly title: string;
  readonly getBody: (endDate: string | null) => string;
  readonly ctaLabel: string;
  readonly ctaStyle: "primary" | "gray";
};

const VARIANT_CONFIGS: Record<EnforcementModalVariant, VariantConfig> = {
  warning: {
    icon: "warning-outline",
    iconColor: "#f59e0b",
    title: "Community Guidelines Warning",
    getBody: () =>
      "Your account was flagged for behavior that may violate our community guidelines. Please review our guidelines to keep Room a safe space for everyone.",
    ctaLabel: "I Understand",
    ctaStyle: "primary",
  },
  dm_ban: {
    icon: "chatbubble-outline",
    iconColor: "#ef4444",
    title: "Messaging Restricted",
    getBody: (endDate) =>
      `Your account has a messaging restriction until ${formatDate(endDate)}. You can still browse profiles but cannot send or receive messages during this period.`,
    ctaLabel: "Got It",
    ctaStyle: "gray",
  },
  suspension: {
    icon: "time-outline",
    iconColor: "#ef4444",
    title: "Account Suspended",
    getBody: (endDate) =>
      `Your account has been suspended until ${formatDate(endDate)} for violating community guidelines. During this time you cannot interact with the app.`,
    ctaLabel: "Got It",
    ctaStyle: "gray",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EnforcementModal({
  variant,
  endDate,
  visible,
  onDismiss,
}: EnforcementModalProps) {
  const config = VARIANT_CONFIGS[variant];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={variant === "warning" ? undefined : onDismiss}
    >
      <View style={styles.backdrop} accessibilityRole="alert">
        <View style={styles.card}>
          {/* Icon */}
          <Ionicons
            name={config.icon}
            size={48}
            color={config.iconColor}
          />

          {/* Title */}
          <Text style={styles.title}>{config.title}</Text>

          {/* Body */}
          <Text style={styles.body}>{config.getBody(endDate)}</Text>

          {/* CTA button */}
          <Pressable
            style={[
              styles.ctaButton,
              config.ctaStyle === "primary"
                ? styles.ctaButtonPrimary
                : styles.ctaButtonGray,
            ]}
            onPress={onDismiss}
            testID="enforcement-modal-cta"
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.ctaLabel,
                config.ctaStyle === "primary"
                  ? styles.ctaLabelPrimary
                  : styles.ctaLabelGray,
              ]}
            >
              {config.ctaLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginTop: 16,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    color: "#4b5563",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 24,
  },
  ctaButton: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  ctaButtonPrimary: {
    backgroundColor: "#7c3aed",
  },
  ctaButtonGray: {
    backgroundColor: "#e5e7eb",
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  ctaLabelPrimary: {
    color: "#fff",
  },
  ctaLabelGray: {
    color: "#111827",
  },
});
