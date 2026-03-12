/**
 * Static icebreaker prompt pool for new chat conversations.
 *
 * Provides roommate-specific and general social conversation starters
 * that differentiate Room from dating apps.
 */

import type { IcebreakerPrompt } from "@/types/chat";

// ---------------------------------------------------------------------------
// Prompt Pool
// ---------------------------------------------------------------------------

export const ICEBREAKER_PROMPTS: readonly IcebreakerPrompt[] = [
  // Roommate-specific prompts
  { id: "rm-01", text: "What's your ideal weekend morning?", category: "roommate" },
  { id: "rm-02", text: "Are you a thermostat fighter?", category: "roommate" },
  { id: "rm-03", text: "Morning person or night owl?", category: "roommate" },
  { id: "rm-04", text: "How do you feel about guests?", category: "roommate" },
  { id: "rm-05", text: "What's your cleaning style?", category: "roommate" },
  { id: "rm-06", text: "Do you cook or is it takeout every night?", category: "roommate" },
  { id: "rm-07", text: "Music speaker or headphones person?", category: "roommate" },
  { id: "rm-08", text: "What time do you usually go to sleep?", category: "roommate" },
  { id: "rm-09", text: "How do you feel about shared groceries?", category: "roommate" },
  { id: "rm-10", text: "Biggest pet peeve in a roommate?", category: "roommate" },
  // Social prompts
  { id: "sc-01", text: "What's your favorite show right now?", category: "social" },
  { id: "sc-02", text: "What's the last thing that made you laugh?", category: "social" },
  { id: "sc-03", text: "If you could only eat one meal for a week?", category: "social" },
  { id: "sc-04", text: "What's your go-to study spot?", category: "social" },
  { id: "sc-05", text: "What's your unpopular opinion?", category: "social" },
  { id: "sc-06", text: "What hobby have you picked up recently?", category: "social" },
  { id: "sc-07", text: "Best campus food spot?", category: "social" },
  { id: "sc-08", text: "What's the first thing you'd do with a free day?", category: "social" },
] as const;

// ---------------------------------------------------------------------------
// Random Selection (Fisher-Yates shuffle)
// ---------------------------------------------------------------------------

/**
 * Returns a random sample of icebreaker prompts.
 * Uses Fisher-Yates shuffle on a copy (immutable -- does not mutate the pool).
 */
export function getRandomPrompts(count: number): readonly IcebreakerPrompt[] {
  const shuffled = [...ICEBREAKER_PROMPTS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
