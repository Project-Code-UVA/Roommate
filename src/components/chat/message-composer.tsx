/**
 * MessageComposer — text input with send, camera, and GIF buttons.
 *
 * Features:
 * - Multiline text input, max height 120px
 * - "Send" key on keyboard triggers send
 * - Polished reply banner: violet accent bar + "Replying to [Name]" + body preview + X
 * - "Replying to you" when replying to own message
 * - "Photo" fallback when original message has no text body
 * - Edit mode: pre-fills input, changes send icon to checkmark
 */

import * as React from "react";
import { useState, useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/lib/constants";
import type { Message } from "@/types/chat";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = {
  readonly onSend: (text: string) => void;
  readonly onCameraPress: () => void;
  readonly onGifPress: () => void;
  readonly replyTo: Message | null;
  readonly onDismissReply: () => void;
  readonly editingMessage: Message | null;
  readonly onCancelEdit: () => void;
  /** currentUserId to determine "Replying to you" vs "Replying to [Name]" */
  readonly currentUserId: string;
  /** Display name of the other participant */
  readonly otherName: string;
  readonly disabled: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build the sender label for the reply banner. */
function buildReplyLabel(replyTo: Message, currentUserId: string, otherName: string): string {
  if (replyTo.sender_id === currentUserId) return "Replying to you";
  return `Replying to ${otherName}`;
}

/** Build the preview body for the reply banner. */
function buildReplyBody(replyTo: Message): string {
  if (replyTo.body) return replyTo.body.replace(/\n+/g, " ");
  if (replyTo.media_url) return "Photo";
  return "Message";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageComposer({
  onSend,
  onCameraPress,
  onGifPress,
  replyTo,
  onDismissReply,
  editingMessage,
  onCancelEdit,
  currentUserId,
  otherName,
  disabled,
}: Props): React.JSX.Element {
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);

  // Pre-fill input when entering edit mode; clear on exit
  useEffect(() => {
    if (editingMessage?.body) {
      setText(editingMessage.body);
      inputRef.current?.focus();
    } else {
      setText("");
    }
  }, [editingMessage]);

  // Auto-focus input when reply is initiated
  useEffect(() => {
    if (replyTo) {
      inputRef.current?.focus();
    }
  }, [replyTo]);

  const isEmpty = text.trim().length === 0;

  const handleSend = useCallback(() => {
    if (isEmpty || disabled) return;
    onSend(text.trim());
    setText("");
  }, [text, isEmpty, disabled, onSend]);

  return (
    <View style={styles.outerContainer}>
      {/* ── Reply banner ─────────────────────────────────────────────────── */}
      {!!replyTo && (
        <View style={styles.replyBanner}>
          {/* Violet accent bar */}
          <View style={styles.replyAccentBar} />

          <View style={styles.replyContent}>
            <Text style={styles.replyLabel} numberOfLines={1}>
              {buildReplyLabel(replyTo, currentUserId, otherName)}
            </Text>
            <Text style={styles.replyBody} numberOfLines={1} ellipsizeMode="tail">
              {buildReplyBody(replyTo)}
            </Text>
          </View>

          <Pressable
            testID="composer-dismiss-reply"
            onPress={onDismissReply}
            style={styles.dismissBtn}
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color={COLORS.gray[400]} />
          </Pressable>
        </View>
      )}

      {/* ── Edit banner ──────────────────────────────────────────────────── */}
      {!!editingMessage && (
        <View style={styles.editBanner}>
          <Ionicons name="pencil-outline" size={14} color="#7c3aed" style={styles.editIcon} />
          <View style={styles.editContent}>
            <Text style={styles.editLabel}>Editing message</Text>
            <Text style={styles.editBody} numberOfLines={1} ellipsizeMode="tail">
              {editingMessage.body ?? ""}
            </Text>
          </View>
          <Pressable
            testID="composer-cancel-edit"
            onPress={onCancelEdit}
            style={styles.dismissBtn}
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color={COLORS.gray[400]} />
          </Pressable>
        </View>
      )}

      {/* ── Input row ────────────────────────────────────────────────────── */}
      <View style={styles.inputRow}>
        {/* Camera button */}
        <Pressable
          testID="composer-camera-btn"
          onPress={onCameraPress}
          style={styles.iconBtn}
          hitSlop={8}
        >
          <Ionicons name="camera-outline" size={24} color={COLORS.gray[500]} />
        </Pressable>

        {/* GIF button */}
        <Pressable
          testID="composer-gif-btn"
          onPress={onGifPress}
          style={styles.iconBtn}
          hitSlop={8}
        >
          <View style={styles.gifBadge}>
            <Text style={styles.gifText}>GIF</Text>
          </View>
        </Pressable>

        {/* Text input */}
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            testID="composer-input"
            style={styles.input}
            placeholder={editingMessage ? "Edit message…" : "Message…"}
            placeholderTextColor={COLORS.gray[400]}
            multiline
            value={text}
            onChangeText={setText}
            editable={!disabled}
            onSubmitEditing={handleSend}
            submitBehavior="submit"
            returnKeyType="send"
          />
        </View>

        {/* Send / confirm button */}
        <Pressable
          testID="composer-send-btn"
          onPress={handleSend}
          disabled={isEmpty || disabled}
          accessibilityState={{ disabled: isEmpty || disabled }}
          style={styles.iconBtn}
          hitSlop={8}
        >
          <Ionicons
            name={editingMessage ? "checkmark-circle" : "arrow-up-circle"}
            size={32}
            color={isEmpty || disabled ? COLORS.gray[300] : COLORS.primary[600]}
          />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  outerContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    paddingBottom: 4,
  },
  // ── Reply banner ───────────────────────────────────────────────────────────
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f3ff", // violet-50
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 10,
    overflow: "hidden",
    paddingRight: 8,
    paddingVertical: 6,
  },
  replyAccentBar: {
    width: 3,
    alignSelf: "stretch",
    backgroundColor: "#7c3aed",
    marginRight: 10,
  },
  replyContent: {
    flex: 1,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7c3aed",
    marginBottom: 1,
  },
  replyBody: {
    fontSize: 12,
    color: "#4b5563",
  },
  dismissBtn: {
    paddingLeft: 8,
  },
  // ── Edit banner ────────────────────────────────────────────────────────────
  editBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f3ff",
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editIcon: {
    marginRight: 8,
  },
  editContent: {
    flex: 1,
  },
  editLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7c3aed",
    marginBottom: 1,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  editBody: {
    fontSize: 12,
    color: "#4b5563",
  },
  // ── Input row ──────────────────────────────────────────────────────────────
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 4,
    gap: 4,
  },
  iconBtn: {
    paddingBottom: 4,
    paddingHorizontal: 2,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 38,
    maxHeight: 120,
    justifyContent: "center",
  },
  input: {
    fontSize: 15,
    color: "#111827",
    padding: 0,
    margin: 0,
    lineHeight: 20,
  },
  gifBadge: {
    borderWidth: 1.5,
    borderColor: COLORS.gray[400],
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginBottom: 4,
  },
  gifText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.gray[500],
    letterSpacing: 0.5,
  },
});
