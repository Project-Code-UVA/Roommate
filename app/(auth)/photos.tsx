import { useState, useCallback } from "react";
import { View, Text, Alert, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { StepContainer } from "@/components/onboarding/step-container";
import { PhotoGrid } from "@/components/onboarding/photo-grid";
import { COLORS } from "@/lib/constants";
import { useSession } from "@/contexts/auth-context";
import { useOnboarding } from "@/hooks/use-onboarding";
import { pickImage, uploadPhoto, deletePhoto, reorderPhotos } from "@/services/photo-service";
import type { PhotoSlot } from "@/components/onboarding/photo-grid";

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 9;

export default function PhotosScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { saveProgress } = useOnboarding();
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const filledCount = photos.filter(Boolean).length;
  const isValid = filledCount >= MIN_PHOTOS; // MODIFIED: Continue disabled until at least 3 photos selected

  const uploadFromSource = useCallback(async (source: "camera" | "gallery", startIndex: number) => {
    if (!session?.user.id) return;
    const userId = session.user.id;

    try {
      const remainingSlots = MAX_PHOTOS - filledCount;
      const selectionLimit = source === "camera" ? 1 : remainingSlots;

      const result = await pickImage(source, selectionLimit);
      if (result.canceled || !result.assets?.length) return;

      const assets = result.assets;

      // Build temp entries for all selected photos
      const tempEntries = assets.map((asset, i) => ({
        slotIndex: startIndex + i,
        tempId: `temp-${Date.now()}-${i}`,
        uri: asset.uri,
      }));

      // Show local previews immediately for all selected photos
      setPhotos((prev) => {
        const next = [...prev];
        tempEntries.forEach(({ slotIndex, tempId, uri }) => {
          while (next.length <= slotIndex) next.push(null);
          next[slotIndex] = { id: tempId, uri, uploaded: false };
        });
        return next;
      });

      // Upload all in parallel, collect errors
      const errors = await Promise.all(
        tempEntries.map(async ({ slotIndex, tempId, uri }) => {
          const { url, error } = await uploadPhoto(userId, uri, slotIndex);
          if (error) {
            setPhotos((prev) => prev.map((p) => (p?.id === tempId ? null : p)).filter(Boolean));
            return error;
          }
          setPhotos((prev) =>
            prev.map((p) =>
              p?.id === tempId
                ? { id: `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`, uri: url, uploaded: true }
                : p
            )
          );
          return null;
        })
      );

      const failedCount = errors.filter(Boolean).length;
      if (failedCount > 0) {
        Alert.alert(
          "Upload Failed",
          failedCount === assets.length
            ? "Failed to upload photos. Please try again."
            : `${failedCount} of ${assets.length} photos failed to upload.`
        );
      }
    } catch {
      Alert.alert("Error", "Failed to add photos. Please try again.");
    }
  }, [session?.user.id, filledCount]);

  const handleAdd = useCallback((index: number) => {
    Alert.alert("Add Photo", "Choose a source", [
      { text: "Take Photo", onPress: () => uploadFromSource("camera", index) },
      { text: "Choose from Library", onPress: () => uploadFromSource("gallery", index) },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [uploadFromSource]);

  const handleRemove = useCallback((index: number) => {
    const photo = photos[index];
    if (!photo || !session?.user.id) return;

    // Remove from UI immediately
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = null;
      return next.filter(Boolean);
    });

    // Best-effort delete from server (don't block UI)
    if (photo.uploaded && photo.id && session?.user.id) {
      const filePath = `${session.user.id}/${photo.id}.jpg`;
      deletePhoto(session.user.id, photo.id, filePath);
    }
  }, [photos, session?.user.id]);

  const handleReorder = useCallback((next: PhotoSlot[]) => {
    setPhotos(next);
    // Persist the new order_index for any photos already uploaded.
    const userId = session?.user.id;
    if (!userId) return;
    const uploadedIds = next
      .filter((p): p is NonNullable<PhotoSlot> => Boolean(p?.uploaded && p?.id))
      .map((p) => p.id);
    if (uploadedIds.length > 0) {
      reorderPhotos(userId, uploadedIds);
    }
  }, [session?.user.id]);

  const handleContinue = useCallback(async () => {
    if (!isValid) return;
    setLoading(true);

    try {
      await saveProgress("photos", { photoCount: filledCount });
      router.push("/(auth)/bio");
    } catch {
      Alert.alert("Error", "Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isValid, router]);

  return (
    <StepContainer
      title="Add your photos"
      subtitle="You need at least 3 photos. First photo is your profile photo."
      showBack
      onBack={() => router.back()}
      currentStep={7}
      totalSteps={11}
    >
      <View className="flex-1">
        {/* Photo grid */}
        <View className="mt-2">
          <PhotoGrid
            photos={photos}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onReorder={handleReorder}
          />
        </View>

        {/* Counter text */}
        {/* // MODIFIED: increased counter text from ~14pt to 16pt */}
        <Text
          style={{ fontSize: 16 }} // MODIFIED: counter text bumped +2pt
          className="text-center text-gray-500 mt-4"
        >
          {filledCount < MIN_PHOTOS
            ? `${filledCount}/${MIN_PHOTOS} required photos`
            : `${filledCount} photos`}
        </Text>
      </View>

      {/* Continue button */}
      <View className="pb-6 pt-4">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!isValid || loading}
          activeOpacity={0.85}
          style={{
            backgroundColor: isValid ? COLORS.primary[600] : COLORS.gray[300],
            borderRadius: 999,
            // MODIFIED: increased button padding from 16 to 18
            paddingVertical: 18, // MODIFIED: button padding bumped +2
          }}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            // MODIFIED: increased button text from ~18pt to 20pt
            <Text
              style={{ fontSize: 20 }} // MODIFIED: button text bumped +2pt for larger scale
              className="text-white font-semibold text-center"
            >
              Continue
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </StepContainer>
  );
}
