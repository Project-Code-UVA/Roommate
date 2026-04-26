/**
 * LikedMeCard: Card for the Liked Me grid section.
 *
 * Free users: Blurred photo with no identifying info. Tap triggers upgrade.
 * Paid users: Full photo + name overlay. Tap triggers selection.
 */

import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
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
  /** Card width (px). */
  readonly size: number;
  /** Card height; defaults to `size` (square). */
  readonly height?: number;
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
  height: heightProp,
}: LikedMeCardProps) {
  const height = heightProp ?? size;
  const handlePress = () => {
    if (isPaid) {
      onSelect(profile);
    } else {
      onUpgrade();
    }
  };

  const hasPhoto = Boolean(profile.photo_url?.trim());

  return (
    <Pressable
      testID={`liked-me-card-${profile.user_id}`}
      onPress={handlePress}
      style={[styles.container, { width: size, height }]}
    >
      {hasPhoto ? (
        <Image
          source={{ uri: profile.photo_url }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.photoFallback]} />
      )}

      {!isPaid && (
        <BlurView
          testID="blur-overlay"
          intensity={76}
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
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
  },
  photoFallback: {
    backgroundColor: "#d1d5db",
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
