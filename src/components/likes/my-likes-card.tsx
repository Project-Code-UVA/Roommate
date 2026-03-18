/**
 * MyLikesCard: Grid card for the My Likes section.
 *
 * Shows photo with name + year gradient overlay.
 * Similar layout to ExploreGridCard.
 */

import { Image, Pressable, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import type { MyLike } from "@/types/explore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MyLikesCardProps = {
  readonly like: MyLike;
  readonly onPress: () => void;
  readonly size: number;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MyLikesCard({ like, onPress, size }: MyLikesCardProps) {
  const label = like.year
    ? `${like.display_name}, ${like.year}`
    : like.display_name;

  return (
    <Pressable
      testID={`my-like-card-${like.user_id}`}
      onPress={onPress}
      style={[styles.container, { width: size, height: size }]}
    >
      <Image
        source={{ uri: like.photo_url }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.6)"]}
        style={styles.gradient}
      >
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </LinearGradient>
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
  label: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
