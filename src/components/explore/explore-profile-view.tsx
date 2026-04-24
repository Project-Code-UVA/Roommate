/**
 * Full-screen profile detail view (Hinge/Tinder-inspired).
 *
 * Layout philosophy: photos are interleaved between content sections rather
 * than crammed into a single hero carousel. This is the signature pattern of
 * modern dating/roommate apps — each photo earns its own full-bleed moment,
 * and prompt-style sections (About, Lifestyle, Tags) break up the scroll.
 *
 * Structure:
 *   [Hero photo — name / year / verified / location / match pill overlay]
 *   [Quick stat chips — "Looking for", "Class of"]
 *   [About card (bio)]
 *   [Photo 2 — full-bleed]
 *   [Lifestyle grid — iconified living preferences]
 *   [Photo 3 — full-bleed]
 *   [Habits & tags]
 *   [Remaining photos — full-bleed]
 *   [Floating action bar — pass / message / like]
 *
 * Horizontal swipe on the card still fires like/dismiss (matches Discovery
 * gesture language). Vertical scroll reveals the rest of the profile.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OverflowMenu } from "@/components/shared/overflow-menu";
import { ReportSheet } from "@/components/safety/report-sheet";
import { showBlockConfirmDialog } from "@/components/safety/block-confirm-dialog";
import { blockUser } from "@/services/block-service";
import { submitReport } from "@/services/report-service";
import { useSession } from "@/contexts/auth-context";
import { COLORS } from "@/lib/constants";
import { FILTER_VALUE_LABELS } from "@/constants/filter-options";
import type { DiscoveryProfile, FilterCategory } from "@/types/filters";
import type { OverflowMenuItem } from "@/types/safety";
import type { ReportCategory } from "@/types/chat";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const MAX_ROTATION = 10;
const FLY_OUT_X = SCREEN_WIDTH * 1.5;
const HERO_HEIGHT = Math.min(SCREEN_HEIGHT * 0.62, SCREEN_WIDTH * 1.25);
const PHOTO_CARD_HEIGHT = SCREEN_WIDTH * 1.15;

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const LIFESTYLE_ICONS: Readonly<Record<FilterCategory, IoniconName>> = {
  sleep_schedule: "moon-outline",
  cleanliness: "sparkles-outline",
  guests: "people-outline",
  smoking: "ban-outline",
  budget_range: "cash-outline",
  partying: "wine-outline",
  pets: "paw-outline",
  noise_level: "volume-low-outline",
  study_habits: "book-outline",
  rushing: "ribbon-outline",
  social_energy: "chatbubbles-outline",
};

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

type LifestyleEntry = {
  readonly category: FilterCategory;
  readonly label: string;
  readonly value: string;
  readonly icon: IoniconName;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function prettify(category: FilterCategory, value: string | undefined): string | null {
  if (!value) return null;
  return FILTER_VALUE_LABELS[category]?.[value] ?? value;
}

function buildLifestyle(profile: DiscoveryProfile): LifestyleEntry[] {
  const self = profile.nitty_gritty?.self ?? {};
  const entries: LifestyleEntry[] = [];

  const push = (category: FilterCategory, label: string, raw: string | undefined) => {
    const pretty = prettify(category, raw);
    if (!pretty) return;
    entries.push({ category, label, value: pretty, icon: LIFESTYLE_ICONS[category] });
  };

  push("sleep_schedule", "Sleep", self.sleep_schedule);
  push("cleanliness", "Cleanliness", self.cleanliness);

  if (self.smoking !== undefined) {
    const isNonSmoker =
      self.smoking === "never" || self.smoking === "no" || self.smoking === "false";
    const smokingLabel = isNonSmoker ? "Non-smoker" : prettify("smoking", self.smoking);
    if (smokingLabel) {
      entries.push({
        category: "smoking",
        label: "Smoking",
        value: smokingLabel,
        icon: LIFESTYLE_ICONS.smoking,
      });
    }
  }

  push("guests", "Guests", self.guests);
  push("noise_level", "Noise", self.noise_level);
  push("partying", "Social", self.partying);
  push("pets", "Pets", self.pets);
  push("social_energy", "Energy", self.social_energy);
  push("study_habits", "Study", self.study_habits);

  return entries;
}

function buildTagChips(profile: DiscoveryProfile): string[] {
  const self = profile.nitty_gritty?.self ?? {};
  const chips: string[] = [];
  const sleep = prettify("sleep_schedule", self.sleep_schedule);
  const clean = prettify("cleanliness", self.cleanliness);
  const social = prettify("social_energy", self.social_energy);
  if (sleep) chips.push(sleep);
  if (clean) chips.push(clean);
  if (social) chips.push(social);
  if (profile.year) chips.push(`Class of ${profile.year}`);
  return chips;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PhotoCard({ url }: { readonly url: string }) {
  return (
    <View style={styles.photoCard}>
      <Image source={{ uri: url }} style={styles.photoCardImage} resizeMode="cover" />
    </View>
  );
}

function SectionCard({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function LifestyleCell({ entry }: { readonly entry: LifestyleEntry }) {
  return (
    <View style={styles.lifestyleCell}>
      <View style={styles.lifestyleIconWrap}>
        <Ionicons name={entry.icon} size={18} color={COLORS.primary[600]} />
      </View>
      <View style={styles.lifestyleText}>
        <Text style={styles.lifestyleLabel}>{entry.label}</Text>
        <Text style={styles.lifestyleValue} numberOfLines={1}>
          {entry.value}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ExploreProfileView({
  profile,
  onLike,
  onDismiss,
  onMessage,
  onClose,
  visible,
  onBlock,
}: ExploreProfileViewProps) {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const insets = useSafeAreaInsets();

  const [reportVisible, setReportVisible] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const lifestyleEntries = useMemo(
    () => (profile ? buildLifestyle(profile) : []),
    [profile],
  );
  const tagChips = useMemo(
    () => (profile ? buildTagChips(profile) : []),
    [profile],
  );

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

  const triggerLike = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLike();
    onClose();
  }, [onLike, onClose]);

  const triggerDismiss = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDismiss();
    onClose();
  }, [onDismiss, onClose]);

  const triggerMessage = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMessage();
    onClose();
  }, [onMessage, onClose]);

  // ---------------------------------------------------------------------------
  // Swipe gesture (horizontal pan on hero → like/dismiss)
  // ---------------------------------------------------------------------------

  const translateX = useSharedValue(0);
  const isAnimating = useSharedValue(false);

  useEffect(() => {
    translateX.value = 0;
    isAnimating.value = false;
  }, [profile?.user_id, translateX, isAnimating]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-10, 10])
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
          () => {
            runOnJS(triggerLike)();
          },
        );
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        isAnimating.value = true;
        translateX.value = withSpring(
          -FLY_OUT_X,
          { damping: 20, stiffness: 200, mass: 0.8 },
          () => {
            runOnJS(triggerDismiss)();
          },
        );
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  const cardAnimStyle = useAnimatedStyle(() => {
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

  const likeIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], "clamp"),
  }));

  const passIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], "clamp"),
  }));

  const overflowItems: readonly OverflowMenuItem[] = [
    { label: "Block", icon: "ban-outline", onPress: handleBlock, destructive: true },
    { label: "Report", icon: "flag-outline", onPress: handleReport },
  ];

  if (!profile) return null;

  // ---------------------------------------------------------------------------
  // Derived content
  // ---------------------------------------------------------------------------

  const compatibility = Math.round(profile.rank_score * 100);
  const lookingFor = profile.mode_status === "roommate" ? "Roommate" : "Friends";
  const heroPhoto = profile.photos[0];
  const photo2 = profile.photos[1];
  const photo3 = profile.photos[2];
  const remainingPhotos = profile.photos.slice(3);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.container, cardAnimStyle]}>
          {/* Swipe indicators — LIKE (right) / NOPE (left) */}
          <Animated.View
            style={[styles.likePill, likeIndicatorStyle, { top: insets.top + 80 }]}
            pointerEvents="none"
          >
            <Text style={styles.likePillText}>LIKE</Text>
          </Animated.View>
          <Animated.View
            style={[styles.nopePill, passIndicatorStyle, { top: insets.top + 80 }]}
            pointerEvents="none"
          >
            <Text style={styles.nopePillText}>NOPE</Text>
          </Animated.View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 120 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Hero photo ── */}
            <View style={[styles.hero, { height: HERO_HEIGHT }]}>
              {heroPhoto ? (
                <Image
                  source={{ uri: heroPhoto.url }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.heroPlaceholder]} />
              )}

              {/* Gradient for legibility of overlay text */}
              <LinearGradient
                colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0)", "rgba(0,0,0,0.82)"]}
                locations={[0, 0.35, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              {/* Top controls — back + overflow */}
              <View
                style={[styles.topBar, { paddingTop: insets.top + 8 }]}
                pointerEvents="box-none"
              >
                <Pressable
                  onPress={onClose}
                  style={styles.glassButton}
                  testID="explore-profile-back"
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <Ionicons name="arrow-back" size={22} color="#1f2937" />
                </Pressable>
                <View style={styles.glassButton}>
                  <OverflowMenu items={overflowItems} testIDPrefix="explore-profile" />
                </View>
              </View>

              {/* Hero overlay content — name / verified / location / match */}
              <View style={styles.heroOverlay}>
                {compatibility > 0 ? (
                  <View style={styles.matchBadge}>
                    <LinearGradient
                      colors={[COLORS.primary[500], COLORS.primary[700]]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <Ionicons name="sparkles" size={12} color="#fff" />
                    <Text style={styles.matchBadgeText}>{compatibility}% MATCH</Text>
                  </View>
                ) : null}

                <View style={styles.nameRow}>
                  <Text style={styles.heroName} numberOfLines={1}>
                    {profile.display_name}
                  </Text>
                  {profile.year ? (
                    <Text style={styles.heroYear}>, {profile.year}</Text>
                  ) : null}
                </View>

                <View style={styles.metaRow}>
                  {profile.selfie_verified ? (
                    <View style={styles.verifiedPill}>
                      <Ionicons name="checkmark-circle" size={13} color="#fff" />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  ) : null}
                  {profile.hometown ? (
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={14} color="#fff" />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {profile.hometown}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* ── Stat chips ── */}
            <View style={styles.statRow}>
              <View style={styles.statPill}>
                <Ionicons name="home" size={14} color={COLORS.primary[700]} />
                <Text style={styles.statPillLabel}>Looking for</Text>
                <Text style={styles.statPillValue}>{lookingFor}</Text>
              </View>
              {profile.year ? (
                <View style={styles.statPill}>
                  <Ionicons name="school" size={14} color={COLORS.primary[700]} />
                  <Text style={styles.statPillLabel}>Class of</Text>
                  <Text style={styles.statPillValue}>{profile.year}</Text>
                </View>
              ) : null}
            </View>

            {/* ── About ── */}
            {profile.bio ? (
              <View style={styles.contentBlock}>
                <SectionCard title="About me">
                  <Text style={styles.bio}>{profile.bio}</Text>
                </SectionCard>
              </View>
            ) : null}

            {/* ── Photo 2 ── */}
            {photo2 ? (
              <View style={styles.contentBlock}>
                <PhotoCard url={photo2.url} />
              </View>
            ) : null}

            {/* ── Lifestyle grid ── */}
            {lifestyleEntries.length > 0 ? (
              <View style={styles.contentBlock}>
                <SectionCard title="Living vibes">
                  <View style={styles.lifestyleGrid}>
                    {lifestyleEntries.map((entry) => (
                      <LifestyleCell key={entry.category} entry={entry} />
                    ))}
                  </View>
                </SectionCard>
              </View>
            ) : null}

            {/* ── Photo 3 ── */}
            {photo3 ? (
              <View style={styles.contentBlock}>
                <PhotoCard url={photo3.url} />
              </View>
            ) : null}

            {/* ── Tag chips ── */}
            {tagChips.length > 0 ? (
              <View style={styles.contentBlock}>
                <SectionCard title="At a glance">
                  <View style={styles.tagRow}>
                    {tagChips.map((chip) => (
                      <View key={chip} style={styles.tag}>
                        <Text style={styles.tagText}>{chip}</Text>
                      </View>
                    ))}
                  </View>
                </SectionCard>
              </View>
            ) : null}

            {/* ── Remaining photos ── */}
            {remainingPhotos.map((photo) => (
              <View key={photo.id} style={styles.contentBlock}>
                <PhotoCard url={photo.url} />
              </View>
            ))}
          </ScrollView>

          {/* ── Floating action bar ── */}
          <View
            style={[styles.actionBar, { paddingBottom: insets.bottom + 12 }]}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={triggerDismiss}
              style={[styles.actionButton, styles.passButton]}
              testID="explore-profile-pass"
              accessibilityRole="button"
              accessibilityLabel="Pass"
            >
              <Ionicons name="close" size={28} color="#ef4444" />
            </Pressable>
            <Pressable
              onPress={triggerMessage}
              style={[styles.actionButton, styles.superButton]}
              testID="explore-profile-message"
              accessibilityRole="button"
              accessibilityLabel="Super like"
            >
              <Ionicons name="star" size={24} color="#fff" />
            </Pressable>
            <Pressable
              onPress={triggerLike}
              style={[styles.actionButton, styles.likeButton]}
              testID="explore-profile-like"
              accessibilityRole="button"
              accessibilityLabel="Like"
            >
              <Ionicons name="heart" size={28} color="#22c55e" />
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>

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
    backgroundColor: "#f7f4ff",
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
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroPlaceholder: {
    backgroundColor: COLORS.gray[300],
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  glassButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  heroOverlay: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 24,
  },
  matchBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: COLORS.primary[900],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  matchBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  heroName: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.8,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowRadius: 6,
  },
  heroYear: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 22,
    fontWeight: "600",
    marginLeft: 2,
    marginBottom: 3,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowRadius: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(34, 197, 94, 0.95)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verifiedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  locationText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    flexShrink: 1,
  },

  // ── Stat chip row ──
  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  statPillLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.gray[500],
  },
  statPillValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.gray[900],
  },

  // ── Content blocks ──
  contentBlock: {
    paddingHorizontal: 20,
    marginTop: 14,
  },

  // ── Section cards ──
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  sectionAccent: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: COLORS.primary[500],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.gray[900],
    letterSpacing: -0.3,
  },
  bio: {
    fontSize: 15,
    color: COLORS.gray[700],
    lineHeight: 23,
  },

  // ── Photo cards (interleaved) ──
  photoCard: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: COLORS.gray[200],
    height: PHOTO_CARD_HEIGHT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  photoCardImage: {
    width: "100%",
    height: "100%",
  },

  // ── Lifestyle grid ──
  lifestyleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 2,
  },
  lifestyleCell: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  lifestyleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  lifestyleText: {
    flex: 1,
  },
  lifestyleLabel: {
    fontSize: 11,
    color: COLORS.gray[500],
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  lifestyleValue: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.gray[900],
    marginTop: 1,
  },

  // ── Tag chips ──
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: COLORS.primary[50],
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary[700],
  },

  // ── Floating action bar ──
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    paddingTop: 12,
    backgroundColor: "transparent",
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 8,
  },
  passButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  superButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary[600],
    shadowColor: COLORS.primary[900],
    shadowOpacity: 0.35,
  },
  likeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },

  // ── Swipe indicators ──
  likePill: {
    position: "absolute",
    right: 24,
    backgroundColor: "#22c55e",
    borderWidth: 3,
    borderColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 9,
    transform: [{ rotate: "12deg" }],
    zIndex: 40,
  },
  likePillText: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 1,
  },
  nopePill: {
    position: "absolute",
    left: 24,
    backgroundColor: "#ef4444",
    borderWidth: 3,
    borderColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 9,
    transform: [{ rotate: "-12deg" }],
    zIndex: 40,
  },
  nopePillText: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
