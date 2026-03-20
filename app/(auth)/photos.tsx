import { useState, useCallback } from "react";
import { View, Text, Alert, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { StepContainer } from "@/components/onboarding/step-container";
import { PhotoGrid } from "@/components/onboarding/photo-grid";
import { COLORS } from "@/lib/constants";
import type { PhotoSlot } from "@/components/onboarding/photo-grid";

const MIN_PHOTOS = 3;

export default function PhotosScreen() {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const filledCount = photos.filter(Boolean).length;
  const isValid = filledCount >= MIN_PHOTOS; // MODIFIED: Continue disabled until at least 3 photos selected

  const handleAdd = useCallback((index: number) => {
    Alert.alert("Add Photo", "Choose a source", [
      {
        text: "Take Photo",
        onPress: () => {
          // TODO: call pickImage('camera') then uploadPhoto
          // Stub: add a placeholder
          setPhotos((prev) => {
            const next = [...prev];
            while (next.length <= index) next.push(null);
            next[index] = {
              id: `photo-${Date.now()}`,
              uri: `https://picsum.photos/seed/${Date.now()}/400/400`,
              uploaded: true,
            };
            return next;
          });
        },
      },
      {
        text: "Choose from Library",
        onPress: () => {
          // TODO: call pickImage('gallery') then uploadPhoto
          setPhotos((prev) => {
            const next = [...prev];
            while (next.length <= index) next.push(null);
            next[index] = {
              id: `photo-${Date.now()}`,
              uri: `https://picsum.photos/seed/${Date.now() + 1}/400/400`,
              uploaded: true,
            };
            return next;
          });
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, []);

  const handleRemove = useCallback((index: number) => {
    // TODO: call deletePhoto from photo-service
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = null;
      // Compact: remove trailing nulls then shift filled items forward
      const compacted = next.filter(Boolean);
      return compacted;
    });
  }, []);

  const handleContinue = useCallback(async () => {
    if (!isValid) return;
    setLoading(true);

    try {
      // TODO: save progress
      await new Promise((r) => setTimeout(r, 400));
      router.push("/(auth)/bio");
    } catch {
      // error handling
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
      totalSteps={9}
    >
      <View className="flex-1">
        {/* Photo grid */}
        <View className="mt-2">
          <PhotoGrid photos={photos} onAdd={handleAdd} onRemove={handleRemove} />
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
