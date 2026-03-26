/**
 * Profile tab — view and edit your own profile.
 *
 * Clean white layout matching Explore/Discovery aesthetic.
 * Photo carousel, compact status chips, and editable fields all
 * flow inside a single ScrollView with no above-fold fixed elements.
 */

import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileFields } from "@/components/profile/profile-fields";
import { ModeSelector } from "@/components/profile/mode-selector";
import { PhotoManager } from "@/components/profile/photo-manager";
import { VerificationBanner } from "@/components/verification/verification-banner";
import { SelfieCapture } from "@/components/verification/selfie-capture";
import { useProfile } from "@/hooks/use-profile";
import { useSession } from "@/contexts/auth-context";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const { session } = useSession();
  const router = useRouter();
  const userId = session?.user.id ?? "";

  const {
    profile,
    photos,
    modeStatus,
    isLoading,
    error,
    selfieVerified,
    refresh,
    updateField,
  } = useProfile(userId);

  const [refreshing, setRefreshing] = useState(false);
  const [showPhotoManager, setShowPhotoManager] = useState(false);
  const [modeState, setModeState] = useState(modeStatus);
  const [showBanner, setShowBanner] = useState(true);
  const [showSelfieCapture, setShowSelfieCapture] = useState(false);

  // Sync mode from hook when it loads
  if (modeStatus !== "roommate" && modeState === "roommate" && !isLoading) {
    setModeState(modeStatus);
  }

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleModeChange = useCallback((mode: "roommate" | "friends" | "found_roommate") => {
    setModeState(mode);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error ?? "Profile not found"}</Text>
        <Pressable style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable
          onPress={() => router.push("/settings" as never)}
          style={styles.settingsButton}
          testID="settings-button"
        >
          <Ionicons name="settings-outline" size={22} color={COLORS.gray[600]} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Photo carousel */}
        <ProfileHeader
          photos={photos}
          displayName={profile.display_name}
          selfieVerified={selfieVerified}
          onEditPhotos={() => setShowPhotoManager(!showPhotoManager)}
        />

        {/* Photo manager (collapsible) */}
        {showPhotoManager && (
          <PhotoManager
            userId={userId}
            photos={photos}
            onPhotosChanged={refresh}
          />
        )}

        {/* Verification nudge — compact strip, inside scroll */}
        {!selfieVerified && showBanner && (
          <VerificationBanner
            onVerify={() => setShowSelfieCapture(true)}
            onDismiss={() => setShowBanner(false)}
          />
        )}

        {/* Status chips */}
        <ModeSelector
          userId={userId}
          currentMode={modeState}
          onModeChange={handleModeChange}
        />

        {/* Editable fields */}
        <ProfileFields
          bio={profile.bio}
          gender={profile.gender}
          showGender={profile.show_gender}
          hometown={profile.hometown}
          showHometown={profile.show_hometown}
          year={profile.year}
          onUpdate={updateField}
        />
      </ScrollView>

      {/* Selfie capture modal */}
      <Modal
        visible={showSelfieCapture}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SelfieCapture
          userId={userId}
          onComplete={() => {
            setShowSelfieCapture(false);
            setShowBanner(false);
            refresh();
          }}
          onCancel={() => setShowSelfieCapture(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.gray[900],
    letterSpacing: -0.5,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  errorText: {
    color: "#f87171",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary[600],
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
