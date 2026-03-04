# Domain Pitfalls

**Domain:** Roommate-first swipe discovery app with mutual matching (React Native Expo + Supabase)
**Researched:** 2026-03-03
**Overall confidence:** MEDIUM (based on training data and project document analysis; web search unavailable for verification)

---

## Critical Pitfalls

Mistakes that cause rewrites, data corruption, or trust violations.

---

### Pitfall 1: Match Creation Race Condition (Non-Atomic Mutual Like Resolution)

**What goes wrong:** When User A likes User B and User B has already liked User A, the system must atomically: (1) detect the reciprocal like, (2) create a match record, (3) create a messaging thread. If these steps are not wrapped in a single database transaction, two concurrent likes can produce duplicate matches, orphaned threads, or missed matches entirely.

**Why it happens:** Developers check for reciprocal likes with a SELECT, then INSERT the match in separate statements. Under concurrent load (both users swiping at the same time), both requests can read "no match exists" and either both create duplicate matches or both skip creation.

**Consequences:**
- Duplicate match records and threads
- Users see "It's a Match" but no thread exists
- Users never see a match that should have been created
- Data integrity violations cascade into messaging bugs

**Prevention:**
- Use a Postgres function (or Supabase Edge Function calling a Postgres function) that performs the entire like-check-match-thread sequence inside a single transaction with row-level locking (`SELECT ... FOR UPDATE` on the existing like row).
- Add a unique constraint on the `matches` table (e.g., `UNIQUE(user_a_id, user_b_id)` where `user_a_id < user_b_id`) so duplicates are impossible at the database level.
- The `likes` table needs a unique constraint on `(liker_id, liked_id)` to prevent duplicate likes.

**Detection:** Duplicate match records in the database. Users reporting "matched but can't message" or "matched twice."

**Phase relevance:** Must be solved in the matching/Discovery implementation phase. Do not defer.

---

### Pitfall 2: Client-Side Trust Logic Leaking Past Server Enforcement

**What goes wrong:** Developers implement school-gating, block-filtering, or enforcement-state checks in the React Native client and assume the server "also does it." Over time, server-side checks get missed, incomplete, or drift from client logic. An attacker bypasses the client entirely via direct API calls.

**Why it happens:** Supabase's RLS policies feel like "automatic server enforcement," but RLS only works if policies are correctly written and cover every access path. Edge Functions that skip RLS (using the service role key) or custom API endpoints that forget to re-check eligibility create bypass vectors.

**Consequences:**
- Users message people outside their school
- Blocked users remain visible via API
- Suspended users continue interacting
- Violation of the PRD's non-negotiable rules

**Prevention:**
- Every RLS policy must be the single source of truth for visibility. Never duplicate eligibility logic in client code and assume the server matches.
- Write integration tests that attempt prohibited actions via direct Supabase client calls (not through the app UI). Test: messaging without shared school, viewing blocked users, liking while suspended.
- Edge Functions using the service role key must re-implement all checks explicitly since RLS is bypassed.
- Create a shared `check_eligibility(actor_id, target_id)` Postgres function used by both RLS policies and Edge Functions.

**Detection:** Penetration testing or a security review that tries direct API calls. Audit logs showing actions that should have been blocked.

**Phase relevance:** Must be established in the first backend phase and enforced in every subsequent phase. Add automated security tests early.

---

### Pitfall 3: Supabase RLS Performance Degradation on Complex Policies

**What goes wrong:** RLS policies that involve joins (e.g., "user can see profiles only if they share a school") execute per-row. A Discovery query returning 50 candidates can trigger 50 separate school-overlap subqueries inside the RLS policy, turning a simple paginated query into an N+1 disaster.

**Why it happens:** Supabase RLS is standard Postgres RLS. Policies are predicates evaluated per row. Developers write logically correct policies that are computationally expensive. The query planner cannot always optimize away repeated subqueries inside policies.

**Consequences:**
- Discovery and Explore queries take 500ms-2s+ instead of <100ms
- Database CPU spikes under moderate load
- App feels sluggish on swipe stack refills

**Prevention:**
- Pre-compute shared-school eligibility. Maintain a materialized view or a `user_school_pairs` table that maps `(user_id, school_id)` and use simple `EXISTS` checks against it in RLS.
- For Discovery, use an Edge Function with the service role key to build the candidate set (bypassing RLS) and manually enforce all filters in the query. This avoids per-row RLS overhead for the hottest query in the app.
- Benchmark RLS policies with `EXPLAIN ANALYZE` on realistic data volumes (10K+ users, 50+ schools) before shipping.
- Add database indexes: composite index on `user_schools(school_id, user_id)` and `user_schools(user_id, school_id)`.

