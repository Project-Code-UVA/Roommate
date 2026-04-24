/**
 * Match service: Like, unmatch, and match retrieval operations.
 *
 * Wraps Supabase RPC calls for atomic like+match detection and unmatch+block.
 * All functions return structured error objects (never throw).
 */

import { supabase } from "@/lib/supabase";
import type { LikeResult, UnmatchResult } from "@/types/filters";

// Cast for RPC functions not yet in generated database types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = supabase.rpc.bind(supabase) as any;

// ---------------------------------------------------------------------------
// Like profile (atomic like + mutual match detection)
// ---------------------------------------------------------------------------

export async function likeProfile(
  likerId: string,
  likedId: string,
  isSuperLike = false,
): Promise<LikeResult> {
  const { data, error } = await rpc("like_profile", {
    p_liker_id: likerId,
    p_liked_id: likedId,
    p_is_super_like: isSuperLike,
  });

  if (error) {
    return {
      success: false,
      is_match: false,
      is_super_like: isSuperLike,
      match_id: null,
      thread_id: null,
      error: error.message,
    };
  }

  // RPC returns jsonb with success/error fields
  const result = data as Record<string, unknown>;

  if (result.error) {
    return {
      success: false,
      is_match: false,
      is_super_like: isSuperLike,
      match_id: null,
      thread_id: null,
      error: result.error as string,
    };
  }

  return {
    success: true,
    is_match: (result.is_match as boolean) ?? false,
    is_super_like: (result.is_super_like as boolean) ?? isSuperLike,
    match_id: (result.match_id as string) ?? null,
    thread_id: (result.thread_id as string) ?? null,
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Unmatch user (soft-delete with optional block)
// ---------------------------------------------------------------------------

export async function unmatchUser(
  userId: string,
  otherId: string,
  blockToo = false,
): Promise<UnmatchResult> {
  const { data, error } = await rpc("unmatch_user", {
    p_user_id: userId,
    p_other_id: otherId,
    p_block_too: blockToo,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as Record<string, unknown> | null;

  return {
    success: (result?.success as boolean) ?? true,
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Get active matches
// ---------------------------------------------------------------------------

type MatchesResult = {
  readonly data: readonly Record<string, unknown>[] | null;
  readonly error: string | null;
};

export async function getMatches(userId: string): Promise<MatchesResult> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .is("unmatched_at", null);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? [], error: null };
}
