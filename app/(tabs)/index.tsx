/**
 * Discovery tab screen — swipe-based roommate discovery.
 *
 * Shows one profile at a time as a swipeable full-screen card.
 * Swipe right = like, swipe left = pass.
 *
 * Header (Discovery title + cards-left counter + overflow menu) floats above
 * the card stack on the light gradient background — not overlaid on the photo.
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  ActivityIndicator,
  Share,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SwipeCard } from "@/components/discovery/swipe-card";
import { PhotoCarousel } from "@/components/discovery/photo-carousel";
import { PhotoViewer } from "@/components/discovery/photo-viewer";
import { ExploreProfileView } from "@/components/explore/explore-profile-view";
import { SwipeTutorial } from "@/components/discovery/swipe-tutorial";
import { EmptyState } from "@/components/discovery/empty-state";
import { MatchModal } from "@/components/match/match-modal";
import { OverflowMenu } from "@/components/shared/overflow-menu";
import { FilterButton } from "@/components/shared/filter-button";
import { ReportSheet } from "@/components/safety/report-sheet";
import { openFilterDraft } from "@/stores/filter-draft";
import { setAppliedFilters, useAppliedFilters } from "@/stores/applied-filters";
import { showBlockConfirmDialog } from "@/components/safety/block-confirm-dialog";
import { blockUser } from "@/services/block-service";
import { submitReport } from "@/services/report-service";
import { useDiscoveryStack } from "@/hooks/use-discovery-stack";
import { useSession } from "@/contexts/auth-context";
import { COLORS } from "@/lib/constants";
import { FILTER_VALUE_LABELS } from "@/constants/filter-options";
import type { OverflowMenuItem } from "@/types/safety";
import type { ReportCategory } from "@/types/chat";
import type { DiscoveryFilters } from "@/types/filters";
import { countActiveFilters } from "@/types/filters";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GRADIENT_COLORS = ["#f5f3ff", "#fdf2f8", "#fff7ed"] as const;

function getHabitChips(profile: {
  year: string | null;
  nitty_gritty?: { self?: Partial<Record<string, string>> } | null;
}): string[] {
  const self = profile.nitty_gritty?.self ?? {};
  const chips: string[] = [];
  const sleep = self.sleep_schedule
    ? (FILTER_VALUE_LABELS.sleep_schedule[self.sleep_schedule] ?? self.sleep_schedule)
    : null;
  const clean = self.cleanliness
    ? (FILTER_VALUE_LABELS.cleanliness[self.cleanliness] ?? self.cleanliness)
    : null;
  if (sleep) chips.push(sleep);
  if (clean) chips.push(clean);
  if (profile.year) chips.push(`Class of ${profile.year}`);
  return chips.slice(0, 3);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DiscoveryScreen() {
  const { session } = useSession();
  const router = useRouter();
  const userId = session?.user.id ?? "";
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 49 + insets.bottom;

  const filters = useAppliedFilters();
  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  const {
    stack,
    currentProfile,
    isLoading,
    isEmpty,
    error,
    matchData,
    dismissCurrent,
    likeCurrent,
    superLikeCurrent,
    dismissMatch,
    refresh,
  } = useDiscoveryStack(userId, filters);

  const nextProfile = stack[1] ?? null;

  // Aggressively warm the image cache 5 profiles ahead. By the time a card
  // reaches the visible "back" slot it already has its hero photo in cache,
  // so the swap is instant and there's no expo-image fade-in flash.
  const lookahead = useMemo(() => stack.slice(1, 6), [stack]);
  useEffect(() => {
    const heroes = lookahead
      .map((p) => p.photos?.[0]?.url)
      .filter((u): u is string => Boolean(u));
    if (heroes.length > 0) {
      Image.prefetch(heroes, "memory-disk").catch(() => {});
    }
  }, [lookahead]);

  const [reportVisible, setReportVisible] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [expandVisible, setExpandVisible] = useState(false);
  const [viewerPhotoUrl, setViewerPhotoUrl] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  const handleLike = useCallback(() => {
    likeCurrent();
  }, [likeCurrent]);

  const handleDismiss = useCallback(() => {
    dismissCurrent();
  }, [dismissCurrent]);

  const handleSuperLike = useCallback(() => {
    superLikeCurrent();
  }, [superLikeCurrent]);

  const handleExpand = useCallback(() => {
    setExpandVisible(true);
  }, []);

  const handleCloseExpand = useCallback(() => {
    setExpandVisible(false);
  }, []);

  const handlePhotoTap = useCallback((photoUrl: string) => {
    setViewerPhotoUrl(photoUrl);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setViewerPhotoUrl(null);
  }, []);

  const handleBlock = useCallback(() => {
    if (!currentProfile) return;
    showBlockConfirmDialog(currentProfile.display_name, async () => {
      const result = await blockUser(userId, currentProfile.user_id);
      if (result.success) {
        dismissCurrent();
      }
    });
  }, [currentProfile, userId, dismissCurrent]);

  const handleReport = useCallback(() => {
    setReportVisible(true);
  }, []);

  const handleReportSubmit = useCallback(
    async (category: ReportCategory, description: string) => {
      if (!currentProfile) return;
      setIsReporting(true);
      await submitReport(userId, currentProfile.user_id, category, description);
      setIsReporting(false);
      setReportVisible(false);
    },
    [currentProfile, userId],
  );

  const handleSendMessage = useCallback(() => {
    if (!matchData) return;

    const { threadId, profile } = matchData;
    const avatarUrl = profile.photos[0]?.url ?? "";

    dismissMatch();
    router.push(
      `/chat/${threadId}?otherUserId=${profile.user_id}&otherName=${encodeURIComponent(profile.display_name)}&otherAvatar=${encodeURIComponent(avatarUrl)}` as never,
    );
  }, [matchData, dismissMatch, router]);

  const handleKeepSwiping = useCallback(() => {
    dismissMatch();
  }, [dismissMatch]);

  const handleShare = useCallback(async () => {
    await Share.share({ message: "I matched with someone on Room!" });
  }, []);

  const overflowItems = useMemo<readonly OverflowMenuItem[]>(() => [
    { label: "Block", icon: "ban-outline", onPress: handleBlock, destructive: true },
    { label: "Report", icon: "flag-outline", onPress: handleReport },
  ], [handleBlock, handleReport]);

  const handleOpenFilters = useCallback(() => {
    openFilterDraft(filters, setAppliedFilters);
    router.push("/filters" as never);
  }, [filters, router]);

  // ---------------------------------------------------------------------------
  // Render — loading / error / empty states
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <LinearGradient colors={GRADIENT_COLORS} style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (isLoading) {
    return (
      <LinearGradient colors={GRADIENT_COLORS} style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
      </LinearGradient>
    );
  }

  if (isEmpty) {
    return (
      <LinearGradient
        colors={GRADIENT_COLORS}
        style={[styles.screen, { paddingTop: insets.top, paddingBottom: TAB_BAR_HEIGHT }]}
        testID="discovery-empty"
      >
        {/* Header still renders so the user can loosen filters from empty state */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discovery</Text>
          <View style={styles.headerRight}>
            <FilterButton
              activeCount={activeFilterCount}
              onPress={handleOpenFilters}
              testID="discovery-filter-button"
            />
          </View>
        </View>
        <EmptyState onRefresh={refresh} />
      </LinearGradient>
    );
  }

  // ---------------------------------------------------------------------------
  // Render — main discovery view
  // ---------------------------------------------------------------------------

  return (
    <LinearGradient
      colors={GRADIENT_COLORS}
      style={[styles.screen, { paddingTop: insets.top, paddingBottom: TAB_BAR_HEIGHT }]}
      testID="discovery-screen"
    >
      {/* Screen-level header — sits above the card on the light gradient */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discovery</Text>
        <View style={styles.headerRight}>
          {stack.length > 1 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{stack.length} left</Text>
            </View>
          )}
          <FilterButton
            activeCount={activeFilterCount}
            onPress={handleOpenFilters}
            testID="discovery-filter-button"
          />
          {currentProfile && (
            <OverflowMenu items={overflowItems} testIDPrefix="discovery" />
          )}
        </View>
      </View>

      {/* Card stack — current card with next card peeking behind */}
      <View style={styles.cardStack}>
        {nextProfile && nextProfile.photos[0] && (
          <View style={styles.behindCard} pointerEvents="none">
            <PhotoCarousel
              photos={nextProfile.photos}
              displayName={nextProfile.display_name}
              year={nextProfile.year}
              selfieVerified={nextProfile.selfie_verified}
              hometown={nextProfile.hometown}
              profileId={nextProfile.user_id}
              compatibility={Math.round(nextProfile.rank_score * 100)}
              bio={nextProfile.bio}
              habitChips={getHabitChips(nextProfile)}
            />
          </View>
        )}
        {currentProfile && (
          <SwipeCard
            key={currentProfile.user_id}
            profile={currentProfile}
            onSwipeRight={handleLike}
            onSwipeLeft={handleDismiss}
            onSwipeUp={handleSuperLike}
            onExpand={handleExpand}
          />
        )}
      </View>

      {/* First-time tutorial overlay */}
      <SwipeTutorial />

      {/* Match modal */}
      <MatchModal
        visible={matchData !== null}
        matchData={matchData}
        currentUserPhotoUrl={null}
        onSendMessage={handleSendMessage}
        onKeepSwiping={handleKeepSwiping}
        onShare={handleShare}
      />

      {/* Report sheet */}
      <Modal transparent visible={reportVisible} animationType="none">
        <ReportSheet
          visible={reportVisible}
          userName={currentProfile?.display_name ?? ""}
          onSubmit={handleReportSubmit}
          onClose={() => setReportVisible(false)}
          isSubmitting={isReporting}
        />
      </Modal>

      {/* Expanded profile detail — opened via double-tap on card.
          Shares visual language with Explore's full profile view. */}
      <ExploreProfileView
        profile={currentProfile}
        nextProfile={nextProfile}
        visible={expandVisible}
        onClose={handleCloseExpand}
        onLike={() => {
          handleCloseExpand();
          handleLike();
        }}
        onDismiss={() => {
          handleCloseExpand();
          handleDismiss();
        }}
        onMessage={() => {
          handleCloseExpand();
          handleSuperLike();
        }}
        onBlock={() => {
          handleCloseExpand();
          dismissCurrent();
        }}
      />

      {/* Full-screen photo viewer — retained for future use */}
      <PhotoViewer
        photoUrl={viewerPhotoUrl}
        visible={viewerPhotoUrl !== null}
        onClose={handleCloseViewer}
      />
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  headerTitle: {
    color: "#1a0a2e",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countBadge: {
    backgroundColor: "rgba(168, 85, 247, 0.12)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  countText: {
    color: "#7c3aed",
    fontSize: 13,
    fontWeight: "600",
  },
  cardStack: {
    flex: 1,
  },
  behindCard: {
    // Render the next card at full size behind the front one so that when
    // the front flies off the next is already in place. No scale or opacity
    // pop on swap — swipes feel instant.
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    overflow: "hidden",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    color: "#f87171",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary[600],
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
