/**
 * Compact grid card for the Explore tab.
 *
 * Shows a profile photo with a gradient overlay at the bottom
 * displaying the user's name, verified badge, and class year.
 * Sized for the 2-column grid.
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
        colors={["transparent", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.78)"]}
        locations={[0.45, 0.7, 1]}
        style={styles.gradient}
      >
        <View style={styles.nameRow}>
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
    paddingTop: 48,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  name: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  year: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "400",
    marginTop: 2,
  },
});
