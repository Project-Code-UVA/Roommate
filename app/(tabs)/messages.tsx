/**
 * Messages tab -- thread list showing all conversations.
 *
 * Displays avatar, display name, last message preview, timestamp,
 * and unread badge for each thread. Search bar filters by name.
 * Tapping navigates to the chat screen. Pull-to-refresh to reload threads.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSession } from "@/contexts/auth-context";
import { COLORS } from "@/lib/constants";
import { getConversationPreview } from "@/services/thread-preview";
import { getThreads, type EnrichedThread } from "@/services/thread-service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ThreadItem = EnrichedThread;

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

function truncateText(text: string): string {
  if (text.length <= MAX_PREVIEW_LENGTH) return text;
  return `${text.slice(0, MAX_PREVIEW_LENGTH)}...`;
}

// ---------------------------------------------------------------------------
// Thread row component
// ---------------------------------------------------------------------------

function ThreadRow({
  thread,
  currentUserId,
  onPress,
}: {
  readonly thread: ThreadItem;
  readonly currentUserId: string;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.threadRow}
      onPress={onPress}
      testID={`thread-${thread.id}`}
    >
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        {thread.other_user_avatar_url ? (
          <Image
            source={{ uri: thread.other_user_avatar_url }}
            style={styles.avatar}
            testID={`avatar-${thread.id}`}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Ionicons name="person-circle" size={52} color={COLORS.gray[300]} />
          </View>
        )}
        {thread.unread_count > 0 && (
          <View style={styles.unreadDot} testID={`badge-${thread.id}`} />
        )}
      </View>

      {/* Text content */}
      <View style={styles.textContent}>
        <View style={styles.nameRow}>
          <Text
            style={[
              styles.displayName,
              thread.unread_count > 0 && styles.displayNameUnread,
            ]}
            numberOfLines={1}
          >
            {thread.other_user_display_name}
          </Text>
          {thread.last_message_at && (
            <Text
              style={[
                styles.timestamp,
                thread.unread_count > 0 && styles.timestampUnread,
              ]}
            >
              {formatRelativeTime(thread.last_message_at)}
            </Text>
          )}
        </View>
        <Text
          style={[
            styles.preview,
            thread.unread_count > 0 && styles.previewUnread,
          ]}
          numberOfLines={1}
        >
          {truncateText(
            getConversationPreview(thread.last_message, currentUserId, {
              senderName: thread.other_user_display_name,
              currentUserLabel: "You",
            }),
          )}
        </Text>

      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyThreads({ hasSearch }: { readonly hasSearch: boolean }) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={hasSearch ? "search-outline" : "chatbubbles-outline"}
        size={64}
        color={COLORS.gray[300]}
      />
      <Text style={styles.emptyTitle}>
        {hasSearch ? "No results found" : "No conversations yet"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {hasSearch
          ? "Try a different name"
          : "Match with someone to start chatting"}
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
  const [searchQuery, setSearchQuery] = useState("");

  const fetchThreads = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await getThreads(userId);

    if (error) {
      console.error("[MessagesScreen] Error fetching threads:", error);
      // We could set an error state here to show a message to the user
    }

    if (data) {
      setThreads(data);
    }

    setIsLoading(false);
  }, [userId]);


  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  useFocusEffect(
    useCallback(() => {
      void fetchThreads();
    }, [fetchThreads]),
  );

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

  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads as ThreadItem[];
    const q = searchQuery.toLowerCase();
    return (threads as ThreadItem[]).filter((t) =>
      t.other_user_display_name.toLowerCase().includes(q),
    );
  }, [threads, searchQuery]);

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
        <Text style={styles.headerTitle} testID="messages-title">
          Messages
        </Text>
        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={COLORS.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor={COLORS.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <Ionicons
                name="close-circle"
                size={18}
                color={COLORS.gray[400]}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Thread list */}
      <FlatList
        data={filteredThreads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ThreadRow
            thread={item}
            currentUserId={userId}
            onPress={() => handlePressThread(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyThreads hasSearch={searchQuery.length > 0} />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary[500]}
          />
        }
        contentContainerStyle={
          filteredThreads.length === 0 ? styles.emptyList : styles.listContent
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
    gap: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.gray[900],
    letterSpacing: -0.5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray[100],
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray[900],
    padding: 0,
  },
  threadRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: "#fff",
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.gray[100],
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: COLORS.primary[600],
    borderWidth: 2,
    borderColor: "#fff",
  },
  textContent: {
    flex: 1,
    gap: 3,
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
  displayNameUnread: {
    fontWeight: "700",
  },
  timestamp: {
    fontSize: 13,
    color: COLORS.gray[400],
    marginLeft: 8,
  },
  timestampUnread: {
    color: COLORS.primary[600],
    fontWeight: "600",
  },
  preview: {
    fontSize: 14,
    color: COLORS.gray[400],
  },
  previewUnread: {
    color: COLORS.gray[700],
    fontWeight: "500",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.gray[100],
    marginLeft: 80,
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
  listContent: {
    paddingBottom: 20,
  },
});
