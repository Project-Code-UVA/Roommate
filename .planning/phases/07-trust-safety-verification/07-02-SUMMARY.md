---
phase: 07-trust-safety-verification
plan: 02
subsystem: testing
tags: [supabase, postgres, rpc, integration-tests, enforcement, blocking, trust-safety]

# Dependency graph
requires:
  - phase: 07-trust-safety-verification
    plan: 00
    provides: "block_user RPC, enforcement fix migration, integration test stubs, safety types"
  - phase: 03-discovery-engine
    provides: "get_discovery_stack, like_profile, get_my_likes RPCs"
  - phase: 05-messaging
    provides: "send_message RPC, threads/messages tables"
  - phase: 06-explore-likes
    provides: "get_explore_feed, get_liked_me RPCs"
provides:
  - "Integration test setup with 7 real Supabase helpers (createTestUser, addUserToSchool, createTestThread, setEnforcementState, cleanupTestUsers, getSchoolIds, supabaseAdmin)"
  - "16 integration tests covering 4 surfaces: discovery, explore, messaging, likes"
  - "RPC-level enforcement verification for SAFE-01, SAFE-02, SAFE-04, SAFE-05, SAFE-06"
affects: [07-03, 07-04]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Service-role integration tests calling real Supabase RPCs", "Per-test user isolation with cascading auth.admin.deleteUser cleanup", "Cached school ID lookup for test efficiency"]

key-files:
  created:
    - __tests__/integration/setup.ts
  modified:
    - __tests__/integration/discovery-gating.test.ts
    - __tests__/integration/explore-blocking.test.ts
    - __tests__/integration/message-enforcement.test.ts
    - __tests__/integration/likes-blocking.test.ts

key-decisions:
  - "Test photo inserted for each user to ensure visibility in explore feed (requires approved photo)"
  - "Multiple like targets created per enforcement test to avoid idempotent like_profile conflicts"
  - "Each describe block gets isolated users to prevent cross-test state pollution"

patterns-established:
  - "Integration test helper pattern: service-role client with typed overrides for createTestUser"
  - "Canonical ID ordering in createTestThread mirrors LEAST/GREATEST constraint in matches/threads"
  - "getSchoolIds caches at module level to avoid repeated DB calls across test files"

requirements-completed: [SAFE-01, SAFE-02, SAFE-04, SAFE-05, SAFE-06]

# Metrics
duration: 3min
completed: 2026-03-24
---

# Phase 7 Plan 02: Integration Tests Summary

**16 RPC-level integration tests proving server-side enforcement across discovery, explore, messaging, and likes using real Supabase service-role client**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-24T20:27:25Z
- **Completed:** 2026-03-24T20:30:43Z
- **Tasks:** 2
- **Files created/modified:** 5

## Accomplishments
- Integration test setup with 7 helper functions (createTestUser, addUserToSchool, createTestThread, setEnforcementState, cleanupTestUsers, getSchoolIds, supabaseAdmin) using service role key for RLS bypass
- 16 integration tests across 4 files covering all 4 trust surfaces per D-13
- Tests call real Supabase RPCs per D-12 (no mocks) to verify server-side enforcement
- Covers shared-school gating, block enforcement, enforcement state checks (warning/dm_ban/suspended/permanent_ban), and underage report category

## Task Commits

Each task was committed atomically:

1. **Task 1: Integration test setup with real Supabase helpers** - `a0d9c8a` (feat)
2. **Task 2: 4 integration test files with 16 test cases** - `9547c16` (test)

## Files Created/Modified
- `__tests__/integration/setup.ts` - Full integration test helpers: supabaseAdmin, createTestUser, addUserToSchool, createTestThread, setEnforcementState, cleanupTestUsers, getSchoolIds
- `__tests__/integration/discovery-gating.test.ts` - 3 tests: shared-school inclusion, non-shared exclusion, block exclusion (SAFE-01)
- `__tests__/integration/explore-blocking.test.ts` - 3 tests: block exclusion, enforcement exclusion, block idempotency (SAFE-02)
- `__tests__/integration/message-enforcement.test.ts` - 7 tests: send_message enforcement (warning OK, dm_ban/suspended/banned blocked) + like_profile enforcement (warning/dm_ban OK, suspended blocked) (SAFE-04, SAFE-05)
- `__tests__/integration/likes-blocking.test.ts` - 3 tests: my-likes block exclusion, liked-me block exclusion, underage report category (SAFE-02, SAFE-06)

## Decisions Made
- Inserted an approved test photo for each user so they appear in explore/discovery feeds (both RPCs require approved photos)
- Created multiple like targets per enforcement test to avoid idempotent like_profile conflicts from prior test runs
- Used isolated describe blocks with separate users per test suite to prevent cross-test state pollution from block/enforcement mutations

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added test photo insertion to createTestUser**
- **Found during:** Task 1 (setup implementation)
- **Issue:** get_explore_feed filters out users with no approved photos (WHERE photo_url IS NOT NULL), so test users without photos would be invisible in explore tests
- **Fix:** createTestUser now inserts an approved photo record for each test user
- **Files modified:** __tests__/integration/setup.ts
- **Verification:** Explore blocking tests can verify user presence/absence in feed
- **Committed in:** a0d9c8a (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for explore feed tests to work correctly. No scope creep.

## Issues Encountered
None

## User Setup Required
Integration tests require environment variables to run against a live Supabase instance:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for RLS bypass

## Known Stubs
None - all helper functions and test cases are fully implemented.

## Next Phase Readiness
- Integration test infrastructure ready for any future trust/safety tests
- All 4 surfaces (discovery, explore, messaging, likes) have enforcement coverage
- Test helpers reusable by Plan 03 (components) and Plan 04 (verification) if needed

## Self-Check: PASSED

All 5 created/modified files verified on disk. Both task commits (a0d9c8a, 9547c16) verified in git log.

---
*Phase: 07-trust-safety-verification*
*Plan: 02*
*Completed: 2026-03-24*
