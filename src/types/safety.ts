/**
 * TypeScript types for the Trust & Safety domain.
 *
 * Defines contracts for enforcement state, enforcement actions,
 * block results, selfie verification, and shared UI types
 * used across safety-related services, hooks, and components.
 *
 * All types are readonly/immutable per project coding conventions.
 */

// ---------------------------------------------------------------------------
// Enforcement State & Actions
// ---------------------------------------------------------------------------

export type EnforcementState = "none" | "warning" | "dm_ban_48h" | "suspended_7d" | "permanent_ban";

export type EnforcementActionType = "warning" | "dm_ban_48h" | "suspended_7d" | "permanent_ban";

export type EnforcementAction = {
  readonly id: string;
  readonly user_id: string;
  readonly action: EnforcementActionType;
  readonly start_at: string;
  readonly end_at: string | null;
  readonly created_at: string;
};

// ---------------------------------------------------------------------------
// Enforcement Info (client-side aggregate)
// ---------------------------------------------------------------------------

export type EnforcementInfo = {
  readonly state: EnforcementState;
  readonly endAt: string | null;
  readonly action: EnforcementAction | null;
};

// ---------------------------------------------------------------------------
// Block Result
// ---------------------------------------------------------------------------

export type BlockResult = {
  readonly success: boolean;
  readonly error: string | null;
};

// ---------------------------------------------------------------------------
// Selfie Verification Result
// ---------------------------------------------------------------------------

export type SelfieResult = {
  readonly url: string;
  readonly error: string | null;
};

// ---------------------------------------------------------------------------
// Overflow Menu Item
// ---------------------------------------------------------------------------

export type OverflowMenuItem = {
  readonly label: string;
  readonly icon: string;
  readonly onPress: () => void;
  readonly destructive?: boolean;
};
