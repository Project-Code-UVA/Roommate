/**
 * Profile header — user's photo carousel with name and verified badge.
 *
 * Shows primary photo with navigation dots. Tap to cycle through photos.
 */

import { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Dimensions,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HEADER_HEIGHT = 320;

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
    (tapX: number) => {
      if (photoCount <= 1) return;
      const isLeftHalf = tapX < SCREEN_WIDTH / 2;
      setPhotoIndex((prev) => {
        if (isLeftHalf) {
          return prev > 0 ? prev - 1 : photoCount - 1;
        }
        return (prev + 1) % photoCount;
      });
    },
    [photoCount],
  );

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.photoWrap}
        onPress={(e) => handleTap(e.nativeEvent.locationX)}
      >
        {currentPhoto ? (
          <Image
            source={{ uri: currentPhoto.url }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.photo, styles.placeholder]}>
            <Ionicons name="person" size={64} color={COLORS.gray[300]} />
          </View>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.6)"]}
          style={styles.gradient}
          pointerEvents="none"
        >
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>{displayName ?? "Your Name"}</Text>
            {selfieVerified && (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={COLORS.primary[400]}
                style={styles.verifiedIcon}
              />
            )}
          </View>
        </LinearGradient>

        {/* Photo dots */}
        {photoCount > 1 && (
          <View style={styles.dotsRow}>
            {photos.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === photoIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        )}
      </Pressable>

      {/* Edit photos button */}
      <Pressable style={styles.editButton} onPress={onEditPhotos}>
        <Ionicons name="camera-outline" size={20} color={COLORS.primary[600]} />
        <Text style={styles.editText}>Edit Photos</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  photoWrap: {
    height: HEADER_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    backgroundColor: COLORS.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
  },
  verifiedIcon: {
    marginLeft: 8,
  },
  dotsRow: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: "#fff",
  },
  dotInactive: {
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary[50],
    borderRadius: 12,
    alignSelf: "center",
  },
  editText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary[600],
  },
});
