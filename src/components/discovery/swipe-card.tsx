/**
 * Swipeable discovery card with pan gesture.
 *
 * Layout: Photo carousel at top (~55% screen), profile info below in ScrollView.
 * Horizontal pan gesture on the whole card:
 *   - Swipe right = like (green glow)
 *   - Swipe left = pass (red glow)
 * Spring animation flies card off-screen, then next profile appears.
 *
 * Gesture: activeOffsetX: [-15, 15] to avoid competing with vertical scroll.
 * Swipe threshold: 30% screen width.
 * Rotation: max 12 degrees.
 *
 * Per D-09/D-10: overflow menu with block/report in top-right corner.
 * Overflow menu zIndex 20 to sit above swipe glow overlays (zIndex 10).
 */

import { useCallback, useState } from "react";
import { Modal, View, ScrollView, Dimensions, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { LinearGradient } from "expo-linear-gradient";

import { PhotoCarousel } from "@/components/discovery/photo-carousel";
import { ProfileInfo } from "@/components/discovery/profile-info";
import { OverflowMenu } from "@/components/shared/overflow-menu";
import { ReportSheet } from "@/components/safety/report-sheet";
import { showBlockConfirmDialog } from "@/components/safety/block-confirm-dialog";
import { blockUser } from "@/services/block-service";
import { submitReport } from "@/services/report-service";
import { useSession } from "@/contexts/auth-context";
import type { DiscoveryProfile } from "@/types/filters";
import type { OverflowMenuItem } from "@/types/safety";
import type { ReportCategory } from "@/types/chat";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const MAX_ROTATION = 12;
const FLY_OUT_X = SCREEN_WIDTH * 1.5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SwipeCardProps = {
  readonly profile: DiscoveryProfile;
  readonly onSwipeRight: () => void;
  readonly onSwipeLeft: () => void;
  readonly onBlock?: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SwipeCard({ profile, onSwipeRight, onSwipeLeft, onBlock }: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const isAnimating = useSharedValue(false);

  // Block/report state
  const [reportVisible, setReportVisible] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const { session } = useSession();
  const userId = session?.user.id ?? "";

  const triggerLike = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSwipeRight();
  }, [onSwipeRight]);

  const triggerDismiss = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSwipeLeft();
  }, [onSwipeLeft]);

  // Block/report handlers
  const handleBlock = useCallback(() => {
    showBlockConfirmDialog(profile.display_name, async () => {
      const result = await blockUser(userId, profile.user_id);
      if (result.success) {
        onBlock?.();
      }
    });
  }, [profile, userId, onBlock]);

  const handleReport = useCallback(() => {
    setReportVisible(true);
  }, []);

  const handleReportSubmit = useCallback(
    async (category: ReportCategory, description: string) => {
      setIsReporting(true);
      await submitReport(userId, profile.user_id, category, description);
      setIsReporting(false);
      setReportVisible(false);
    },
    [profile, userId],
  );

  const overflowItems: readonly OverflowMenuItem[] = [
    { label: "Block", icon: "ban-outline", onPress: handleBlock, destructive: true },
    { label: "Report", icon: "flag-outline", onPress: handleReport },
  ];

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
        // Swipe right -- like
        isAnimating.value = true;
        translateX.value = withSpring(
          FLY_OUT_X,
          { damping: 20, stiffness: 200, mass: 0.8 },
          () => {
            runOnJS(triggerLike)();
          },
        );
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Swipe left -- dismiss
        isAnimating.value = true;
        translateX.value = withSpring(
          -FLY_OUT_X,
          { damping: 20, stiffness: 200, mass: 0.8 },
          () => {
            runOnJS(triggerDismiss)();
          },
        );
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  // Card transform: translate + rotate
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

  // Green glow for right swipe
  const likeOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 0.4],
      "clamp",
    );
    return { opacity };
  });

  // Red glow for left swipe
  const passOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [0.4, 0],
      "clamp",
    );
    return { opacity };
  });

  return (
    <>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Like glow overlay */}
          <Animated.View
            style={[styles.overlay, styles.likeOverlay, likeOverlayStyle]}
            pointerEvents="none"
          />
          {/* Pass glow overlay */}
          <Animated.View
            style={[styles.overlay, styles.passOverlay, passOverlayStyle]}
            pointerEvents="none"
          />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces
          >
            <PhotoCarousel
              photos={profile.photos}
              displayName={profile.display_name}
              year={profile.year}
              selfieVerified={profile.selfie_verified}
              hometown={profile.hometown}
              profileId={profile.user_id}
            />
            <ProfileInfo profile={profile} />
          </ScrollView>

          {/* Top bar overlay — rendered last so it paints above the ScrollView.
              Gradient fades into the photo so it feels native to the card. */}
          <LinearGradient
            colors={["rgba(0,0,0,0.32)", "transparent"]}
            style={styles.topBar}
            pointerEvents="box-none"
          >
            {/* Left slot — reserved for future actions (save, boost, etc.) */}
            <View style={styles.topBarSlot} />
            <View style={styles.topBarSlot} pointerEvents="auto">
              <OverflowMenu items={overflowItems} testIDPrefix="swipe-card" />
            </View>
          </LinearGradient>
        </Animated.View>
      </GestureDetector>

      {/* Report sheet -- rendered outside GestureDetector to avoid gesture conflicts */}
      <Modal transparent visible={reportVisible} animationType="none">
        <ReportSheet
          visible={reportVisible}
          userName={profile.display_name}
          onSubmit={handleReportSubmit}
          onClose={() => setReportVisible(false)}
          isSubmitting={isReporting}
        />
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 72,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  topBarSlot: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    borderRadius: 16,
  },
  likeOverlay: {
    backgroundColor: "#4ade80",
  },
  passOverlay: {
    backgroundColor: "#ef4444",
  },
});
