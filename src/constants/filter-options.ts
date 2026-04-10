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

// ---------------------------------------------------------------------------
// Human-friendly labels for each option value
// ---------------------------------------------------------------------------

export const FILTER_VALUE_LABELS: Readonly<Record<FilterCategory, Readonly<Record<string, string>>>> = {
  sleep_schedule: { early_bird: "Early Bird", night_owl: "Night Owl", flexible: "Flexible" },
  cleanliness: { very_tidy: "Very Tidy", tidy: "Tidy", moderate: "Moderate", relaxed: "Relaxed" },
  guests: { never: "Never", rarely: "Rarely", sometimes: "Sometimes", often: "Often" },
  smoking: { never: "Never", outside_only: "Outside Only", social: "Social", daily: "Daily" },
  budget_range: {
    under_500: "Under $500",
    "500_800": "$500–800",
    "800_1200": "$800–1.2k",
    "1200_1500": "$1.2k–1.5k",
    over_1500: "Over $1.5k",
  },
  partying: { never: "Never", rarely: "Rarely", weekends: "Weekends", often: "Often" },
  pets: { no_pets: "No Pets", have_pets: "Have Pets", love_pets: "Love Pets", allergic: "Allergic" },
  noise_level: { silent: "Silent", quiet: "Quiet", moderate: "Moderate", loud_ok: "Loud OK" },
  study_habits: { home_studier: "Home", library: "Library", mixed: "Mixed", minimal: "Minimal" },
} as const;

// ---------------------------------------------------------------------------
// Display order for nitty-gritty categories
// ---------------------------------------------------------------------------

export const FILTER_CATEGORY_ORDER: readonly FilterCategory[] = [
  "sleep_schedule",
  "cleanliness",
  "noise_level",
  "guests",
  "pets",
  "smoking",
  "partying",
  "study_habits",
  "budget_range",
] as const;
