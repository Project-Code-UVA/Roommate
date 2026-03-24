/**
 * Read-only profile detail modal for the Likes tab.
 *
 * Shows the same PhotoCarousel + ProfileInfo layout as Discovery,
 * but without swipe gestures — just a back button to close.
 */

import { Ionicons } from "@expo/vector-icons";
import { Modal, View, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PhotoCarousel } from "@/components/discovery/photo-carousel";
import { ProfileInfo } from "@/components/discovery/profile-info";
import type { DiscoveryProfile } from "@/types/filters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProfileDetailModalProps = {
  readonly profile: DiscoveryProfile | null;
  readonly onClose: () => void;
  readonly visible: boolean;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileDetailModal({
  profile,
  onClose,
  visible,
}: ProfileDetailModalProps) {
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
