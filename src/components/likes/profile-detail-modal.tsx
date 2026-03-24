/**
 * Read-only profile detail modal for the Likes tab.
 *
 * Shows the same PhotoCarousel + ProfileInfo layout as Discovery,
 * but without swipe gestures -- just a back button to close.
 *
 * Per D-09/D-10: overflow menu with block/report in top-right corner.
 */

import { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Modal, View, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
// Types
// ---------------------------------------------------------------------------

type ProfileDetailModalProps = {
  readonly profile: DiscoveryProfile | null;
  readonly onClose: () => void;
  readonly visible: boolean;
  readonly onBlock?: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileDetailModal({
  profile,
  onClose,
  visible,
  onBlock,
}: ProfileDetailModalProps) {
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
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Back button */}
        <Pressable
          onPress={onClose}
          style={styles.backButton}
          testID="profile-detail-back"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={28} color="#1f2937" />
        </Pressable>

        {/* Overflow menu -- top-right corner */}
        <View style={styles.overflowMenuContainer}>
          <OverflowMenu items={overflowItems} testIDPrefix="likes-profile" />
        </View>

        {/* Profile content */}
        <View style={styles.card}>
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
        </View>

        {/* Report sheet */}
        <ReportSheet
          visible={reportVisible}
          userName={profile.display_name}
          onSubmit={handleReportSubmit}
          onClose={() => setReportVisible(false)}
          isSubmitting={isReporting}
        />
      </SafeAreaView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  card: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    overflow: "hidden",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
});
