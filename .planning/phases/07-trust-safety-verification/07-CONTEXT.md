# Phase 7: Trust, Safety & Verification - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Enforce graduated moderation, comprehensive reporting, and optional selfie verification for trust signals. The schema, enums, `is_blocked()` function, `shares_school()` function, RLS policies, and basic block/report services already exist — this phase wires them together with server-side enforcement checks, surfaces block/report across all app surfaces, adds selfie verification UX, and proves everything works with integration tests.

</domain>

<decisions>
## Implementation Decisions

### Selfie Verification
- **D-01:** Camera capture only — no third-party liveness check, no manual review queue. User takes a selfie in-app; it's stored in Supabase Storage. Having a face photo on file is the trust signal for v1.
- **D-02:** Post-onboarding prompt — non-blocking. After onboarding completes, show a banner or modal nudging the user to verify. They can skip and verify later from profile settings.
- **D-03:** Verified badge is a small checkmark overlay on profile photos. Appears on Discovery/Explore cards AND on full profile views.
- **D-04:** Re-upload allowed from profile settings at any time. New selfie replaces the old one; verified status is retained.

### Enforcement State Feedback
- **D-05:** Banned/suspended users attempting to start a new conversation see an explicit error: "Your account has a messaging restriction until [date]." If permanent, no end date shown.
- **D-06:** Suspended/banned users are read-only across the board — cannot swipe, like, explore, or message. They can still see their existing data (matches, profile) but can take no actions.
- **D-07:** Warning (first enforcement level) is surfaced as an in-app modal on next app open. Modal explains what happened and links to community guidelines.
- **D-08:** Permanently banned users see a clear ban message on login attempt: "Your account has been permanently suspended for violating community guidelines." Cannot log in. No appeal mechanism for v1.

### Block from Non-Chat Surfaces
- **D-09:** Block is available from ALL profile views: Discovery swipe card, Explore profile modal, Likes tab profile detail modal, and Discovery profile bottom sheet. (Chat already has it.)
- **D-10:** Block is triggered via a 3-dot overflow menu on full profile views/bottom sheets — consistent with the chat header overflow pattern already built in Phase 5.
- **D-11:** After blocking, the profile modal/sheet is dismissed immediately and the user is removed from the current feed/stack optimistically.

### Integration Tests
- **D-12:** RPC-level integration tests — call actual Supabase RPCs with test users and assert correct gating behavior. No Maestro for this phase.
- **D-13:** Four surfaces must have explicit tests: discovery stack (shared-school gating), explore feed (block enforcement), send_message RPC (enforcement state check), likes RPCs (block enforcement on my-likes and liked-me).
- **D-14:** Tests live in `__tests__/integration/` — separate from existing unit tests in `__tests__/`.

### Claude's Discretion
- Selfie storage bucket configuration and file path structure
- Exact wording of enforcement modals beyond the approved pattern above
- Enforcement state check implementation in `send_message` RPC (add WHERE clause or pre-check function)
- Test setup/teardown patterns for integration tests (test user creation/cleanup)
- Whether to add `selfie_url` and `selfie_verified` columns or reuse existing users table columns

</decisions>

<specifics>
## Specific Ideas

- The chat header overflow menu pattern (from Phase 5 `chat-header.tsx`) is the exact UI pattern to replicate for non-chat block surfaces — consistent UX across the app.
- Enforcement state check must be in the `send_message` RPC (server-side), not client-side. The client should surface the error message returned by the RPC.
- Integration tests should use a dedicated test Supabase project or a seeded test schema — not production data.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Trust & Safety Policy
- `docs/TRUST_AND_SAFETY.md` — Report categories (8), escalation framework (warning → 48h DM ban → 7-day suspension → permanent ban)
- `docs/PRD.md` §Trust & Safety — Full safety system requirements and moderation rules

### Schema
- `supabase/migrations/00001_create_enums.sql` — `enforcement_state`, `enforcement_action_type`, `report_reason`, `report_status` enums
- `supabase/migrations/00013_create_blocks.sql` — Blocks table structure
- `supabase/migrations/00014_create_reports.sql` — Reports table structure (includes `status` field)
- `supabase/migrations/00015_create_enforcement_actions.sql` — Enforcement actions table
- `supabase/migrations/00019_create_trust_functions.sql` — `is_blocked()` and `shares_school()` SECURITY DEFINER functions
- `supabase/migrations/00024_rls_safety_system.sql` — RLS policies on blocks, reports, enforcement_actions

### Existing Services (extend, don't replace)
- `src/services/block-service.ts` — Current `blockFromChat()` — wraps `unmatchUser` with blockToo=true
- `src/services/report-service.ts` — Current `submitReport()` — inserts into reports table

### Existing UI Patterns to Replicate
- `src/components/chat/chat-header.tsx` — 3-dot overflow menu pattern for block/report actions
- `src/components/discovery/profile-sheet.tsx` — Profile bottom sheet (needs overflow menu added)
- `src/components/explore/explore-profile-view.tsx` — Explore profile modal (needs overflow menu added)
- `src/components/likes/profile-detail-modal.tsx` — Likes profile modal (needs overflow menu added)

### Architecture
- `docs/ARCHITECTURE.md` — System structure and server-enforcement rules
- `docs/DB_SCHEMA.md` — Full data model

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `is_blocked()` function: Already used in discovery, explore, and likes RPCs — enforcement tests can use same pattern
- `unmatchUser(userId, otherUserId, blockToo=true)`: Core block mechanic — non-chat block service should call this same function
- Chat header overflow menu: Exact UI component to replicate for Discovery/Explore/Likes overflow menus
- `expo-camera` or `expo-image-picker`: Already used for photo upload in onboarding — selfie capture should use same approach

### Established Patterns
- All RPC calls return `{ success, error }` shaped objects — enforcement state errors should use same shape
- Optimistic UI: Like/dismiss removes cards immediately — block should follow same pattern
- Services never throw, always return structured error objects

### Integration Points
- `send_message` RPC (00037): Must add enforcement state check before inserting message
- Discovery stack RPC (00030): Verify `is_blocked()` call is present — if not, add it
- Explore feed RPC (00039): Verify `is_blocked()` call is present — if not, add it
- My-likes (00040) and Liked-me (00041) RPCs: Verify block filtering is applied

</code_context>

<deferred>
## Deferred Ideas

- Appeal mechanism for permanent bans — out of scope for v1
- Admin dashboard for reviewing reports and applying enforcement — out of scope for v1; enforcement is currently manual (direct DB operation)
- Liveness detection for selfie — Phase 7 uses simple capture only; upgrade in a future phase
- Push notification for enforcement actions — Phase 8 scope
- Auto-escalation triggers (automatically escalating from warning to ban based on report volume) — future phase

</deferred>

---

*Phase: 07-trust-safety-verification*
*Context gathered: 2026-03-24*
