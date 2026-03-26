/**
 * Profile tab — directory hub.
 *
 * Shows avatar + name at top, then grouped directory rows
 * that navigate to dedicated sub-pages for editing.
 */

import { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
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

import { SelfieCapture } from "@/components/verification/selfie-capture";
import { useProfile } from "@/hooks/use-profile";
import { useSession } from "@/contexts/auth-context";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Directory row
// ---------------------------------------------------------------------------

type DirectoryRowProps = {
  readonly iconName: keyof typeof Ionicons.glyphMap;
  readonly iconBg: string;
  readonly label: string;
  readonly detail?: string;
  readonly detailColor?: string;
  readonly onPress: () => void;
  readonly isLast?: boolean;
};

function DirectoryRow({
  iconName,
  iconBg,
  label,
  detail,
  detailColor,
  onPress,
  isLast,
}: DirectoryRowProps) {
  return (
    <>
      <Pressable style={styles.row} onPress={onPress} android_ripple={{ color: COLORS.gray[100] }}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={17} color="#fff" />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
        <View style={styles.rowRight}>
          {detail && (
            <Text style={[styles.rowDetail, detailColor ? { color: detailColor } : undefined]}>
              {detail}
            </Text>
          )}
          <Ionicons name="chevron-forward" size={16} color={COLORS.gray[300]} />
        </View>
      </Pressable>
      {!isLast && <View style={styles.rowSeparator} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>{title}</Text>
      <View style={styles.group}>{children}</View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Mode label helper
// ---------------------------------------------------------------------------

const MODE_LABELS: Record<string, string> = {
  roommate: "Roommate",
  friends: "Friends",
  found_roommate: "Found one!",
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const { session } = useSession();
  const router = useRouter();
  const userId = session?.user.id ?? "";

  const { profile, photos, modeStatus, isLoading, error, selfieVerified, refresh } =
    useProfile(userId);

  const [refreshing, setRefreshing] = useState(false);
  const [showSelfieCapture, setShowSelfieCapture] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const primaryPhoto = photos[0] ?? null;

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
      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable
          onPress={() => router.push("/settings" as never)}
          style={styles.settingsButton}
          testID="settings-button"
        >
          <Ionicons name="settings-outline" size={20} color={COLORS.gray[600]} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            {primaryPhoto ? (
              <Image source={{ uri: primaryPhoto.url }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={40} color={COLORS.gray[300]} />
              </View>
            )}
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.display_name ?? "Your Name"}</Text>
            {selfieVerified && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary[500]} />
            )}
          </View>
          {profile.year && (
            <Text style={styles.yearText}>Class of {profile.year}</Text>
          )}
        </View>

        {/* PROFILE */}
        <Section title="PROFILE">
          <DirectoryRow
            iconName="person-circle-outline"
            iconBg={COLORS.primary[600]}
            label="Edit Profile"
            onPress={() => router.push("/profile/edit" as never)}
          />
          <DirectoryRow
            iconName="images-outline"
            iconBg="#6366f1"
            label="My Photos"
            detail={photos.length > 0 ? `${photos.length} photos` : "Add photos"}
            onPress={() => router.push("/profile/photos" as never)}
            isLast
          />
        </Section>

        {/* DISCOVERY */}
        <Section title="DISCOVERY">
          <DirectoryRow
            iconName="home-outline"
            iconBg="#8b5cf6"
            label="Your Status"
            detail={MODE_LABELS[modeStatus] ?? modeStatus}
            onPress={() => router.push("/profile/status" as never)}
          />
          <DirectoryRow
            iconName="shield-checkmark-outline"
            iconBg={selfieVerified ? "#16a34a" : "#d97706"}
            label="Verification"
            detail={selfieVerified ? "Verified" : "Not verified"}
            detailColor={selfieVerified ? "#16a34a" : "#d97706"}
            onPress={() => setShowSelfieCapture(true)}
            isLast
          />
        </Section>

        {/* ACCOUNT */}
        <Section title="ACCOUNT">
          <DirectoryRow
            iconName="settings-outline"
            iconBg={COLORS.gray[600]}
            label="Settings"
            onPress={() => router.push("/settings" as never)}
            isLast
          />
        </Section>
      </ScrollView>

      {/* Selfie capture modal */}
      <Modal visible={showSelfieCapture} animationType="slide" presentationStyle="fullScreen">
        <SelfieCapture
          userId={userId}
          onComplete={() => {
            setShowSelfieCapture(false);
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
  screen: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },

  // Avatar
  avatarSection: { alignItems: "center", paddingVertical: 24 },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: COLORS.primary[200],
  },
  avatar: { width: "100%", height: "100%" },
  avatarPlaceholder: { backgroundColor: COLORS.gray[100], alignItems: "center", justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  name: { fontSize: 22, fontWeight: "700", color: COLORS.gray[900], letterSpacing: -0.3 },
  yearText: { fontSize: 14, color: COLORS.gray[400], marginTop: 3 },

  // Section
  section: { marginBottom: 8 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.gray[400],
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 4,
    marginTop: 16,
  },
  group: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.gray[200],
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: "#fff",
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: "500", color: COLORS.gray[900] },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowDetail: { fontSize: 14, color: COLORS.gray[400] },
  rowSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.gray[200],
    marginLeft: 60,
  },

  // Error
  errorText: { color: "#f87171", fontSize: 16, textAlign: "center", marginBottom: 16 },
  retryButton: { backgroundColor: COLORS.primary[600], borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 },
  retryText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
