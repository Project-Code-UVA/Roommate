/**
 * Full profile view for Explore tab.
 *
 * Modal presentation with stacked SwipeCards from Discovery.
 * The next profile is rendered behind the current one and becomes
 * visible during a partial swipe. Swipe right = like, left = dismiss.
 *
 * Per D-09/D-10: overflow menu with block/report in top-right corner.
 */

import { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Modal, View, Pressable, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { SwipeCard } from "@/components/discovery/swipe-card";
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
// Types
// ---------------------------------------------------------------------------

type ExploreProfileViewProps = {
  readonly profile: DiscoveryProfile | null;
  readonly nextProfile: DiscoveryProfile | null;
  readonly onLike: () => void;
  readonly onDismiss: () => void;
  readonly onMessage: () => void;
  readonly onClose: () => void;
  readonly visible: boolean;
  readonly onBlock?: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ExploreProfileView({
  profile,
  nextProfile,
  onLike,
  onDismiss,
  onClose,
  visible,
  onBlock,
}: ExploreProfileViewProps) {
  // Block/report state
  const [reportVisible, setReportVisible] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const { session } = useSession();
  const userId = session?.user.id ?? "";

  // Block/report handlers
  const handleBlock = useCallback(() => {
    if (!profile) return;
    showBlockConfirmDialog(profile.display_name, async () => {
      const result = await blockUser(userId, profile.user_id);
      if (result.success) {
        onClose();
        onBlock?.();
      }
    });
  }, [profile, userId, onClose, onBlock]);

  const handleReport = useCallback(() => {
    setReportVisible(true);
  }, []);

  const handleReportSubmit = useCallback(
    async (category: ReportCategory, description: string) => {
      if (!profile) return;
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

  if (!profile) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
        <SafeAreaView style={styles.container} edges={["top"]}>
          {/* Back button */}
          <Pressable
            onPress={onClose}
            style={styles.backButton}
            testID="explore-profile-back"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={28} color="#1f2937" />
          </Pressable>

          {/* Overflow menu -- top-right, mirror of back button */}
          <View style={styles.overflowMenuContainer}>
            <OverflowMenu items={overflowItems} testIDPrefix="explore-profile" />
          </View>

          {/* Card stack -- next card behind, current card on top */}
          <View style={styles.cardStack}>
            {/* Next profile (behind) */}
            {nextProfile && (
              <View style={styles.backCard} pointerEvents="none">
                <SwipeCard
                  key={nextProfile.user_id}
                  profile={nextProfile}
                  onSwipeRight={() => {}}
                  onSwipeLeft={() => {}}
                />
              </View>
            )}

            {/* Current profile (front, swipeable) */}
            <View style={styles.frontCard}>
              <SwipeCard
                key={profile.user_id}
                profile={profile}
                onSwipeRight={onLike}
                onSwipeLeft={onDismiss}
              />
            </View>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>

      {/* Report sheet */}
      <ReportSheet
        visible={reportVisible}
        userName={profile.display_name}
        onSubmit={handleReportSubmit}
        onClose={() => setReportVisible(false)}
        isSubmitting={isReporting}
      />
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 8,
  },
  backButton: {
    position: "absolute",
    top: 56,
    left: 12,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  overflowMenuContainer: {
    position: "absolute",
    top: 56,
    right: 12,
    zIndex: 100,
  },
  cardStack: {
    flex: 1,
  },
  backCard: {
    ...StyleSheet.absoluteFillObject,
  },
  frontCard: {
    flex: 1,
  },
});
