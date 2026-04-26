/**
 * MessageBubble — iMessage-style chat bubble with sender/receiver variants.
 *
 * Layout (from top to bottom per message):
 *   [In-bubble reply quote]   ← only if message is a reply
 *   [Media image]             ← only if media_url present
 *   [Body text]
 *   ["Edited" label]          ← only if edited_at present
 *   [Delivery indicator]      ← sender only
 *   ─────────────────────────── (Pressable ends here)
 *   [Reaction pills]          ← rendered OUTSIDE the Pressable for hit-testing
 *
 * The reactions are positioned as a sibling below the bubble rather than
 * inside it so they don't trigger the long-press and get their own tap area.
 */

import * as React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";

import { DeliveryIndicator } from "@/components/chat/delivery-indicator";
import { MessageReactions } from "@/components/chat/message-reactions";
import { MessageReplyPreview } from "@/components/chat/message-reply-preview";
import type { ReplyPreviewData } from "@/components/chat/message-reply-preview";
import type { Message, MessageReaction, DeliveryStatus } from "@/types/chat";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = {
  readonly message: Message;
  readonly isSender: boolean;
  readonly isLastInCluster: boolean;
  readonly reactions: readonly MessageReaction[];
  readonly currentUserId: string;
  /** Display name of the other participant, for "Replying to [Name]" */
  readonly otherName: string;
  readonly onLongPress: () => void;
  readonly onImagePress: (mediaUrl: string) => void;
  /**
   * Called when a reaction pill is tapped.
   * @param emoji - The emoji character
   * @param existingReactionId - The current user's existing reaction ID, or null
   */
  readonly onReactionToggle: (emoji: string, existingReactionId: string | null) => void;
  readonly onReplyPress: () => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeDeliveryStatus(message: Message): DeliveryStatus | "failed" {
  if (message._status === "failed") return "failed";
  if (message.read_at) return "read";
  if (message.delivered_at) return "delivered";
  if (message._status === "sending") return "sending";
  return "sent";
}

/**
 * Build the reply preview data object from the joined reply_to field.
 * Handles deleted (null body + null reply_to) and media-only replies.
 */
function buildReplyPreviewData(
  message: Message,
  currentUserId: string,
  otherName: string,
): ReplyPreviewData | null {
  // If no ID is present, it's not a reply.
  if (!message.reply_to_id) return null;

  // Handle various join result formats (object, array, null, undefined).
  // Sometimes Supabase joins on the column name directly, or renames to the table.
  let replyTo = (message as any).reply_to || (message as any).reply_to_id_info || (message as any).messages;
  
  if (Array.isArray(replyTo)) {
    replyTo = replyTo[0];
  }

  // If we have the ID but the join data is missing, the original message 
  // might have been deleted or RLS is blocking access.
  if (!replyTo || typeof replyTo !== "object" || !replyTo.sender_id) {
    return {
      body: null,
      media_url: null,
      senderName: null,
      isOwnMessage: false,
    };
  }

  const isOwnMessage = replyTo.sender_id === currentUserId;

  return {
    body: replyTo.body ?? null,
    media_url: replyTo.media_url ?? null,
    senderName: isOwnMessage ? null : otherName,
    isOwnMessage,
  };
}


// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageBubble({
  message,
  isSender,
  isLastInCluster,
  reactions,
  currentUserId,
  otherName,
  onLongPress,
  onImagePress,
  onReactionToggle,
  onReplyPress,
}: Props): React.JSX.Element {
  const replyPreviewData = buildReplyPreviewData(message, currentUserId, otherName);
  const senderName = isSender ? "You" : otherName;
  const isUnsent = message.unsent_at != null;
  const isDeletedForEveryone =
    message.deleted_for_everyone_at != null || message.deleted_at != null;
  const isHiddenState = isUnsent || isDeletedForEveryone;
  const placeholderText = isUnsent
    ? `${senderName} unsent a message`
    : isDeletedForEveryone
      ? isSender
        ? "You deleted a message"
        : "Message deleted"
      : null;

  // ── Bubble shape ──────────────────────────────────────────────────────────
  const bubbleStyle = isSender
    ? [styles.bubble, styles.bubbleSender, isLastInCluster && styles.bubbleSenderLast]
    : [styles.bubble, styles.bubbleReceiver, isLastInCluster && styles.bubbleReceiverLast];

  const textStyle = isSender ? styles.textSender : styles.textReceiver;

  const containerStyle = isSender ? styles.containerSender : styles.containerReceiver;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* ── Bubble (Pressable) ─────────────────────────────────────────────── */}
      <Pressable
        testID={isSender ? "bubble-sender" : "bubble-receiver"}
        onLongPress={onLongPress}
        style={bubbleStyle}
        delayLongPress={350}
      >
        {/* In-bubble reply quote */}
        {replyPreviewData && !isHiddenState && (
          <MessageReplyPreview
            data={replyPreviewData}
            isSenderBubble={isSender}
            onPress={onReplyPress}
          />
        )}

        {/* Media image */}
        {message.media_url != null && !isHiddenState && (
          <Pressable onPress={() => onImagePress(message.media_url!)}>
            <Image
              testID="bubble-media-image"
              source={{ uri: message.media_url }}
              style={styles.mediaImage}
              contentFit="cover"
            />
          </Pressable>
        )}

        {/* Body text */}
        {placeholderText != null ? (
          <Text style={textStyle}>{placeholderText}</Text>
        ) : message.body != null ? (
          <Text style={textStyle}>{message.body}</Text>
        ) : null}

        {/* "Edited" indicator */}
        {message.edited_at != null && !isHiddenState && (
          <Text style={[styles.editedLabel, isSender ? styles.editedSender : styles.editedReceiver]}>
            Edited
          </Text>
        )}

        {/* Delivery tick (sender only) */}
        {isSender && (
          <View style={styles.deliveryRow}>
            <DeliveryIndicator status={computeDeliveryStatus(message)} />
          </View>
        )}
      </Pressable>

      {/* ── Reaction pills (OUTSIDE the Pressable) ────────────────────────── */}
      {reactions.length > 0 && !isHiddenState && (
        <MessageReactions
          reactions={reactions}
          currentUserId={currentUserId}
          onToggle={onReactionToggle}
          isSender={isSender}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 2,
    maxWidth: "78%",
  },
  containerSender: {
    alignSelf: "flex-end",
  },
  containerReceiver: {
    alignSelf: "flex-start",
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bubbleSender: {
    backgroundColor: "#7c3aed", // violet-600
    borderBottomRightRadius: 20,
  },
  bubbleSenderLast: {
    borderBottomRightRadius: 4,
  },
  bubbleReceiver: {
    backgroundColor: "#e5e7eb", // gray-200
    borderBottomLeftRadius: 20,
  },
  bubbleReceiverLast: {
    borderBottomLeftRadius: 4,
  },
  textSender: {
    fontSize: 15,
    lineHeight: 21,
    color: "#ffffff",
  },
  textReceiver: {
    fontSize: 15,
    lineHeight: 21,
    color: "#111827",
  },
  mediaImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginBottom: 4,
  },
  editedLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  editedSender: {
    color: "rgba(255,255,255,0.55)",
  },
  editedReceiver: {
    color: "#9ca3af",
  },
  deliveryRow: {
    alignItems: "flex-end",
    marginTop: 3,
  },
});
