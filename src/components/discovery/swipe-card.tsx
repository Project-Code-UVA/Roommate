/**
 * Swipeable discovery card with pan + tap gestures.
 *
 * Full-screen photo card — profile info is overlaid on the photo via
 * PhotoCarousel's bottom gradient. No scroll within the card.
 *
 * Gestures:
 *   - Swipe right → like (green LIKE pill)
 *   - Swipe left  → pass (red NOPE pill)
 *   - Swipe up    → super-like (blue SUPER pill)
 *   - Double-tap center → expand profile (via PhotoCarousel onDoubleTap)
 *   - Tap edges   → photo navigation (via PhotoCarousel)
 *
 * Pan activates once either axis crosses 15px. Dominant axis wins on release.
 * Horizontal threshold: 30% screen width. Vertical threshold: 25% screen height.
 *
 * Block/report overflow menu lives in the parent screen header (index.tsx).
 */

import { useCallback } from "react";
import { View, Text, Dimensions, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { PhotoCarousel } from "@/components/discovery/photo-carousel";
import { FILTER_VALUE_LABELS } from "@/constants/filter-options";
import type { DiscoveryProfile } from "@/types/filters";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD_X = SCREEN_WIDTH * 0.3;
const SWIPE_THRESHOLD_Y = SCREEN_HEIGHT * 0.18;
const MAX_ROTATION = 12;
const FLY_OUT_X = SCREEN_WIDTH * 1.5;
const FLY_OUT_Y = SCREEN_HEIGHT * 1.2;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getHabitChips(profile: DiscoveryProfile): string[] {
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
// Types
// ---------------------------------------------------------------------------

type SwipeCardProps = {
  readonly profile: DiscoveryProfile;
  readonly onSwipeRight: () => void;
  readonly onSwipeLeft: () => void;
  readonly onSwipeUp: () => void;
  readonly onExpand: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SwipeCard({
  profile,
  onSwipeRight,
  onSwipeLeft,
  onSwipeUp,
  onExpand,
}: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isAnimating = useSharedValue(false);

  const habitChips = getHabitChips(profile);
  const compatibility = Math.round(profile.rank_score * 100);

  const triggerLike = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSwipeRight();
  }, [onSwipeRight]);

  const triggerDismiss = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSwipeLeft();
  }, [onSwipeLeft]);

  const triggerSuperLike = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onSwipeUp();
  }, [onSwipeUp]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .activeOffsetY([-15, 15])
    .onUpdate((event) => {
      "worklet";
      if (isAnimating.value) return;
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      "worklet";
      if (isAnimating.value) return;

      const absX = Math.abs(event.translationX);
      const absY = Math.abs(event.translationY);
      // Vertical-up wins only if Y motion dominates X and user moved up
      const verticalUpDominant = event.translationY < 0 && absY > absX;

      if (verticalUpDominant && absY > SWIPE_THRESHOLD_Y) {
        isAnimating.value = true;
        translateY.value = withSpring(
          -FLY_OUT_Y,
          { damping: 22, stiffness: 320, mass: 0.6 },
          () => { runOnJS(triggerSuperLike)(); },
        );
      } else if (event.translationX > SWIPE_THRESHOLD_X) {
        isAnimating.value = true;
        translateX.value = withSpring(
          FLY_OUT_X,
          { damping: 22, stiffness: 320, mass: 0.6 },
          () => { runOnJS(triggerLike)(); },
        );
      } else if (event.translationX < -SWIPE_THRESHOLD_X) {
        isAnimating.value = true;
        translateX.value = withSpring(
          -FLY_OUT_X,
          { damping: 22, stiffness: 320, mass: 0.6 },
          () => { runOnJS(triggerDismiss)(); },
        );
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-MAX_ROTATION, 0, MAX_ROTATION],
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  const likeOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, SWIPE_THRESHOLD_X], [0, 0.4], "clamp");
    return { opacity };
  });

  const passOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [-SWIPE_THRESHOLD_X, 0], [0.4, 0], "clamp");
    return { opacity };
  });

  const superOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateY.value, [-SWIPE_THRESHOLD_Y, 0], [0.4, 0], "clamp");
    return { opacity };
  });

  const likeIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, SWIPE_THRESHOLD_X], [0, 1], "clamp");
    return { opacity };
  });

  const passIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [-SWIPE_THRESHOLD_X, 0], [1, 0], "clamp");
    return { opacity };
  });

  const superIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateY.value, [-SWIPE_THRESHOLD_Y, 0], [1, 0], "clamp");
    return { opacity };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        {/* Swipe glow overlays */}
        <Animated.View
          style={[styles.overlay, styles.likeOverlay, likeOverlayStyle]}
          pointerEvents="none"
        />
        <Animated.View
          style={[styles.overlay, styles.passOverlay, passOverlayStyle]}
          pointerEvents="none"
        />
        <Animated.View
          style={[styles.overlay, styles.superOverlay, superOverlayStyle]}
          pointerEvents="none"
        />

        {/* Full-screen photo with overlaid profile info */}
        <PhotoCarousel
          photos={profile.photos}
          displayName={profile.display_name}
          year={profile.year}
          selfieVerified={profile.selfie_verified}
          hometown={profile.hometown}
          profileId={profile.user_id}
          compatibility={compatibility}
          bio={profile.bio}
          habitChips={habitChips}
          onDoubleTap={onExpand}
        />

        {/* LIKE pill indicator */}
        <Animated.View style={[styles.likePill, likeIndicatorStyle]} pointerEvents="none">
          <Text style={styles.likePillText}>LIKE</Text>
        </Animated.View>

        {/* NOPE pill indicator */}
        <Animated.View style={[styles.nopePill, passIndicatorStyle]} pointerEvents="none">
          <Text style={styles.nopePillText}>NOPE</Text>
        </Animated.View>

        {/* SUPER pill indicator (center-top, appears when swiping up) */}
        <Animated.View style={[styles.superPill, superIndicatorStyle]} pointerEvents="none">
          <Text style={styles.superPillText}>SUPER</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    borderRadius: 24,
  },
  likeOverlay: {
    backgroundColor: "#4ade80",
  },
  passOverlay: {
    backgroundColor: "#ef4444",
  },
  superOverlay: {
    backgroundColor: "#3b82f6",
  },
  likePill: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#22c55e",
    borderWidth: 3,
    borderColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 9,
    transform: [{ rotate: "12deg" }],
    zIndex: 20,
  },
  likePillText: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 1,
  },
  nopePill: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: "#ef4444",
    borderWidth: 3,
    borderColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 9,
    transform: [{ rotate: "-12deg" }],
    zIndex: 20,
  },
  nopePillText: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 1,
  },
  superPill: {
    position: "absolute",
    top: 80,
    alignSelf: "center",
    backgroundColor: "#3b82f6",
    borderWidth: 3,
    borderColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 20,
  },
  superPillText: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
});
