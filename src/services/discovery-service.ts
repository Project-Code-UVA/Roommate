/**
 * Discovery service: Stack retrieval, mode updates, dismissals, and saves.
 *
 * Wraps Supabase RPC calls for Discovery tab operations.
 * All functions return structured error objects (never throw).
 */

import { supabase } from "@/lib/supabase";
import type { DiscoveryProfile } from "@/types/filters";

// Cast for RPC functions not yet in generated database types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = supabase.rpc.bind(supabase) as any;

// ---------------------------------------------------------------------------
// Discovery stack
// ---------------------------------------------------------------------------

type DiscoveryStackResult = {
  readonly data: readonly DiscoveryProfile[] | null;
  readonly error: string | null;
};

export async function getDiscoveryStack(
  userId: string,
  limit = 20,
  offset = 0,
): Promise<DiscoveryStackResult> {
  const { data, error } = await rpc("get_discovery_stack", {
    p_user_id: userId,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? [], error: null };
}

// ---------------------------------------------------------------------------
// Mode status
// ---------------------------------------------------------------------------

type ModeStatus = "roommate" | "friends" | "found_roommate";

export async function updateModeStatus(
  userId: string,
  status: ModeStatus,
): Promise<{ error: string | null }> {
  const { error } = await rpc("update_mode_status", {
    p_user_id: userId,
    p_new_status: status,
  });

  return { error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// Dismiss profile
// ---------------------------------------------------------------------------

export async function dismissProfile(
  userId: string,
  dismissedId: string,
): Promise<{ error: string | null }> {
  const { error } = await rpc("dismiss_profile", {
    p_user_id: userId,
    p_dismissed_id: dismissedId,
  });

  return { error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// Save / unsave profile
// ---------------------------------------------------------------------------

export async function saveProfile(
  userId: string,
  savedId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("saves")
    .upsert(
      { saver_id: userId, saved_id: savedId },
      { onConflict: "saver_id,saved_id" },
    );

  return { error: error?.message ?? null };
}

export async function unsaveProfile(
  userId: string,
  savedId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("saves")
    .delete()
    .eq("saver_id", userId)
    .eq("saved_id", savedId);

  return { error: error?.message ?? null };
}
