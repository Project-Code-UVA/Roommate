# Technology Stack

**Project:** Room (Roommate Discovery App)
**Researched:** 2026-03-03
**Overall Confidence:** MEDIUM (versions need npm verification -- web tools unavailable during research)

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React Native | 0.76+ | Cross-platform mobile runtime | Industry standard for cross-platform mobile. Single codebase for iOS + Android. Large ecosystem. | HIGH |
| Expo | SDK 52+ | Managed workflow, build tooling, OTA updates | Drastically reduces native config. EAS Build for CI/CD. Expo Router for file-based navigation. Prebuild for native module access when needed. | HIGH |
| TypeScript | 5.x | Type safety | Non-negotiable for a codebase with complex business rules (school gating, matching, enforcement). Catches routing/state errors at compile time. | HIGH |

**Version note:** Expo SDK 52 shipped late 2024 with React Native 0.76 (New Architecture default). SDK 53 may be available by now. Run `npm view expo version` to confirm latest before initializing. Always use the latest stable SDK.

### Backend (Supabase)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase | Latest | BaaS (Auth, Database, Realtime, Storage, Edge Functions) | Postgres-native, Row Level Security for server-enforced rules, built-in auth with phone OTP, Realtime for messaging, Edge Functions for custom logic. Perfect for Room's security-first model. | HIGH |
| @supabase/supabase-js | 2.x | Client SDK | Official JS client. Supports Realtime subscriptions, auth hooks, and typed queries. | HIGH |
| PostgreSQL | 15+ (Supabase managed) | Primary database | Supabase runs Postgres. RLS policies enforce shared-school gating, block visibility, and enforcement states at the database level -- exactly what Room requires. | HIGH |
| Supabase Edge Functions | Deno runtime | Server-side business logic | Match creation (atomic), enforcement checks, ranking computation, ads gating. Runs on Deno -- use TypeScript. | HIGH |
| Supabase Auth | Built-in | Phone OTP, session management | Native phone OTP support. Age validation in signup hook. Session tokens for API auth. | HIGH |
| Supabase Storage | Built-in | Photo uploads, media | Signed URLs for privacy. Image transformation built-in. Bucket policies for access control. | HIGH |

### Navigation & Routing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Expo Router | v4+ (ships with SDK 52+) | File-based navigation | Built on React Navigation. File-based routing matches mental model of tab-based app (Discovery, Explore, Likes, Messages, Profile). Deep linking built-in. | HIGH |

**Do NOT use:** React Navigation directly. Expo Router wraps it and provides file-based routing, type-safe routes, and better DX. Only drop to raw React Navigation APIs for edge cases within Expo Router.

### Swipe Mechanics

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| react-native-reanimated | 3.x | Animation engine | Required for performant 60fps swipe animations. Worklet-based -- runs on UI thread. Ships with Expo. | HIGH |
| react-native-gesture-handler | 2.x | Touch/gesture system | Pan gesture detection for swipe left/right/up. Ships with Expo. Used with Reanimated for swipe cards. | HIGH |
| **Custom swipe deck** | N/A | Tinder-style card stack | Build custom using Reanimated + Gesture Handler. See rationale below. | HIGH |

**Why custom over react-native-deck-swiper:** The popular `react-native-deck-swiper` package is poorly maintained (last meaningful update ~2021), uses the old Animated API (not Reanimated), and does not support the New Architecture. Building a custom deck with Reanimated v3 + Gesture Handler v2 gives you:
- 60fps animations on UI thread
- Full control over swipe thresholds, overlay rendering, bookmark gesture
- Photo carousel within cards (tap zones for image navigation)
- Ad card injection every ~10 cards
- Loop behavior on last photo

This is 200-400 lines of code for the core deck component. Well worth owning.

### Real-Time Messaging

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase Realtime | Built-in | Message delivery, presence | Already in the stack. Supports Postgres Changes (listen to message inserts), Broadcast (typing indicators), and Presence (online status). No additional vendor needed for Room's messaging scope. | HIGH |

