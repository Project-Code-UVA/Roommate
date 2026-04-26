/**
 * Photo manager — grid with add, delete, and reorder.
 *
 * - Photos render in sorted order_index, packed left-to-right (no gaps).
 * - Tap empty slot → add a photo at the next position.
 * - Tap a photo → select it (purple ring); tap another photo to swap; tap
 *   selected photo again to cancel.
 * - Long-press a photo → delete (subject to MIN_PHOTOS).
 */

import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/lib/constants";
import {
  pickImage,
  uploadPhoto,
  deletePhoto,
  reorderPhotos,
} from "@/services/photo-service";

const MAX_PHOTOS = 9;
const MIN_PHOTOS = 3;
const GRID_COLUMNS = 3;

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

export function PhotoManager({ userId, photos, onPhotosChanged }: PhotoManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  // Always operate on photos sorted by order_index — guarantees a packed grid
  // even if the underlying order_index values have gaps.
  const sortedPhotos = [...photos].sort(
    (a, b) => a.order_index - b.order_index,
  );

  const handleAddPhoto = useCallback(async () => {
    if (sortedPhotos.length >= MAX_PHOTOS) {
      Alert.alert("Maximum photos", `You can have up to ${MAX_PHOTOS} photos.`);
      return;
    }

    const result = await pickImage("gallery", 1);
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    const nextIndex = sortedPhotos.length;
    const uploadResult = await uploadPhoto(userId, result.assets[0].uri, nextIndex);
    setUploading(false);

    if (uploadResult.error) {
      Alert.alert("Upload failed", uploadResult.error);
      return;
    }

    onPhotosChanged();
  }, [userId, sortedPhotos.length, onPhotosChanged]);

  const handleDeletePhoto = useCallback(
    (photo: Photo) => {
      if (sortedPhotos.length <= MIN_PHOTOS) {
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
            const urlParts = photo.url.split("/photos/");
            const filePath = urlParts[1] ?? "";
            await deletePhoto(userId, photo.id, filePath);
            // Repack after delete so order_indexes stay 0..N-1.
            const remainingIds = sortedPhotos
              .filter((p) => p.id !== photo.id)
              .map((p) => p.id);
            await reorderPhotos(userId, remainingIds);
            onPhotosChanged();
          },
        },
      ]);
    },
    [userId, sortedPhotos, onPhotosChanged],
  );

  const handlePhotoPress = useCallback(
    async (photo: Photo) => {
      if (selectedPhotoId === null) {
        setSelectedPhotoId(photo.id);
        return;
      }
      if (selectedPhotoId === photo.id) {
        setSelectedPhotoId(null);
        return;
      }
      // Swap the two photos' positions and persist.
      const reordered = sortedPhotos.map((p) => {
        if (p.id === selectedPhotoId) {
          return sortedPhotos.find((q) => q.id === photo.id)!;
        }
        if (p.id === photo.id) {
          return sortedPhotos.find((q) => q.id === selectedPhotoId)!;
        }
        return p;
      });
      setSelectedPhotoId(null);
      const result = await reorderPhotos(
        userId,
        reordered.map((p) => p.id),
      );
      if (result.error) {
        Alert.alert("Reorder failed", result.error);
        return;
      }
      onPhotosChanged();
    },
    [selectedPhotoId, sortedPhotos, userId, onPhotosChanged],
  );

  // Build grid: filled slots 0..N-1, then empty slots up to MAX_PHOTOS.
  const slots: ReadonlyArray<Photo | null> = Array.from(
    { length: MAX_PHOTOS },
    (_, i) => sortedPhotos[i] ?? null,
  );
  const nextEmptyIndex = sortedPhotos.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Photos</Text>
        <Text style={styles.count}>
          {sortedPhotos.length}/{MAX_PHOTOS} (min {MIN_PHOTOS})
        </Text>
      </View>

      {selectedPhotoId !== null ? (
        <Text style={styles.helperText}>Tap another photo to swap positions.</Text>
      ) : (
        <Text style={styles.helperText}>
          Tap a photo to swap, long-press to delete.
        </Text>
      )}

      <View style={styles.grid}>
        {slots.map((photo, index) => {
          const isSelected = photo !== null && photo.id === selectedPhotoId;
          return (
            <View key={photo?.id ?? `empty-${index}`} style={styles.slot}>
              {photo ? (
                <Pressable
                  style={[styles.photoWrap, isSelected && styles.photoSelected]}
                  onPress={() => handlePhotoPress(photo)}
                  onLongPress={() => handleDeletePhoto(photo)}
                >
                  <Image
                    source={{ uri: photo.url }}
                    style={styles.photo}
                    contentFit="cover"
                  />
                  <View style={styles.indexBadge}>
                    <Text style={styles.indexText}>{index + 1}</Text>
                  </View>
                  {sortedPhotos.length > MIN_PHOTOS && (
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDeletePhoto(photo)}
                      hitSlop={8}
                    >
                      <Ionicons name="close-circle" size={22} color="#ef4444" />
                    </Pressable>
                  )}
                </Pressable>
              ) : (
                <Pressable
                  style={styles.emptySlot}
                  onPress={index === nextEmptyIndex ? handleAddPhoto : undefined}
                  disabled={index !== nextEmptyIndex}
                >
                  {index === nextEmptyIndex ? (
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
          );
        })}
      </View>
    </View>
  );
}

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
  helperText: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 10,
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
  photoSelected: {
    borderWidth: 3,
    borderColor: COLORS.primary[500],
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
