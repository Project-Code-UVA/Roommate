# Roadmap: Room

## Overview

Room delivers a roommate-first swipe discovery app for college students, built on a foundation of server-enforced trust (shared-school gating, mutual matching, enforcement escalation). The roadmap follows the rigid dependency chain: schema and infrastructure first, then auth/onboarding, then the Discovery engine (backend before UI to catch performance issues early), then messaging (depends on matches), then secondary surfaces (Explore, Likes), then the full trust/safety system, then cross-cutting concerns (notifications, privacy), and finally monetization. Each phase delivers a coherent, testable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Schema** - Project scaffold, database schema, RLS infrastructure, and shared trust functions
- [ ] **Phase 2: Auth & Onboarding** - Age-gated signup, phone verification, photo upload, school selection, and progressive onboarding
- [ ] **Phase 3: Discovery Engine** - Server-side discovery stack query, filtering, matching logic, and mode/dealbreaker enforcement
- [ ] **Phase 4: Swipe UI & Match Experience** - Custom swipe deck, photo carousel, save/bookmark, and match modal
- [ ] **Phase 5: Messaging** - Real-time chat, delivery indicators, reactions, threading, media, block/report from chat
- [ ] **Phase 6: Explore & Likes** - Grid browse with weighted ranking, Likes tab with My Likes/Liked Me/Matches
- [ ] **Phase 7: Trust, Safety & Verification** - Enforcement escalation, reporting system, selfie verification, verified badge
- [ ] **Phase 8: Notifications & Privacy** - Push notifications for matches/messages, privacy controls, account deletion
- [ ] **Phase 9: Monetization & Ads** - Subscriptions, paid features, ad integration with engagement gating

## Phase Details

### Phase 1: Foundation & Schema
**Goal**: A runnable Expo project connected to Supabase with the correct PRD v2.0 database schema and shared trust infrastructure in place
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04
**Success Criteria** (what must be TRUE):
  1. Expo Development Build runs on iOS and Android simulators with Supabase client connected
  2. All PRD v2.0 tables exist in Supabase (users, profiles, schools, user_schools, likes, matches, dismissals, saves, threads, messages, reports, blocks, ranking_config, ads_engagement, subscriptions)
  3. Row Level Security policies enforce shared-school visibility on user-facing tables
  4. Shared `is_blocked()` Postgres function correctly hides blocked users across all queries that reference it
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Expo project scaffold with NativeWind, Supabase client, and 5-tab navigation
- [ ] 01-02-PLAN.md — Supabase project creation, PRD v2.0 schema migrations, and school seed data
- [ ] 01-03-PLAN.md — RLS policies, shared trust functions (is_blocked, shares_school), and TypeScript type generation

### Phase 2: Auth & Onboarding
**Goal**: Users can create a verified account and complete onboarding to become eligible for Discovery and messaging
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-08
**Success Criteria** (what must be TRUE):
  1. User under 18 is blocked at signup and cannot proceed
  2. User can verify phone number via OTP and create an account
  3. User can upload at least 3 photos and complete required profile fields (name, year, bio)
  4. User can select at least one school during onboarding
  5. User who has not completed all verification steps cannot appear in Discovery, Explore, or send messages
**Plans**: 5 plans

Plans:
- [ ] 02-00-PLAN.md — Wave 0 test infrastructure: shared mocks and test stubs for all Phase 2 services/hooks
- [ ] 02-01-PLAN.md — Schema migrations, auth context, route protection, services, and shared onboarding components
- [ ] 02-02-PLAN.md — Welcome screen, age gate (birthday), and phone OTP verification
- [ ] 02-03-PLAN.md — Name, gender, and school selection onboarding screens
- [ ] 02-04-PLAN.md — Photo upload, bio entry, and onboarding completion flow

### Phase 3: Discovery Engine
**Goal**: Server-side infrastructure delivers a filtered, school-gated discovery stack with atomic mutual matching and mode/dealbreaker enforcement
**Depends on**: Phase 2
**Requirements**: DISC-05, DISC-06, DISC-07, DISC-08, DISC-09, DISC-10, MTCH-01, MTCH-04
**Success Criteria** (what must be TRUE):
  1. Discovery stack query returns only profiles sharing at least one school with the requesting user (server-enforced)
  2. User can set roommate preference filters with preference vs. dealbreaker distinction, and dealbreakers exclude profiles from the stack
  3. User who sets status to "found roommate" is removed from all other users' Discovery stacks
  4. When both users have liked each other, a match is created atomically with no race conditions
  5. User can unmatch, permanently removing the thread and preventing re-matching
**Plans**: 3 plans

Plans:
- [ ] 03-00-PLAN.md — Wave 0: test stubs, TypeScript types/constants, and schema migrations (dismissal tracking, match soft-delete, GIN index, ranking seeds)
- [ ] 03-01-PLAN.md — Postgres RPC functions: discovery stack query, like+match, unmatch, mode status, dismiss
- [ ] 03-02-PLAN.md — Client services: discovery-service, filter-service, match-service with full test coverage

