/**
 * Enforcement service: Check user enforcement state.
 *
 * Queries enforcement_state from users table and enforcement_actions
 * for the most recent action matching that state.
 * All functions return structured data (never throw).
 */

import { supabase } from "@/lib/supabase";
import type {
  EnforcementAction,
  EnforcementInfo,
  EnforcementState,
} from "@/types/safety";

// ---------------------------------------------------------------------------
// Default enforcement info (clean user)
// ---------------------------------------------------------------------------

const CLEAN_ENFORCEMENT: EnforcementInfo = {
  state: "none",
  endAt: null,
  action: null,
};

// ---------------------------------------------------------------------------
// Action blocking rules
// ---------------------------------------------------------------------------

type BlockableAction = "like" | "message" | "swipe" | "explore";

const BLOCKED_ACTIONS: Record<EnforcementState, readonly BlockableAction[]> = {
  none: [],
  warning: [],
  dm_ban_48h: ["message"],
  suspended_7d: ["like", "message", "swipe", "explore"],
  permanent_ban: ["like", "message", "swipe", "explore"],
};

// ---------------------------------------------------------------------------
// Get enforcement info for a user
// ---------------------------------------------------------------------------

export async function getEnforcementInfo(
  userId: string,
): Promise<EnforcementInfo> {
  // Query user enforcement_state
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("enforcement_state")
    .eq("id", userId)
    .single();

  if (userError || !userData) {
    return CLEAN_ENFORCEMENT;
  }

  const state = (userData.enforcement_state as EnforcementState) ?? "none";

  if (state === "none") {
    return CLEAN_ENFORCEMENT;
  }

  // Query most recent enforcement_action matching the state
  const { data: actionData } = await supabase
    .from("enforcement_actions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const action = (actionData as EnforcementAction | null) ?? null;

  return {
    state,
    endAt: action?.end_at ?? null,
    action,
  };
}

// ---------------------------------------------------------------------------
// Check if an action is blocked by enforcement state
// ---------------------------------------------------------------------------

export function isActionBlocked(
  action: BlockableAction,
  state: EnforcementState,
): boolean {
  const blockedActions = BLOCKED_ACTIONS[state];
  return blockedActions.includes(action);
}

// ---------------------------------------------------------------------------
// Get the most recent enforcement action for a user
// ---------------------------------------------------------------------------

export async function getActiveEnforcement(
  userId: string,
): Promise<EnforcementAction | null> {
  const { data, error } = await supabase
    .from("enforcement_actions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data as EnforcementAction;
}
