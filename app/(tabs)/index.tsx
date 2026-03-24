/**
 * Discovery tab screen — swipe-based roommate discovery.
 *
 * Shows one profile at a time as a swipeable card.
 * Swipe right = like, swipe left = pass.
 * Photo carousel at top, profile info below.
 * Floating action buttons for dismiss/like/message.
 */

import { useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  Share,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SwipeCard } from "@/components/discovery/swipe-card";
import { FloatingActions } from "@/components/discovery/floating-actions";
import { SwipeTutorial } from "@/components/discovery/swipe-tutorial";
import { EmptyState } from "@/components/discovery/empty-state";
import { MatchModal } from "@/components/match/match-modal";
import { useDiscoveryStack } from "@/hooks/use-discovery-stack";
import { useSession } from "@/contexts/auth-context";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DiscoveryScreen() {
  const { session } = useSession();
  const router = useRouter();
  const userId = session?.user.id ?? "";
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 49 + insets.bottom;

  const {
    currentProfile,
    isLoading,
    isEmpty,
    error,
    matchData,
    dismissCurrent,
    likeCurrent,
    dismissMatch,
  } = useDiscoveryStack(userId);

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  const handleLike = useCallback(() => {
    likeCurrent();
  }, [likeCurrent]);

  const handleDismiss = useCallback(() => {
    dismissCurrent();
  }, [dismissCurrent]);

  const handleMessage = useCallback(() => {
    if (!currentProfile) return;
    Alert.alert(
      "Send a Message",
      `Start a conversation with ${currentProfile.display_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Message",
          onPress: () => {
            likeCurrent();
          },
        },
      ],
    );
  }, [currentProfile, likeCurrent]);

  // Match modal callbacks
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
    await Share.share({
      message: "I matched with someone on Room!",
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Error state
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
      </View>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <View style={styles.screen} testID="discovery-empty">
        <EmptyState />
      </View>
    );
  }

  return (
    <View
      style={[styles.screen, { paddingTop: insets.top, paddingBottom: TAB_BAR_HEIGHT }]}
      testID="discovery-screen"
    >
      {/* Swipeable profile card */}
      {currentProfile && (
        <SwipeCard
          key={currentProfile.user_id}
          profile={currentProfile}
          onSwipeRight={handleLike}
          onSwipeLeft={handleDismiss}
        />
      )}

      {/* Floating action buttons */}
      <FloatingActions onDismiss={handleDismiss} onMessage={handleMessage} onLike={handleLike} />

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
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
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
