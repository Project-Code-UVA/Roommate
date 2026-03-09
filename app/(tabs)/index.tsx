/**
 * Discovery tab screen.
 *
 * Renders the swipe deck with all interactions wired:
 * - Swipe right to like, left to dismiss, up for message stub
 * - Tap card to open profile bottom sheet
 * - Match modal appears on mutual match with confetti + haptics
 * - Photo viewer opens from profile sheet
 * - Empty state when no profiles remain
 */

import { useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  Share,
  TouchableOpacity,
} from "react-native";

import { SwipeDeck } from "@/components/discovery/swipe-deck";
import { EmptyState } from "@/components/discovery/empty-state";
import { MatchModal } from "@/components/match/match-modal";
import { ProfileSheet } from "@/components/discovery/profile-sheet";
import { PhotoViewer } from "@/components/discovery/photo-viewer";
import { useDiscoveryStack } from "@/hooks/use-discovery-stack";
import { useSession } from "@/contexts/auth-context";
import { COLORS } from "@/lib/constants";
import type { DiscoveryProfile } from "@/types/filters";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DiscoveryScreen() {
  const { session } = useSession();
  const userId = session?.user.id ?? "";

  const {
    stack,
    isLoading,
    isEmpty,
    error,
    matchData,
    dismissCurrent,
    likeCurrent,
    saveCurrent,
    dismissMatch,
  } = useDiscoveryStack(userId);

  // Profile sheet state
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [selectedProfile, setSelectedProfile] =
    useState<DiscoveryProfile | null>(null);

  // Photo viewer state
  const [photoViewerUrl, setPhotoViewerUrl] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  const handleLike = useCallback(() => {
    likeCurrent();
  }, [likeCurrent]);

  const handleDismiss = useCallback(() => {
    dismissCurrent();
  }, [dismissCurrent]);

  const handleSave = useCallback(() => {
    saveCurrent();
  }, [saveCurrent]);

  const handleSwipeUp = useCallback(() => {
    Alert.alert("Coming Soon", "Messaging will be available in a future update");
  }, []);

  const handleTapCard = useCallback((profile: DiscoveryProfile) => {
    setSelectedProfile(profile);
    setShowProfileSheet(true);
  }, []);

  // Match modal callbacks
  const handleSendMessage = useCallback(() => {
    Alert.alert("Coming Soon", "Chat will be available soon!");
  }, []);

  const handleKeepSwiping = useCallback(() => {
    dismissMatch();
  }, [dismissMatch]);

  const handleShare = useCallback(async () => {
    await Share.share({
      message: "I matched with someone on Room!",
    });
  }, []);

  // Profile sheet callbacks
  const handleProfileSheetDismiss = useCallback(() => {
    setShowProfileSheet(false);
  }, []);

  const handlePhotoTap = useCallback((url: string) => {
    setPhotoViewerUrl(url);
  }, []);

  const handlePhotoViewerClose = useCallback(() => {
    setPhotoViewerUrl(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Error state
  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-8">
        <Text className="mb-4 text-center text-base text-red-400">
          {error}
        </Text>
        <TouchableOpacity
          className="rounded-full px-6 py-3"
          style={{ backgroundColor: COLORS.primary[600] }}
        >
          <Text className="text-sm font-semibold text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
      </View>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <View className="flex-1 bg-black">
        <EmptyState />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Swipe deck */}
      <SwipeDeck
        stack={stack}
        onLike={handleLike}
        onDismiss={handleDismiss}
        onSave={handleSave}
        onSwipeUp={handleSwipeUp}
        onTapCard={handleTapCard}
      />

      {/* Match modal */}
      <MatchModal
        visible={matchData !== null}
        matchData={matchData}
        currentUserPhotoUrl={null}
        onSendMessage={handleSendMessage}
        onKeepSwiping={handleKeepSwiping}
        onShare={handleShare}
      />

      {/* Profile bottom sheet */}
      <ProfileSheet
        profile={selectedProfile}
        visible={showProfileSheet}
        onDismiss={handleProfileSheetDismiss}
        onPhotoTap={handlePhotoTap}
      />

      {/* Photo viewer */}
      <PhotoViewer
        photoUrl={photoViewerUrl}
        visible={photoViewerUrl !== null}
        onClose={handlePhotoViewerClose}
      />
    </View>
  );
}
