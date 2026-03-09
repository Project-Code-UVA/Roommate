/**
 * Single discovery card with photo background, gesture handling, and overlays.
 *
 * Features:
 * - Full-screen photo with gradient overlay showing profile info
 * - Pan gesture for swipe left/right/up with rotation and feedback
 * - Tap gesture for photo navigation (left half = prev, right half = next)
 * - Green glow + heart for right swipe, red glow + X for left swipe
 * - Floating action buttons (dismiss, save, like)
 * - PhotoIndicator at top showing current photo position
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useCallback } from "react";
import { View, Text, Image, Dimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";

import { CardActionButtons } from "@/components/discovery/card-action-buttons";
import { PhotoIndicator } from "@/components/discovery/photo-indicator";
import { COLORS } from "@/lib/constants";
import type { DiscoveryProfile } from "@/types/filters";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const SWIPE_UP_THRESHOLD = 150;
const ROTATION_ANGLE = 12;
const SPRING_CONFIG = { damping: 15, stiffness: 150 };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SwipeCardProps = {
  readonly profile: DiscoveryProfile;
  readonly isTopCard: boolean;
  readonly onLike: () => void;
  readonly onDismiss: () => void;
  readonly onSave: () => void;
  readonly onSwipeUp: () => void;
  readonly onTapCard: () => void;
  readonly isSaved?: boolean;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SwipeCard({
  profile,
  isTopCard,
  onLike,
  onDismiss,
  onSave,
  onSwipeUp,
  onTapCard,
  isSaved = false,
}: SwipeCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const photos = profile.photos;
  const currentPhoto = photos[photoIndex] ?? photos[0];
  const totalPhotos = photos.length;

  // -------------------------------------------------------------------------
  // Photo navigation
  // -------------------------------------------------------------------------

  const goToPreviousPhoto = useCallback(() => {
    setPhotoIndex((prev) => (prev > 0 ? prev - 1 : totalPhotos - 1));
  }, [totalPhotos]);

  const goToNextPhoto = useCallback(() => {
    setPhotoIndex((prev) => (prev + 1) % totalPhotos);
  }, [totalPhotos]);

  // -------------------------------------------------------------------------
  // Gestures (top card only)
  // -------------------------------------------------------------------------

  const tapGesture = Gesture.Tap().onEnd((event) => {
    "worklet";
    const isLeftHalf = event.x < SCREEN_WIDTH / 2;
    if (isLeftHalf) {
      runOnJS(goToPreviousPhoto)();
    } else {
      runOnJS(goToNextPhoto)();
    }
  });

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      "worklet";
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      "worklet";
      const shouldSwipeRight = translateX.value > SWIPE_THRESHOLD;
      const shouldSwipeLeft = translateX.value < -SWIPE_THRESHOLD;
      const shouldSwipeUp = translateY.value < -SWIPE_UP_THRESHOLD;

      if (shouldSwipeRight) {
        translateX.value = withSpring(SCREEN_WIDTH * 1.5);
        translateY.value = withSpring(translateY.value);
        runOnJS(onLike)();
      } else if (shouldSwipeLeft) {
        translateX.value = withSpring(-SCREEN_WIDTH * 1.5);
        translateY.value = withSpring(translateY.value);
        runOnJS(onDismiss)();
      } else if (shouldSwipeUp) {
        translateY.value = withSpring(-SCREEN_HEIGHT);
        runOnJS(onSwipeUp)();
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  // -------------------------------------------------------------------------
  // Animated styles
  // -------------------------------------------------------------------------

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-ROTATION_ANGLE, 0, ROTATION_ANGLE],
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  const likeOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const dislikeOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  // -------------------------------------------------------------------------
  // Non-top card: static, scaled down, no gestures
  // -------------------------------------------------------------------------

  if (!isTopCard) {
    return (
      <View
        className="absolute inset-0 overflow-hidden rounded-2xl"
        style={{ transform: [{ scale: 0.95 }] }}
        pointerEvents="none"
      >
        <Image
          source={{ uri: currentPhoto?.url }}
          className="absolute inset-0 h-full w-full"
          resizeMode="cover"
        />
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // Top card: full interactive card
  // -------------------------------------------------------------------------

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        className="absolute inset-0 overflow-hidden rounded-2xl"
        style={[cardAnimatedStyle]}
        testID="swipe-card"
      >
        {/* Photo background */}
        <Image
          source={{ uri: currentPhoto?.url }}
          className="absolute inset-0 h-full w-full"
          resizeMode="cover"
          testID="card-photo"
        />

        {/* Like overlay (green glow + heart) */}
        <Animated.View
          className="absolute inset-0 items-center justify-center"
          style={[{ backgroundColor: "rgba(34, 197, 94, 0.3)" }, likeOverlayStyle]}
          pointerEvents="none"
        >
          <Ionicons name="heart" size={80} color="rgba(34, 197, 94, 0.8)" />
        </Animated.View>

        {/* Dislike overlay (red glow + X) */}
        <Animated.View
          className="absolute inset-0 items-center justify-center"
          style={[{ backgroundColor: "rgba(239, 68, 68, 0.3)" }, dislikeOverlayStyle]}
          pointerEvents="none"
        >
          <Ionicons name="close" size={80} color="rgba(239, 68, 68, 0.8)" />
        </Animated.View>

        {/* Photo indicator at top */}
        <View className="absolute left-0 right-0 top-0 z-10">
          <PhotoIndicator total={totalPhotos} current={photoIndex} />
        </View>

        {/* Bottom gradient overlay with profile info */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          className="absolute bottom-0 left-0 right-0 pb-20 pt-32"
        >
          <View className="px-4">
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl font-bold text-white">
                {profile.display_name}
              </Text>
              {profile.year && (
                <Text className="text-lg text-gray-300">
                  {profile.year}
                </Text>
              )}
            </View>

            {/* Compatibility score badge */}
            <View className="mt-1 flex-row items-center gap-2">
              <View className="rounded-full bg-primary-600/80 px-2.5 py-0.5">
                <Text className="text-xs font-semibold text-white">
                  {Math.round(profile.rank_score * 100)}% match
                </Text>
              </View>

              {profile.selfie_verified && (
                <View className="flex-row items-center gap-1">
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={COLORS.primary[400]}
                  />
                  <Text className="text-xs text-primary-400">Verified</Text>
                </View>
              )}
            </View>

            {/* Mode status pill */}
            {profile.mode_status === "friends" && (
              <View className="mt-2 self-start rounded-full bg-white/20 px-3 py-1">
                <Text className="text-xs text-white">Looking for friends</Text>
              </View>
            )}

            {profile.bio && (
              <Text
                className="mt-2 text-sm text-gray-300"
                numberOfLines={2}
              >
                {profile.bio}
              </Text>
            )}
          </View>
        </LinearGradient>

        {/* Floating action buttons */}
        <CardActionButtons
          onDismiss={onDismiss}
          onSave={onSave}
          onLike={onLike}
          isSaved={isSaved}
        />
      </Animated.View>
    </GestureDetector>
  );
}