**Detection:** Slow query logs. `pg_stat_statements` showing Discovery/Explore queries with high mean time. Users reporting slow swipe stack loading.

**Phase relevance:** Must be addressed during Discovery/Explore backend implementation. Performance testing should happen before frontend integration.

---

### Pitfall 4: Incomplete Block Enforcement Across All Surfaces

**What goes wrong:** Blocking User B removes them from one surface (e.g., Discovery) but they still appear in Explore, Likes, or existing message threads. The block is partially enforced, giving the blocker a false sense of safety.

**Why it happens:** Block checks are added per-feature rather than as a cross-cutting concern. Each new query (Discovery candidates, Explore grid, Likes list, thread list) must independently filter out blocked users. One missed query = one leak.

**Consequences:**
- Blocked users visible in some tabs
- Trust violation -- users feel unsafe
- Potential legal liability if harassment continues through an unblocked surface

**Prevention:**
- Implement block filtering as a Postgres function or view that every query uses: `CREATE FUNCTION is_blocked(a uuid, b uuid) RETURNS boolean`. Reference this in all RLS policies and all Edge Function queries.
- Write a comprehensive integration test suite that, after a block action, asserts the blocked user is invisible across ALL surfaces: Discovery, Explore, Likes (My Likes, Liked Me, Matches), Messages, and any profile deeplink.
- When adding any new feature that shows user lists, the PR checklist must include "Does this filter blocked users?"

**Detection:** QA testing block behavior across all tabs. Automated test suite that covers all surfaces after block.

**Phase relevance:** Block infrastructure must be built as a shared utility in the first backend phase. Every feature phase must include block-filtering tests.

---

### Pitfall 5: Schema Drift Between PRD and Database

**What goes wrong:** The current `DB_SCHEMA.md` does not include `likes` or `matches` tables, despite the PRD v2.0 requiring mutual matching. The schema still has `routing_state_for_recipient` on threads (a v1 concept removed in v2.0). Building on the current schema without reconciling it to the PRD produces features that conflict with requirements.

**Why it happens:** The PRD was updated to v2.0 (matching-based) but supporting documents were not fully updated. Developers pick up the schema doc and implement what it says, missing the PRD's actual requirements.

**Consequences:**
- Missing tables for core features (likes, matches)
- Implementing removed features (message routing tiers)
- Wasted effort building against an outdated schema
- Confusion about source of truth

**Prevention:**
- Before implementation begins, reconcile `DB_SCHEMA.md` with PRD v2.0. Add: `likes` table (`liker_id`, `liked_id`, `source` [discovery/explore], `created_at`), `matches` table (`id`, `user_a_id`, `user_b_id`, `created_at`, `status`), `saves/bookmarks` table.
- Remove `routing_state_for_recipient` from threads (no routing tiers in v2.0).
- Add a `dismissals` table to track left-swipes so dismissed users do not reappear.
- Establish PRD as the authoritative source; schema docs are derived artifacts.

**Detection:** Review schema against every PRD section before implementation starts.

**Phase relevance:** Must be resolved in Phase 0 (setup/foundation) before any feature work begins.

---

## Moderate Pitfalls

---

### Pitfall 6: Supabase Realtime Channel Limits and Message Ordering

**What goes wrong:** Supabase Realtime uses Phoenix Channels over WebSockets. At scale, each active chat requires a channel subscription. Users with many matches accumulate many subscriptions. Messages arrive out of order during reconnection or network flaps. Offline messages are missed entirely if the client was not subscribed when they were sent.

**Prevention:**
- Do not subscribe to individual thread channels for all matches simultaneously. Subscribe only to the currently open thread + a single "notification" channel that signals new messages across all threads.
- Use `created_at` timestamps (server-generated) for message ordering, never client-side arrival order.
- On app foreground/reconnect, always fetch recent messages via REST API first, then layer on Realtime for new ones. Realtime is a supplement to polling, not a replacement.
- Implement message pagination with cursor-based pagination (using `created_at` + `id`), not offset-based.

**Detection:** Users reporting missing messages, out-of-order messages, or messages appearing only after app restart.

