# Phase 1: Foundation & Schema - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Project scaffold with Expo Development Build, Supabase client connection, correct PRD v2.0 database schema (reconciled from docs/DB_SCHEMA.md), Row Level Security policies for shared-school gating, and shared trust functions (block-check). This phase produces a runnable app shell with a fully provisioned backend — no UI features yet.

</domain>

<decisions>
## Implementation Decisions

### Project Structure
- Hybrid folder organization: shared UI in `/components/`, domain logic in `/features/`
- Each feature module (discovery, messaging, explore, etc.) has its own components, hooks, utils
- Shared utilities, types, and constants at root level
- Expo Router for file-based navigation

### Navigation & Tab Bar
- 5-tab layout: Discovery is the center/primary tab (like Tinder)
- Tab order: Explore | Likes | Discovery (center) | Messages | Profile
- Outlined/minimal icons with fill on active state

### Visual Identity
- Bold & youthful color palette: purple/violet gradient primary
- Energetic, Gen Z appeal
- NativeWind (Tailwind CSS) for styling

### Schema Design
- Supabase migrations are the source of truth (docs/DB_SCHEMA.md updated to reflect)
- Reconcile with PRD v2.0: add `likes`, `matches`, `dismissals`, `saves` tables
- Remove `routing_state_for_recipient` from threads (v1 artifact)
- Add `status` enum on threads (active/unmatched/blocked)
- Roommate preferences stored as JSONB (`nitty_gritty` column on profiles) — flexible, no migration for new fields
- Separate tables for likes, dismissals, saves (not single interactions table) — cleaner queries, easier indexing

### Supabase Setup
- Create hosted Supabase project in US East (us-east-1)
- User has existing Supabase account
- Environment config via Expo env vars (.env files with expo-constants)
- Seed schools table with real US university data for realistic development

### RLS Strategy
- RLS policies on ALL user-facing tables from day one (safety first, optimize only if benchmarks show problems)
- Shared `is_blocked(user_a, user_b)` Postgres function — single source of truth for block checks, referenced by RLS policies and Edge Functions
- Default own-data access pattern: users can always read/write their own rows, additional policies for cross-user visibility
- Service role only for admin operations (Edge Functions) — no admin UI in this phase

### Claude's Discretion
- Exact folder naming conventions (kebab-case vs camelCase)
- Specific NativeWind/Tailwind theme configuration
- Migration file naming and ordering strategy
- Which schools to include in seed data
- Exact RLS policy structure per table
- TypeScript configuration and path aliases

</decisions>

<specifics>
## Specific Ideas

- Tab arrangement mirrors Tinder's center-primary pattern — Discovery is the hero
- Purple/violet gradient signals youthful energy, differentiates from Tinder's warm coral and Bumble's yellow
- JSONB for preferences is a deliberate flexibility choice — new roommate criteria can be added without schema migrations

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- docs/PRD.md — authoritative product spec (PRD v2.0, matching-based architecture)
- docs/DB_SCHEMA.md — logical schema to reconcile (has v1 artifacts to update)
- docs/ARCHITECTURE.md — high-level service boundaries
- docs/DECISIONS.md — decision log to update
- docs/TRUST_AND_SAFETY.md — trust model reference
- docs/UI_UX_SPEC.md — UI/UX specification

### Integration Points
- CLAUDE.md references docs/ as source of truth for product behavior
- docs/DB_SCHEMA.md should be updated to match the reconciled migration schema

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-schema*
*Context gathered: 2026-03-03*
