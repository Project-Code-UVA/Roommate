# Project Research Summary

**Project:** Room — Roommate Discovery App
**Domain:** Swipe-based roommate matching, school-gated social discovery (18+)
**Researched:** 2026-03-03
**Confidence:** MEDIUM (web verification unavailable; training data + authoritative project documents)

## Executive Summary

Room is a mobile app that applies Tinder-style swipe UX to the roommate-finding use case, with school affiliation as the trust boundary. This positions it against two mature categories simultaneously: swipe apps (where polish expectations are extremely high) and roommate platforms (which are uniformly low-polish). Users will benchmark Room against Tinder/Bumble, not RoomSync or Roomi — meaning animation quality, messaging responsiveness, and onboarding flow must be near-commercial grade from day one. The recommended approach is React Native (Expo) on the client, Supabase (Postgres + Auth + Realtime + Edge Functions) as the backend, with Row Level Security as the primary enforcement layer for all trust rules. This combination gives a solo or small team full-stack capability without vendor lock-in on the hot paths.

The defining technical constraint is the non-negotiable shared-school gating requirement: every visibility rule, messaging gate, and enforcement state must be enforced at the database level through RLS policies and Edge Functions — never trusted to client code. This single architectural principle shapes everything: it mandates server-authoritative state, makes the Discovery query the most complex and performance-critical in the system, and requires that the block cascade and enforcement escalation system be built as shared infrastructure rather than per-feature bolt-ons. The highest-risk technical operation is the atomic like-to-match creation, which must use a Postgres transaction with row-level locking to prevent race conditions.

The most important launch risk is the tension between a small school user pool and engagement. At schools with few users, the Discovery stack exhausts quickly, and the empty state experience will make or break early retention. This must be designed thoughtfully — not treated as an edge case — and is an argument for shipping the Explore browse surface early (Phase 2, not Phase 4). The secondary risks are RLS performance degradation on complex join-based policies (the school-gating query is N+1 by default if not indexed correctly) and the Expo managed workflow pressure from third-party SDKs (selfie verification, ads). Both are solvable but must be addressed in the right phase.

---

## Key Findings

### Recommended Stack

The stack centers on React Native + Expo (SDK 52+, New Architecture enabled) for the mobile client and Supabase as the single backend platform. Supabase is the right choice here because Postgres RLS directly implements the server-side enforcement model the PRD demands — it is not a workaround or a convenience, it is the architectural mechanism for school gating and block enforcement. Navigation uses Expo Router (file-based, type-safe), animations use react-native-reanimated v3 + gesture-handler v2 (on UI thread, required for 60fps swipe), and state is split between Zustand (client) and TanStack Query (server state/caching). The swipe deck must be built custom — existing packages like `react-native-deck-swiper` are unmaintained and incompatible with the New Architecture.

The selfie verification vendor is unresolved (Veriff, Onfido, or AWS Rekognition) and should be evaluated separately; prefer API-based over SDK-based to avoid Expo managed workflow ejection pressure. All version numbers need npm verification before project init — web tools were unavailable during research.

**Core technologies:**
- React Native + Expo SDK 52+: Cross-platform mobile runtime — New Architecture default, EAS Build for CI/CD, file-based routing
- Supabase (Postgres + Auth + Realtime + Edge Functions): Full backend — RLS for trust enforcement, Realtime for messaging, phone OTP built-in
- TypeScript 5.x: Type safety — mandatory given complex business rules (school gating, enforcement states, routing logic)
- react-native-reanimated v3 + gesture-handler v2: Swipe animations — UI-thread worklets required for 60fps on Android
- Zustand 5.x + TanStack Query 5.x: State management — Zustand for client state, TanStack for server state/pagination
- NativeWind (Tailwind for RN): Styling — utility-first, familiar, compiles to StyleSheet at build time (zero runtime cost)
- RevenueCat: In-app purchases — abstracts App Store / Play Store billing for subscriptions
- Expo Push + Edge Functions: Push notifications — cross-platform, triggered server-side for reliability
- Zod + React Hook Form: Forms and validation — shared schemas between client and Edge Functions

### Expected Features

