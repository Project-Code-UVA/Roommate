/**
 * Explore service: Feed retrieval and profile detail fetching.
 *
 * Wraps Supabase RPC calls for the Explore tab.
 * All functions return structured error objects (never throw).
 */

import { supabase } from "@/lib/supabase";
import type { ExploreProfile } from "@/types/explore";
import type { DiscoveryProfile } from "@/types/filters";

// Cast for RPC functions not yet in generated database types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = supabase.rpc.bind(supabase) as any;

// ---------------------------------------------------------------------------
// Explore feed (engagement-ranked grid)
// ---------------------------------------------------------------------------

type ExploreFeedResult = {
  readonly data: readonly ExploreProfile[];
  readonly error: string | null;
};

export async function getExploreFeed(
  userId: string,
  limit = 24,
  offset = 0,
  seed = 0,
): Promise<ExploreFeedResult> {
  const { data, error } = await rpc("get_explore_feed", {
    p_user_id: userId,
    p_limit: limit,
    p_offset: offset,
    p_seed: seed,
  });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}

// ---------------------------------------------------------------------------
// Profile detail (full DiscoveryProfile for a single user)
// ---------------------------------------------------------------------------

type ProfileDetailResult = {
  readonly data: DiscoveryProfile | null;
  readonly error: string | null;
};

export async function getProfileDetail(
  userId: string,
  targetId: string,
): Promise<ProfileDetailResult> {
  const { data, error } = await rpc("get_profile_detail", {
    p_user_id: userId,
    p_target_id: targetId,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? null, error: null };
}
