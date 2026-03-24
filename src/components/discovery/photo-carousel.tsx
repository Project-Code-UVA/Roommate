/**
 * Photo carousel for swipe card — all photos in top section.
 *
 * Tap left/right halves to navigate. Last photo loops to first.
 * Gradient overlay at bottom with name, year, verified badge.
 * Photo indicator bars at top.
 */

import { useState, useCallback, useEffect } from "react";
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

import { PhotoIndicator } from "@/components/discovery/photo-indicator";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CAROUSEL_HEIGHT = SCREEN_HEIGHT * 0.55;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Photo = {
  readonly id: string;
  readonly url: string;
  readonly position: number;
};

type PhotoCarouselProps = {
  readonly photos: readonly Photo[];
  readonly displayName: string;
  readonly year: string | null;
  readonly selfieVerified: boolean;
  readonly hometown: string | null;
  readonly profileId: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PhotoCarousel({
  photos,
  displayName,
  year,
  selfieVerified,
  hometown,
  profileId,
}: PhotoCarouselProps) {
  const [photoIndex, setPhotoIndex] = useState(0);

  const photoCount = photos.length;
  const currentPhoto = photos[photoIndex] ?? photos[0] ?? null;

  // Reset index when profile changes
  useEffect(() => {
    setPhotoIndex(0);
  }, [profileId]);

  const handleTap = useCallback(
    (tapX: number) => {
      if (photoCount <= 1) return;
      const isLeftHalf = tapX < SCREEN_WIDTH / 2;
      setPhotoIndex((prev) => {
        if (isLeftHalf) {
          return prev > 0 ? prev - 1 : photoCount - 1;
        }
        return (prev + 1) % photoCount; // loops back to first
      });
    },
    [photoCount],
  );

  if (!currentPhoto) return null;

  return (
    <Pressable
      style={styles.container}
      onPress={(e) => handleTap(e.nativeEvent.locationX)}
    >
      <Image
        source={{ uri: currentPhoto.url }}
        style={styles.photo}
        resizeMode="cover"
      />

      {/* Photo indicator bars at top */}
      <View style={styles.indicatorWrap}>
        <PhotoIndicator total={photoCount} current={photoIndex} />
      </View>

      {/* Bottom gradient with name overlay */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.75)"]}
        style={styles.gradient}
        pointerEvents="none"
      >
        <View style={styles.nameRow}>
          <Text style={styles.nameText}>{displayName}</Text>
          {year && <Text style={styles.yearText}>, {year}</Text>}
          {selfieVerified && (
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={COLORS.primary[400]}
              style={styles.verifiedIcon}
            />
          )}
        </View>
        {hometown && (
          <View style={styles.hometownRow}>
            <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.hometownText}>{hometown}</Text>
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
  container: {
    height: CAROUSEL_HEIGHT,
    position: "relative",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  indicatorWrap: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  nameText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },
  yearText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 22,
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
});