The core loop that must ship before anything else is functional: onboarding (age gate + phone OTP + 3 photos + school selection), Discovery swipe stack, mutual matching, and real-time messaging with block/report. Without all six components working together, the product does not function. The feature dependency chain is rigid: verification unlocks profile creation, which unlocks Discovery, which unlocks likes, which unlock matches, which unlock messaging.

**Must have (table stakes):**
- Phone OTP verification + age gate — trust baseline, App Store requirement
- Onboarding flow (progressive: age → phone → photos → schools → preferences) — drop-off is extreme without it
- Swipe-based discovery (left/right/save) with photo carousel — the core interaction model
- Mutual matching (atomic like → match → thread) — consent model users expect
- Real-time messaging with delivery indicators, block, and report — engagement dies without it
- Shared-school gating (server-enforced) — the entire trust model depends on this
- Push notifications (match alerts, new messages) — users disengage without them
- Profile editing + mode status — users need to signal "found roommate" to exit the stack

**Should have (competitive differentiators):**
- Roommate-specific preference filters (sleep schedule, cleanliness, budget, guests) with dealbreaker vs. soft-preference distinction
- Explore tab with weighted ranking algorithm (configurable weights: completeness 30%, activity 25%, verification 20%, engagement 15%, freshness 10%)
- Likes tab (My Likes, blurred Liked Me grid, Matches list)
- Selfie verification + verified badge + Explore ranking boost
- Chat enhancements (reactions, reply threading, media/GIF, icebreaker prompts)
- Empty state handling with filter guidance for small school pools

**Defer to v2+:**
- Liked Me reveal (paid) — requires engaged user base first
- Advanced filters (paid)
- Profile boost (paid)
- Ads integration — defer until engagement thresholds are real
- AI compatibility scoring — unproven, opaque, user-distrust risk
- Video calling — high complexity, low v1 value
- Cross-school browsing — destroys the trust boundary

### Architecture Approach

Room uses a hybrid enforcement model: RLS policies are the primary access control layer for visibility (school gating, block filtering, enforcement state), and Edge Functions handle multi-step atomic operations (like processing, block cascade, report escalation) that require business logic beyond what RLS can express. The client never directly writes to sensitive tables — every trust-critical action flows through an Edge Function that validates preconditions before writing. The Discovery stack is generated by a Postgres function called via `rpc()` (not raw PostgREST) because the query is too complex for PostgREST's query string API. Realtime messaging requires a REST-first + Realtime-as-supplement pattern: always fetch via REST on reconnect, use Realtime only for real-time delivery of new messages.

**Major components:**
1. Auth Module — phone OTP, age gate, session tokens via Supabase Auth; must use expo-secure-store, not AsyncStorage
2. Discovery Engine — `get_discovery_stack` Postgres function with school/block/enforcement/mode/dealbreaker filters; cursor-based pagination
3. Like Service — `process-like` Edge Function with Postgres transaction, row-level locking, unique constraints to prevent duplicate matches
4. Messaging Service — Supabase Realtime per-thread subscriptions, RLS-enforced read/write, REST-first on reconnect
5. Explore Service — `get_explore_feed` Postgres function with weighted scoring from `ranking_config` table (tunable weights, no hardcoding)
6. Moderation Service — `process-block` and `process-report` Edge Functions, shared `is_blocked()` / `is_under_enforcement()` Postgres functions used by both RLS and Edge Functions
7. Notification Service — Edge Functions trigger on events (match, message) and call Expo Push API
8. Monetization Service — RevenueCat webhook Edge Function, subscriptions table, entitlement checks in paid-feature gates

### Critical Pitfalls

1. **Match creation race condition** — Two concurrent likes produce duplicate matches or missed matches. Prevention: wrap like-check-match-thread in a single Postgres transaction with `SELECT ... FOR UPDATE`; add `UNIQUE(user_a_id, user_b_id)` constraint where `user_a_id < user_b_id`. Must be solved in Phase 2.

2. **Client-side trust logic drift** — Server-side enforcement gets incomplete or drifts from client logic; attackers bypass via direct API calls. Prevention: RLS is the only source of truth; write integration tests that attempt prohibited actions via direct Supabase client (not app UI); Edge Functions using the service role must re-implement all checks explicitly. Must be established in Phase 1 and enforced in every phase.

