/**
 * Selfie capture screen for identity verification.
 *
 * Uses expo-image-picker (front camera) for selfie capture per D-01.
 * Two modes: capture (shutter button) and preview (Retake / Use Photo).
 * Upload uses base64-arraybuffer pattern via selfie-service.
 */

import { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import { captureSelfie, uploadSelfie } from "@/services/selfie-service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SelfieCaptureProps = {
  readonly userId: string;
  readonly onComplete: () => void;
  readonly onCancel: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SelfieCapture({
  userId,
  onComplete,
  onCancel,
}: SelfieCaptureProps) {
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = useCallback(async () => {
    const result = await captureSelfie();
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setCapturedUri(result.assets[0].uri);
      setError(null);
    }
  }, []);

  const handleRetake = useCallback(() => {
    setCapturedUri(null);
    setError(null);
  }, []);

  const handleUsePhoto = useCallback(async () => {
    if (!capturedUri) return;

    setIsUploading(true);
    setError(null);

    const result = await uploadSelfie(userId, capturedUri);

    if (result.error) {
      setError(result.error);
      setIsUploading(false);
      return;
    }

    setIsUploading(false);
    onComplete();
  }, [userId, capturedUri, onComplete]);

  // -------------------------------------------------------------------------
  // Preview mode
  // -------------------------------------------------------------------------

  if (capturedUri !== null) {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: capturedUri }}
          style={styles.previewImage}
          resizeMode="cover"
        />

        <View style={styles.previewButtons}>
          <Pressable style={styles.retakeButton} onPress={handleRetake}>
            <Text style={styles.retakeText}>Retake</Text>
          </Pressable>

          <Pressable
            style={styles.usePhotoButton}
            onPress={handleUsePhoto}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.usePhotoText}>Use Photo</Text>
            )}
          </Pressable>
        </View>

        {error !== null && (
          <Text style={styles.errorText}>
            Upload failed. Please try again.
          </Text>
        )}
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // Capture mode
  // -------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      <View style={styles.captureArea}>
        <Text style={styles.instructionText}>
          Position your face within the frame
        </Text>
      </View>

      <View style={styles.shutterWrap}>
        <Pressable
          onPress={handleCapture}
          accessibilityLabel="Take selfie"
          accessibilityRole="button"
          testID="selfie-shutter"
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.9 : 1 }],
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View style={styles.shutterOuter}>
            <View style={styles.shutterInner} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  captureArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#fff",
    opacity: 0.8,
    marginTop: 40,
  },
  shutterWrap: {
    alignItems: "center",
    paddingBottom: 60,
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: "#7c3aed",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
  },
  previewImage: {
    flex: 1,
  },
  previewButtons: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  retakeButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  retakeText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  usePhotoButton: {
    flex: 1,
    height: 48,
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  usePhotoText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
});
