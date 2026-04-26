/**
 * Explore tab screen — 2-column grid of profiles.
 *
 * Shows profiles from any school, ranked by engagement/popularity
 * with random profiles mixed in. Tap card to view full profile.
 *
 * Pull-to-refresh shuffles the feed with a new seed.
 * Scroll loads more profiles with the same seed.
 */

import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { ExploreGridCard } from "@/components/explore/explore-grid-card";
import { ExploreProfileView } from "@/components/explore/explore-profile-view";
import { MatchModal } from "@/components/match/match-modal";
import { FilterButton } from "@/components/shared/filter-button";
import { useExploreFeed } from "@/hooks/use-explore-feed";
import { openFilterDraft } from "@/stores/filter-draft";
import { useSession } from "@/contexts/auth-context";
import { COLORS } from "@/lib/constants";
import type { ExploreProfile } from "@/types/explore";
import type { DiscoveryFilters } from "@/types/filters";
import { countActiveFilters } from "@/types/filters";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_COLUMNS = 2;
const GRID_PADDING = 16;
const CARD_GAP = 10;
const CARD_SIZE =
  (SCREEN_WIDTH - GRID_PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) /
  NUM_COLUMNS;

// ---------------------------------------------------------------------------
// Loading skeleton placeholder
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  const cards = Array.from({ length: 6 }, (_, i) => i);
  return (
    <View style={styles.skeletonContainer}>
      {cards.map((i) => (
        <View
          key={i}
          style={[
            styles.skeletonCard,
            { width: CARD_SIZE, height: CARD_SIZE * 1.4 },
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
      <Ionicons name="compass-outline" size={64} color={COLORS.primary[300]} />
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

  const [filters, setFilters] = useState<DiscoveryFilters>({});
  const activeFilterCount = useMemo(
    () => countActiveFilters(filters),
    [filters],
  );

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
  } = useExploreFeed(userId, filters);

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

  const handleOpenFilters = useCallback(() => {
    openFilterDraft(filters, setFilters);
    router.push("/filters" as never);
  }, [filters, router]);

  // -------------------------------------------------------------------------
  // Render item
  // -------------------------------------------------------------------------

  const renderItem = useCallback(
    ({ item, index }: { item: ExploreProfile; index: number }) => (
      <View
        style={[
          styles.cardWrapper,
          index % NUM_COLUMNS === 0 ? styles.cardLeft : styles.cardRight,
        ]}
      >
        <ExploreGridCard
          profile={item}
          onPress={() => selectProfile(item)}
          size={CARD_SIZE}
        />
      </View>
    ),
    [selectProfile],
  );

  const keyExtractor = useCallback(
    (item: ExploreProfile) => item.user_id,
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
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Explore</Text>
          {profiles.length > 0 && (
            <Text style={styles.headerSubtitle}>
              {profiles.length} potential roommates nearby
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <FilterButton
            activeCount={activeFilterCount}
            onPress={handleOpenFilters}
            testID="explore-filter-button"
          />
          <View style={styles.sparklesBadge}>
            <Ionicons name="sparkles" size={18} color={COLORS.primary[600]} />
          </View>
        </View>
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
          initialNumToRender={8}
          maxToRenderPerBatch={6}
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
          columnWrapperStyle={styles.columnWrapper}
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
        onMessage={handleLike}
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
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(167, 139, 250, 0.2)",
  },
  headerLeft: {
    gap: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.gray[900],
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.gray[400],
  },
  sparklesBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary[100],
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: GRID_PADDING,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: CARD_GAP,
  },
  cardWrapper: {
    // handled by columnWrapper spacing
  },
  cardLeft: {},
  cardRight: {},
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  // Skeleton
  skeletonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: GRID_PADDING,
    gap: CARD_GAP,
  },
  skeletonCard: {
    backgroundColor: COLORS.primary[100],
    borderRadius: 16,
    opacity: 0.6,
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