3. **RLS performance on complex join policies** — School-gating via joins in RLS policies triggers N+1 per-row evaluation on Discovery and Explore queries. Prevention: maintain `user_school_pairs` pre-computed; use service role in hot path Edge Functions and manually enforce filters in the query; benchmark with `EXPLAIN ANALYZE` on 10K+ users before shipping. Must be addressed during Phase 2 backend.

4. **Incomplete block enforcement across surfaces** — Block removes a user from Discovery but they remain visible in Explore, Likes, or messages. Prevention: implement `is_blocked(a, b)` as a shared Postgres function used in every query; write a cross-surface integration test that asserts invisibility across all tabs after block. Must be built as shared infrastructure in Phase 1 and included in every phase's test checklist.

5. **Schema drift between PRD and DB_SCHEMA.md** — The current `DB_SCHEMA.md` is missing `likes` and `matches` tables and still contains removed v1 concepts (`routing_state_for_recipient`). Prevention: reconcile schema with PRD v2.0 before any implementation begins; add `interactions`, `matches`, `ranking_config`, `ads_engagement`, `subscriptions` tables; remove v1 routing artifacts. Must be resolved in Phase 0.

---

## Implications for Roadmap

Based on the combined research, the architecture defines a clear dependency chain that should drive phase ordering. The most important insight is that auth, schema, and RLS infrastructure are prerequisites for every feature — getting them right (and proven via integration tests) before building Discovery pays dividends in every subsequent phase.

### Phase 0: Foundation and Schema Alignment

**Rationale:** The schema has known drift from the PRD. This must be resolved before any feature is built. Simultaneously, project setup (Expo Development Build from day one — not Expo Go) determines whether native module integrations later require painful migrations. This is a pre-condition phase, not optional.

**Delivers:** Correct database schema aligned to PRD v2.0, Expo project initialized with Development Build, Supabase project configured, CI/CD scaffolding (EAS Build), Biome linting setup, base RLS infrastructure (user table, shared `is_blocked()` / `is_under_enforcement()` functions).

**Addresses:** Schema alignment for `likes`, `matches`, `interactions`, `dismissals`, `ranking_config`, `ads_engagement`, `subscriptions` tables; removal of `routing_state_for_recipient`; all critical indexes.

**Avoids:** Pitfall 5 (schema drift), Pitfall 12 (Expo managed workflow ejection), Pitfall 2 (RLS enforcement gaps introduced early).

**Research flag:** Standard patterns. No deeper research needed — this is scaffolding and schema work.

---

### Phase 1: Auth and Onboarding

**Rationale:** Authentication and onboarding are prerequisites for every feature. Phone OTP, age gate, profile creation (photos, school selection), and session management must be solid before anything else can be tested. This is also where the photo moderation pipeline decision must be made.

**Delivers:** Working auth flow (age gate → phone OTP → profile → school selection), photo upload to Supabase Storage with provisional moderation, basic profile CRUD, Expo Push token registration, secure session management.

**Addresses:** Age gate (18+ enforcement), phone OTP verification, minimum 3 photos requirement, school selection, progressive onboarding disclosure pattern.

**Avoids:** Pitfall 10 (photo moderation bottleneck at activation), Pitfall 14 (timezone edge case in age verification), Pitfall 15 (Supabase session expiry on mobile), Pitfall 16 (push permission timing — defer prompt to first match moment).

**Research flag:** Needs phase research for selfie verification vendor selection (Veriff vs. Onfido vs. AWS Rekognition; prefer API-based to avoid native SDK dependency). All other patterns are well-documented.

---

### Phase 2: Discovery — Backend First

**Rationale:** The Discovery stack query is the most complex and performance-critical query in the system. Build and benchmark the backend (Postgres function, RLS policies, indexes) before building the swipe UI on top of it. Discovering performance problems after the UI is built means rework. The like-to-match atomic transaction must be built correctly the first time — race conditions here are data corruption bugs.

