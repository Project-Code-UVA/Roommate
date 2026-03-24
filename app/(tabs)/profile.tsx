/**
 * Profile tab — view and edit your own profile.
 *
 * Displays photo carousel with edit overlay, editable fields,
 * mode selector, and photo manager. Gear icon navigates to settings.
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
          <Ionicons name="settings-outline" size={24} color={COLORS.gray[700]} />
        </Pressable>
      </View>

      {/* Verification banner for unverified users (D-02: dismissable) */}
      {!selfieVerified && showBanner && (
        <VerificationBanner
          onVerify={() => setShowSelfieCapture(true)}
          onDismiss={() => setShowBanner(false)}
        />
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Photo header */}
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

        {/* Mode selector */}
        <ModeSelector
          userId={userId}
          currentMode={modeState}
          onModeChange={handleModeChange}
        />

        {/* Editable fields */}
        <View style={styles.fieldsSection}>
          <ProfileFields
            bio={profile.bio}
            gender={profile.gender}
            showGender={profile.show_gender}
            hometown={profile.hometown}
            showHometown={profile.show_hometown}
            year={profile.year}
            onUpdate={updateField}
          />
        </View>
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
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  settingsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  fieldsSection: {
    marginTop: 20,
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
