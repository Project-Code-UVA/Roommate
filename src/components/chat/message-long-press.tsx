/**
 * Long-press message overlay.
 *
 * Shows the ReactionPicker tapback row (6 reactions with active state) and
 * action rows: Reply, Copy text, Edit, Unsend, Delete for me, Report message.
 *
 * Displayed as a modal overlay with semi-transparent backdrop.
 */

import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { ReactionPicker } from "@/components/chat/reaction-picker";
import type { Message, MessageReaction } from "@/types/chat";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MessageLongPressProps = {
  readonly currentUserId: string;
  readonly visible: boolean;
  readonly message: Message | null;
  /** Current reactions on the message — used to show which ones are active */
  readonly reactions: readonly MessageReaction[];
  readonly onReact: (emoji: string) => void;
  readonly onReply: () => void;
  readonly onCopy: () => void;
  readonly onEdit: () => void;
  readonly onUnsend: () => void;
  readonly onDelete: () => void;
  readonly onReport: () => void;
  readonly onClose: () => void;
};

type ActionItem = {
  readonly label: string;
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly onPress: () => void;
  readonly color?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageLongPress({
  currentUserId,
  visible,
  message,
  reactions = [],
  onReact,
  onReply,
  onCopy,
  onEdit,
  onUnsend,
  onDelete,
  onReport,
  onClose,
}: MessageLongPressProps) {
  // Haptic feedback when the menu opens
  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [visible]);

  const handleReact = useCallback(
    (emoji: string) => {
      onReact(emoji);
    },
    [onReact],
  );

  if (!visible || !message) {
    return null;
  }

  const isSender = message.sender_id === currentUserId;
  const isWithin5Minutes =
    new Date().getTime() - new Date(message.created_at).getTime() < 5 * 60 * 1000;

  const isUnsent = message.unsent_at != null;
  const isDeletedForEveryone =
    message.deleted_for_everyone_at != null || message.deleted_at != null;
  const isHiddenState = isUnsent || isDeletedForEveryone;

  // Single reaction per user/message.
  const myActiveEmoji =
    reactions.find((r) => r.user_id === currentUserId)?.emoji ?? null;

  const hasCopyableText = Boolean(message.body?.trim());
  const canReply = !isHiddenState;
  const canCopy = hasCopyableText && !isHiddenState;
  const canEdit = isSender && hasCopyableText && !isHiddenState;
  const canUnsend = isSender && isWithin5Minutes && !isHiddenState;

  const actions: readonly ActionItem[] = [
    ...(canReply
      ? [{ label: "Reply", icon: "arrow-undo-outline" as keyof typeof Ionicons.glyphMap, onPress: onReply }]
      : []),
    ...(canCopy
      ? [{ label: "Copy text", icon: "copy-outline" as keyof typeof Ionicons.glyphMap, onPress: onCopy }]
      : []),
    ...(canEdit
      ? [{ label: "Edit", icon: "pencil-outline" as keyof typeof Ionicons.glyphMap, onPress: onEdit }]
      : []),
    ...(canUnsend
      ? [{ label: "Unsend", icon: "arrow-undo-circle-outline" as keyof typeof Ionicons.glyphMap, onPress: onUnsend, color: "#ef4444" }]
      : []),
    { label: "Delete for me", icon: "trash-outline", onPress: onDelete },
    ...(!isSender
      ? [{ label: "Report message", icon: "flag-outline" as keyof typeof Ionicons.glyphMap, onPress: onReport, color: "#ef4444" }]
      : []),
  ];

  return (
    <Modal transparent visible animationType="fade" testID="long-press-overlay">
      {/* Backdrop — tapping closes the menu */}
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        testID="long-press-backdrop"
      />

      {/* Menu card */}
      <View style={styles.contentContainer}>
        <View style={styles.card}>
          {/* Tapback reaction picker */}
          <ReactionPicker
            activeEmoji={myActiveEmoji}
            onSelect={handleReact}
          />

          {/* Separator */}
          <View style={styles.separator} />

          {/* Action rows */}
          {actions.map((action) => (
            <Pressable
              key={action.label}
              style={({ pressed }) => [
                styles.actionRow,
                pressed && styles.actionRowPressed,
              ]}
              onPress={action.onPress}
            >
              <View style={styles.actionContent}>
                <Ionicons
                  name={action.icon}
                  size={22}
                  color={action.color ?? "#4b5563"}
                  style={styles.actionIcon}
                />
                <Text
                  style={[
                    styles.actionLabel,
                    action.color ? { color: action.color } : undefined,
                  ]}
                >
                  {action.label}
                </Text>
              </View>
            </Pressable>
          ))}

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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 4,
    width: "100%",
    maxWidth: 310,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 12,
    marginVertical: 2,
  },
  actionRow: {
    width: "100%",
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 18,
  },
  actionIcon: {
    marginRight: 12,
    width: 24, // Fixed width for icons to keep labels aligned
    textAlign: "center",
  },
  actionRowPressed: {
    backgroundColor: "#f3f4f6",
  },
  actionLabel: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
});

