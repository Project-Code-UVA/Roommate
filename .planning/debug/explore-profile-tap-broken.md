---
status: awaiting_human_verify
trigger: "Tapping on profiles in the Explore page does nothing. They should expand to show the full profile view."
created: 2026-03-18T00:00:00Z
updated: 2026-03-18T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - get_profile_detail RPC does not exist in any Supabase migration
test: Searched all migrations for get_profile_detail - zero results
expecting: N/A - root cause confirmed
next_action: Create migration for get_profile_detail RPC and add error handling

## Symptoms

expected: Tapping a profile card in the Explore page should expand/open the full profile view
actual: Nothing happens when tapping profile cards in Explore
errors: None reported (error is silently swallowed)
reproduction: Go to Explore tab, tap any profile card
started: Was working before, now broken

## Eliminated

- hypothesis: onPress handler not wired up in ExploreGridCard
  evidence: explore.tsx line 155 passes `onPress={() => selectProfile(item)}`, ExploreGridCard wraps in Pressable with onPress
  timestamp: 2026-03-18T00:01:00Z

- hypothesis: ExploreProfileView modal visibility logic is broken
  evidence: Modal visible prop is `selectedProfile !== null` which is correct
  timestamp: 2026-03-18T00:01:30Z

## Evidence

- timestamp: 2026-03-18T00:02:00Z
  checked: selectProfile in use-explore-feed.ts (line 149-160)
  found: Calls getProfileDetail RPC, only sets selectedProfile if result.data is truthy
  implication: If RPC fails, selectedProfile stays null, modal never opens

- timestamp: 2026-03-18T00:02:30Z
  checked: explore-service.ts getProfileDetail function (line 54-68)
  found: Calls supabase.rpc("get_profile_detail", ...), returns {data: null, error} on failure
  implication: Non-existent RPC will return error, data will be null

- timestamp: 2026-03-18T00:03:00Z
  checked: All Supabase migrations for get_profile_detail
  found: ZERO results - function does not exist in any migration
  implication: ROOT CAUSE - the RPC was never created

- timestamp: 2026-03-18T00:03:30Z
  checked: get_discovery_stack.sql (migration 00030) for DiscoveryProfile shape
  found: Returns user_id, display_name, bio, year, hometown, nitty_gritty, completion_score, mode_status, selfie_verified, last_active_at, rank_score, photos
  implication: get_profile_detail must return same shape for a single user

## Resolution

root_cause: The `get_profile_detail` Supabase RPC function was never created (no migration exists). When a user taps an Explore card, `selectProfile` calls this non-existent RPC, which returns an error. The error is silently handled (data=null), so `selectedProfile` is never set, and the modal never opens.
fix: Created migration 00047_get_profile_detail.sql with the missing RPC function. Added error handling to selectProfile in use-explore-feed.ts so failures surface an Alert instead of silently doing nothing.
verification: TypeScript compiles cleanly for all modified files. Awaiting human verification on device.
files_changed:
  - supabase/migrations/00047_get_profile_detail.sql (NEW)
  - src/hooks/use-explore-feed.ts (error handling in selectProfile)