**Phase relevance:** Messaging implementation phase. Architecture decision on Realtime vs. alternatives should be made early.

---

### Pitfall 7: Swipe Animation Performance on Low-End Android

**What goes wrong:** React Native's JS bridge introduces frame drops during swipe gestures, especially with image-heavy cards. The Discovery swipe deck stutters at 30fps instead of 60fps, making the core interaction feel broken.

**Why it happens:** Swipe gesture handling crosses the JS-native bridge on every frame. Complex card layouts with multiple images, gradients, and overlays compound the problem. Android devices have wider performance variance than iOS.

**Prevention:**
- Use `react-native-reanimated` v3+ with worklets for all swipe gesture handling. Animations must run entirely on the UI thread, never crossing the JS bridge.
- Use `react-native-gesture-handler` for gesture recognition.
- Pre-load the next 2-3 card images while the current card is visible.
- Keep card components lightweight: no inline styles recalculated per render, memoize aggressively, use `React.memo` on card subcomponents.
- Test on a low-end Android device (e.g., Pixel 3a equivalent) throughout development, not just on the latest iPhone.

**Detection:** FPS monitoring during swipe gestures. Manual testing on budget Android hardware.

**Phase relevance:** Discovery UI implementation phase. Performance testing must happen during development, not after.

---

### Pitfall 8: Discovery Stack Exhaustion and Re-Surfacing Logic

**What goes wrong:** Users in small schools quickly exhaust the candidate pool. The app shows "No more people" after 20 swipes, and the user churns. Alternatively, dismissed users are accidentally re-surfaced because the dismissal tracking is incomplete.

**Why it happens:** The Discovery query must exclude: already-liked users, already-dismissed users, matched users, blocked users, users with incompatible mode status, and users filtered by dealbreakers. For a school with 200 users, the eligible pool can shrink to single digits quickly.

**Prevention:**
- Track all dismissals in a `dismissals` table. Never re-surface dismissed users (the PRD does not mention a "reset" feature).
- Show a meaningful empty state: "You've seen everyone at [School] for now. Check back later or adjust your filters." Do not show a loading spinner or error.
- Pre-compute candidate counts so the client can show "X people match your filters" and guide users toward relaxing dealbreakers.
- Consider a daily refresh indicator: "3 new people since yesterday."

**Detection:** Analytics showing high rates of stack exhaustion within first session. Users reporting seeing the same person twice.

**Phase relevance:** Discovery backend and UI phase. Empty state design is a UX requirement, not an afterthought.

---

### Pitfall 9: Enforcement State Not Checked at Action Time

**What goes wrong:** A user receives a 48-hour DM ban, but the ban is checked only at login or thread creation. The user, already in an open thread, continues sending messages throughout the ban period.

**Why it happens:** Enforcement state is treated as a profile flag checked during session initialization rather than a per-action gate. The `enforcement_actions` table has `start_at` and `end_at`, but message-send logic does not query it.

**Prevention:**
- Check enforcement state on every message send, every like, and every match creation. This must be a server-side check (RLS policy or Edge Function validation), not a client-side UI disable.
- Create a Postgres function `is_under_enforcement(user_id uuid, action_type text) RETURNS boolean` that checks active enforcement actions. Use it in the message-insert RLS policy.
- Enforcement expiry (`end_at`) must be compared against `now()` at query time, not cached.

**Detection:** Audit log showing messages sent during active enforcement periods. Integration tests that attempt actions while enforcement is active.

**Phase relevance:** Trust and Safety implementation phase. Must be wired into every action endpoint.

---

### Pitfall 10: Photo Moderation Bottleneck at Onboarding

**What goes wrong:** Users upload 3+ photos during onboarding. If photos require moderation before the profile is visible, users wait hours or days in a "pending" state, killing activation. If photos are shown without moderation, inappropriate content appears in Discovery.

**Why it happens:** No clear decision on sync vs. async moderation. The `photos` table has `moderation_status` but no defined flow for how moderation happens or what users see while waiting.

**Prevention:**
- Use automated image moderation (e.g., AWS Rekognition, Google Cloud Vision, or a similar service) for first-pass screening. Flag obviously inappropriate content immediately; approve everything else provisionally.
- Provisionally approved photos are visible to other users immediately. Flagged photos are hidden pending manual review.
- Manual review queue for flagged content only, not all uploads.
- Set a moderation SLA: automated check within 30 seconds, manual review within 24 hours.