**Delivers:** `get_discovery_stack` Postgres function with school/block/enforcement/mode/dealbreaker/dismissed filtering, cursor-based pagination; `process-like` Edge Function with atomic match creation and thread bootstrap; `matches` and `interactions` tables with correct unique constraints and indexes; EXPLAIN ANALYZE benchmarks on realistic data.

**Addresses:** Shared-school gating (server-enforced), mutual matching, match creation atomicity, dismissal tracking.

**Avoids:** Pitfall 1 (match race condition), Pitfall 2 (client-side trust bypass), Pitfall 3 (RLS N+1 performance), Pitfall 4 (incomplete block enforcement — block-check function built here).

**Research flag:** Standard patterns for Postgres transactions and RLS. No phase research needed.

---

### Phase 3: Discovery — Swipe UI

**Rationale:** With the backend proven, build the swipe card UI. Separating backend and UI phases allows performance benchmarking the backend in isolation and lets UI development focus on animation quality without debugging query issues simultaneously. Custom swipe deck using Reanimated v3 + Gesture Handler v2 is non-negotiable — no existing package supports the New Architecture.

**Delivers:** Custom swipe deck component (Reanimated v3 worklets, UI-thread animation, 60fps target), card photo carousel with tap-zone navigation, swipe overlays (like/nope/save indicators), save/bookmark interaction distinct from like, match modal on mutual match, empty state with filter guidance, connection state handling.

**Addresses:** Table-stakes swipe UX, photo carousel, save/bookmark feature, empty state for small school pools.

**Avoids:** Pitfall 7 (swipe animation performance on Android — test on Pixel 3a equivalent throughout), Pitfall 8 (stack exhaustion UX), Pitfall 13 (save vs. like confusion — clear icon differentiation required).

**Research flag:** Standard patterns. Reanimated v3 worklet documentation is thorough.

---

### Phase 4: Messaging

**Rationale:** Messaging depends on matches existing. It is the highest-engagement feature in the app and must work reliably before anything else. Realtime delivery, correct message ordering, and block/unmatch cascades are table stakes — not polish.

**Delivers:** Realtime chat (Supabase Realtime per-thread subscription, REST-first on reconnect), message delivery indicators, thread list with unread counts, block cascade Edge Function, unmatch Edge Function, report submission flow, push notifications (match alert + new message), icebreaker prompts.

**Addresses:** Real-time messaging (table stakes), delivery indicators, block, report, push notifications, icebreaker prompts (differentiator).

**Avoids:** Pitfall 6 (Realtime channel limits and message ordering — subscribe only to active thread + global notification channel), Pitfall 4 (incomplete block — unmatch cascade must cover all surfaces), Pitfall 9 (enforcement not checked at action time — message-send RLS policy includes enforcement check).

**Research flag:** Standard patterns. Supabase Realtime Postgres Changes pattern is well-documented. No phase research needed.

---

### Phase 5: Explore and Likes

**Rationale:** Explore is a critical retention feature for small-school users who exhaust the Discovery stack quickly. The weighted ranking algorithm must be implemented as a Postgres function with weights stored in `ranking_config` (tunable without redeploy). Likes tab completes the engagement loop by showing social proof (who liked me, my matches).

**Delivers:** Explore grid feed with `get_explore_feed` Postgres function and weighted scoring, Likes tab (My Likes, blurred Liked Me grid for free users, Matches list), bookmarks/saved profiles view, mode status toggle (looking/found/friends) with Discovery removal, school-gating enforcement in Explore (shared with Discovery RLS patterns).

**Addresses:** Explore tab (differentiator), Explore ranking algorithm (tunable weights), Likes tab (engagement loop), mode status (differentiation from dating apps), blurred Liked Me (monetization setup).

**Avoids:** Pitfall 4 (block must apply to Explore and Likes queries — covered by shared `is_blocked()` function), Pitfall 3 (RLS performance — use same service-role + manual filter pattern as Discovery).

**Research flag:** Standard patterns. Ranking algorithm is a Postgres function — no external research needed.

---

### Phase 6: Trust, Safety, and Verification

