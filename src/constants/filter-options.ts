/**
 * Predefined filter options for the 9 nitty-gritty categories.
 *
 * These constants define the valid values for self-description,
 * preferences, and dealbreakers in the Discovery Engine.
 */

import type { FilterCategory } from "@/types/filters";

// ---------------------------------------------------------------------------
// Filter option values per category
// ---------------------------------------------------------------------------

export const FILTER_OPTIONS: Readonly<Record<FilterCategory, readonly string[]>> = {
  sleep_schedule: ["early_bird", "night_owl", "flexible"],
  cleanliness: ["very_tidy", "tidy", "moderate", "relaxed"],
  guests: ["never", "rarely", "sometimes", "often"],
  smoking: ["never", "outside_only", "social", "daily"],
  budget_range: ["under_500", "500_800", "800_1200", "1200_1500", "over_1500"],
  partying: ["never", "rarely", "weekends", "often"],
  pets: ["no_pets", "have_pets", "love_pets", "allergic"],
  noise_level: ["silent", "quiet", "moderate", "loud_ok"],
  study_habits: ["home_studier", "library", "mixed", "minimal"],
} as const;

// ---------------------------------------------------------------------------
// Human-friendly labels for each category
// ---------------------------------------------------------------------------

export const FILTER_LABELS: Readonly<Record<FilterCategory, string>> = {
  sleep_schedule: "Sleep Schedule",
  cleanliness: "Cleanliness",
  guests: "Guests",
  smoking: "Smoking",
  budget_range: "Budget Range",
  partying: "Partying",
  pets: "Pets",
  noise_level: "Noise Level",
  study_habits: "Study Habits",
} as const;
