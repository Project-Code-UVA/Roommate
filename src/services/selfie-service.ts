/**
 * Selfie service: Capture and upload selfie for verification.
 *
 * Uses expo-image-picker for front-camera capture and
 * base64-arraybuffer pattern for reliable Supabase Storage upload.
 * All functions return structured data (never throw).
 */

import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";

import { supabase } from "@/lib/supabase";
import type { SelfieResult } from "@/types/safety";

// Cast for RPC functions not yet in generated database types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = supabase.rpc.bind(supabase) as any;

// ---------------------------------------------------------------------------
// Capture selfie with front camera
// ---------------------------------------------------------------------------

export async function captureSelfie(): Promise<ImagePicker.ImagePickerResult> {
  return ImagePicker.launchCameraAsync({
    cameraType: ImagePicker.CameraType.front,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    mediaTypes: ["images"],
  });
}

// ---------------------------------------------------------------------------
// Upload selfie to Supabase Storage and mark user as verified
// ---------------------------------------------------------------------------

export async function uploadSelfie(
  userId: string,
  uri: string,
): Promise<SelfieResult> {
  try {
    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Upload to selfies bucket with upsert for re-upload support (D-04)
    const filePath = `${userId}/selfie.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("selfies")
      .upload(filePath, decode(base64), {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      return { url: "", error: uploadError.message };
    }

    // Mark user as selfie verified via RPC
    await rpc("set_selfie_verified", { p_user_id: userId });

    // Get public URL for the uploaded selfie
    const {
      data: { publicUrl },
    } = supabase.storage.from("selfies").getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return { url: "", error: message };
  }
}
