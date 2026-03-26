/**
 * Full profile detail view for Explore tab.
 *
 * Matches the Figma UserDetailPage design:
 * - Hero photo (tap left/right zones to navigate, bar-style dots)
 * - Name, verified badge, location, compatibility % overlaid at bottom of hero
 * - Scrollable content: quick lifestyle tags, About card, Lifestyle grid
 * - Fixed bottom action bar: Dismiss (X) + Like (Heart)
 * - Overflow menu for block/report
 */

import { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OverflowMenu } from "@/components/shared/overflow-menu";
import { ReportSheet } from "@/components/safety/report-sheet";
import { showBlockConfirmDialog } from "@/components/safety/block-confirm-dialog";
import { blockUser } from "@/services/block-service";
import { submitReport } from "@/services/report-service";
import { useSession } from "@/contexts/auth-context";
import { COLORS } from "@/lib/constants";
import type { DiscoveryProfile } from "@/types/filters";
import type { OverflowMenuItem } from "@/types/safety";
import type { ReportCategory } from "@/types/chat";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * 0.58;

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
// Helpers
// ---------------------------------------------------------------------------

function getHabitChips(profile: DiscoveryProfile): string[] {
  const self = profile.nitty_gritty?.self ?? {};
  const chips: string[] = [];
  if (self.sleep_schedule) chips.push(self.sleep_schedule);
  if (self.cleanliness) chips.push(self.cleanliness);
  if (profile.year) chips.push(`Class of ${profile.year}`);
  if (self.pets === "yes" || self.pets === "has pets") chips.push("Pet Friendly");
  return chips.slice(0, 4);
}

function formatLifestyle(profile: DiscoveryProfile): {
  label: string;
  value: string;
}[] {
  const self = profile.nitty_gritty?.self ?? {};
  const rows: { label: string; value: string }[] = [];
  if (self.sleep_schedule) rows.push({ label: "Sleep", value: self.sleep_schedule });
  if (self.cleanliness) rows.push({ label: "Cleanliness", value: self.cleanliness });
  if (self.smoking !== undefined) rows.push({ label: "Smoking", value: self.smoking === "yes" ? "Smoker" : "Non-smoker" });
  if (self.guests) rows.push({ label: "Guests", value: self.guests });
  if (self.noise_level) rows.push({ label: "Noise", value: self.noise_level });
  if (self.partying) rows.push({ label: "Social", value: self.partying });
  return rows.slice(0, 6);
}

// ---------------------------------------------------------------------------
// Photo dots (bar style like Figma)
// ---------------------------------------------------------------------------

function PhotoDots({
  count,
  current,
}: {
  readonly count: number;
  readonly current: number;
}) {
  if (count <= 1) return null;
  return (
    <View style={dotsStyles.row}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[dotsStyles.dot, i === current && dotsStyles.dotActive]}
        />
      ))}
    </View>
  );
}

const dotsStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 16,
  },
  dot: {
    flex: 1,
    maxWidth: 80,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotActive: {
    backgroundColor: "#fff",
  },
});

// ---------------------------------------------------------------------------
// Lifestyle grid cell
// ---------------------------------------------------------------------------

function LifestyleCell({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <View style={lifestyleStyles.cell}>
      <Text style={lifestyleStyles.label}>{label}</Text>
      <Text style={lifestyleStyles.value}>{value}</Text>
    </View>
  );
}

