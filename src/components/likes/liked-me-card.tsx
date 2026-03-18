/**
 * LikedMeCard: Card for the Liked Me grid section.
 *
 * Free users: Blurred photo with no identifying info. Tap triggers upgrade.
 * Paid users: Full photo + name overlay. Tap triggers selection.
 */

import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import type { LikedMeProfile } from "@/types/explore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LikedMeCardProps = {
  readonly profile: LikedMeProfile;
  readonly isPaid: boolean;
  readonly onUpgrade: () => void;
  readonly onSelect: (profile: LikedMeProfile) => void;
  readonly size: number;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LikedMeCard({
  profile,
  isPaid,
  onUpgrade,
  onSelect,
  size,
}: LikedMeCardProps) {
  const handlePress = () => {
    if (isPaid) {
      onSelect(profile);
    } else {
      onUpgrade();
    }
  };

  return (
    <Pressable
      testID={`liked-me-card-${profile.user_id}`}
      onPress={handlePress}
      style={[styles.container, { width: size, height: size }]}
    >
      <Image
        source={{ uri: profile.photo_url }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {!isPaid && (
        <BlurView
          testID="blur-overlay"
          intensity={60}
          tint="light"
          style={StyleSheet.absoluteFill}
        />
      )}

      {isPaid && profile.display_name && (
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.6)"]}
          style={styles.gradient}
        >
          <Text style={styles.name} numberOfLines={1}>
            {profile.display_name}
          </Text>
        </LinearGradient>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: 24,
  },
  name: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
