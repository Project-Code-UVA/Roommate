/**
 * Explore tab screen — 3-column Instagram-style grid of profiles.
 *
 * Shows profiles from any school, ranked by engagement/popularity
 * with random profiles mixed in. Tap card to view full Hinge-style
 * profile with like/dismiss actions.
 *
 * Pull-to-refresh shuffles the feed with a new seed.
 * Scroll loads more profiles with the same seed.
 */

import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Alert,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ExploreGridCard } from "@/components/explore/explore-grid-card";
import { ExploreProfileView } from "@/components/explore/explore-profile-view";
import { MatchModal } from "@/components/match/match-modal";
import { useExploreFeed } from "@/hooks/use-explore-feed";
import { useSession } from "@/contexts/auth-context";
import { COLORS } from "@/lib/constants";
import type { ExploreProfile } from "@/types/explore";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const CARD_GAP = 1;
const CARD_SIZE = (SCREEN_WIDTH - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const ROW_HEIGHT = CARD_SIZE * 1.3 + CARD_GAP;

// ---------------------------------------------------------------------------
// Loading skeleton placeholder
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  const cards = Array.from({ length: 12 }, (_, i) => i);
  return (
    <View style={styles.skeletonContainer}>
      {cards.map((i) => (
        <View
          key={i}
          style={[
            styles.skeletonCard,
            { width: CARD_SIZE, height: CARD_SIZE * 1.3 },
          ]}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="compass-outline" size={64} color={COLORS.gray[300]} />
      <Text style={styles.emptyTitle}>No profiles to explore right now</Text>
      <Text style={styles.emptySubtext}>
        Pull down to refresh and check back later
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ExploreScreen() {
  const { session } = useSession();
  const router = useRouter();
  const userId = session?.user.id ?? "";

  const {
    profiles,
    selectedProfile,
    nextProfile,
    isLoading,
    isRefreshing,
    hasMore,
    matchData,
    loadMore,
    refresh,
    selectProfile,
    likeSelected,
    dismissSelected,
    clearSelected,
    dismissMatch,
  } = useExploreFeed(userId);

  // Track current user photo for match modal
  const [currentUserPhotoUrl] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleLike = useCallback(async () => {
    await likeSelected();
  }, [likeSelected]);

  const handleDismiss = useCallback(async () => {
    await dismissSelected();
  }, [dismissSelected]);

  const handleMessage = useCallback(async () => {
    // Swipe-up = message intent; treated as like (match triggers messaging)
    await likeSelected();
  }, [likeSelected]);

  const handleMatchSendMessage = useCallback(() => {
    if (matchData?.threadId) {
      dismissMatch();
      router.push(`/chat/${matchData.threadId}` as never);
    }
  }, [matchData, dismissMatch, router]);

  const handleKeepBrowsing = useCallback(() => {
    dismissMatch();
  }, [dismissMatch]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({ message: "Check out Room - find your roommate!" });
    } catch {
      // Ignore share errors
    }
  }, []);

  // -------------------------------------------------------------------------
  // Render item
  // -------------------------------------------------------------------------

  const renderItem = useCallback(
    ({ item }: { item: ExploreProfile }) => (
      <ExploreGridCard
        profile={item}
        onPress={() => selectProfile(item)}
        size={CARD_SIZE}
      />
    ),
    [selectProfile],
  );

  const keyExtractor = useCallback(
    (item: ExploreProfile) => item.user_id,
    [],
  );

  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: ROW_HEIGHT,
      offset: ROW_HEIGHT * Math.floor(index / NUM_COLUMNS),
      index,
    }),
    [],
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (!userId) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : profiles.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={profiles}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={NUM_COLUMNS}
          getItemLayout={getItemLayout}
          initialNumToRender={12}
          maxToRenderPerBatch={9}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={COLORS.primary[500]}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            hasMore ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color={COLORS.primary[400]} />
              </View>
            ) : null
          }
        />
      )}

      {/* Full profile view modal */}
      <ExploreProfileView
        profile={selectedProfile}
        nextProfile={nextProfile}
        onLike={handleLike}
        onDismiss={handleDismiss}
        onMessage={handleMessage}
        onClose={clearSelected}
        visible={selectedProfile !== null}
      />


      {/* Match modal */}
      <MatchModal
        visible={matchData !== null}
        matchData={matchData}
        currentUserPhotoUrl={currentUserPhotoUrl}
        onSendMessage={handleMatchSendMessage}
        onKeepSwiping={handleKeepBrowsing}
        onShare={handleShare}
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.gray[900],
  },
  listContent: {
    paddingBottom: 90,
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  // Skeleton
  skeletonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingTop: 1,
  },
  skeletonCard: {
    backgroundColor: COLORS.gray[200],
    borderRadius: 8,
    margin: 0.5,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.gray[700],
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray[400],
    marginTop: 8,
    textAlign: "center",
  },
});