**Why Supabase Realtime over Stream/SendBird:**
- Room's messaging is match-gated (low volume per user, not group chat at scale)
- All messages already stored in Postgres (needed for moderation, reporting, enforcement)
- Supabase Realtime Postgres Changes triggers on message INSERT -- instant delivery
- Broadcast channel handles typing indicators and delivery confirmations
- Presence tracks online/offline status
- No additional vendor cost, no additional SDK, no data sync complexity
- Stream Chat costs $0.01-0.05/MAU -- unnecessary for a launch product

**When to reconsider:** If Room scales past 100K concurrent messaging users and Supabase Realtime latency degrades, evaluate Stream Chat or a dedicated WebSocket service. This is a post-PMF concern.

**Implementation pattern:**
```typescript
// Subscribe to new messages in a thread
supabase
  .channel(`thread:${threadId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `thread_id=eq.${threadId}`
  }, (payload) => {
    // Append new message to local state (immutably)
  })
  .subscribe()
```

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zustand | 5.x | Global client state | Minimal API, immutable by convention, no boilerplate. Perfect for auth state, active filters, swipe deck state, unread counts. | HIGH |
| TanStack Query (React Query) | 5.x | Server state / caching | Handles Supabase data fetching, caching, pagination, background refetching. Discovery stack pagination, Explore feed, Likes lists. Automatic stale-while-revalidate. | HIGH |

**Why Zustand over Redux:** Redux is overkill for this app. Room has simple client state (current user, filters, UI state) and complex server state (profiles, matches, messages). TanStack Query handles server state. Zustand handles the rest in ~50 lines of store code.

**Why NOT Context API alone:** Context causes re-renders on any state change. Zustand provides selector-based subscriptions -- only components using specific state slices re-render.

### Image Handling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| expo-image | 2.x | Image display | Built on FlashImage (iOS) and Coil (Android). Blurhash placeholders, caching, progressive loading. Much faster than React Native's Image component. Ships with Expo. | HIGH |
| expo-image-picker | 16.x | Photo selection from gallery | Camera and gallery access. Handles permissions. Ships with Expo. | HIGH |
| expo-camera | 16.x | Selfie verification capture | Camera access for selfie verification flow. Ships with Expo. | MEDIUM |
| Supabase Storage | Built-in | Photo storage + CDN | Upload to Supabase Storage buckets. Built-in image transformations (resize, crop) via URL params. Signed URLs for private photos. | HIGH |

**Image pipeline:**
1. User selects photo via `expo-image-picker`
2. Client-side resize to max 1200px width (reduce upload size)
3. Upload to Supabase Storage with user-scoped path
4. Store URL in profile record
5. Display via `expo-image` with Supabase transform params for thumbnails

**For client-side image manipulation (resize before upload):** Use `expo-image-manipulator` (ships with Expo). Resize to 1200px max dimension before upload to reduce bandwidth and storage costs.

### Push Notifications

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| expo-notifications | 17.x | Push notification handling | Expo Push Notification service abstracts APNs + FCM. Free tier generous. Token management built-in. | HIGH |
| Supabase Edge Functions | Built-in | Notification triggers | Edge Function fires on match creation, new message, etc. Calls Expo Push API. | HIGH |

**Architecture:**
1. Client registers for push via `expo-notifications`, gets Expo Push Token
2. Token stored in Supabase `user_devices` table
3. Edge Function (or Postgres trigger + Edge Function) fires on events:
   - New match created -> push to both users
   - New message -> push to recipient (if not in-app)
   - Like received (future paid feature reveal)
4. Edge Function calls Expo Push API (`https://exp.host/--/api/v2/push/send`)

**Do NOT use:** Firebase Cloud Messaging directly. Expo Push Service wraps FCM + APNs and handles token management. Only go direct FCM/APNs if you leave Expo managed workflow.

### Monetization

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| RevenueCat | react-native-purchases 8.x | In-app subscriptions + purchases | Abstracts App Store + Play Store billing. Handles receipt validation, entitlement management, subscription lifecycle. Industry standard for React Native IAP. | HIGH |
| Google AdMob (via react-native-google-mobile-ads) | 14.x | Ad display | Most common mobile ad SDK. Supports banner, interstitial, native ads. Compatible with Expo via config plugin. | MEDIUM |

