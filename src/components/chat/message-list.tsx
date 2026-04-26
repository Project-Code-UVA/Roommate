/**
 * MessageList — inverted FlatList rendering chat messages with date separators
 * and message grouping.
 *
 * Groups consecutive messages from the same sender within a 5-minute threshold.
 * Inserts date separators between messages on different days.
 * Last message in a cluster gets a "tail" indicator.
 *
 * Passes currentUserId and otherName down to MessageBubble so it can
 * render reply quotes with proper sender names and reaction highlights.
 */

import * as React from "react";
import { useMemo } from "react";
import { FlatList, View, ActivityIndicator } from "react-native";

import { MessageBubble } from "@/components/chat/message-bubble";
import { SwipeableMessage } from "@/components/chat/swipeable-message";
import { DateSeparator } from "@/components/chat/date-separator";
import { COLORS } from "@/lib/constants";
import type { Message, MessageReaction } from "@/types/chat";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MessageItem = {
  readonly type: "message";
  readonly key: string;
  readonly data: Message;
  readonly isSender: boolean;
  readonly isLastInCluster: boolean;
};

type DateItem = {
  readonly type: "date";
  readonly key: string;
  readonly date: string;
};

type ListItem = MessageItem | DateItem;

type Props = {
  readonly messages: readonly Message[];
  readonly currentUserId: string;
  /** Display name of the other participant — passed to MessageBubble for reply labels */
  readonly otherName: string;
  readonly reactions: Map<string, readonly MessageReaction[]>;
  readonly onLongPress: (message: Message) => void;
  readonly onImagePress: (mediaUrl: string) => void;
  /**
   * Called when a reaction pill is tapped on a bubble.
   * Passes the emoji and the current user's existing reactionId (null if not reacted).
   */
  readonly onReactionToggle: (messageId: string, emoji: string, existingReactionId: string | null) => void;
  readonly onReplyPress: (messageId: string) => void;
  readonly onSwipeToReply: (message: Message) => void;
  readonly onEndReached: () => void;
  readonly isLoading: boolean;
  readonly ListEmptyComponent?: React.ReactElement;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FIVE_MINUTES_MS = 5 * 60 * 1000;

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function buildListItems(
  messages: readonly Message[],
  currentUserId: string,
): readonly ListItem[] {
  if (messages.length === 0) return [];

  // Messages arrive newest-first (inverted list), so index 0 is most recent.
  const items: ListItem[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const next = i < messages.length - 1 ? messages[i + 1] : null;
    const isSender = msg.sender_id === currentUserId;

    // A cluster ends when the next message (older, visually above) is from a
    // different sender or has a gap > 5 min.
    const isLastInCluster =
      next === null ||
      next.sender_id !== msg.sender_id ||
      Math.abs(
        new Date(msg.created_at).getTime() - new Date(next.created_at).getTime(),
      ) > FIVE_MINUTES_MS;

    items.push({
      type: "message",
      key: msg.id,
      data: msg,
      isSender,
      isLastInCluster,
    });

    // Insert date separator when crossing a day boundary
    if (next && !isSameDay(msg.created_at, next.created_at)) {
      items.push({
        type: "date",
        key: `date-${msg.created_at}`,
        date: msg.created_at,
      });
    }
  }

  // Add date separator for the oldest message group
  const oldest = messages[messages.length - 1];
  items.push({
    type: "date",
    key: `date-${oldest.created_at}-end`,
    date: oldest.created_at,
  });

  return items;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageList({
  messages,
  currentUserId,
  otherName,
  reactions,
  onLongPress,
  onImagePress,
  onReactionToggle,
  onReplyPress,
  onSwipeToReply,
  onEndReached,
  isLoading,
  ListEmptyComponent,
}: Props): React.JSX.Element {
  const listItems = useMemo(
    () => buildListItems(messages, currentUserId),
    [messages, currentUserId],
  );

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === "date") {
      return (
        <View testID="date-separator">
          <DateSeparator date={item.date} />
        </View>
      );
    }

    const msgReactions = reactions.get(item.data.id) ?? [];

    return (
      <SwipeableMessage onSwipeToReply={() => onSwipeToReply(item.data)}>
        <MessageBubble
          message={item.data}
          isSender={item.isSender}
          isLastInCluster={item.isLastInCluster}
          reactions={msgReactions}
          currentUserId={currentUserId}
          otherName={otherName}
          onLongPress={() => onLongPress(item.data)}
          onImagePress={(url) => onImagePress(url)}
          onReactionToggle={(emoji, existingId) =>
            onReactionToggle(item.data.id, emoji, existingId)
          }
          onReplyPress={() => onReplyPress(item.data.id)}
        />
      </SwipeableMessage>
    );
  };

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View testID="message-list-loading" style={{ alignItems: "center", paddingVertical: 16 }}>
        <ActivityIndicator size="small" color={COLORS.primary[500]} />
      </View>
    );
  };

  return (
    <FlatList
      testID="message-list"
      data={listItems as ListItem[]}
      extraData={reactions}
      renderItem={renderItem}
      keyExtractor={(item) => item.key}
      inverted
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexGrow: 1,
        justifyContent: "flex-end",
      }}
    />

  );
}
