/**
 * Profile header — circular avatar with edit overlay, name, and verified badge.
 *
 * Tap left/right halves of avatar to cycle photos.
 * Camera button opens photo manager.
 */

import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Photo = {
  readonly id: string;
  readonly url: string;
  readonly order_index: number;
};

type ProfileHeaderProps = {
  readonly photos: readonly Photo[];
  readonly displayName: string | null;
  readonly selfieVerified: boolean;
  readonly onEditPhotos: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AVATAR_SIZE = 110;

export function ProfileHeader({
  photos,
  displayName,
  selfieVerified,
  onEditPhotos,
}: ProfileHeaderProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photoCount = photos.length;
  const currentPhoto = photos[photoIndex] ?? null;

  const handleTap = useCallback(
    (tapX: number, containerWidth: number) => {
      if (photoCount <= 1) return;
      const isLeftHalf = tapX < containerWidth / 2;
      setPhotoIndex((prev) => {
        if (isLeftHalf) return prev > 0 ? prev - 1 : photoCount - 1;
        return (prev + 1) % photoCount;
      });
    },
    [photoCount],
  );

  return (
    <View style={styles.container}>
      {/* Circular avatar */}
      <View style={styles.avatarSection}>
        <Pressable
          style={styles.avatarWrap}
          onPress={(e) =>
            handleTap(e.nativeEvent.locationX, AVATAR_SIZE)
          }
        >
          {currentPhoto ? (
            <Image
              source={{ uri: currentPhoto.url }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={40} color={COLORS.gray[300]} />
            </View>
          )}
        </Pressable>

        {/* Camera edit button */}
        <Pressable style={styles.cameraButton} onPress={onEditPhotos}>
          <Ionicons name="camera" size={14} color="#fff" />
        </Pressable>
      </View>

      {/* Photo navigation dots */}
      {photoCount > 1 && (
        <View style={styles.dotsRow}>
          {photos.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === photoIndex ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
      )}

      {/* Name + verified */}
      <View style={styles.nameRow}>
        <Text style={styles.name}>{displayName ?? "Your Name"}</Text>
        {selfieVerified && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={COLORS.primary[500]}
          />
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 20,
    marginBottom: 8,
  },
  avatarSection: {
    position: "relative",
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: COLORS.primary[200],
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  cameraButton: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary[600],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 5,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: COLORS.primary[500],
  },
  dotInactive: {
    backgroundColor: COLORS.gray[300],
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.gray[900],
    letterSpacing: -0.3,
  },
});
