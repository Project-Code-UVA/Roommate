/**
 * Hook to load and manage the current user's own profile.
 *
 * Combines profile data + photos + mode status into a single state object.
 * Provides optimistic update helpers for inline editing.
 */

import { useState, useEffect, useCallback } from "react";

import { getProfile, updateProfile, type ProfileUpdate } from "@/services/profile-service";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Photo = {
  readonly id: string;
  readonly url: string;
  readonly order_index: number;
};

type UserProfile = {
  readonly display_name: string | null;
  readonly bio: string | null;
  readonly year: string | null;
  readonly gender: string | null;
  readonly show_gender: boolean;
  readonly hometown: string | null;
  readonly show_hometown: boolean;
  readonly nitty_gritty: unknown;
  readonly completion_score: number;
};

type ModeStatus = "roommate" | "friends" | "found_roommate";

type UseProfileState = {
  readonly profile: UserProfile | null;
  readonly photos: readonly Photo[];
  readonly modeStatus: ModeStatus;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly selfieVerified: boolean;
  readonly refresh: () => Promise<void>;
  readonly updateField: (fields: ProfileUpdate) => Promise<{ error: string | null }>;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useProfile(userId: string): UseProfileState {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [photos, setPhotos] = useState<readonly Photo[]>([]);
  const [modeStatus, setModeStatus] = useState<ModeStatus>("roommate");
  const [selfieVerified, setSelfieVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load profile
      const profileData = await getProfile(userId);

      if (!profileData) {
        setError("Profile not found");
        setIsLoading(false);
        return;
      }

      setProfile({
        display_name: profileData.display_name,
        bio: profileData.bio,
        year: profileData.year,
        gender: profileData.gender,
        show_gender: (profileData as Record<string, unknown>).show_gender as boolean ?? true,
        hometown: profileData.hometown,
        show_hometown: (profileData as Record<string, unknown>).show_hometown as boolean ?? true,
        nitty_gritty: profileData.nitty_gritty,
        completion_score: (profileData as Record<string, unknown>).completion_score as number ?? 0,
      });

      // Load photos
      const { data: photoData } = await supabase
        .from("photos")
        .select("id, url, order_index")
        .eq("user_id", userId)
        .order("order_index", { ascending: true });

      setPhotos(photoData ?? []);

      // Load user data (mode_status, selfie_verified)
      const { data: userData } = await supabase
        .from("users")
        .select("mode_status, selfie_verified")
        .eq("id", userId)
        .single();

      if (userData) {
        setModeStatus(userData.mode_status as ModeStatus);
        setSelfieVerified(userData.selfie_verified ?? false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load profile";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateField = useCallback(
    async (fields: ProfileUpdate): Promise<{ error: string | null }> => {
      // Optimistic update
      setProfile((prev) => (prev ? { ...prev, ...fields } : prev));

      const result = await updateProfile(userId, fields);

      if (result.error) {
        // Revert on error
        await loadProfile();
      }

      return result;
    },
    [userId, loadProfile],
  );

  return {
    profile,
    photos,
    modeStatus,
    isLoading,
    error,
    selfieVerified,
    refresh: loadProfile,
    updateField,
  };
}