**Rationale:** The enforcement escalation system, selfie verification, and advanced moderation features are on top of a working core product. Building them here (not earlier) means they can be tested against real user actions rather than stubs. The report flow and enforcement state integration in messaging/like/match operations must be wired in here if not already included in earlier phases.

**Delivers:** Enforcement escalation (warning → 48h DM ban → 7-day suspension → permanent ban), `process-report` Edge Function with admin queue, selfie verification integration with external API, verified badge on profiles, `is_under_enforcement()` function wired into all action RLS policies (message send, like, match creation), moderation audit log.

**Addresses:** Graduated enforcement (differentiator vs. binary ban), selfie verification (differentiator), complete reporting flow (table stakes for app store compliance).

**Avoids:** Pitfall 2 (client-side trust bypass — integration tests for direct API enforcement), Pitfall 9 (enforcement not checked at action time).

**Research flag:** Needs phase research to select selfie verification vendor and evaluate Expo config plugin availability vs. API-only approach.

---

### Phase 7: Monetization and Ads

**Rationale:** Monetization requires an engaged user base to generate revenue. Ads integration should be the last phase because the AdMob SDK adds startup latency, requires ATT consent flow on iOS, and can interfere with swipe gestures if not carefully isolated. RevenueCat integration is lower risk and can ship first. Ads must remain in a separate module so they can be disabled during development and testing.

**Delivers:** RevenueCat subscription integration (paid tier entitlement), Liked Me full reveal (paid), Advanced filters (paid), Profile boost (paid consumable), AdMob integration with engagement gating (10 swipes OR first match before ads appear), ATT consent flow (iOS), ads in separate module (can be disabled).

**Addresses:** Paid features (revenue), ads (revenue), engagement gating (ads do not interrupt core trust interactions).

**Avoids:** Pitfall 11 (ads SDK breaking core UX — kept in separate module, deferred to last), Pitfall 12 (Expo workflow ejection — use Development Builds throughout, verify Expo config plugin for AdMob before committing).

**Research flag:** Needs phase research on current AdMob Expo config plugin status and ATT compliance requirements at time of implementation. Both change frequently.

---

### Phase 8: Polish and Optimization

**Rationale:** Performance optimization, accessibility, analytics instrumentation, and edge case handling come after all features work. This includes discovery query optimization if needed at scale, image pipeline tuning, and E2E test coverage for critical user flows.

**Delivers:** Accessibility pass, performance profiling and optimization, analytics instrumentation (Supabase logs + custom events), E2E test coverage (Maestro), edge state handling (empty states, error states, network degradation, background/foreground transitions), OTA update strategy.

**Avoids:** All pitfalls via regression testing at this phase.

**Research flag:** Standard patterns. No phase research needed.

---

### Phase Ordering Rationale

- Schema alignment must precede all feature work — drifted schema causes wasted effort and rework.
- Auth is a prerequisite for every feature that involves user identity.
- Discovery backend must precede Discovery UI — performance problems found late cost more.
- Messaging depends on matches; matches depend on Discovery — strict sequential dependency.
- Explore and Likes are parallel tracks that do not block the core loop but should ship before monetization to establish engagement.
- Trust and safety infrastructure is partially built in early phases (block, enforcement RLS policies) but the full escalation system and selfie verification come after the core loop works.
- Ads and monetization ship last to avoid SDK complexity contaminating core feature development and to ensure the user base exists to generate revenue.

---

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 1 (Auth/Onboarding):** Selfie verification vendor selection — Veriff, Onfido, AWS Rekognition. Must determine API-only vs. SDK approach before committing. Research current pricing, Expo compatibility, and liveness detection capabilities.
- **Phase 6 (Trust and Verification):** Same vendor selection applies with full implementation scope. ATT compliance requirements also need verification at implementation time.
- **Phase 7 (Monetization/Ads):** AdMob Expo config plugin compatibility with current Expo SDK version, current ATT prompt requirements, and RevenueCat React Native SDK version compatibility all change frequently. Verify before starting phase.

Phases with standard, well-documented patterns (can skip `/gsd:research-phase`):