**RevenueCat for paid features:**
- "See who liked you" -- entitlement check
- "Advanced filters" -- entitlement check
- "Profile boost" -- consumable purchase
- Handles cross-platform subscription state automatically

**AdMob for ads:**
- Banner ads in Explore feed and Likes footer
- Native ads injected into Discovery card stack (every ~10 cards)
- Engagement gating logic in client (10 swipes OR first match before showing ads)
- Server-side ads gating in Edge Function for verification

**Alternative considered:** `expo-ads-admob` was deprecated. Use `react-native-google-mobile-ads` with Expo config plugin.

### Forms & Validation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React Hook Form | 7.x | Form management | Performant (uncontrolled components), minimal re-renders. Used for onboarding flow, profile editing, filters. | HIGH |
| Zod | 3.x | Schema validation | TypeScript-first validation. Shared schemas between client validation and Edge Function validation. Define once, validate everywhere. | HIGH |

### UI Components

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tamagui OR NativeWind | Latest | Styling system | **Tamagui** if you want a component library with built-in primitives (buttons, sheets, dialogs). **NativeWind** (Tailwind for RN) if you prefer utility-first CSS and building custom components. Both work with Expo. Pick one. Recommendation: **NativeWind** for Room -- lighter weight, team likely familiar with Tailwind, full control over design. | MEDIUM |
| react-native-bottom-sheet | 5.x | Bottom sheets | Match modal, report flow, filter panels. Gorhom's bottom sheet is the standard. Uses Reanimated. | HIGH |
| react-native-safe-area-context | 5.x | Safe area handling | Ships with Expo. Required for notch/island handling. | HIGH |
| react-native-mmkv | 3.x | Local storage (fast) | 30x faster than AsyncStorage. Store auth tokens, user preferences, cached filter state. | HIGH |

### Phone OTP & Verification

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase Auth (Phone) | Built-in | Phone OTP | Supabase has native phone OTP via Twilio integration. Configure Twilio credentials in Supabase dashboard. No additional client SDK needed. | HIGH |
| Selfie verification | TBD (external) | Liveness + face match | Options: Veriff, Onfido, or AWS Rekognition. This is a specialized service -- do NOT build custom. Evaluate during implementation phase. | LOW |

### Testing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Jest | 29.x | Unit + integration tests | Ships with Expo. Test business logic, state stores, utility functions. | HIGH |
| React Native Testing Library | 12.x | Component tests | Test UI components in isolation. Render and query by accessibility roles. | HIGH |
| Maestro | Latest | E2E testing | YAML-based, no flaky Appium/Detox setup. Record and replay flows. Best DX for React Native E2E in 2025. | MEDIUM |

### Dev Tooling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| EAS Build | Latest | Cloud builds | Expo Application Services. Build iOS + Android in the cloud. No local Xcode/Android Studio required for most work. | HIGH |
| EAS Update | Latest | OTA updates | Push JS bundle updates without app store review. Critical for fast iteration. | HIGH |
| Biome | 1.x | Linting + formatting | Faster than ESLint + Prettier combined. Single tool. Growing adoption in React Native ecosystem. | MEDIUM |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Navigation | Expo Router | React Navigation (raw) | Expo Router wraps React Navigation with file-based routing, type safety, deep linking. No reason to use raw RN Nav in an Expo project. |
| State (client) | Zustand | Redux Toolkit | Overkill. Room's client state is simple. RTK adds boilerplate without benefit here. |
| State (server) | TanStack Query | SWR | TanStack Query has better pagination support (needed for Discovery/Explore), mutation support, and devtools. |
| Messaging | Supabase Realtime | Stream Chat | Additional cost ($0.01-0.05/MAU), additional SDK, data split between Postgres and Stream. Room's match-gated messaging is low-volume enough for Supabase Realtime. |
| Messaging | Supabase Realtime | SendBird | Same as Stream -- unnecessary vendor for match-gated messaging. |
| Swipe cards | Custom (Reanimated) | react-native-deck-swiper | Unmaintained, old Animated API, no New Architecture support. |
| Styling | NativeWind | Tamagui | Tamagui is heavier, opinionated component library. NativeWind gives Tailwind familiarity with less lock-in. |
| Styling | NativeWind | StyleSheet (raw) | Raw StyleSheet works but lacks utility-class DX. NativeWind compiles to StyleSheet at build time -- zero runtime cost. |
| Image display | expo-image | react-native-fast-image | expo-image is the Expo-maintained successor. FastImage has had maintenance issues. |
| E2E testing | Maestro | Detox | Detox has complex setup, flaky on CI. Maestro is YAML-based, more reliable, easier to maintain. |
| Linting | Biome | ESLint + Prettier | Biome is 10-30x faster. Single config. But ESLint ecosystem is more mature -- acceptable alternative. |
| Ads | AdMob | Meta Audience Network | AdMob has broader fill rates and better React Native support. |
| IAP | RevenueCat | react-native-iap (raw) | RevenueCat handles receipt validation, entitlements, cross-platform state, analytics. Raw IAP requires building all of this. |

