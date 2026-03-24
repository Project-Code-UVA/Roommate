/**
 * Photo manager — grid with add/delete/reorder.
 *
 * Shows numbered positions (1-9), min 3 enforced.
 * Tap empty slot to add, long-press to delete (if > 3 photos).
 */

import { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/lib/constants";
import { pickImage, uploadPhoto, deletePhoto } from "@/services/photo-service";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_PHOTOS = 9;
const MIN_PHOTOS = 3;
const GRID_COLUMNS = 3;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Photo = {
  readonly id: string;
  readonly url: string;
  readonly order_index: number;
};

type PhotoManagerProps = {
  readonly userId: string;
  readonly photos: readonly Photo[];
  readonly onPhotosChanged: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PhotoManager({ userId, photos, onPhotosChanged }: PhotoManagerProps) {
  const [uploading, setUploading] = useState(false);

  const handleAddPhoto = useCallback(async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert("Maximum photos", `You can have up to ${MAX_PHOTOS} photos.`);
      return;
    }

    const result = await pickImage("gallery", 1);
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    const nextIndex = photos.length;
    const uploadResult = await uploadPhoto(userId, result.assets[0].uri, nextIndex);
    setUploading(false);

    if (uploadResult.error) {
      Alert.alert("Upload failed", uploadResult.error);
      return;
    }

    onPhotosChanged();
  }, [userId, photos.length, onPhotosChanged]);

  const handleDeletePhoto = useCallback(
    (photo: Photo) => {
      if (photos.length <= MIN_PHOTOS) {
        Alert.alert(
          "Minimum photos required",
          `You must have at least ${MIN_PHOTOS} photos.`,
        );
        return;
      }

      Alert.alert("Delete photo?", "This action cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Extract file path from URL
            const urlParts = photo.url.split("/photos/");
            const filePath = urlParts[1] ?? "";
            await deletePhoto(userId, photo.id, filePath);
            onPhotosChanged();
          },
        },
      ]);
    },
    [userId, photos.length, onPhotosChanged],
  );

  // Build grid slots
  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => {
    return photos.find((p) => p.order_index === i) ?? null;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Photos</Text>
        <Text style={styles.count}>
          {photos.length}/{MAX_PHOTOS} (min {MIN_PHOTOS})
        </Text>
      </View>

      <View style={styles.grid}>
        {slots.map((photo, index) => (
          <View key={index} style={styles.slot}>
            {photo ? (
              <Pressable
                style={styles.photoWrap}
                onLongPress={() => handleDeletePhoto(photo)}
              >
                <Image source={{ uri: photo.url }} style={styles.photo} resizeMode="cover" />
                <View style={styles.indexBadge}>
                  <Text style={styles.indexText}>{index + 1}</Text>
                </View>
                {photos.length > MIN_PHOTOS && (
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleDeletePhoto(photo)}
                  >
                    <Ionicons name="close-circle" size={22} color="#ef4444" />
                  </Pressable>
                )}
              </Pressable>
            ) : (
              <Pressable
                style={styles.emptySlot}
                onPress={index === photos.length ? handleAddPhoto : undefined}
                disabled={index !== photos.length}
              >
                {index === photos.length ? (
                  uploading ? (
                    <ActivityIndicator size="small" color={COLORS.primary[500]} />
                  ) : (
                    <Ionicons name="add" size={32} color={COLORS.primary[400]} />
                  )
                ) : (
                  <Text style={styles.slotNumber}>{index + 1}</Text>
                )}
              </Pressable>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray[500],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  count: {
    fontSize: 13,
    color: COLORS.gray[400],
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slot: {
    width: `${100 / GRID_COLUMNS - 2}%`,
    aspectRatio: 0.75,
  },
  photoWrap: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  indexBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  indexText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  deleteButton: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  emptySlot: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.gray[50],
  },
  slotNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray[300],
  },
});
