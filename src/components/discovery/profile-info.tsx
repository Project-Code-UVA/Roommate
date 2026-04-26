/**
 * Profile info sections below the photo carousel in swipe cards.
 *
 * Displays: compatibility, mode badge, bio, habits, preferences.
 * Extracted from the old profile-card.tsx for use in the swipe card layout.
 */

import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/lib/constants";
import type { DiscoveryProfile, FilterCategory } from "@/types/filters";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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
  rushing: "Rushing",
  social_energy: "Introvert / Extrovert",
  looking_for: "Looking For",

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
  rushing: "🏛️",
  social_energy: "🗣️",
  looking_for: "🔍",

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
  rushing: "ribbon-outline",
  social_energy: "people-circle-outline",
  looking_for: "search-outline",

};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProfileInfoProps = {
  readonly profile: DiscoveryProfile;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileInfo({ profile }: ProfileInfoProps) {
  const matchPercent = Math.round(profile.rank_score * 100);

  const selfEntries = profile.nitty_gritty?.self
    ? (Object.entries(profile.nitty_gritty.self) as [FilterCategory, string][])
    : [];

  const prefEntries = profile.nitty_gritty?.preferences
    ? (Object.entries(profile.nitty_gritty.preferences) as [FilterCategory, readonly string[]][])
    : [];

  return (
    <View style={styles.container}>
      {/* Compatibility + mode */}
      <View style={styles.compatCard}>
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
      </View>

      {/* Bio */}
      {profile.bio ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary[500]} />
            <Text style={styles.sectionTitle}>About me</Text>
          </View>
          <Text style={styles.bioText}>{profile.bio}</Text>
        </View>
      ) : null}

      {/* Habits */}
      {selfEntries.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="home-outline" size={18} color={COLORS.primary[500]} />
            <Text style={styles.sectionTitle}>Their habits</Text>
          </View>
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
        </View>
      )}

      {/* Preferences */}
      {prefEntries.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="search-outline" size={18} color={COLORS.primary[500]} />
            <Text style={styles.sectionTitle}>Looking for</Text>
          </View>
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
        </View>
      )}

    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 10,
  },
  // Section card
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Compatibility
  compatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
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
  // Habits
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
  // Preferences
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
});
