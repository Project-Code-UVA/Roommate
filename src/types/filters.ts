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
  | "rushing"
  | "social_energy"
  | "looking_for";


// ---------------------------------------------------------------------------
// Nitty-gritty JSONB schema
// ---------------------------------------------------------------------------

/**
 * Two-layer preference model stored in profiles.nitty_gritty:
 * - self: what the user is like (single value per category)
 * - preferences: what the user prefers in a roommate (multiple acceptable values)
 */
export type NittyGritty = {
  readonly self: Partial<Record<FilterCategory, string>>;
  readonly preferences: Partial<Record<FilterCategory, readonly string[]>>;
};

// ---------------------------------------------------------------------------
// Session-level filters (ad-hoc, not persisted to profile)
// ---------------------------------------------------------------------------

/**
 * Hard-include filter applied on top of saved preferences.
 *
 * Semantics: for every category key with a non-empty array, a candidate
 * must have `nitty_gritty.self[category]` in that list.
 * Empty arrays or missing keys impose no constraint.
 *
 * Lives in screen-local state — never written to the profile.
 */
export type DiscoveryFilters = Partial<Record<FilterCategory, readonly string[]>>;

export const EMPTY_FILTERS: DiscoveryFilters = Object.freeze({});

/**
 * Count of categories that currently have at least one selected value.
 * Used to render the "active filter" badge next to the filter button.
 */
export function countActiveFilters(filters: DiscoveryFilters): number {
  let count = 0;
  for (const key of Object.keys(filters) as FilterCategory[]) {
    const values = filters[key];
    if (values && values.length > 0) count += 1;
  }
  return count;
}

/**
 * Strip empty arrays so the payload sent to the RPC stays compact and
 * cache-friendly across calls.
 */
export function normalizeFilters(filters: DiscoveryFilters): DiscoveryFilters {
  const result: Record<string, readonly string[]> = {};
  for (const key of Object.keys(filters) as FilterCategory[]) {
    const values = filters[key];
    if (values && values.length > 0) {
      result[key] = values;
    }
  }
  return result as DiscoveryFilters;
}

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
  readonly is_super_like: boolean;
  readonly match_id: string | null;
  readonly thread_id: string | null;
  readonly error: string | null;
};

export type UnmatchResult = {
  readonly success: boolean;
  readonly error: string | null;
};
