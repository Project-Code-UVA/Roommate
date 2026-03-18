/**
 * TypeScript types for the Explore feed and Likes system.
 *
 * Defines contracts for Explore grid profiles, liked-me profiles,
 * and my-likes data returned by Phase 6 Supabase RPCs.
 */

// ---------------------------------------------------------------------------
// Explore grid profile (returned by get_explore_feed RPC)
// ---------------------------------------------------------------------------

export type ExploreProfile = {
  readonly user_id: string;
  readonly display_name: string;
  readonly year: string | null;
  readonly photo_url: string;
  readonly selfie_verified: boolean;
};

// ---------------------------------------------------------------------------
// Liked-me profile (returned by get_liked_me RPC)
// ---------------------------------------------------------------------------

/**
 * When `p_is_paid = false`, display_name is null (server omits it).
 * When `p_is_paid = true`, display_name is populated.
 */
export type LikedMeProfile = {
  readonly user_id: string;
  readonly photo_url: string;
  readonly display_name: string | null;
  readonly liked_at: string;
};

// ---------------------------------------------------------------------------
// My like (returned by get_my_likes RPC)
// ---------------------------------------------------------------------------

export type MyLike = {
  readonly user_id: string;
  readonly display_name: string;
  readonly year: string | null;
  readonly photo_url: string;
  readonly liked_at: string;
};