### Phase 4: Swipe UI & Match Experience
**Goal**: Users can browse and interact with the Discovery stack through a polished swipe interface with photo carousel and match celebration
**Depends on**: Phase 3
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04, MTCH-02, MTCH-03
**Success Criteria** (what must be TRUE):
  1. User can swipe left to dismiss and swipe right to like profiles at 60fps
  2. User can save/bookmark a profile as a distinct action from liking
  3. User can tap photo zones to navigate the image carousel, which loops from last photo back to first
  4. User sees an "It's a Match" modal when a mutual match occurs, with a messaging thread auto-created
**Plans**: 3 plans

Plans:
- [ ] 04-00-PLAN.md — Wave 0: test stubs, @testing-library/react-native, reanimated/haptics mocks
- [ ] 04-01-PLAN.md — Discovery hook, swipe card deck, photo carousel, action buttons, empty state
- [ ] 04-02-PLAN.md — Match modal with confetti/haptics, profile bottom sheet, photo viewer, Discovery screen wiring

### Phase 5: Messaging
**Goal**: Matched users can communicate in real-time with rich messaging features and in-chat safety controls
**Depends on**: Phase 4
**Requirements**: MSG-01, MSG-02, MSG-03, MSG-04, MSG-05, MSG-06, MSG-07, MSG-08, MSG-09, MSG-10
**Success Criteria** (what must be TRUE):
  1. User can send and receive text messages in real-time with matched users
  2. User can see timestamps and delivery indicators (sent/delivered) on messages
  3. User can react to messages with emoji and reply to specific messages in a thread
  4. User can send photos and GIFs in chat
  5. User can block or report another user from within the chat, with block causing full visibility removal
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Explore & Likes
**Goal**: Users can browse same-school profiles in a grid view ranked by a weighted algorithm, and view their likes/matches activity
**Depends on**: Phase 5
**Requirements**: EXPL-01, EXPL-02, EXPL-03, EXPL-04, EXPL-05, LIKE-01, LIKE-02, LIKE-03, LIKE-04
**Success Criteria** (what must be TRUE):
  1. User can browse a grid of profiles from shared schools, ranked by the weighted algorithm (completeness, activity, verification, interactions, freshness)
  2. Ranking weights are configurable server-side without code deployment
  3. User can like and save profiles from Explore, with matching rules identical to Discovery
  4. User can view My Likes list, Matches list with last message preview and unread indicator
  5. Free users see blurred Liked Me grid; paid users see revealed identities
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: Trust, Safety & Verification
**Goal**: The platform enforces graduated moderation, comprehensive reporting, and optional selfie verification for trust signals
**Depends on**: Phase 5
**Requirements**: SAFE-01, SAFE-02, SAFE-03, SAFE-04, SAFE-05, SAFE-06, AUTH-07
**Success Criteria** (what must be TRUE):
  1. Shared-school gating is enforced server-side on ALL visibility queries (Discovery, Explore, Likes, Messages) with integration tests proving it
  2. Blocking a user hides them from Discovery, Explore, Likes, and Messages with server enforcement and cross-surface integration tests
  3. User can report with 8 categories (harassment, sexual content, hate speech, spam, impersonation, underage, safety threat, other)
  4. Enforcement escalation works: warning, 48-hour DM ban, 7-day suspension, permanent ban -- and enforcement state is checked before allowing new conversations
  5. User can complete selfie verification and receive a verified badge on their profile
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

### Phase 8: Notifications & Privacy
**Goal**: Users receive timely push notifications for key events and have control over their data and account lifecycle
**Depends on**: Phase 5
**Requirements**: NOTF-01, NOTF-02, PRIV-01, PRIV-02, PRIV-03
**Success Criteria** (what must be TRUE):
  1. User receives push notification when they get a new match
  2. User receives push notification when they get a new message
  3. No live GPS tracking exists; hometown is optional and user-entered
  4. User can delete their account with immediate deactivation and hard deletion within 30 days
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD

### Phase 9: Monetization & Ads
**Goal**: Revenue generation through subscriptions, paid features, and engagement-gated advertising that never interrupts trust interactions
**Depends on**: Phase 6, Phase 7
**Requirements**: PAID-01, PAID-02, PAID-03, PAID-04, PAID-05, PAID-06, PAID-07, PAID-08
**Success Criteria** (what must be TRUE):
  1. User can purchase a subscription to reveal who liked them (full Liked Me reveal)
  2. User can purchase advanced filters and profile boost (temporary ranking increase)
  3. Ads appear approximately every 10 cards in Discovery, in Explore feed, and in Likes footer
  4. Ads do not appear before 10 swipes OR first match, during swipe decision moment, or in message composer
  5. All ads are clearly labeled "Sponsored"
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9
(Phases 6, 7, 8 can run in parallel after Phase 5; Phase 9 depends on 6 and 7)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Schema | 3/3 | Complete | 2026-03-05 |
| 2. Auth & Onboarding | 2/5 | In Progress|  |
| 3. Discovery Engine | 0/3 | Not started | - |
| 4. Swipe UI & Match Experience | 0/3 | Not started | - |
| 5. Messaging | 0/? | Not started | - |
| 6. Explore & Likes | 0/? | Not started | - |
| 7. Trust, Safety & Verification | 0/? | Not started | - |
| 8. Notifications & Privacy | 0/? | Not started | - |
| 9. Monetization & Ads | 0/? | Not started | - |
