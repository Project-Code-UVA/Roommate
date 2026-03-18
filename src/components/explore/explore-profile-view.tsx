/**
 * Full profile view for Explore tab.
 *
 * Modal presentation showing the existing ProfileCard (Hinge-style
 * scrollable profile) with FloatingActions at the bottom for
 * like/dismiss/message.
 */

import { Ionicons } from "@expo/vector-icons";
import { Modal, View, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProfileCard } from "@/components/discovery/profile-card";
import { FloatingActions } from "@/components/discovery/floating-actions";
import type { DiscoveryProfile } from "@/types/filters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExploreProfileViewProps = {
  readonly profile: DiscoveryProfile | null;
  readonly onLike: () => void;
  readonly onDismiss: () => void;
  readonly onMessage: () => void;
  readonly onClose: () => void;
  readonly visible: boolean;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ExploreProfileView({
  profile,
  onLike,
  onDismiss,
  onMessage,
  onClose,
  visible,
}: ExploreProfileViewProps) {
  if (!profile) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
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

        {/* Profile content */}
        <View style={styles.content}>
          <ProfileCard profile={profile} />
        </View>

        {/* Action buttons */}
        <FloatingActions
          onDismiss={onDismiss}
          onMessage={onMessage}
          onLike={onLike}
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
    backgroundColor: "#f9fafb",
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
  content: {
    flex: 1,
  },
});
