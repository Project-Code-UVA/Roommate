/**
 * TypeScript types for the Discovery Engine filter/nitty-gritty system.
 *
 * Defines the contract for roommate compatibility preferences stored
 * in the profiles.nitty_gritty JSONB column.
 */

// ---------------------------------------------------------------------------
// Filter categories
// ---------------------------------------------------------------------------

export type FilterCategory =
  | "sleep_schedule"
  | "cleanliness"
  | "guests"
  | "smoking"
  | "budget_range"
  | "partying"
  | "pets"
  | "noise_level"
  | "study_habits"
  | "looking_for";

// ---------------------------------------------------------------------------
// Nitty-gritty JSONB schema
// ---------------------------------------------------------------------------

/**
 * Three-layer preference model stored in profiles.nitty_gritty:
 * - self: what the user is like (single value per category)
 * - preferences: what the user prefers in a roommate (multiple acceptable values)
 * - dealbreakers: what the user will NOT accept (hard exclusion filters)
 */
export type NittyGritty = {
  readonly self: Partial<Record<FilterCategory, string>>;
  readonly preferences: Partial<Record<FilterCategory, readonly string[]>>;
  readonly dealbreakers: Partial<Record<FilterCategory, readonly string[]>>;
};

// ---------------------------------------------------------------------------
// Discovery profile (returned by get_discovery_stack RPC)
// ---------------------------------------------------------------------------

export type DiscoveryProfile = {
  readonly user_id: string;
  readonly display_name: string;
  readonly bio: string | null;
  readonly year: string | null;
  readonly hometown: string | null;
  readonly nitty_gritty: NittyGritty | null;
  readonly completion_score: number;
  readonly mode_status: "roommate" | "friends";
  readonly selfie_verified: boolean;
  readonly last_active_at: string;
  readonly rank_score: number;
  readonly photos: readonly { readonly id: string; readonly url: string; readonly position: number }[];
};

// ---------------------------------------------------------------------------
// Action results
// ---------------------------------------------------------------------------

export type LikeResult = {
  readonly success: boolean;
  readonly is_match: boolean;
  readonly match_id: string | null;
  readonly thread_id: string | null;
  readonly error: string | null;
};

export type UnmatchResult = {
  readonly success: boolean;
  readonly error: string | null;
};
