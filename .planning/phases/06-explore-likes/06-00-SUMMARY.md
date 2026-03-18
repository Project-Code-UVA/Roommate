---
phase: 06-explore-likes
plan: 00
subsystem: database
tags: [supabase, rpc, typescript, explore, likes, ranking]

# Dependency graph
requires:
  - phase: 03-discovery-engine
    provides: "ranking_config table, likes/matches tables, is_blocked function"
  - phase: 01-project-setup
    provides: "profiles, users, photos, dismissals tables"
provides:
  - "ExploreProfile, LikedMeProfile, MyLike TypeScript types"
  - "get_explore_feed RPC with engagement-ranked scoring"
  - "get_my_likes RPC for pending outbound likes"
  - "get_liked_me + get_liked_me_count RPCs with paid/free gating"
  - "Explore ranking weight seeds in ranking_config"
  - "36 test stubs across 10 files for Phase 6 services, hooks, components"
affects: [06-01, 06-02]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Explore weighted scoring (engagement/activity/completeness/verification/freshness)", "Paid/free data gating in RPC layer"]

key-files:
  created:
    - src/types/explore.ts
    - supabase/migrations/00039_get_explore_feed.sql
    - supabase/migrations/00040_get_my_likes.sql
    - supabase/migrations/00041_get_liked_me.sql
    - supabase/migrations/00042_seed_explore_weights.sql
    - __tests__/services/explore-service.test.ts
    - __tests__/services/likes-service.test.ts
    - __tests__/hooks/use-explore-feed.test.ts
    - __tests__/hooks/use-likes.test.ts
    - __tests__/components/explore/explore-grid-card.test.tsx
    - __tests__/components/explore/explore-profile-view.test.tsx
    - __tests__/components/likes/liked-me-card.test.tsx
    - __tests__/components/likes/matches-row.test.tsx
    - __tests__/components/likes/my-likes-card.test.tsx
    - __tests__/components/likes/upgrade-banner.test.tsx
  modified: []

key-decisions:
  - "Explore feed shows ANY school profiles (not shared-school gated) per user decision"
  - "Five-factor scoring: engagement 35%, activity 25%, completeness 20%, verification 10%, freshness 10%"
  - "Deterministic shuffle via setseed(p_seed / 2147483647.0) for consistent pagination"
  - "Free users get no display_name in liked-me RPC (server-side data gating)"
  - "Matches use LEAST/GREATEST for ordered pair matching (user_a < user_b constraint)"

patterns-established:
  - "Paid/free data gating: RPC returns different field sets based on subscription flag"
  - "Explore scoring: 0.7 * weighted_score + 0.3 * random() for diversity"

requirements-completed: [EXPL-02, EXPL-03]

# Metrics
duration: 3min
completed: 2026-03-17
---

# Phase 6 Plan 00: Wave 0 Foundation Summary

**Explore/Likes type contracts, 4 Supabase RPCs (explore feed, my likes, liked me + count), explore weight seeds, and 36 test stubs**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T00:34:31Z
- **Completed:** 2026-03-18T00:37:41Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Three readonly TypeScript types (ExploreProfile, LikedMeProfile, MyLike) defining Phase 6 data contracts
- Engagement-ranked explore feed RPC with 5-factor scoring and deterministic shuffle
- My-likes and liked-me RPCs with pending-only filtering (excludes reciprocal likes and matches)
- Paid/free data gating in get_liked_me (server omits display_name for free users)
- 36 test stubs across 10 files ready for Plans 01 and 02

## Task Commits

Each task was committed atomically:

1. **Task 1: Create type contracts and Supabase RPC migrations** - `378662a` (feat)
2. **Task 2: Create test stubs for all Phase 6 modules** - `878b63d` (test)

## Files Created/Modified
- `src/types/explore.ts` - ExploreProfile, LikedMeProfile, MyLike readonly types
- `supabase/migrations/00039_get_explore_feed.sql` - Engagement-ranked explore feed with 5-factor scoring
- `supabase/migrations/00040_get_my_likes.sql` - Pending outbound likes query
- `supabase/migrations/00041_get_liked_me.sql` - Inbound likes with paid/free gating + count function
- `supabase/migrations/00042_seed_explore_weights.sql` - Explore ranking weight configuration
- `__tests__/services/explore-service.test.ts` - 5 explore service test stubs
- `__tests__/services/likes-service.test.ts` - 6 likes service test stubs
- `__tests__/hooks/use-explore-feed.test.ts` - 5 explore feed hook stubs
- `__tests__/hooks/use-likes.test.ts` - 4 likes hook stubs
- `__tests__/components/explore/explore-grid-card.test.tsx` - 3 grid card stubs
- `__tests__/components/explore/explore-profile-view.test.tsx` - 3 profile view stubs
- `__tests__/components/likes/liked-me-card.test.tsx` - 3 liked-me card stubs
- `__tests__/components/likes/matches-row.test.tsx` - 3 matches row stubs
- `__tests__/components/likes/my-likes-card.test.tsx` - 2 my-likes card stubs
- `__tests__/components/likes/upgrade-banner.test.tsx` - 2 upgrade banner stubs

## Decisions Made
- Explore feed shows profiles from ANY school (not shared-school restricted) per documented user decision
- Five-factor explore scoring: engagement (35%), activity (25%), completeness (20%), verification (10%), freshness (10%)
- Deterministic shuffle via setseed for consistent pagination across page loads
- Free users see no display_name in liked-me responses (server-side privacy gating)
- Match pair ordering uses LEAST/GREATEST to respect the user_a < user_b CHECK constraint

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Migrations need to be applied via Supabase MCP (same pattern as all prior phases). SQL files are ready in supabase/migrations/.

## Next Phase Readiness
- Type contracts ready for service layer (Plan 01)
- Test stubs ready for TDD implementation (Plans 01 and 02)
- RPCs ready for Supabase MCP application
- Explore weights seeded for tunable ranking

## Self-Check: PASSED

All 15 files verified present. Both task commits (378662a, 878b63d) verified in git log.

---
*Phase: 06-explore-likes*
*Completed: 2026-03-17*