- **Phase 0 (Foundation):** Schema design and Expo project setup — authoritative docs are thorough.
- **Phase 2 (Discovery Backend):** Postgres transactions and RLS are well-documented. The `rpc()` pattern for complex queries is a standard Supabase pattern.
- **Phase 3 (Discovery UI):** Reanimated v3 + Gesture Handler v2 documentation is thorough; custom swipe deck is a well-traveled path.
- **Phase 4 (Messaging):** Supabase Realtime Postgres Changes pattern is well-documented.
- **Phase 5 (Explore/Likes):** Postgres weighted scoring function is straightforward. No novel patterns.
- **Phase 8 (Polish):** Optimization and accessibility are project-specific; no domain research needed.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Architecture choices are HIGH confidence (Expo + Supabase is a proven combination for this use case). Version numbers are MEDIUM — web verification was unavailable; run `npm view` before project init. |
| Features | MEDIUM | Table stakes features are HIGH confidence (well-established swipe app patterns). Competitor analysis for RoomSync/Roomi is LOW confidence — smaller products that may have changed. PRD is authoritative. |
| Architecture | MEDIUM | Core patterns (RLS, Edge Functions, Realtime, cursor pagination) are HIGH confidence. Supabase-specific limits (Realtime channel counts, Edge Function cold starts) are MEDIUM — needs monitoring post-launch. |
| Pitfalls | MEDIUM | Critical pitfalls (race condition, RLS performance, client-side bypass, block completeness) are HIGH confidence based on established distributed systems patterns. Supabase-specific behaviors (PgBouncer advisory lock behavior, Realtime reconnect ordering) are MEDIUM — verify against current Supabase docs before implementing. |

**Overall confidence:** MEDIUM

Research is sufficient to begin roadmap planning and initial implementation. The architecture is sound. Gaps are known and addressable during their respective phases.

### Gaps to Address

- **Version numbers:** Verify all package versions via `npm view` before project initialization. Expo SDK 53 may be available; use latest stable.
- **Selfie verification vendor:** Research and commit to a vendor (Veriff, Onfido, or AWS Rekognition) during Phase 1 planning. Prefer API-based over SDK-based.
- **Supabase Realtime limits:** Verify current channel limits and reconnection behavior against live Supabase documentation before Phase 4. The "REST-first on reconnect" pattern is the safe default regardless.
- **AdMob Expo config plugin:** Verify current compatibility with the selected Expo SDK version before Phase 7. Plugin status changes with each Expo SDK release.
- **DB_SCHEMA.md reconciliation:** Must happen in Phase 0 before any implementation. The schema needs `likes`, `matches`, `interactions`, `dismissals`, `ranking_config`, `ads_engagement`, and `subscriptions` tables added, and `routing_state_for_recipient` removed from threads.
- **ATT compliance requirements:** iOS App Tracking Transparency requirements evolve. Verify current Apple guidelines at Phase 7.

---

## Sources

### Primary (HIGH confidence)
- `docs/PRD.md` v2.0 — authoritative product requirements, feature rules, enforcement model
- `docs/ARCHITECTURE.md` — baseline architecture reference
- `docs/DB_SCHEMA.md` — current database schema (note: requires reconciliation with PRD v2.0)
- `docs/TRUST_AND_SAFETY.md` — enforcement escalation rules
- `.planning/PROJECT.md` — project context

### Secondary (MEDIUM confidence)
- Expo documentation (expo.dev) — Expo Router, EAS Build, Development Builds, managed workflow
- Supabase documentation (supabase.com) — RLS, Realtime, Edge Functions, Auth, Storage
- React Native community consensus — Reanimated v3, Gesture Handler v2, Zustand, TanStack Query
- Tinder/Bumble/Hinge feature knowledge — table stakes swipe app patterns
- PostgreSQL documentation — RLS behavior, transaction isolation, query optimization

### Tertiary (LOW confidence, needs validation)
- RoomSync, Roomi, Dibs competitor feature sets — smaller products, may have changed significantly
- Supabase Realtime channel limits at scale — verify against current docs
- AdMob React Native SDK compatibility — verify before Phase 7
- Selfie verification vendor pricing and capabilities — research needed before Phase 1 vendor selection

---

*Research completed: 2026-03-03*
*Ready for roadmap: yes*
