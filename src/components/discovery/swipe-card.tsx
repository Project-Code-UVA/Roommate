/**
 * Swipeable discovery card with pan gesture.
 *
 * Full-screen photo card — profile info is overlaid on the photo via
 * PhotoCarousel's bottom gradient. No scroll within the card.
 *
 * Horizontal pan gesture:
 *   - Swipe right → like (green LIKE pill indicator)
 *   - Swipe left  → pass (red NOPE pill indicator)
 * Spring animation flies card off-screen, then next profile appears.
 *
 * Gesture: activeOffsetX: [-15, 15] to avoid competing with page scrolls.
 * Swipe threshold: 30% screen width. Rotation: max 12 degrees.
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
import type { DiscoveryProfile } from "@/types/filters";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const MAX_ROTATION = 12;
const FLY_OUT_X = SCREEN_WIDTH * 1.5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getHabitChips(profile: DiscoveryProfile): string[] {
  const self = profile.nitty_gritty?.self ?? {};
  const chips: string[] = [];
  if (self.sleep_schedule) chips.push(self.sleep_schedule);
  if (self.cleanliness) chips.push(self.cleanliness);
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
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SwipeCard({ profile, onSwipeRight, onSwipeLeft }: SwipeCardProps) {
  const translateX = useSharedValue(0);
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

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((event) => {
      "worklet";
      if (isAnimating.value) return;
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      "worklet";
      if (isAnimating.value) return;

      if (event.translationX > SWIPE_THRESHOLD) {
        isAnimating.value = true;
        translateX.value = withSpring(
          FLY_OUT_X,
          { damping: 20, stiffness: 200, mass: 0.8 },
          () => { runOnJS(triggerLike)(); },
        );
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        isAnimating.value = true;
        translateX.value = withSpring(
          -FLY_OUT_X,
          { damping: 20, stiffness: 200, mass: 0.8 },
          () => { runOnJS(triggerDismiss)(); },
        );
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
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
        { rotate: `${rotation}deg` },
      ],
    };
  });

  const likeOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 0.4], "clamp");
    return { opacity };
  });

  const passOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [0.4, 0], "clamp");
    return { opacity };
  });

  const likeIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], "clamp");
    return { opacity };
  });

  const passIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], "clamp");
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
        />

        {/* LIKE pill indicator */}
        <Animated.View style={[styles.likePill, likeIndicatorStyle]} pointerEvents="none">
          <Text style={styles.likePillText}>LIKE</Text>
        </Animated.View>

        {/* NOPE pill indicator */}
        <Animated.View style={[styles.nopePill, passIndicatorStyle]} pointerEvents="none">
          <Text style={styles.nopePillText}>NOPE</Text>
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
});
