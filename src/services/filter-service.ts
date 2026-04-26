/**
 * Filter service: Read/write nitty-gritty preference data.
 *
 * Manages the two-layer NittyGritty JSONB column (self, preferences)
 * using immutable update patterns.
 */

import { supabase } from "@/lib/supabase";
import type { Json } from "@/types/database.types";
import type { FilterCategory, NittyGritty } from "@/types/filters";
import { FILTER_OPTIONS } from "@/constants/filter-options";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_NITTY_GRITTY: NittyGritty = {
  self: {},
  preferences: {},
};

const VALID_CATEGORIES = Object.keys(FILTER_OPTIONS) as readonly FilterCategory[];

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function isValidCategory(category: string): category is FilterCategory {
  return VALID_CATEGORIES.includes(category as FilterCategory);
}

// ---------------------------------------------------------------------------
// Read nitty-gritty
// ---------------------------------------------------------------------------

type NittyGrittyResult = {
  readonly data: NittyGritty | null;
  readonly error: string | null;
};

export async function getNittyGritty(
  userId: string,
): Promise<NittyGrittyResult> {
  const { data, error } = await supabase
    .from("profiles")
    .select("nitty_gritty")
    .eq("user_id", userId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  const raw = data?.nitty_gritty as NittyGritty | null;

  return {
    data: raw ?? { ...DEFAULT_NITTY_GRITTY },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Shared read-modify-write helper (immutable)
// ---------------------------------------------------------------------------

async function readAndUpdate(
  userId: string,
  updater: (current: NittyGritty) => NittyGritty,
): Promise<{ error: string | null }> {
  // Read current value
  const { data, error: readError } = await supabase
    .from("profiles")
    .select("nitty_gritty")
    .eq("user_id", userId)
    .single();

  if (readError) {
    return { error: readError.message };
  }

  const current = (data?.nitty_gritty as NittyGritty | null) ?? {
    ...DEFAULT_NITTY_GRITTY,
  };

  // Apply immutable update
  const updated = updater(current);

  // Write back
  const { error: writeError } = await supabase
    .from("profiles")
    .update({ nitty_gritty: updated as unknown as Json })
    .eq("user_id", userId);

  return { error: writeError?.message ?? null };
}

// ---------------------------------------------------------------------------
// Update self values (single value per category)
// ---------------------------------------------------------------------------

export async function updateSelfValues(
  userId: string,
  category: FilterCategory,
  value: string,
): Promise<{ error: string | null }> {
  if (!isValidCategory(category)) {
    return { error: `Invalid filter category: ${category}` };
  }

  return readAndUpdate(userId, (current) => ({
    ...current,
    self: { ...current.self, [category]: value },
  }));
}

// ---------------------------------------------------------------------------
// Update preferences (array of acceptable values per category)
// ---------------------------------------------------------------------------

export async function updatePreferences(
  userId: string,
  category: FilterCategory,
  values: readonly string[],
): Promise<{ error: string | null }> {
  if (!isValidCategory(category)) {
    return { error: `Invalid filter category: ${category}` };
  }

  return readAndUpdate(userId, (current) => ({
    ...current,
    preferences: { ...current.preferences, [category]: [...values] },
  }));
}

