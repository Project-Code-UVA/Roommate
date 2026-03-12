/**
 * Messages tab -- thread list showing all conversations.
 *
 * Displays avatar, display name, last message preview, timestamp,
 * and unread badge for each thread. Tapping navigates to the chat screen.
 * Pull-to-refresh to reload threads.
 */

import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSession } from "@/contexts/auth-context";
import { COLORS } from "@/lib/constants";
import { getThreads } from "@/services/thread-service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ThreadItem = {
  readonly id: string;
  readonly user_a_id: string;
  readonly user_b_id: string;
  readonly status: string;
  readonly created_at: string;
  readonly last_message_body: string | null;
  readonly last_message_at: string | null;
  readonly unread_count: number;
  readonly other_user_id: string;
  readonly other_user_display_name: string;
  readonly other_user_avatar_url: string | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_PREVIEW_LENGTH = 40;

function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return "now";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d`;

  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function truncatePreview(text: string | null): string {
  if (!text) return "No messages yet";
  if (text.length <= MAX_PREVIEW_LENGTH) return text;
  return `${text.slice(0, MAX_PREVIEW_LENGTH)}...`;
}

// ---------------------------------------------------------------------------
// Thread row component
// ---------------------------------------------------------------------------

function ThreadRow({
  thread,
  onPress,
}: {
  readonly thread: ThreadItem;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.threadRow}
      onPress={onPress}
      testID={`thread-${thread.id}`}
    >
      {/* Avatar */}
      {thread.other_user_avatar_url ? (
        <Image
          source={{ uri: thread.other_user_avatar_url }}
          style={styles.avatar}
          testID={`avatar-${thread.id}`}
        />
      ) : (
        <View style={styles.avatarFallback}>
          <Ionicons name="person-circle" size={48} color={COLORS.gray[300]} />
        </View>
      )}

      {/* Text content */}
      <View style={styles.textContent}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName} numberOfLines={1}>
            {thread.other_user_display_name}
          </Text>
          {thread.last_message_at && (
            <Text style={styles.timestamp}>
              {formatRelativeTime(thread.last_message_at)}
            </Text>
          )}
        </View>
        <View style={styles.previewRow}>
          <Text
            style={[
              styles.preview,
              thread.unread_count > 0 && styles.previewUnread,
            ]}
            numberOfLines={1}
          >
            {truncatePreview(thread.last_message_body)}
          </Text>
          {thread.unread_count > 0 && (
            <View style={styles.badge} testID={`badge-${thread.id}`}>
              <Text style={styles.badgeText}>
                {thread.unread_count > 99 ? "99+" : thread.unread_count}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyThreads() {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color={COLORS.gray[300]} />
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>
        Match with someone to start chatting
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function MessagesScreen() {
  const { session } = useSession();
  const router = useRouter();
  const userId = session?.user.id ?? "";

  const [threads, setThreads] = useState<readonly ThreadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchThreads = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await getThreads(userId);

    if (!error && data) {
      // Map raw thread records to ThreadItem shape
      const mapped: readonly ThreadItem[] = (
        data as readonly Record<string, unknown>[]
      ).map((t) => {
        const otherUserId =
          t.user_a_id === userId
            ? (t.user_b_id as string)
            : (t.user_a_id as string);

        return {
          id: t.id as string,
          user_a_id: t.user_a_id as string,
          user_b_id: t.user_b_id as string,
          status: t.status as string,
          created_at: t.created_at as string,
          last_message_body: (t.last_message_body as string | null) ?? null,
          last_message_at: (t.last_message_at as string | null) ?? null,
          unread_count: (t.unread_count as number) ?? 0,
          other_user_id: otherUserId,
          other_user_display_name:
            (t.other_user_display_name as string) ?? "Unknown",
          other_user_avatar_url:
            (t.other_user_avatar_url as string | null) ?? null,
        };
      });

      setThreads(mapped);
    }

    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchThreads();
    setRefreshing(false);
  }, [fetchThreads]);

  const handlePressThread = useCallback(
    (thread: ThreadItem) => {
      router.push(
        `/chat/${thread.id}?otherUserId=${thread.other_user_id}&otherName=${encodeURIComponent(thread.other_user_display_name)}&otherAvatar=${encodeURIComponent(thread.other_user_avatar_url ?? "")}` as never,
      );
    },
    [router],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Thread list */}
      <FlatList
        data={threads as ThreadItem[]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ThreadRow
            thread={item}
            onPress={() => handlePressThread(item)}
          />
        )}
        ListEmptyComponent={<EmptyThreads />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary[500]}
          />
        }
        contentContainerStyle={threads.length === 0 ? styles.emptyList : undefined}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.gray[900],
  },
  threadRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray[100],
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  textContent: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  displayName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray[900],
    flex: 1,
  },
  timestamp: {
    fontSize: 13,
    color: COLORS.gray[400],
    marginLeft: 8,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  preview: {
    fontSize: 14,
    color: COLORS.gray[400],
    flex: 1,
  },
  previewUnread: {
    color: COLORS.gray[700],
    fontWeight: "500",
  },
  badge: {
    backgroundColor: COLORS.primary[600],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.gray[900],
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray[400],
    textAlign: "center",
  },
  emptyList: {
    flexGrow: 1,
  },
});
