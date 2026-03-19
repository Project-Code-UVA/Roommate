/**
 * Hinge-style scrollable profile card.
 *
 * Layout:
 * 1. Photo carousel (top 3 photos, tap left/right to cycle) with indicator bars
 * 2. Compatibility score + mode status
 * 3. Bio card
 * 4. Living preferences (detailed habits grid)
 * 5. Roommate preferences card (what they want)
 * 6. Dealbreakers card
 * 7. Remaining photos (4+)
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PhotoIndicator } from "@/components/discovery/photo-indicator";
import { ProfileSection } from "@/components/discovery/profile-section";
import { COLORS } from "@/lib/constants";
import type { DiscoveryProfile, FilterCategory } from "@/types/filters";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * 0.6;
const PHOTO_HEIGHT = SCREEN_HEIGHT * 0.45;
const MAX_CAROUSEL_PHOTOS = 3;

const CATEGORY_LABELS: Record<FilterCategory, string> = {
  sleep_schedule: "Sleep Schedule",
  cleanliness: "Cleanliness",
  guests: "Guests",
  smoking: "Smoking",
  budget_range: "Budget",
  partying: "Partying",
  pets: "Pets",
  noise_level: "Noise Level",
  study_habits: "Study Habits",
};

const CATEGORY_ICONS: Record<FilterCategory, keyof typeof Ionicons.glyphMap> = {
  sleep_schedule: "moon-outline",
  cleanliness: "sparkles-outline",
  guests: "people-outline",
  smoking: "ban-outline",
  budget_range: "wallet-outline",
  partying: "musical-notes-outline",
  pets: "paw-outline",
  noise_level: "volume-medium-outline",
  study_habits: "book-outline",
};

const CATEGORY_EMOJI: Record<FilterCategory, string> = {
  sleep_schedule: "🌙",
  cleanliness: "✨",
  guests: "👥",
  smoking: "🚭",
  budget_range: "💰",
  partying: "🎉",
  pets: "🐾",
  noise_level: "🔊",
  study_habits: "📚",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProfileCardProps = {
  readonly profile: DiscoveryProfile;
  readonly onProfileTap?: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileCard({ profile, onProfileTap }: ProfileCardProps) {
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const [photoIndex, setPhotoIndex] = useState(0);

  const photos = profile.photos ?? [];
  const carouselPhotos = photos.slice(0, MAX_CAROUSEL_PHOTOS);
  const remainingPhotos = photos.slice(MAX_CAROUSEL_PHOTOS);
  const carouselCount = carouselPhotos.length;
  const currentPhoto = carouselPhotos[photoIndex] ?? carouselPhotos[0] ?? null;

  const selfEntries = profile.nitty_gritty?.self
    ? (Object.entries(profile.nitty_gritty.self) as [FilterCategory, string][])
    : [];

  const prefEntries = profile.nitty_gritty?.preferences
    ? (Object.entries(profile.nitty_gritty.preferences) as [FilterCategory, readonly string[]][])
    : [];

  const dealEntries = profile.nitty_gritty?.dealbreakers
    ? (Object.entries(profile.nitty_gritty.dealbreakers) as [FilterCategory, readonly string[]][])
    : [];

  const matchPercent = Math.round(profile.rank_score * 100);

  // Reset scroll and photo index when profile changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setPhotoIndex(0);
  }, [profile.user_id]);

  // Photo carousel tap handler
  const handlePhotoTap = useCallback(
    (tapX: number) => {
      if (carouselCount <= 1) return;
      const isLeftHalf = tapX < SCREEN_WIDTH / 2;
      setPhotoIndex((prev) => {
        if (isLeftHalf) {
          return prev > 0 ? prev - 1 : carouselCount - 1;
        }
        return (prev + 1) % carouselCount;
      });
    },
    [carouselCount],
  );

  if (!currentPhoto) return null;

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces
    >
      {/* 1. Photo carousel */}
      <Pressable
        style={styles.heroContainer}
        onPress={(e) => handlePhotoTap(e.nativeEvent.locationX)}
      >
        <Image
          source={{ uri: currentPhoto.url }}
          style={styles.heroPhoto}
          resizeMode="cover"
        />

        {/* Photo indicator bars — below notch / Dynamic Island */}
        <View style={[styles.indicatorContainer, { paddingTop: insets.top }]}>
          <PhotoIndicator total={carouselCount} current={photoIndex} />
        </View>

        {/* Bottom gradient with name overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.75)"]}
          style={styles.heroGradient}
          pointerEvents="box-none"
        >
          <Pressable onPress={onProfileTap} disabled={!onProfileTap}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{profile.display_name}</Text>
              {profile.year && (
                <Text style={styles.yearText}>, {profile.year}</Text>
              )}
              {profile.selfie_verified && (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={COLORS.primary[400]}
                  style={styles.verifiedIcon}
                />
              )}
            </View>
            {profile.hometown && (
              <View style={styles.hometownRow}>
                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.hometownText}>{profile.hometown}</Text>
              </View>
            )}
          </Pressable>
        </LinearGradient>
      </Pressable>

      {/* Content cards interleaved with remaining photos.
       * Order: compat → bio → photo → habits → photo → prefs → photo → deals → ...
       * Photos are pulled from remainingPhotos as available. */}
      {(() => {
        let photoIdx = 0;

        const nextPhoto = () => {
          if (photoIdx >= remainingPhotos.length) return null;
          const photo = remainingPhotos[photoIdx];
          photoIdx += 1;
          return (
            <View key={photo.id} style={styles.photoContainer}>
              <Image
                source={{ uri: photo.url }}
                style={styles.photo}
                resizeMode="cover"
              />
            </View>
          );
        };

        // Build ordered list of cards, inserting photos between each
        const sections: React.ReactNode[] = [];

        // Compatibility card
        sections.push(
          <View key="compat" style={styles.compatCard}>
            <View style={styles.compatLeft}>
              <View style={styles.compatRing}>
                <Text style={styles.compatPercent}>{matchPercent}%</Text>
              </View>
              <Text style={styles.compatLabel}>Compatible</Text>
            </View>
            <View style={styles.compatRight}>
              <View style={styles.modePill}>
                <Ionicons
                  name={profile.mode_status === "roommate" ? "home" : "people"}
                  size={15}
                  color={COLORS.primary[600]}
                />
                <Text style={styles.modeText}>
                  {profile.mode_status === "roommate"
                    ? "Looking for roommate"
                    : "Looking for friends"}
                </Text>
              </View>
              {profile.completion_score >= 0.8 && (
                <View style={styles.completeBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#059669" />
                  <Text style={styles.completeText}>Complete profile</Text>
                </View>
              )}
            </View>
          </View>,
        );

        // Bio
        if (profile.bio) {
          sections.push(
            <ProfileSection key="bio" title="About me" icon="chatbubble-outline" iconColor={COLORS.primary[500]}>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </ProfileSection>,
          );
        }

        // Photo break
        const p1 = nextPhoto();
        if (p1) sections.push(p1);

        // Habits
        if (selfEntries.length > 0) {
          sections.push(
            <ProfileSection key="habits" title="Their habits" icon="home-outline" iconColor={COLORS.primary[500]}>
              <View style={styles.habitsGrid}>
                {selfEntries.map(([category, value]) => (
                  <View key={category} style={styles.habitChip}>
                    <Text style={styles.habitEmoji}>{CATEGORY_EMOJI[category]}</Text>
                    <View style={styles.habitTextWrap}>
                      <Text style={styles.habitLabel}>{CATEGORY_LABELS[category]}</Text>
                      <Text style={styles.habitValue}>{value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ProfileSection>,
          );
        }

        // Photo break
        const p2 = nextPhoto();
        if (p2) sections.push(p2);

        // Preferences
        if (prefEntries.length > 0) {
          sections.push(
            <ProfileSection key="prefs" title="Looking for" icon="search-outline" iconColor={COLORS.primary[500]}>
              <View style={styles.prefsList}>
                {prefEntries.map(([category, values]) => (
                  <View key={category} style={styles.prefRow}>
                    <Ionicons
                      name={CATEGORY_ICONS[category]}
                      size={16}
                      color={COLORS.primary[400]}
                    />
                    <Text style={styles.prefCategory}>{CATEGORY_LABELS[category]}:</Text>
                    <Text style={styles.prefValues}>{values.join(", ")}</Text>
                  </View>
                ))}
              </View>
            </ProfileSection>,
          );
        }

        // Photo break
        const p3 = nextPhoto();
        if (p3) sections.push(p3);

        // Dealbreakers
        if (dealEntries.length > 0) {
          sections.push(
            <ProfileSection key="deals" title="Dealbreakers" icon="warning-outline" iconColor="#ef4444">
              <View style={styles.dealList}>
                {dealEntries.map(([category, values]) => (
                  <View key={category} style={styles.dealRow}>
                    <View style={styles.dealDot} />
                    <Text style={styles.dealText}>
                      {CATEGORY_LABELS[category]}: {values.join(", ")}
                    </Text>
                  </View>
                ))}
              </View>
            </ProfileSection>,
          );
        }

        // Any leftover photos after all cards
        let extra = nextPhoto();
        while (extra) {
          sections.push(extra);
          extra = nextPhoto();
        }

        return sections;
      })()}

      {/* Bottom spacer for floating buttons */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Hero photo carousel
  heroContainer: {
    height: HERO_HEIGHT,
    position: "relative",
  },
  heroPhoto: {
    width: "100%",
    height: "100%",
  },
  indicatorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  nameText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
  },
  yearText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 24,
    fontWeight: "400",
  },
  verifiedIcon: {
    marginLeft: 8,
  },
  hometownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  hometownText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  // Compatibility card
  compatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 12,
    marginTop: 10,
    padding: 16,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  compatLeft: {
    alignItems: "center",
    gap: 4,
  },
  compatRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: COLORS.primary[400],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary[50],
  },
  compatPercent: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary[600],
  },
  compatLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary[400],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  compatRight: {
    flex: 1,
    gap: 8,
  },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  modeText: {
    fontSize: 13,
    color: COLORS.primary[600],
    fontWeight: "600",
  },
  completeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  completeText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
  },
  // Bio
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#1f2937",
  },
  // Habits grid (self)
  habitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  habitChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: "45%",
    flex: 1,
  },
  habitEmoji: {
    fontSize: 20,
  },
  habitTextWrap: {
    flex: 1,
  },
  habitLabel: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "500",
  },
  habitValue: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "600",
    marginTop: 1,
  },
  // Preferences (looking for)
  prefsList: {
    gap: 10,
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  prefCategory: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
  },
  prefValues: {
    fontSize: 14,
    color: "#1f2937",
    flex: 1,
  },
  // Dealbreakers
  dealList: {
    gap: 8,
  },
  dealRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dealDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ef4444",
  },
  dealText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  // Remaining photos
  photoContainer: {
    height: PHOTO_HEIGHT,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 16,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  // Bottom spacer
  bottomSpacer: {
    height: 90,
  },
});