**Detection:** Onboarding funnel analytics showing drop-off at photo upload step. High volume of pending-moderation photos.

**Phase relevance:** Onboarding/profile phase. The moderation pipeline must be designed before photo upload is implemented.

---

### Pitfall 11: Ads Integration Breaking Core UX Trust

**What goes wrong:** Ad SDKs (AdMob, etc.) inject native views that interfere with swipe gestures, add 200-500ms of startup latency, increase app bundle size significantly, and introduce privacy consent requirements (ATT on iOS, GDPR) that block onboarding.

**Why it happens:** Ad SDKs are optimized for web/native, not React Native. They often require native module linking, conflict with Expo managed workflow, and have poor React Native wrappers.

**Prevention:**
- Defer ads integration to a later phase. Build the engagement gating logic (track swipe count, match count) early, but do not integrate the actual ad SDK until core features are stable.
- Use `expo-ads-admob` or `react-native-google-mobile-ads` (check Expo compatibility). Test in Expo Development Build, not Expo Go (ad SDKs require native modules).
- Implement ATT (App Tracking Transparency) prompt before ad initialization on iOS. If user declines, ads still work but are non-personalized.
- Keep ads in a separate module so they can be disabled for testing and development.

**Detection:** App startup time regression after ad SDK integration. Swipe gesture conflicts. App Store review rejection for missing ATT prompt.

**Phase relevance:** Ads should be one of the last phases. Do not let ad SDK issues block core feature development.

---

### Pitfall 12: Expo Managed Workflow Ejection Pressure

**What goes wrong:** A required native module (selfie verification SDK, specific ad SDK, push notification provider) is incompatible with Expo managed workflow, forcing an eject to bare workflow mid-project. This breaks the development workflow, CI/CD pipeline, and OTA update capability.

**Why it happens:** Expo managed workflow restricts which native modules can be used. Third-party SDKs for identity verification (selfie check), certain ad networks, and advanced push notification features often require custom native code.

**Prevention:**
- Use Expo Development Builds (custom dev client) from the start, not Expo Go. This allows native modules while keeping the Expo build system (`eas build`).
- Vet all third-party SDKs for Expo compatibility before committing to them. Check if an Expo Config Plugin exists.
- For selfie verification, prefer API-based solutions (upload photo to server, server calls verification API) over SDK-based solutions that require native integration.
- Never plan around Expo Go for anything beyond initial prototyping.

**Detection:** Build failures when adding a new native dependency. "This module requires linking" errors in Expo Go.

**Phase relevance:** Must be decided in project setup phase. Using Development Builds from day one avoids painful migration later.

---

## Minor Pitfalls

---

### Pitfall 13: Bookmark/Save Feature Confusion with Like

**What goes wrong:** Users conflate "Save" (bookmark) with "Like" (swipe right). They save a profile thinking it expresses interest, then wonder why no match happens. Or they skip liking because they already saved.

**Prevention:**
- Clear UI differentiation: Save uses a bookmark icon, not a heart. Tooltip on first use.
- Save does NOT dismiss the card from the stack. User must still swipe left or right after saving.
- Saved profiles accessible from a separate "Saved" section in the Profile or Likes tab.

**Phase relevance:** Discovery UI phase. UX copy and iconography matter here.

---

### Pitfall 14: Timezone and Date Handling for Age Verification

**What goes wrong:** A user born on the boundary date (exactly 18 years ago today) is incorrectly allowed or blocked depending on timezone handling. Server uses UTC, user is in a different timezone, and the age calculation is off by a day.

**Prevention:**
- Calculate age server-side using the user's birthdate against `CURRENT_DATE` in the database timezone (UTC).
- Use a strict rule: user must be 18 on or before the current UTC date. This means some users turning 18 "today" in a western timezone might be blocked for up to ~12 hours. This is the safe default.
- Store birthdate as a `DATE` type, not a timestamp.

**Phase relevance:** Auth/onboarding phase. Small implementation detail with legal consequences.

---

### Pitfall 15: Supabase Auth Session Management on Mobile

**What goes wrong:** Supabase auth tokens expire, and the refresh flow fails silently on mobile. Users are logged out unexpectedly, losing draft messages or in-progress profile edits. Background app state on mobile complicates token refresh timing.

**Prevention:**
- Use `supabase-js` v2+ with `autoRefreshToken: true` and `persistSession: true`.
- Store the session in secure storage (`expo-secure-store`), not AsyncStorage.
- Implement a global auth state listener that detects session expiry and shows a re-auth screen rather than silently failing.
- Handle the case where the app returns from background after hours: check session validity before any API call.

