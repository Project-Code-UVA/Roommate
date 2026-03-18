/**
 * Likes tab screen.
 *
 * Three sections: Matches, Liked Me (with upgrade banner), My Likes.
 * Pull-to-refresh on entire ScrollView. Loading spinner on initial load.
 */

import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSession } from "@/contexts/auth-context";
import { useLikes } from "@/hooks/use-likes";
import { MatchesRow } from "@/components/likes/matches-row";
import { LikedMeCard } from "@/components/likes/liked-me-card";
import { MyLikesCard } from "@/components/likes/my-likes-card";
import { UpgradeBanner } from "@/components/likes/upgrade-banner";
import { COLORS } from "@/lib/constants";
import type { LikedMeProfile } from "@/types/explore";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GRID_GAP = 6;
const GRID_PADDING = 16;
const GRID_COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_SIZE = Math.floor(
  (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) /
    GRID_COLUMNS,
);

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------

function SectionHeader({
  title,
  count,
}: {
  readonly title: string;
  readonly count: number;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ message }: { readonly message: string }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function LikesScreen() {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const router = useRouter();

  const {
    matches,
    myLikes,
    likedMe,
    likedMeCount,
    isLoading,
    isRefreshing,
    refresh,
    isPaid,
  } = useLikes(userId);

  const handleUpgrade = () => {
    Alert.alert("Coming Soon", "Premium features launching soon!");
  };

  const handleSelectLikedMe = (_profile: LikedMeProfile) => {
    // TODO: Phase 9 — navigate to profile view for paid users
  };

  const handlePressMatch = (threadId: string, otherUserId: string, otherName: string, otherAvatar: string | null) => {
    router.push(
      `/chat/${threadId}?otherUserId=${otherUserId}&otherName=${encodeURIComponent(otherName)}&otherAvatar=${encodeURIComponent(otherAvatar ?? "")}` as never,
    );
  };

  const handlePressMyLike = (_userId: string) => {
    // TODO: Navigate to profile view
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator
          testID="likes-loading"
          size="large"
          color={COLORS.primary[500]}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.screenTitle} testID="likes-title">
        Likes
      </Text>
      <ScrollView
        testID="likes-scroll"
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Matches Section */}
        <SectionHeader title="Matches" count={matches.length} />
        {matches.length === 0 ? (
          <EmptyState message="No matches yet. Keep exploring!" />
        ) : (
          <View testID="matches-list">
            {matches.map((thread) => (
              <MatchesRow
                key={thread.id}
                thread={thread}
                onPress={() =>
                  handlePressMatch(
                    thread.id,
                    thread.other_user_id,
                    thread.other_user_display_name,
                    thread.other_user_avatar_url,
                  )
                }
              />
            ))}
          </View>
        )}

        {/* Liked Me Section */}
        <SectionHeader title="Liked Me" count={likedMeCount} />
        {!isPaid && (
          <UpgradeBanner count={likedMeCount} onUpgrade={handleUpgrade} />
        )}
        {likedMe.length === 0 && likedMeCount === 0 ? (
          <EmptyState message="No one has liked you yet." />
        ) : (
          <View testID="liked-me-grid" style={styles.grid}>
            {likedMe.map((profile) => (
              <LikedMeCard
                key={profile.user_id}
                profile={profile}
                isPaid={isPaid}
                onUpgrade={handleUpgrade}
                onSelect={handleSelectLikedMe}
                size={CARD_SIZE}
              />
            ))}
          </View>
        )}

        {/* My Likes Section */}
        <SectionHeader title="My Likes" count={myLikes.length} />
        {myLikes.length === 0 ? (
          <EmptyState message="You haven't liked anyone yet. Explore profiles!" />
        ) : (
          <View testID="my-likes-grid" style={styles.grid}>
            {myLikes.map((like) => (
              <MyLikesCard
                key={like.user_id}
                like={like}
                onPress={() => handlePressMyLike(like.user_id)}
                size={CARD_SIZE}
              />
            ))}
          </View>
        )}

        {/* Bottom spacer for tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.gray[900],
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.gray[800],
  },
  countBadge: {
    backgroundColor: COLORS.gray[200],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray[600],
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.gray[400],
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: GRID_PADDING,
    gap: GRID_GAP,
  },
  bottomSpacer: {
    height: 100,
  },
});
