/**
 * MatchesRow: A single match row for the Likes tab Matches section.
 *
 * Shows circular avatar, display name, last message preview, relative time,
 * and unread indicator dot.
 */

import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { EnrichedThread } from "@/services/thread-service";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MatchesRowProps = {
  readonly thread: EnrichedThread;
  readonly onPress: () => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "";

  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;

  const diffWeek = Math.floor(diffDay / 7);
  return `${diffWeek}w`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MatchesRow({ thread, onPress }: MatchesRowProps) {
  const hasUnread = thread.unread_count > 0;
  const previewText = thread.last_message_body ?? "New match! Say hi";
  const isNewMatch = !thread.last_message_body;

  return (
    <Pressable
      testID={`match-row-${thread.id}`}
      style={styles.container}
      onPress={onPress}
    >
      <Image
        testID={`match-avatar-${thread.id}`}
        source={{ uri: thread.other_user_avatar_url ?? undefined }}
        style={styles.avatar}
      />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.nameRow}>
            {hasUnread && <View testID="unread-dot" style={styles.unreadDot} />}
            <Text
              style={[styles.name, hasUnread && styles.nameBold]}
              numberOfLines={1}
            >
              {thread.other_user_display_name}
            </Text>
          </View>
          <Text style={styles.time}>
            {formatRelativeTime(thread.last_message_at)}
          </Text>
        </View>
        <Text
          style={[
            styles.preview,
            hasUnread && styles.previewBold,
            isNewMatch && styles.previewItalic,
          ]}
          numberOfLines={1}
        >
          {previewText}
        </Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gray[200],
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    color: COLORS.gray[900],
  },
  nameBold: {
    fontWeight: "700",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    marginRight: 6,
  },
  time: {
    fontSize: 13,
    color: COLORS.gray[400],
  },
  preview: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  previewBold: {
    fontWeight: "600",
    color: COLORS.gray[800],
  },
  previewItalic: {
    fontStyle: "italic",
  },
});
