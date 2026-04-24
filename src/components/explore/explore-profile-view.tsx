/**
 * Full profile detail view for Explore tab.
 *
 * Visual parity with Discovery swipe card: the hero uses the same
 * PhotoCarousel component (full-bleed photo + gradient overlay with
 * name, verified badge, location, habit chips, compatibility badge,
 * and bio preview). Scrolling below the fold reveals a modern
 * About section and Hinge-style iconified Lifestyle grid.
 *
 * Swipe left/right still triggers dismiss/like with LIKE/NOPE pills,
 * matching the discovery gesture language.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PhotoCarousel } from "@/components/discovery/photo-carousel";
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
const MAX_ROTATION = 12;
const FLY_OUT_X = SCREEN_WIDTH * 1.5;

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

function getHabitChips(profile: DiscoveryProfile): string[] {
  const self = profile.nitty_gritty?.self ?? {};
  const chips: string[] = [];
  const sleep = prettify("sleep_schedule", self.sleep_schedule);
  const clean = prettify("cleanliness", self.cleanliness);
  if (sleep) chips.push(sleep);
  if (clean) chips.push(clean);
  if (profile.year) chips.push(`Class of ${profile.year}`);
  return chips.slice(0, 3);
}

function buildLifestyle(profile: DiscoveryProfile): LifestyleEntry[] {
  const self = profile.nitty_gritty?.self ?? {};
  const entries: LifestyleEntry[] = [];

  const push = (
    category: FilterCategory,
    label: string,
    raw: string | undefined,
    overrideValue?: string,
  ) => {
    const pretty = overrideValue ?? prettify(category, raw);
    if (!pretty) return;
    entries.push({
      category,
      label,
      value: pretty,
      icon: LIFESTYLE_ICONS[category],
    });
  };

  push("sleep_schedule", "Sleep", self.sleep_schedule);
  push("cleanliness", "Cleanliness", self.cleanliness);
  // Smoking: show friendlier "Non-smoker" for `never` values
  if (self.smoking !== undefined) {
    const smokingLabel =
      self.smoking === "never" || self.smoking === "no" || self.smoking === "false"
        ? "Non-smoker"
        : prettify("smoking", self.smoking);
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

  return entries.slice(0, 6);
}

// ---------------------------------------------------------------------------
// Lifestyle grid cell — icon-first, Hinge-style
// ---------------------------------------------------------------------------

function LifestyleCell({ entry }: { readonly entry: LifestyleEntry }) {
  return (
    <View style={lifestyleStyles.cell}>
      <View style={lifestyleStyles.iconWrap}>
        <Ionicons name={entry.icon} size={18} color={COLORS.primary[600]} />
      </View>
      <View style={lifestyleStyles.cellText}>
        <Text style={lifestyleStyles.label}>{entry.label}</Text>
        <Text style={lifestyleStyles.value} numberOfLines={1}>
          {entry.value}
        </Text>
      </View>
    </View>
  );
}

const lifestyleStyles = StyleSheet.create({
  cell: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  cellText: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: COLORS.gray[500],
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  value: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.gray[900],
    marginTop: 1,
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

  const [reportVisible, setReportVisible] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const habitChips = useMemo(
    () => (profile ? getHabitChips(profile) : []),
    [profile],
  );
  const lifestyleEntries = useMemo(
    () => (profile ? buildLifestyle(profile) : []),
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

  const translateX = useSharedValue(0);
  const isAnimating = useSharedValue(false);

  useEffect(() => {
    translateX.value = 0;
    isAnimating.value = false;
  }, [profile?.user_id, translateX, isAnimating]);

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
        isAnimating.value = true;
        translateX.value = withSpring(
          FLY_OUT_X,
          { damping: 20, stiffness: 200, mass: 0.8 },
          () => { runOnJS(triggerLike)(); },
        );
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        isAnimating.value = true;
        translateX.value = withSpring(
          -FLY_OUT_X,
          { damping: 20, stiffness: 200, mass: 0.8 },
          () => { runOnJS(triggerDismiss)(); },
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
    {
      label: "Block",
      icon: "ban-outline",
      onPress: handleBlock,
      destructive: true,
    },
    { label: "Report", icon: "flag-outline", onPress: handleReport },
  ];

  if (!profile) return null;

  const compatibility = Math.round(profile.rank_score * 100);
  const lookingFor =
    profile.mode_status === "roommate" ? "Roommate" : "Friends";

  const heroHeight = SCREEN_HEIGHT - insets.top - insets.bottom - 20;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.container, cardAnimStyle]}>
          {/* LIKE pill indicator */}
          <Animated.View style={[styles.likePill, likeIndicatorStyle]} pointerEvents="none">
            <Text style={styles.likePillText}>LIKE</Text>
          </Animated.View>
          {/* NOPE pill indicator */}
          <Animated.View style={[styles.nopePill, passIndicatorStyle]} pointerEvents="none">
            <Text style={styles.nopePillText}>NOPE</Text>
          </Animated.View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Hero card — same visual language as Discovery ── */}
            <View style={[styles.hero, { height: heroHeight }]}>
              <PhotoCarousel
                photos={profile.photos}
                displayName={profile.display_name}
                year={profile.year}
                selfieVerified={profile.selfie_verified}
                hometown={profile.hometown}
                profileId={profile.user_id}
                compatibility={compatibility}
                bio={profile.bio}
                habitChips={habitChips}
              />

              <View
                style={[styles.topBar, { paddingTop: insets.top + 8 }]}
                pointerEvents="box-none"
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
                <View style={styles.topBtn}>
                  <OverflowMenu
                    items={overflowItems}
                    testIDPrefix="explore-profile"
                  />
                </View>
              </View>
            </View>

            {/* ── Quick stat pills ── */}
            <View style={styles.statRow}>
              <View style={styles.statPill}>
                <Ionicons name="home-outline" size={14} color={COLORS.primary[700]} />
                <Text style={styles.statPillLabel}>Looking for</Text>
                <Text style={styles.statPillValue}>{lookingFor}</Text>
              </View>
              {profile.year ? (
                <View style={styles.statPill}>
                  <Ionicons name="school-outline" size={14} color={COLORS.primary[700]} />
                  <Text style={styles.statPillLabel}>Class of</Text>
                  <Text style={styles.statPillValue}>{profile.year}</Text>
                </View>
              ) : null}
            </View>

            {/* ── Content ── */}
            <View style={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
              {/* About card */}
              {profile.bio ? (
                <View style={styles.card}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionAccent} />
                    <Text style={styles.sectionTitle}>About</Text>
                  </View>
                  <Text style={styles.bio}>{profile.bio}</Text>
                </View>
              ) : null}

              {/* Lifestyle card */}
              {lifestyleEntries.length > 0 ? (
                <View style={styles.card}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionAccent} />
                    <Text style={styles.sectionTitle}>Lifestyle</Text>
                  </View>
                  <View style={styles.lifestyleGrid}>
                    {lifestyleEntries.map((entry) => (
                      <LifestyleCell key={entry.category} entry={entry} />
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          </ScrollView>
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
    backgroundColor: "#faf7ff",
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
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
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

  // ── Stat pill row ──
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
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

  // ── Content ──
  content: {
    padding: 20,
    paddingTop: 16,
    gap: 14,
  },

  // ── Cards ──
  card: {
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
  lifestyleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 2,
  },

  // ── Swipe indicators ──
  likePill: {
    position: "absolute",
    top: 100,
    right: 20,
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
    top: 100,
    left: 20,
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