**Phase relevance:** Auth implementation phase. Must be robust before any feature depends on authenticated requests.

---

### Pitfall 16: Push Notification Permission Timing

**What goes wrong:** The app requests push notification permission during onboarding before the user has any reason to care. User declines. Later, when they get a match, they never know because they have no notifications. Re-prompting is not possible on iOS without sending users to Settings.

**Prevention:**
- Do not request push permission during onboarding.
- Request push permission at the first high-value moment: when the user gets their first match ("Enable notifications so you never miss a match?").
- Show an in-app pre-prompt explaining the value before triggering the system prompt.
- Track notification permission state and show in-app banners for critical events (new match, new message) if push is disabled.

**Phase relevance:** Notifications phase (after matching and messaging are working).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Project Setup | Expo Go limitations force later migration | Use Development Builds from day one (#12) |
| Schema Design | DB schema misaligned with PRD v2.0 | Reconcile schema before implementation (#5) |
| Auth/Onboarding | Age verification timezone edge case | UTC-based server-side calculation (#14) |
| Auth/Onboarding | Session token expiry on mobile | Secure storage + auto-refresh + listener (#15) |
| Auth/Onboarding | Photo moderation blocking activation | Automated first-pass + provisional approval (#10) |
| Discovery Backend | Match race condition | Atomic Postgres transaction with row locking (#1) |
| Discovery Backend | RLS performance on school-gated queries | Pre-compute eligibility, bypass RLS for hot paths (#3) |
| Discovery Backend | Stack exhaustion in small schools | Track dismissals, meaningful empty states (#8) |
| Discovery UI | Swipe performance on Android | Reanimated worklets, UI-thread animations (#7) |
| Matching System | Duplicate matches or missed matches | Unique constraints + transactional match creation (#1) |
| Messaging | Out-of-order or missing messages via Realtime | REST-first + Realtime supplement, server timestamps (#6) |
| Block System | Incomplete block across surfaces | Shared block-check function, cross-surface test suite (#4) |
| Trust & Safety | Enforcement not checked at action time | Per-action server-side enforcement check (#9) |
| Trust & Safety | Client-side trust logic bypass | Integration tests via direct API, shared eligibility function (#2) |
| Ads Integration | SDK conflicts with Expo and swipe UX | Defer ads, use Development Builds, separate module (#11, #12) |
| Push Notifications | Permission declined during onboarding | Delay prompt to first match moment (#16) |

---

## Supabase-Specific Warnings

These are platform-specific risks that cut across multiple features:

| Risk | Impact | Mitigation |
|------|--------|------------|
| RLS policies with joins are slow per-row | Discovery/Explore latency | Pre-compute shared-school pairs; use service role for hot queries |
| Edge Functions cold start (~200-500ms) | First swipe/message feels slow | Keep functions warm with health checks; use database functions for latency-critical paths |
| Realtime has no message persistence guarantee | Missed messages | Always fetch via REST on reconnect; Realtime is notification layer only |
| Service role key in Edge Functions bypasses all RLS | Security hole if checks are forgotten | Mandatory eligibility checks in every Edge Function; code review checklist item |
| Supabase Storage has no built-in image moderation | Inappropriate photos served | Integrate external moderation API in upload Edge Function |
| Database connection pooling (PgBouncer in transaction mode) | Prepared statements may fail; advisory locks unavailable | Use session mode for specific functions if needed; test connection behavior |

---

## Sources

- Project documents: `docs/PRD.md` (v2.0), `docs/DB_SCHEMA.md`, `docs/ARCHITECTURE.md`, `docs/TRUST_AND_SAFETY.md`, `.planning/PROJECT.md`
- Supabase documentation (training data, not live-verified -- MEDIUM confidence)
- React Native / Expo architecture knowledge (training data -- MEDIUM confidence)
- Swipe-app domain patterns from Tinder/Bumble engineering blog posts (training data -- MEDIUM confidence)
- Postgres RLS behavior from PostgreSQL documentation (training data -- HIGH confidence for core Postgres, MEDIUM for Supabase-specific behavior)

**Note:** Web search was unavailable during this research session. Supabase-specific claims (Realtime channel limits, Edge Function cold start times, connection pooling behavior) should be verified against current Supabase documentation before implementation.
