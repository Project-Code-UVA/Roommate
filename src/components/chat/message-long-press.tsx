/**
 * Long-press message overlay.
 *
 * Shows quick emoji reactions (6 + picker) and action rows:
 * Reply, Copy text, Delete for me, Report message.
 *
 * Displayed as a modal overlay with semi-transparent backdrop.
 */

import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import type { Message } from "@/types/chat";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUICK_EMOJIS = ["\u2764\uFE0F", "\uD83D\uDE02", "\uD83D\uDC4D", "\uD83D\uDE2E", "\uD83D\uDE22", "\uD83D\uDD25"] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MessageLongPressProps = {
  readonly visible: boolean;
  readonly message: Message | null;
  readonly onReact: (emoji: string) => void;
  readonly onReply: () => void;
  readonly onCopy: () => void;
  readonly onDelete: () => void;
  readonly onReport: () => void;
  readonly onOpenEmojiPicker: () => void;
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
  visible,
  message,
  onReact,
  onReply,
  onCopy,
  onDelete,
  onReport,
  onOpenEmojiPicker,
  onClose,
}: MessageLongPressProps) {
  // Haptic on open
  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const actions: readonly ActionItem[] = [
    { label: "Reply", icon: "arrow-undo-outline", onPress: onReply },
    ...(message.body
      ? [{ label: "Copy text", icon: "copy-outline" as keyof typeof Ionicons.glyphMap, onPress: onCopy }]
      : []),
    { label: "Delete for me", icon: "trash-outline", onPress: onDelete },
    { label: "Report message", icon: "flag-outline", onPress: onReport, color: "#ef4444" },
  ];

  return (
    <Modal transparent visible animationType="fade" testID="long-press-overlay">
      {/* Backdrop */}
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        testID="long-press-backdrop"
      />

      {/* Content */}
      <View style={styles.contentContainer}>
        <View style={styles.card}>
          {/* Quick reactions row */}
          <View style={styles.reactionsRow}>
            {QUICK_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                style={styles.emojiButton}
                onPress={() => handleReact(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </Pressable>
            ))}
            <Pressable
              style={styles.emojiButton}
              onPress={onOpenEmojiPicker}
              testID="emoji-picker-btn"
            >
              <Ionicons name="add" size={22} color="#6b7280" />
            </Pressable>
          </View>

          {/* Separator */}
          <View style={styles.separator} />

          {/* Action rows */}
          {actions.map((action) => (
            <Pressable
              key={action.label}
              style={styles.actionRow}
              onPress={action.onPress}
            >
              <Ionicons
                name={action.icon}
                size={20}
                color={action.color ?? "#374151"}
              />
              <Text
                style={[
                  styles.actionLabel,
                  action.color ? { color: action.color } : undefined,
                ]}
              >
                {action.label}
              </Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 8,
    width: "100%",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  reactionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emojiButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: {
    fontSize: 20,
  },
  separator: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionLabel: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
});
