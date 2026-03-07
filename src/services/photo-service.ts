/**
 * Photo service: image picking, upload to Supabase Storage, and photo management.
 *
 * Uses base64-arraybuffer pattern to avoid React Native 0-byte upload bug.
 */

import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";

import { supabase } from "@/lib/supabase";

/**
 * Launch image picker (camera or gallery).
 * Camera: single image with square crop.
 * Gallery: multi-select (up to `selectionLimit`), no crop (iOS limitation).
 */
export async function pickImage(
  source: "camera" | "gallery",
  selectionLimit = 9,
): Promise<ImagePicker.ImagePickerResult> {
  if (source === "camera") {
    return ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
  }

  return ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit,
    quality: 0.8,
  });
}

/**
 * Upload a photo to Supabase Storage and insert a record in the photos table.
 * Uses base64 decode pattern for reliable React Native uploads.
 */
export async function uploadPhoto(
  userId: string,
  uri: string,
  orderIndex: number,
): Promise<{ url: string; error: string | null }> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const filePath = `${userId}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(filePath, decode(base64), {
        contentType: "image/jpeg",
      });

    if (uploadError) {
      return { url: "", error: uploadError.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("photos").getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("photos").insert({
      user_id: userId,
      url: publicUrl,
      order_index: orderIndex,
    });

    if (insertError) {
      return { url: "", error: insertError.message };
    }

    return { url: publicUrl, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return { url: "", error: message };
  }
}

/**
 * Delete a photo from storage and remove its database record.
 */
export async function deletePhoto(
  userId: string,
  photoId: string,
  filePath: string,
): Promise<{ error: string | null }> {
  const { error: storageError } = await supabase.storage
    .from("photos")
    .remove([filePath]);

  if (storageError) {
    return { error: storageError.message };
  }

  const { error: dbError } = await supabase
    .from("photos")
    .delete()
    .eq("id", photoId)
    .eq("user_id", userId);

  return { error: dbError?.message ?? null };
}

/**
 * Reorder photos by updating order_index for each photo.
 */
export async function reorderPhotos(
  userId: string,
  photoIds: readonly string[],
): Promise<{ error: string | null }> {
  // Update each photo's order_index based on array position
  const updates = photoIds.map((id, index) =>
    supabase
      .from("photos")
      .update({ order_index: index })
      .eq("id", id)
      .eq("user_id", userId),
  );

  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error);

  return { error: firstError?.error?.message ?? null };
}
