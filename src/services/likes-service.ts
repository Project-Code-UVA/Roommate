/**
 * Likes service: My-likes, liked-me, and liked-me count queries.
 *
 * Wraps Supabase RPC calls for the Likes tab.
 * All functions return structured error objects (never throw).
 */

import { supabase } from "@/lib/supabase";
import type { LikedMeProfile, MyLike } from "@/types/explore";

// Cast for RPC functions not yet in generated database types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = supabase.rpc.bind(supabase) as any;

// ---------------------------------------------------------------------------
// My likes (pending outbound)
// ---------------------------------------------------------------------------

type MyLikesResult = {
  readonly data: readonly MyLike[];
  readonly error: string | null;
};

export async function getMyLikes(
  userId: string,
  limit = 24,
  offset = 0,
): Promise<MyLikesResult> {
  const { data, error } = await rpc("get_my_likes", {
    p_user_id: userId,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}

// ---------------------------------------------------------------------------
// Liked me (inbound, paid/free gating)
// ---------------------------------------------------------------------------

type LikedMeResult = {
  readonly data: readonly LikedMeProfile[];
  readonly error: string | null;
};

export async function getLikedMe(
  userId: string,
  limit = 24,
  offset = 0,
  isPaid = false,
): Promise<LikedMeResult> {
  const { data, error } = await rpc("get_liked_me", {
    p_user_id: userId,
    p_limit: limit,
    p_offset: offset,
    p_is_paid: isPaid,
  });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}

// ---------------------------------------------------------------------------
// Liked me count (for badge)
// ---------------------------------------------------------------------------

type LikedMeCountResult = {
  readonly count: number;
  readonly error: string | null;
};

export async function getLikedMeCount(
  userId: string,
): Promise<LikedMeCountResult> {
  const { data, error } = await rpc("get_liked_me_count", {
    p_user_id: userId,
  });

  if (error) {
    return { count: 0, error: error.message };
  }

  return { count: typeof data === "number" ? data : 0, error: null };
}
