# Room

## What This Is

Room is a roommate-first mobile application for college students (18+) that enables structured roommate discovery through swipe-based browsing, mutual matching, and shared-school gated messaging. Built with React Native (Expo) and Supabase, it brings a Tinder-style experience to finding compatible roommates within your school network.

## Core Value

Users can discover and match with compatible roommates at their school through a trust-verified, consent-driven swipe experience — if two people like each other, they can chat.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Verified onboarding (phone OTP, 3+ photos, selfie verification, school selection)
- [ ] Age gate (18+ enforced at signup)
- [ ] Discovery tab with swipe-based roommate browsing
- [ ] Mutual matching system (both users must like each other)
- [ ] Match modal with auto-created chat thread
- [ ] Shared-school gating (server-enforced)
- [ ] Real-time messaging for matched users
- [ ] Explore tab (grid-based browse of same-school users)
- [ ] Likes tab (My Likes, Liked Me blurred/paid, Matches)
- [ ] Profile management with roommate preferences
- [ ] Discovery filters (school, year, sleep schedule, cleanliness, budget, etc.)
- [ ] Blocking and unmatching with full visibility removal
- [ ] Trust & safety system (reporting, enforcement escalation)
- [ ] Ads integration (gated by engagement thresholds)
- [ ] Monetization (see who liked you, advanced filters, profile boost)
- [ ] Explore ranking algorithm (completeness, activity, verification weighted)

### Out of Scope

- Housing marketplace — not a listings platform
- Dorm planning tools — beyond roommate discovery
- Cross-school unrestricted browsing — school-bound communities only
- AI compatibility scoring — manual preference matching for v1
- Dating features — roommate-first, not a dating app

## Context

- Comprehensive PRD exists at `docs/PRD.md` (Version 2.0 — Matching-Based Architecture)
- Supporting docs: `docs/ARCHITECTURE.md`, `docs/DB_SCHEMA.md`, `docs/DECISIONS.md`, `docs/TRUST_AND_SAFETY.md`, `docs/UI_UX_SPEC.md`
- PRD uses mutual matching model (both users must like each other before messaging)
- No cold messaging, no message requests — matched threads go directly to Inbox
- Swipe-up-to-message removed in PRD v2.0
- Selfie verification is optional but provides verified badge and ranking boost
- Messaging approach (Supabase Realtime vs third-party vs custom) to be decided during research

## Constraints

- **Platform**: React Native with Expo (iOS + Android)
- **Backend**: Supabase (Postgres + Auth + Realtime + Edge Functions)
- **Age**: 18+ only, no exceptions — birthdate validated server-side
- **School gating**: All visibility and messaging must be server-enforced, never client-only
- **Trust model**: Mutual match required for messaging — no cold DMs
- **Privacy**: No live GPS tracking, account hard-deletion within 30 days

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mutual matching (not open messaging) | Reduces harassment, spam, legal exposure | — Pending |
| React Native + Expo | Cross-platform mobile from single codebase | — Pending |
| Supabase backend | Postgres + Auth + Realtime built-in, fast iteration | — Pending |
| Grid browse for Explore (not swipes) | Differentiates from Discovery, better for casual browsing | — Pending |
| Full PRD scope for v1 | Complete product experience for launch | — Pending |
| Messaging tech TBD | Research will inform real-time messaging approach | — Pending |

---
*Last updated: 2026-03-03 after initialization*