---

## Full Dependency List

```bash
# Core
npx create-expo-app@latest room --template tabs
npx expo install expo-router expo-image expo-image-picker expo-image-manipulator expo-camera expo-notifications

# Supabase
npm install @supabase/supabase-js

# State Management
npm install zustand @tanstack/react-query

# Animations & Gestures (may already ship with Expo)
npx expo install react-native-reanimated react-native-gesture-handler

# UI
npm install nativewind tailwindcss
npx expo install react-native-safe-area-context @gorhom/bottom-sheet react-native-mmkv

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# Monetization
npm install react-native-purchases react-native-google-mobile-ads

# Dev
npm install -D typescript @types/react jest @testing-library/react-native
npm install -D @biomejs/biome
```

**Note:** Run `npx expo install` for Expo-compatible packages to ensure correct version pinning. Versions listed above are approximate -- Expo SDK pins compatible versions automatically.

---

## Architecture Decisions Embedded in Stack

1. **Supabase RLS = server-side enforcement.** Row Level Security policies on Postgres enforce shared-school gating, block visibility, and enforcement states. This is not optional -- it is the primary mechanism for Room's trust model. Every table touching user visibility must have RLS policies.

2. **Edge Functions for atomic operations.** Match creation must be atomic (check mutual like, create match, create thread -- all in one transaction). Edge Functions call Postgres RPCs (stored procedures) for atomicity.

3. **Supabase Realtime for messaging eliminates data split.** Messages live in Postgres (queryable, reportable, moderatable). Realtime delivers them instantly. No sync layer between a chat vendor and your database.

4. **Expo managed workflow with prebuild escape hatch.** Stay in managed workflow as long as possible. Use config plugins for native modules (AdMob, RevenueCat). Only eject to bare workflow if absolutely forced -- and Expo prebuild makes this recoverable.

5. **TanStack Query as the caching layer.** Discovery card stack and Explore feed are paginated server data. TanStack Query handles prefetching next pages, cache invalidation on filter change, and background refresh. Do not build custom caching.

---

## Version Verification Needed

**IMPORTANT:** Web research tools were unavailable during this research session. All version numbers are based on training data (cutoff May 2025). Before initializing the project, verify:

```bash
# Run these to confirm latest versions
npm view expo version
npm view @supabase/supabase-js version
npm view zustand version
npm view @tanstack/react-query version
npm view react-native-reanimated version
npm view nativewind version
npm view react-native-purchases version
npm view react-native-google-mobile-ads version
npm view @biomejs/biome version
```

If Expo SDK 53+ has shipped, use it. The stack recommendations are architecture-level and remain valid regardless of minor version changes.

---

## Sources

- Training data knowledge (May 2025 cutoff) -- MEDIUM confidence on versions
- Expo documentation (expo.dev/docs) -- HIGH confidence on architecture patterns
- Supabase documentation (supabase.com/docs) -- HIGH confidence on Realtime/RLS patterns
- React Native community consensus -- HIGH confidence on library choices (Reanimated, Gesture Handler, Zustand, TanStack Query)

All version numbers should be verified against npm registry before project initialization.
