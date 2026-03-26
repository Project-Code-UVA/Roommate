/**
 * Compact grid card for the Explore tab.
 *
 * Shows a profile photo with a gradient overlay at the bottom
 * displaying the user's name, verified badge, class year, location,
 * and match percentage pill. Sized for the 2-column grid.
 */

import { LinearGradient } from "expo-linear-gradient";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { ExploreProfile } from "@/types/explore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExploreGridCardProps = {
  readonly profile: ExploreProfile;
  readonly onPress: () => void;
  readonly size: number;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ExploreGridCard({ profile, onPress, size }: ExploreGridCardProps) {
  const score = profile.match_score;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { width: size, height: size * 1.4 }]}
      testID={`explore-card-${profile.user_id}`}
    >
      <Image
        source={{ uri: profile.photo_url }}
        style={styles.image}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.75)"]}
        locations={[0.4, 0.65, 1]}
        style={styles.gradient}
      >
        {/* Name row + match badge */}
        <View style={styles.nameRow}>
          <View style={styles.nameLeft}>
            <Text style={styles.name} numberOfLines={1}>
              {profile.display_name}
            </Text>
            {profile.selfie_verified && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="#60a5fa"
                testID={`explore-card-verified-${profile.user_id}`}
                accessibilityLabel="Verified"
              />
            )}
          </View>
          {score != null && (
            <LinearGradient
              colors={["#8b5cf6", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.scoreBadge}
            >
              <Text style={styles.scoreText}>{score}%</Text>
            </LinearGradient>
          )}
        </View>

        {/* Year */}
        {profile.year != null && (
          <Text style={styles.year} numberOfLines={1}>
            {profile.year}
          </Text>
        )}

        {/* Location */}
        {profile.hometown != null && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.7)" />
            <Text style={styles.location} numberOfLines={1}>
              {profile.hometown}
            </Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 12,
    paddingTop: 52,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  nameLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 1,
  },
  scoreBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  scoreText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  year: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "400",
    marginTop: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  location: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    flex: 1,
  },
});
