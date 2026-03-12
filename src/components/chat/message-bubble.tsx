/**
 * MessageBubble -- iMessage-style chat bubble with sender/receiver variants.
 *
 * Features:
 * - Purple sender bubbles (right-aligned) with white text
 * - Gray receiver bubbles (left-aligned) with dark text
 * - Tail effect on last message in cluster (smaller corner radius)
 * - Inline media images
 * - Delivery indicator (sender only)
 * - Reaction pills
 * - Reply preview
 */

import React from "react";
import { View, Text, Image, Pressable } from "react-native";

import { DeliveryIndicator } from "@/components/chat/delivery-indicator";
import { MessageReactions } from "@/components/chat/message-reactions";
import { MessageReplyPreview } from "@/components/chat/message-reply-preview";
import type { Message, MessageReaction, DeliveryStatus } from "@/types/chat";

type Props = {
  readonly message: Message;
  readonly isSender: boolean;
  readonly isLastInCluster: boolean;
  readonly reactions: readonly MessageReaction[];
  readonly onLongPress: () => void;
  readonly onImagePress: (mediaUrl: string) => void;
  readonly onReactionPress: (emoji: string) => void;
  readonly onReplyPress: () => void;
};

function computeDeliveryStatus(message: Message): DeliveryStatus | "failed" {
  if (message._status === "failed") return "failed";
  if (message.read_at) return "read";
  if (message.delivered_at) return "delivered";
  if (message._status === "sending") return "sending";
  return "sent";
}

export function MessageBubble({
  message,
  isSender,
  isLastInCluster,
  reactions,
  onLongPress,
  onImagePress,
  onReactionPress,
  onReplyPress,
}: Props): React.JSX.Element {
  const senderClasses = isLastInCluster
    ? "bg-violet-600 self-end rounded-2xl rounded-br-sm"
    : "bg-violet-600 self-end rounded-2xl";

  const receiverClasses = isLastInCluster
    ? "bg-gray-200 self-start rounded-2xl rounded-bl-sm"
    : "bg-gray-200 self-start rounded-2xl";

  const bubbleClasses = isSender ? senderClasses : receiverClasses;
  const textColor = isSender ? "text-white" : "text-gray-900";

  return (
    <Pressable
      testID={isSender ? "bubble-sender" : "bubble-receiver"}
      onLongPress={onLongPress}
      className={`max-w-[75%] px-3 py-2 my-0.5 ${bubbleClasses}`}
    >
      {/* Reply preview */}
      {message.reply_to != null && (
        <MessageReplyPreview
          originalMessage={{
            body: message.reply_to.body,
            sender_name: "Reply",
          }}
          onPress={onReplyPress}
        />
      )}

      {/* Media image */}
      {message.media_url != null && (
        <Pressable onPress={() => onImagePress(message.media_url!)}>
          <Image
            testID="bubble-media-image"
            source={{ uri: message.media_url }}
            className="w-56 h-56 rounded-xl mb-1"
            resizeMode="cover"
          />
        </Pressable>
      )}

      {/* Body text */}
      {message.body != null && (
        <Text className={`text-base ${textColor}`}>{message.body}</Text>
      )}

      {/* Delivery indicator (sender only) */}
      {isSender && (
        <View className="items-end mt-0.5">
          <DeliveryIndicator status={computeDeliveryStatus(message)} />
        </View>
      )}

      {/* Reactions */}
      {reactions.length > 0 && (
        <MessageReactions
          reactions={reactions}
          onReactionPress={onReactionPress}
        />
      )}
    </Pressable>
  );
}
