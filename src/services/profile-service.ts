/**
 * Profile service: CRUD operations for user profiles.
 *
 * Handles profile creation/updates during onboarding and later edits.
 */

import { supabase } from "@/lib/supabase";
import type { Json, Tables } from "@/types/database.types";

type Profile = Tables<"profiles">;

export type ProfileUpdate = {
  readonly display_name?: string | null;
  readonly bio?: string | null;
  readonly year?: string | null;
  readonly gender?: string | null;
  readonly show_gender?: boolean;
  readonly hometown?: string | null;
  readonly show_hometown?: boolean;
  readonly nitty_gritty?: Json | null;
};

/**
 * Update or create a profile for the given user.
 * Uses upsert to handle both initial creation and subsequent updates.
 */
export async function updateProfile(
  userId: string,
  fields: ProfileUpdate,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("profiles")
    .upsert(
      { user_id: userId, ...fields, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  return { error: error?.message ?? null };
}

/**
 * Get a user's profile.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}
