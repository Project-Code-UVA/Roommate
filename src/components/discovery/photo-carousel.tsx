/**
 * Photo carousel for swipe card — fills the full card height.
 *
 * Tap left/right halves to navigate. Last photo loops to first.
 * Gradient overlay at bottom with name, year, verified badge,
 * compatibility badge, location, habit chips, and bio snippet.
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  readonly compatibility?: number;
  readonly bio?: string | null;
  readonly habitChips?: readonly string[];
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
  compatibility,
  bio,
  habitChips,
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
        return (prev + 1) % photoCount;
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

      {/* Bottom gradient overlay with profile info */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.88)"]}
        style={styles.gradient}
        pointerEvents="none"
      >
        {/* Name row + compatibility badge */}
        <View style={styles.nameRow}>
          <View style={styles.nameLeft}>
            <View style={styles.nameLine}>
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
          </View>
          {compatibility !== undefined && (
            <LinearGradient
              colors={["#a855f7", "#ec4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.compatBadge}
            >
              <Text style={styles.compatPct}>{compatibility}%</Text>
              <Text style={styles.compatMatchLabel}>Match</Text>
            </LinearGradient>
          )}
        </View>

        {/* Location */}
        {hometown ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.locationText}>{hometown}</Text>
          </View>
        ) : null}

        {/* Quick habit chips */}
        {habitChips && habitChips.length > 0 ? (
          <View style={styles.chipsRow}>
            {habitChips.map((chip, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipText}>{chip}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Bio snippet */}
        {bio ? (
          <Text style={styles.bioText} numberOfLines={2}>
            {bio}
          </Text>
        ) : null}
      </LinearGradient>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  indicatorWrap: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    zIndex: 10,
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 120,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  nameLeft: {
    flex: 1,
    marginRight: 12,
  },
  nameLine: {
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
  compatBadge: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
  },
  compatPct: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  compatMatchLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  locationText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
  bioText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 20,
  },
});
