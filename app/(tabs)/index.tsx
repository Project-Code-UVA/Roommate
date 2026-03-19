/**
 * Discovery tab screen — Hinge-style scrollable profiles.
 *
 * Shows one profile at a time as a vertical scroll of photos + info cards.
 * Floating X/Heart buttons at bottom for dismiss/like actions.
 * First-time tutorial overlay teaches the new UX.
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

import { ProfileCard } from "@/components/discovery/profile-card";
import { FloatingActions } from "@/components/discovery/floating-actions";
import { SwipeTutorial } from "@/components/discovery/swipe-tutorial";
import { EmptyState } from "@/components/discovery/empty-state";
import { MatchModal } from "@/components/match/match-modal";
import { ProfileSheet } from "@/components/discovery/profile-sheet";
import { PhotoViewer } from "@/components/discovery/photo-viewer";
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
    stack,
    currentProfile,
    isLoading,
    isEmpty,
    error,
    matchData,
    dismissCurrent,
    likeCurrent,
    dismissMatch,
  } = useDiscoveryStack(userId);

  // Profile sheet & photo viewer state
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [photoViewerUrl, setPhotoViewerUrl] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  const handleProfileTap = useCallback(() => {
    setShowProfileSheet(true);
  }, []);

  const handleDismissSheet = useCallback(() => {
    setShowProfileSheet(false);
  }, []);

  const handlePhotoTap = useCallback((photoUrl: string) => {
    setPhotoViewerUrl(photoUrl);
  }, []);

  const handleClosePhotoViewer = useCallback(() => {
    setPhotoViewerUrl(null);
  }, []);

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
            // Like + navigate to chat (same as swipe-up intent)
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
    <View style={[styles.screen, { paddingBottom: TAB_BAR_HEIGHT }]} testID="discovery-screen">
      {/* Scrollable profile */}
      {currentProfile && (
        <ProfileCard profile={currentProfile} onProfileTap={handleProfileTap} />
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

      {/* Profile detail sheet */}
      <ProfileSheet
        profile={currentProfile}
        visible={showProfileSheet}
        onDismiss={handleDismissSheet}
        onPhotoTap={handlePhotoTap}
      />

      {/* Full-screen photo viewer */}
      <PhotoViewer
        photoUrl={photoViewerUrl}
        visible={photoViewerUrl !== null}
        onClose={handleClosePhotoViewer}
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
