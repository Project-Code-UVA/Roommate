# Room

**A roommate-first mobile app for college students (17+).** Swipe-based discovery, shared-school gated messaging, and a secondary Explore feed — built on Expo/React Native and Supabase.

Room is not a dating app, not a housing marketplace, and not a global social network. It's a structured, school-bound, trust-forward way for students to find compatible roommates.

---

## Table of Contents

- [What Room Does](#what-room-does)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database & Backend](#database--backend)
- [Core Features](#core-features)
- [Trust & Safety](#trust--safety)
- [Architecture Notes](#architecture-notes)
- [Testing](#testing)
- [Documentation](#documentation)
- [FAQ](#faq)

---

## What Room Does

| Tab | Purpose |
|---|---|
| **Discovery** | Roommate-first swipe stack. Right = like, left = dismiss, up = super-like, double-tap = expand profile. |
| **Explore** | School-bound social browsing. Ranked, filtered, never global. |
| **Likes** | See who liked you and who you liked back. |
| **Messages** | Inbox + Message Requests, gated by shared-school + enforcement state. |
| **Profile** | Your info, photos, schools, preferences, verification, settings. |

**Hard rules** (enforced server-side, not just client-side):

- Users must be **17+** with a verified birthdate.
- Messaging requires **at least one shared school** between sender and recipient.
- Verified users (selfie-verified) route DMs to **Inbox**; unverified to **Message Requests**.
- Blocks fully hide a user from Discovery, Explore, Likes, and Messages.
- Users in "Looking for friends" or "Found roommate" mode are removed from the Discovery stack.

---

## Tech Stack

### Mobile Client

| Layer | Tool | Why |
|---|---|---|
| Framework | **Expo SDK 52** (React Native 0.76, New Architecture enabled) | Cross-platform iOS-first, OTA updates, managed native modules. |
| Language | **TypeScript 5.3** | Type safety across services, hooks, and components. |
| Routing | **expo-router 4** (typed routes) | File-based routing in `app/`. |
| Styling | **NativeWind 4** + **Tailwind CSS 3.4** | Utility classes that compile to RN styles. |
| Animation | **react-native-reanimated 3.16** + **gesture-handler 2.20** | 60fps swipe stack, gesture-driven sheets. |
| Bottom sheets | **@gorhom/bottom-sheet 5** | Composer, filters, overflow menus. |
| State | React Context + custom hooks (no Redux) | Lightweight; Supabase realtime is the source of truth. |
| Navigation | **@react-navigation 7** (under expo-router) | Tab + stack navigators. |
| Images | **expo-image**, **expo-image-picker**, **expo-image-manipulator** | Cached image rendering + photo upload pipeline (pick → resize → upload). |
| Notifications | **expo-notifications** + **expo-device** | Push notification tokens registered server-side. |
| Misc | **expo-haptics**, **expo-blur**, **expo-linear-gradient**, **expo-clipboard**, **react-native-confetti-cannon** | UX polish. |

### Backend

| Layer | Tool |
|---|---|
| Database | **Postgres** (via Supabase) with Row-Level Security on every table |
| Auth | **Supabase Auth** — phone OTP |
| Storage | **Supabase Storage** — photos, selfie verification artifacts |
| Realtime | **Supabase Realtime** — chat messages, reactions, read receipts |
| Server logic | **Supabase Edge Functions** (Deno) — currently `send-push-notification`; trust/safety logic lives in Postgres functions + RLS |
| Migrations | 59+ SQL migrations in `supabase/migrations/` |

### Tooling

- **Jest** + **@testing-library/react-native** — unit/component tests (`__tests__/`)
- **Maestro** — mobile E2E flows (`maestro/` flows + skill bindings)
- **Supabase CLI** — local DB, migration generation, type generation
- **expo lint** — linting

---

## Project Structure

```
Roommate/
├── app/                      # expo-router file-based routes
│   ├── (auth)/               # Onboarding: welcome → phone → OTP → name → birthday → photos → school → preferences → bio
│   ├── (tabs)/               # Main tabs: discovery (index), explore, likes, messages, profile
│   ├── chat/                 # Chat thread screens
│   ├── profile/              # Full profile views
│   ├── filters.tsx           # Discovery/explore filter sheet
│   └── settings.tsx
├── src/
│   ├── components/
│   │   ├── chat/             # Message list, composer, reactions, GIF picker, reply UI
│   │   ├── discovery/        # Swipe card, stack, photo carousel, action buttons
│   │   ├── explore/          # Feed cards, profile expanded view
│   │   ├── likes/            # Likes grid, footer, ad slots
│   │   ├── match/            # Match modal, confetti
│   │   ├── onboarding/       # Step UIs for the (auth) flow
│   │   ├── profile/          # Profile sections, photo manager, edit forms
│   │   ├── safety/           # Block, report, enforcement banners
│   │   ├── settings/
│   │   ├── verification/     # Selfie verification UI
│   │   ├── shared/           # Cross-feature primitives
│   │   └── ui/               # Buttons, inputs, sheets, tokens
│   ├── hooks/                # use-auth, use-discovery-stack, use-chat-messages, use-likes, use-explore-feed, use-enforcement, etc.
│   ├── services/             # One module per domain — calls Supabase, returns typed data
│   │   ├── auth-service.ts, account-service.ts
│   │   ├── discovery-service.ts, explore-service.ts, filter-service.ts
│   │   ├── thread-service.ts, message-service.ts, gif-service.ts
│   │   ├── likes-service.ts, match-service.ts
│   │   ├── profile-service.ts, photo-service.ts, school-service.ts
│   │   ├── block-service.ts, report-service.ts, enforcement-service.ts
│   │   ├── selfie-service.ts, notification-service.ts, push-token-service.ts
│   │   └── thread-preview.ts
│   ├── stores/               # Lightweight client state
│   ├── contexts/             # Auth context, theme, etc.
│   ├── lib/                  # Supabase client, helpers, constants
│   ├── constants/
│   └── types/                # Generated Supabase types + app types
├── supabase/
│   ├── migrations/           # 58+ ordered SQL migrations
│   ├── functions/            # Edge functions (send-push-notification)
│   └── seed.sql
├── docs/
│   ├── PRD.md                # Product requirements (source of truth)
│   ├── ARCHITECTURE.md
│   ├── DB_SCHEMA.md
│   ├── DECISIONS.md
│   ├── EDGE_CASES.md, EDGE_CASE_FIXES.md
│   ├── TRUST_AND_SAFETY.md
│   └── UI_UX_SPEC.md
├── __tests__/                # Jest tests + setup
├── qa/                       # Manual QA scripts and notes
├── assets/                   # Icons, splash, fonts
├── CLAUDE.md                 # Engineering execution guide for AI agents
├── AGENTS.md
├── app.json                  # Expo config
├── tailwind.config.js, global.css, nativewind-env.d.ts
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- **Node.js 20+** and **npm**
- **Xcode 15+** (for iOS) or **Android Studio** (for Android)
- **Expo CLI** is invoked via `npx`; no global install required
- **Supabase project** — either a hosted project or local Supabase via the Supabase CLI

### Install

```bash
git clone https://github.com/yxf9tv/Roommate.git
cd Roommate
npm install
```

### Configure

Create a `.env` file (or set values in `app.json` `extra`) with your Supabase credentials. See [Environment Variables](#environment-variables).

### Run

```bash
# Metro + dev menu
npm run start

# Native builds
npm run ios       # requires Xcode
npm run android   # requires Android Studio

# Web (limited — primary target is iOS/Android)
npm run web
```

### Tests & Lint

```bash
npm test          # Jest watch mode
npm run lint      # expo lint
```

---

## Environment Variables

Room reads Supabase config from `expo-constants`. The client expects:

| Var | Purpose |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (RLS enforced) |

Server-only secrets (used by Edge Functions and never shipped to the client):

| Var | Purpose |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server key for Edge Functions |
| `EXPO_ACCESS_TOKEN` | Used by `send-push-notification` to deliver via Expo Push API |

> Never commit `.env`. Never trust the client for messaging eligibility, visibility rules, or enforcement state.

---

## Database & Backend

The schema lives in [`supabase/migrations/`](supabase/migrations/) — 59+ ordered SQL migrations, applied in numeric order (`00001_create_enums.sql` → `00059_unique_demo_cover_photos.sql`).

### Apply migrations locally

```bash
npx supabase start                # local Postgres + Studio
npx supabase db reset             # apply all migrations from scratch
npx supabase db push              # push to linked remote project
```

### Generate TypeScript types

```bash
npx supabase gen types typescript --linked > src/types/database.types.ts
```

### Edge Functions

```bash
npx supabase functions deploy send-push-notification
```

Server-side guarantees enforced in DB (RLS + RPC):

- Shared-school messaging gate
- Enforcement state checks (warning / 48h ban / 7-day suspension / permanent)
- Block visibility (hidden from Discovery, Explore, Likes, Messages)
- Ads gating thresholds (≥10 swipes or first message sent)
- Ranking weights for Explore (30/25/20/15/10 split — see PRD §5)

---

## Core Features

### Discovery (roommate-first)

- Card stack with photo carousel — swipe left/right, swipe up = super-like, double-tap = expand full profile
- Last photo loops back to first
- Mode-aware: users in "Looking for friends" or "Found roommate" are excluded from the stack
- Filters: age range, school, distance, lifestyle dealbreakers (soft + hard)
- Ad slot every ~10 cards, gated by engagement

### Explore (school-bound)

- Only shows users sharing at least one school
- Weighted ranking: profile completeness (30%), recent activity (25%), verification (20%), engagement quality (15%), freshness (10%)
- Ranking weights are tunable via config — never pure popularity
- Tap any card to open the same full-profile view used in Discovery

### Likes

- Who liked you / who you liked
- Ad placement in footer only — never blocking the action

### Messaging

- Inbox vs Message Requests routing based on selfie verification status
- Realtime delivery, typing indicators, read receipts
- Reactions, reply threading, edit, unsend
- Photo + GIF attachments (GIF search via Tenor/Giphy adapter in `gif-service.ts`)
- Tap header avatar to open the other user's profile
- Unread-thread badge on the Messages tab

### Onboarding

Multi-step funnel under `app/(auth)/`: welcome → signup → phone → OTP → name → birthday → gender → school → photos → preferences → nitty-gritty → bio → login. Each step gates the next; partial accounts can't appear in Discovery/Explore.

### Trust & Safety

- Reporting reasons: Harassment, Sexual content, Hate speech, Spam, Impersonation, Underage, Safety threat, Other
- Enforcement escalation: warning → 48h DM ban → 7-day suspension → permanent ban
- Block fully hides the blocker and blocked from each other across all surfaces
- Selfie verification optional but boosts ranking + routes DMs to Inbox

---

## Architecture Notes

- **Server is source of truth.** The client never enforces messaging eligibility, visibility, or moderation. RLS + RPC functions in Postgres do.
- **Services layer (`src/services/`)** wraps every Supabase call. Components and hooks never import the Supabase client directly — they go through a service.
- **Hooks (`src/hooks/`)** orchestrate services + realtime subscriptions and expose data to components.
- **No Redux.** Local component state + React Context for cross-cutting concerns (auth, theme). Supabase Realtime drives live data.
- **Immutable patterns.** New objects, never mutate. Helps with React render correctness and concurrency safety.
- **Small, focused files.** ~200–400 lines typical. Components/services organized by feature domain.

---

## Testing

- **Unit/component**: Jest + `@testing-library/react-native`. Run `npm test`.
- **E2E**: Maestro flows. The `/maestro` skill scaffolds and runs flows against the iOS Simulator or Android emulator.
- **Coverage target**: 80%+ across unit, integration, and critical-path E2E.

---

## Documentation

The canonical specs live in `docs/`. Read these before making non-trivial changes:

- [`docs/PRD.md`](docs/PRD.md) — product behavior; the PRD overrides any other instruction
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — services and server-side guarantees
- [`docs/DB_SCHEMA.md`](docs/DB_SCHEMA.md) — table-by-table schema
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — recorded architectural decisions
- [`docs/TRUST_AND_SAFETY.md`](docs/TRUST_AND_SAFETY.md) — moderation model
- [`docs/EDGE_CASES.md`](docs/EDGE_CASES.md) — edge cases and how they're handled
- [`docs/UI_UX_SPEC.md`](docs/UI_UX_SPEC.md) — visual + interaction spec
- [`CLAUDE.md`](CLAUDE.md) — execution guide for AI agents working in this repo

---

## FAQ

**Why is messaging gated by shared school?**
Trust. Room is not a global open network. Restricting messaging to people who share a school keeps interactions accountable and contextual. The gate is enforced server-side via RLS — clients can't bypass it.

**Why phone OTP instead of email?**
Phone numbers are harder to mass-create than email addresses, which raises the cost of spam/abuse signup. Verified phone is also a prerequisite for several enforcement actions.

**Why are there two browsing tabs (Discovery + Explore)?**
Discovery is the primary roommate-matching surface — narrow filters, swipe mechanics, mode-aware. Explore is a softer, school-bound social browsing layer for students who want to meet people but aren't actively roommate-hunting.

**How does selfie verification change the experience?**
Verified users get a badge, route their first-DMs to the recipient's **Inbox** (not Message Requests), and get a ranking boost in Explore. It's optional.

**What happens when a user picks "Found roommate" or "Looking for friends"?**
They're removed from the Discovery stack so other users don't waste swipes on someone who's done. They can still appear in Explore (Friends mode) and message existing threads.

**Why React Native + Expo instead of native iOS/Android?**
iOS-first launch with Android parity. Expo SDK 52 with the New Architecture gives near-native performance on the swipe stack (Reanimated + Gesture Handler) while keeping a single codebase, OTA updates, and a fast dev loop.

**Why Supabase instead of a custom backend?**
Postgres + RLS gives us strong server-side guarantees with very little glue code. Auth, Storage, Realtime, and Edge Functions are first-class. The trust/safety logic that needs to live server-side fits cleanly into RLS policies + RPC functions.

**Where does push notification logic live?**
The client registers a device token via `push-token-service.ts`. The Edge Function `send-push-notification` (Deno) calls the Expo Push API on relevant DB events.

**How do I add a new migration?**
```bash
npx supabase migration new <name>
# edit the generated SQL
npx supabase db reset    # locally
npx supabase db push     # remote
```
Then regenerate types (`supabase gen types typescript --linked`).

**Is there an admin/moderation UI?**
Not in this repo. Moderation actions today are SQL/RPC-driven. A separate admin surface is planned.

---

## License

Private. All rights reserved.
