/**
 * Photo carousel for swipe card — fills the full card height.
 *
 * Outer thirds navigate photos (left=prev, right=next, loops).
 * Center third is reserved for double-tap → `onDoubleTap` (e.g. expand profile).
 * Center single-tap is a no-op by design.
 *
 * Gradient overlay at bottom with name, year, verified badge, compatibility
 * badge, location, habit chips, and bio snippet. Photo indicator bars at top.
 */

import { useState, useCallback, useEffect, useRef } from "react";
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
const EDGE_THIRD = SCREEN_WIDTH / 3;
const DOUBLE_TAP_WINDOW_MS = 260;

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
  readonly onDoubleTap?: () => void;
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
  onDoubleTap,
}: PhotoCarouselProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const centerTapTimeRef = useRef(0);

  const photoCount = photos.length;
  const currentPhoto = photos[photoIndex] ?? photos[0] ?? null;

  // Reset index when profile changes
  useEffect(() => {
    setPhotoIndex(0);
  }, [profileId]);

  const navPrev = useCallback(() => {
    if (photoCount <= 1) return;
    setPhotoIndex((prev) => (prev > 0 ? prev - 1 : photoCount - 1));
  }, [photoCount]);

  const navNext = useCallback(() => {
    if (photoCount <= 1) return;
    setPhotoIndex((prev) => (prev + 1) % photoCount);
  }, [photoCount]);

  const handleTap = useCallback(
    (tapX: number) => {
      // Outer thirds → instant photo navigation
      if (tapX < EDGE_THIRD) {
        navPrev();
        return;
      }
      if (tapX > SCREEN_WIDTH - EDGE_THIRD) {
        navNext();
        return;
      }

      // Center third → wait for potential 2nd tap for double-tap-to-expand
      if (!onDoubleTap) return;

      const now = Date.now();
      if (now - centerTapTimeRef.current < DOUBLE_TAP_WINDOW_MS) {
        centerTapTimeRef.current = 0;
        onDoubleTap();
      } else {
        centerTapTimeRef.current = now;
      }
    },
    [navPrev, navNext, onDoubleTap],
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
            <Text style={styles.nameLineText} numberOfLines={2} ellipsizeMode="tail">
              <Text style={styles.nameText}>{displayName}</Text>
              {year ? <Text style={styles.yearText}>, {year}</Text> : null}
            </Text>
            {selfieVerified && (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={COLORS.primary[400]}
                style={styles.verifiedIcon}
              />
            )}
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
    gap: 12,
    marginBottom: 4,
  },
  nameLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  nameLineText: {
    flexShrink: 1,
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
    alignSelf: "center",
  },
  compatBadge: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    flexShrink: 0,
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
