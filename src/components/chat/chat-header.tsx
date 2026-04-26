/**
 * Chat header bar.
 *
 * Displays back arrow, avatar + display name (tappable for profile),
 * and overflow menu with Block/Report actions.
 *
 * No online/last active status per user decision -- display name only.
 */

import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { ThreadUser } from "@/types/chat";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChatHeaderProps = {
  readonly otherUser: ThreadUser;
  readonly onPressProfile: () => void;
  readonly onPressBlock: () => void;
  readonly onPressReport: () => void;
  readonly onBack: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatHeader({
  otherUser,
  onPressProfile,
  onPressBlock,
  onPressReport,
  onBack,
}: ChatHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const handleBlock = useCallback(() => {
    setMenuOpen(false);
    onPressBlock();
  }, [onPressBlock]);

  const handleReport = useCallback(() => {
    setMenuOpen(false);
    onPressReport();
  }, [onPressReport]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  return (
    <View style={styles.container}>
      {/* Back button */}
      <Pressable
        onPress={onBack}
        style={styles.backButton}
        testID="chat-header-back"
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={24} color="#111827" />
        <Text style={styles.backText}>Messages</Text>
      </Pressable>

      {/* Avatar + Name */}
      <View style={styles.centerContainer} pointerEvents="box-none">
        <Pressable
          style={styles.profileSection}
          onPress={onPressProfile}
          testID="chat-header-profile"
        >
          {otherUser.avatar_url ? (
            <Image
              source={{ uri: otherUser.avatar_url }}
              style={styles.avatar}
              testID="chat-header-avatar"
            />
          ) : (
            <View style={styles.avatarFallback} testID="chat-header-avatar-fallback">
              <Ionicons name="person-circle" size={32} color="#9ca3af" />
            </View>
          )}
          <Text style={styles.displayName} numberOfLines={1}>
            {otherUser.display_name}
          </Text>
        </Pressable>
      </View>

      {/* Overflow menu button */}
      <Pressable
        onPress={toggleMenu}
        style={styles.overflowButton}
        testID="chat-header-overflow"
        accessibilityRole="button"
        accessibilityLabel="More options"
      >
        <Ionicons name="ellipsis-horizontal" size={22} color="#111827" />
      </Pressable>

      {/* Overflow dropdown */}
      {menuOpen && (
        <>
          {/* Invisible backdrop to close menu on tap outside */}
          <Pressable
            style={styles.menuBackdrop}
            onPress={closeMenu}
            testID="chat-header-menu-backdrop"
          />
          <View style={styles.menuDropdown}>
            <Pressable style={styles.menuItem} onPress={handleBlock} testID="chat-menu-block" accessibilityLabel="Block">
              <Ionicons name="ban-outline" size={18} color="#ef4444" />
              <Text style={[styles.menuLabel, styles.menuLabelDanger]}>Block</Text>
            </Pressable>
            <View style={styles.menuSeparator} />
            <Pressable style={styles.menuItem} onPress={handleReport} testID="chat-menu-report" accessibilityLabel="Report">
              <Ionicons name="flag-outline" size={18} color="#374151" />
              <Text style={styles.menuLabel}>Report</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    height: 64, // Slightly taller to accommodate stacked avatar and name
  },
  backButton: {
    padding: 4,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1,
  },
  backText: {
    fontSize: 16,
    color: "#111827",
    marginLeft: 2,
  },
  centerContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  profileSection: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
  },
  avatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  displayName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  overflowButton: {
    padding: 4,
    zIndex: 1,
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
