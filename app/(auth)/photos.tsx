/**
 * Photo upload onboarding step.
 *
 * Users must upload at least 3 photos to proceed. First photo becomes
 * the profile photo. Supports camera/gallery selection, drag-to-reorder,
 * and deletion. Photos are uploaded to Supabase Storage via base64 pattern.
 */

import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import { StepContainer } from "@/components/onboarding/step-container";
import { PhotoGrid, type PhotoSlot } from "@/components/onboarding/photo-grid";
import { useSession } from "@/contexts/auth-context";
import { useOnboarding } from "@/hooks/use-onboarding";
import { COLORS } from "@/lib/constants";
import {
  deletePhoto,
  pickImage,
  reorderPhotos,
  uploadPhoto,
} from "@/services/photo-service";
import { supabase } from "@/lib/supabase";

const MIN_PHOTOS = 3;

export default function PhotosScreen() {
  const { session } = useSession();
  const { saveProgress } = useOnboarding();

  const [photos, setPhotos] = useState<readonly PhotoSlot[]>([null, null, null]);
  const [uploading, setUploading] = useState<ReadonlySet<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const filledCount = photos.filter((p) => p !== null).length;
  const canContinue = filledCount >= MIN_PHOTOS && uploading.size === 0 && !isSaving;

  // Load existing photos on mount
  useEffect(() => {
    let mounted = true;

    async function loadExistingPhotos() {
      if (!session?.user.id) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("photos")
        .select("id, url, order_index")
        .eq("user_id", session.user.id)
        .order("order_index", { ascending: true });

      if (!mounted) return;

      if (!error && data && data.length > 0) {
        const existingSlots: PhotoSlot[] = data.map((photo) => ({
          id: photo.id,
          uri: photo.url,
          uploaded: true,
        }));

        // Pad to at least MIN_PHOTOS slots
        while (existingSlots.length < MIN_PHOTOS) {
          existingSlots.push(null);
        }

        setPhotos(existingSlots);
      }

      setIsLoading(false);
    }

    loadExistingPhotos();

    return () => {
      mounted = false;
    };
  }, [session?.user.id]);

  const showImageSourcePicker = useCallback(
    (slotIndex: number) => {
      Alert.alert("Add Photo", "Choose a source", [
        {
          text: "Take Photo",
          onPress: () => handlePickImage("camera", slotIndex),
        },
        {
          text: "Choose from Library",
          onPress: () => handlePickImage("gallery", slotIndex),
        },
        { text: "Cancel", style: "cancel" },
      ]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.user.id, photos],
  );

  const handlePickImage = useCallback(
    async (source: "camera" | "gallery", slotIndex: number) => {
      if (!session?.user.id) return;

      const result = await pickImage(source);

      if (result.canceled || !result.assets?.[0]) return;

      const uri = result.assets[0].uri;

      // Mark slot as uploading
      setUploading((prev) => new Set([...prev, slotIndex]));

      // Set local preview immediately
      const previewSlot: PhotoSlot = {
        id: `temp-${Date.now()}`,
        uri,
        uploaded: false,
      };

      setPhotos((prev) => {
        const updated = [...prev];
        updated[slotIndex] = previewSlot;
        return updated;
      });

      const { url, error } = await uploadPhoto(
        session.user.id,
        uri,
        slotIndex,
      );

      if (error) {
        // Revert on error
        setPhotos((prev) => {
          const updated = [...prev];
          updated[slotIndex] = null;
          return updated;
        });
        setUploading((prev) => {
          const next = new Set(prev);
          next.delete(slotIndex);
          return next;
        });
        Alert.alert("Upload Failed", error);
        return;
      }

      // Fetch the inserted photo record to get its ID
      const { data: photoRecord } = await supabase
        .from("photos")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("url", url)
        .single();

      setPhotos((prev) => {
        const updated = [...prev];
        updated[slotIndex] = {
          id: photoRecord?.id ?? `photo-${Date.now()}`,
          uri: url,
          uploaded: true,
        };
        return updated;
      });

      setUploading((prev) => {
        const next = new Set(prev);
        next.delete(slotIndex);
        return next;
      });
    },
    [session?.user.id],
  );

  const handleAdd = useCallback(
    (index: number) => {
      // If index is beyond current array length, expand the array
      if (index >= photos.length) {
        setPhotos((prev) => [...prev, null]);
        // Trigger source picker on next tick so new slot is rendered
        setTimeout(() => showImageSourcePicker(index), 100);
        return;
      }
      showImageSourcePicker(index);
    },
    [photos.length, showImageSourcePicker],
  );

  const handleRemove = useCallback(
    async (index: number) => {
      if (!session?.user.id) return;

      const photo = photos[index];
      if (!photo) return;

      // Extract file path from URL for storage deletion
      const urlParts = photo.uri.split("/photos/");
      const filePath = urlParts.length > 1 ? urlParts[urlParts.length - 1] : "";

      const { error } = await deletePhoto(session.user.id, photo.id, filePath);

      if (error) {
        Alert.alert("Delete Failed", error);
        return;
      }

      // Remove the photo and compact (no gaps)
      setPhotos((prev) => {
        const filled = prev.filter((p, i) => i !== index && p !== null) as PhotoSlot[];
        // Pad to at least MIN_PHOTOS
        while (filled.length < MIN_PHOTOS) {
          filled.push(null);
        }
        return filled;
      });
    },
    [session?.user.id, photos],
  );

  const handleReorder = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (!session?.user.id) return;

      // Optimistic update
      setPhotos((prev) => {
        const updated = [...prev];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        return updated;
      });

      // Get IDs of filled photos in new order
      const reorderedPhotos = [...photos];
      const [moved] = reorderedPhotos.splice(fromIndex, 1);
      reorderedPhotos.splice(toIndex, 0, moved);

      const filledIds = reorderedPhotos
        .filter((p): p is NonNullable<PhotoSlot> => p !== null && p.uploaded)
        .map((p) => p.id);

      const { error } = await reorderPhotos(session.user.id, filledIds);

      if (error) {
        Alert.alert("Reorder Failed", error);
      }
    },
    [session?.user.id, photos],
  );

  async function handleContinue() {
    if (!canContinue) return;

    setIsSaving(true);
    await saveProgress("photos", { photoCount: filledCount });
    setIsSaving(false);
    router.push("/(auth)/bio");
  }

  if (isLoading) {
    return (
      <StepContainer
        title="Add your photos"
        subtitle="You need at least 3 photos. First photo is your profile photo."
        onBack={() => router.back()}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary[600]} />
        </View>
      </StepContainer>
    );
  }

  return (
    <StepContainer
      title="Add your photos"
      subtitle="You need at least 3 photos. First photo is your profile photo."
      onBack={() => router.back()}
    >
      <View className="flex-1">
        <PhotoGrid
          photos={photos}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onReorder={handleReorder}
          uploading={uploading}
        />

        <Text className="mt-3 text-center text-sm text-gray-500">
          {filledCount >= MIN_PHOTOS
            ? `${filledCount} photos`
            : `${filledCount}/${MIN_PHOTOS} required photos`}
        </Text>
      </View>

      <Pressable
        className={`mb-8 rounded-xl py-4 ${
          canContinue ? "bg-primary-600" : "bg-gray-300"
        }`}
        onPress={handleContinue}
        disabled={!canContinue}
        accessibilityRole="button"
        accessibilityLabel="Continue"
        accessibilityState={{ disabled: !canContinue }}
      >
        {isSaving ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text
            className={`text-center text-lg font-semibold ${
              canContinue ? "text-white" : "text-gray-500"
            }`}
          >
            Continue
          </Text>
        )}
      </Pressable>
    </StepContainer>
  );
}
