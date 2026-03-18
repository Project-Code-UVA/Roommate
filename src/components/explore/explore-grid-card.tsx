/**
 * Compact grid card for the Explore tab.
 *
 * Shows a profile photo with a gradient overlay at the bottom
 * displaying the user's name and class year. Approximately 1/3
 * screen width in the 3-column grid.
 */

import { LinearGradient } from "expo-linear-gradient";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";

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
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { width: size, height: size * 1.3 }]}
      testID={`explore-card-${profile.user_id}`}
    >
      <Image
        source={{ uri: profile.photo_url }}
        style={styles.image}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.55)"]}
        style={styles.gradient}
      >
        <Text style={styles.name} numberOfLines={1}>
          {profile.display_name}
        </Text>
        {profile.year != null && (
          <Text style={styles.year} numberOfLines={1}>
            {profile.year}
          </Text>
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
    borderRadius: 8,
    margin: 0.5,
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
    paddingHorizontal: 6,
    paddingBottom: 6,
    paddingTop: 24,
  },
  name: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  year: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "400",
    marginTop: 1,
  },
});
