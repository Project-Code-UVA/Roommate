/**
 * Match celebration modal.
 *
 * Full-screen overlay with confetti animation, haptic feedback,
 * both profile photos, and three action buttons. Stays visible
 * until the user takes an action — no auto-dismiss.
 *
 * MTCH-02: Match celebration modal requirement.
 */

import { useEffect } from "react";
import { Modal, View, Text, Image, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import ConfettiCannon from "react-native-confetti-cannon";

import { COLORS } from "@/lib/constants";
import type { DiscoveryProfile } from "@/types/filters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MatchModalProps = {
  readonly visible: boolean;
  readonly matchData: {
    readonly matchId: string;
    readonly threadId: string;
    readonly profile: DiscoveryProfile;
  } | null;
  readonly currentUserPhotoUrl: string | null;
  readonly onSendMessage: () => void;
  readonly onKeepSwiping: () => void;
  readonly onShare: () => void;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PHOTO_SIZE = 88;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MatchModal({
  visible,
  matchData,
  currentUserPhotoUrl,
  onSendMessage,
  onKeepSwiping,
  onShare,
}: MatchModalProps) {
  // Fire heavy haptic when modal becomes visible
  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, [visible]);

  if (!visible || !matchData) {
    return null;
  }

  const { profile } = matchData;
  const matchedPhotoUrl = profile.photos[0]?.url ?? null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)" }}
        className="items-center justify-center px-8"
      >
        {/* Confetti */}
        <ConfettiCannon
          count={120}
          origin={{ x: -10, y: 0 }}
          autoStart
          fadeOut
        />

        {/* Profile photos — overlapping circles */}
        <View className="mb-6 flex-row items-center justify-center">
          {currentUserPhotoUrl ? (
            <Image
              source={{ uri: currentUserPhotoUrl }}
              style={{
                width: PHOTO_SIZE,
                height: PHOTO_SIZE,
                borderRadius: PHOTO_SIZE / 2,
                borderWidth: 3,
                borderColor: COLORS.white,
              }}
              testID="current-user-photo"
            />
          ) : (
            <View
              style={{
                width: PHOTO_SIZE,
                height: PHOTO_SIZE,
                borderRadius: PHOTO_SIZE / 2,
                borderWidth: 3,
                borderColor: COLORS.white,
                backgroundColor: COLORS.gray[700],
              }}
              testID="current-user-photo"
            />
          )}

          {matchedPhotoUrl ? (
            <Image
              source={{ uri: matchedPhotoUrl }}
              style={{
                width: PHOTO_SIZE,
                height: PHOTO_SIZE,
                borderRadius: PHOTO_SIZE / 2,
                borderWidth: 3,
                borderColor: COLORS.white,
                marginLeft: -20,
              }}
              testID="matched-user-photo"
            />
          ) : (
            <View
              style={{
                width: PHOTO_SIZE,
                height: PHOTO_SIZE,
                borderRadius: PHOTO_SIZE / 2,
                borderWidth: 3,
                borderColor: COLORS.white,
                backgroundColor: COLORS.gray[700],
                marginLeft: -20,
              }}
              testID="matched-user-photo"
            />
          )}
        </View>

        {/* Heading */}
        <Text className="mb-2 text-center text-3xl font-bold text-white">
          It's a Match!
        </Text>

        {/* Subtext */}
        <Text className="mb-10 text-center text-base text-gray-300">
          You and {profile.display_name} liked each other
        </Text>

        {/* Send a Message — primary button */}
        <TouchableOpacity
          onPress={onSendMessage}
          className="mb-4 w-full rounded-full py-4"
          style={{ backgroundColor: COLORS.primary[600] }}
          activeOpacity={0.8}
          testID="match-send-message"
        >
          <Text className="text-center text-base font-semibold text-white">
            Send a Message
          </Text>
        </TouchableOpacity>

        {/* Keep Swiping — secondary link */}
        <TouchableOpacity onPress={onKeepSwiping} className="mb-3 py-2" testID="match-keep-swiping">
          <Text className="text-center text-base font-medium text-white">
            Keep Swiping
          </Text>
        </TouchableOpacity>

        {/* Share — tertiary link */}
        <TouchableOpacity onPress={onShare} className="py-2">
          <Text className="text-center text-sm text-gray-400">Share</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