const lifestyleStyles = StyleSheet.create({
  cell: {
    width: "48%",
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: COLORS.gray[400],
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.gray[900],
  },
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ExploreProfileView({
  profile,
  onLike,
  onDismiss,
  onClose,
  visible,
  onBlock,
}: ExploreProfileViewProps) {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const insets = useSafeAreaInsets();

  const [photoIndex, setPhotoIndex] = useState(0);
  const [reportVisible, setReportVisible] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  // Reset photo index when profile changes
  useEffect(() => {
    setPhotoIndex(0);
  }, [profile?.user_id]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

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

  const handleLike = useCallback(() => {
    onLike();
    onClose();
  }, [onLike, onClose]);

  const handleDismiss = useCallback(() => {
    onDismiss();
    onClose();
  }, [onDismiss, onClose]);

  const goNextPhoto = useCallback(() => {
    if (!profile) return;
    setPhotoIndex((i) => Math.min(i + 1, profile.photos.length - 1));
  }, [profile]);

  const goPrevPhoto = useCallback(() => {
    setPhotoIndex((i) => Math.max(i - 1, 0));
  }, []);

  const overflowItems: readonly OverflowMenuItem[] = [
    {
      label: "Block",
      icon: "ban-outline",
      onPress: handleBlock,
      destructive: true,
    },
    { label: "Report", icon: "flag-outline", onPress: handleReport },
  ];

  if (!profile) return null;

  const currentPhoto = profile.photos[photoIndex]?.url ?? profile.photos[0]?.url;
  const compatibility = Math.round(profile.rank_score * 100);
  const habitChips = getHabitChips(profile);
  const lifestyleRows = formatLifestyle(profile);
  const lookingFor =
    profile.mode_status === "roommate" ? "Roommate" : "Friends";

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {/* ── Scrollable body ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ── Hero photo ── */}
          <View style={[styles.hero, { height: HERO_HEIGHT }]}>
            {currentPhoto ? (
              <Image
                source={{ uri: currentPhoto }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.heroImage, styles.heroFallback]}>
                <Ionicons name="person" size={80} color={COLORS.gray[300]} />
              </View>
            )}

            {/* Gradient overlay — strong at bottom, fades to transparent */}
            <LinearGradient
              colors={[
                "rgba(0,0,0,0)",
                "rgba(0,0,0,0.18)",
                "rgba(0,0,0,0.72)",
              ]}
              locations={[0.4, 0.65, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            {/* Top bar */}
            <View
              style={[styles.topBar, { paddingTop: insets.top + 8 }]}
            >
              <Pressable
                onPress={onClose}
                style={styles.topBtn}
                testID="explore-profile-back"
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={20} color="#1f2937" />
              </Pressable>
              <View style={styles.topRight}>
                <View style={styles.topBtn}>
                  <OverflowMenu
                    items={overflowItems}
                    testIDPrefix="explore-profile"
                  />
                </View>
              </View>
            </View>

            {/* Photo dots */}
            <View style={styles.dotsContainer}>
              <PhotoDots
                count={profile.photos.length}
                current={photoIndex}
              />
            </View>

            {/* Tap zones for photo navigation */}
            <Pressable
              style={styles.leftTapZone}
              onPress={goPrevPhoto}
              accessibilityLabel="Previous photo"
            />
            <Pressable
              style={styles.rightTapZone}
              onPress={goNextPhoto}
              accessibilityLabel="Next photo"
            />

            {/* Name + info at bottom of hero */}
            <View style={styles.heroBottom}>
              <View style={styles.heroBottomLeft}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {profile.display_name}
                  </Text>
                  {profile.selfie_verified && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color="#60a5fa"
                    />
                  )}
                </View>
                {profile.hometown ? (
                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color="rgba(255,255,255,0.85)"
                    />
                    <Text style={styles.location}>{profile.hometown}</Text>
                  </View>
                ) : null}
              </View>

              {compatibility > 0 && (
                <LinearGradient
                  colors={[COLORS.primary[500], "#ec4899"]}
                  style={styles.compatBadge}
                >
                  <Text style={styles.compatPct}>{compatibility}%</Text>
                  <Text style={styles.compatLabel}>Match</Text>
                </LinearGradient>
              )}
            </View>
          </View>

          {/* ── Content section ── */}
          <View style={styles.content}>
            {/* Quick lifestyle tags */}
            {habitChips.length > 0 && (
              <View style={styles.tagsRow}>
                {habitChips.map((chip) => (
                  <View key={chip} style={styles.tag}>
                    <Text style={styles.tagText}>{chip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* About card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>About</Text>
              {profile.bio ? (
                <Text style={styles.bio}>{profile.bio}</Text>
              ) : null}
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Looking for</Text>
                <Text style={styles.infoValue}>{lookingFor}</Text>
              </View>
              {profile.year ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Class year</Text>
                  <Text style={styles.infoValue}>{profile.year}</Text>
                </View>
              ) : null}
            </View>

            {/* Lifestyle card */}
            {lifestyleRows.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Lifestyle</Text>
                <View style={styles.lifestyleGrid}>
                  {lifestyleRows.map((row) => (
                    <LifestyleCell
                      key={row.label}
                      label={row.label}
                      value={row.value}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Bottom padding for action bar */}
            <View style={styles.actionBarSpacer} />
          </View>
        </ScrollView>

        {/* ── Fixed action bar ── */}
        <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={handleDismiss}
            style={styles.dismissBtn}
            testID="explore-profile-dismiss"
            accessibilityRole="button"
            accessibilityLabel="Pass"
          >
            <Ionicons name="close" size={32} color="#ef4444" strokeWidth={2.5} />
          </Pressable>

          <Pressable
            onPress={handleLike}
            style={styles.likeBtn}
            testID="explore-profile-like"
            accessibilityRole="button"
            accessibilityLabel="Like"
          >
            <LinearGradient
              colors={[COLORS.primary[500], "#ec4899"]}
              style={styles.likeBtnGradient}
            >
              <Ionicons name="heart" size={36} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
      </View>

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
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ── Hero ──
  hero: {
    position: "relative",
    backgroundColor: COLORS.gray[200],
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  topRight: {
    flexDirection: "row",
    gap: 8,
  },
  dotsContainer: {
    position: "absolute",
    top: 70,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  leftTapZone: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SCREEN_WIDTH * 0.35,
    bottom: 0,
    zIndex: 10,
  },
  rightTapZone: {
    position: "absolute",
    top: 0,
    right: 0,
    width: SCREEN_WIDTH * 0.65,
    bottom: 0,
    zIndex: 10,
  },
  heroBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroBottomLeft: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  compatBadge: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  compatPct: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  compatLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // ── Content ──
  content: {
    padding: 20,
    gap: 16,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: COLORS.primary[100],
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary[700],
  },

  // ── Cards ──
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  bio: {
    fontSize: 15,
    color: COLORS.gray[700],
    lineHeight: 22,
    marginBottom: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.gray[200],
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray[900],
  },
  lifestyleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  // ── Action bar ──
  actionBarSpacer: {
    height: 100,
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.gray[200],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    paddingTop: 14,
  },
  dismissBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  likeBtn: {
    shadowColor: COLORS.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  likeBtnGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
