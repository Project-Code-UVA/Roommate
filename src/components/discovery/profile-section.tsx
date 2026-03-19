/**
 * White rounded info card used within the scrollable profile view.
 *
 * Renders a titled section with optional icon and arbitrary children content.
 */

import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProfileSectionProps = {
  readonly title?: string;
  readonly icon?: keyof typeof Ionicons.glyphMap;
  readonly iconColor?: string;
  readonly children: React.ReactNode;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileSection({
  title,
  icon,
  iconColor = "#6b7280",
  children,
}: ProfileSectionProps) {
  return (
    <View style={styles.card}>
      {title && (
        <View style={styles.header}>
          {icon && (
            <Ionicons name={icon} size={18} color={iconColor} />
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 12,
    marginTop: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
