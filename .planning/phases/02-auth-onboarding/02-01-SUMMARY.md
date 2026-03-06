---
phase: 02-auth-onboarding
plan: 01
subsystem: auth
tags: [supabase-auth, expo-router, phone-otp, storage, onboarding, react-context]

requires:
  - phase: 01-foundation-schema
    provides: "Expo scaffold, Supabase client, database schema (users, profiles, photos, schools, user_schools tables)"
provides:
  - "SessionProvider with session, loading, and onboarding completion state"
  - "Auth guard routing: unauthenticated -> welcome, not onboarded -> onboarding, onboarded -> tabs"
  - "Onboarding progress persistence via AsyncStorage"
  - "Service layer: auth, photos, schools, profiles"
  - "Shared components: ProgressBar, StepContainer"
  - "Schema migration: onboarding_completed, gender, show_gender, age validation trigger"
  - "Placeholder screens for all 8 onboarding steps"
affects: [02-auth-onboarding, 03-discovery-swipe, 04-explore-ranking]

tech-stack:
  added: [expo-image-picker, expo-image-manipulator, expo-file-system, base64-arraybuffer, "@react-native-community/datetimepicker", expo-linear-gradient]
  patterns: [redirect-based-auth-guard, base64-arraybuffer-upload, asyncstorage-progress-persistence, service-layer-pattern]

key-files:
  created:
    - src/contexts/auth-context.tsx
    - src/hooks/use-auth.ts
    - src/hooks/use-onboarding.ts
    - src/services/auth-service.ts
    - src/services/photo-service.ts
    - src/services/school-service.ts
    - src/services/profile-service.ts
    - src/components/onboarding/progress-bar.tsx
    - src/components/onboarding/step-container.tsx
    - app/welcome.tsx
    - app/(auth)/_layout.tsx
    - app/(auth)/birthday.tsx
    - app/(auth)/phone.tsx
    - app/(auth)/verify-otp.tsx
    - app/(auth)/name.tsx
    - app/(auth)/gender.tsx
    - app/(auth)/school.tsx
    - app/(auth)/photos.tsx
    - app/(auth)/bio.tsx
    - supabase/migrations/00025_add_onboarding_fields.sql
  modified:
    - app/_layout.tsx
    - app/(tabs)/_layout.tsx
    - src/types/database.types.ts

key-decisions:
  - "Used redirect-based auth guard (Expo Router SDK 52 pattern, not Stack.Protected)"
  - "AsyncStorage for onboarding progress tracking, Supabase for actual data persistence"
  - "base64-arraybuffer upload pattern to avoid React Native 0-byte upload bug"
  - "7 visible progress segments (verify-otp grouped with phone step)"

patterns-established:
  - "SessionProvider wraps root layout, useSession hook for auth state"
  - "Service layer exports pure async functions (no classes), return { error: string | null } pattern"
  - "StepContainer provides consistent onboarding screen structure"
  - "ProgressBar segments fill with reanimated animation"

requirements-completed: [AUTH-01, AUTH-02, AUTH-06, AUTH-08]

duration: 6min
completed: 2026-03-06
---

# Phase 2 Plan 01: Auth Infrastructure & Onboarding Skeleton Summary

**Auth context with redirect-based routing, 4-service layer (auth/photos/schools/profiles), progress bar + step container, and schema migration for onboarding fields**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-06T06:50:12Z
- **Completed:** 2026-03-06T06:55:55Z
- **Tasks:** 3
- **Files modified:** 27

## Accomplishments
- Schema migration adds onboarding_completed (users), gender + show_gender (profiles), and server-side age validation trigger
- Auth routing: SessionProvider checks session + onboarding_completed, redirects unauthenticated users to welcome, non-onboarded to birthday step
- Service layer ready for all onboarding screens: auth (age validation, OTP, user creation), photos (pick, upload, delete, reorder), schools (search, add, remove), profiles (upsert, get)
- Shared onboarding components: animated ProgressBar (7 segments) and StepContainer (back button, title, keyboard avoidance)

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema migrations, dependency install** - `b3e49ef` (feat)
2. **Task 2: Auth context, hooks, route protection, shared components** - `af92bc7` (feat)
3. **Task 3: Service layer for auth, photos, schools, profiles** - `179a3fc` (feat)

## Files Created/Modified
- `supabase/migrations/00025_add_onboarding_fields.sql` - Schema: onboarding_completed, gender, show_gender, age trigger
- `src/types/database.types.ts` - Updated with new columns
- `src/contexts/auth-context.tsx` - SessionProvider with session + onboarding state
- `src/hooks/use-auth.ts` - Convenience hook re-exporting useSession + signOut
- `src/hooks/use-onboarding.ts` - Onboarding progress persistence with AsyncStorage
- `src/components/onboarding/progress-bar.tsx` - Animated segmented progress bar
- `src/components/onboarding/step-container.tsx` - Shared onboarding screen wrapper
- `src/services/auth-service.ts` - validateAge, sendOtp, verifyOtp, createUserRecord, markOnboardingComplete
- `src/services/photo-service.ts` - pickImage, uploadPhoto, deletePhoto, reorderPhotos
- `src/services/school-service.ts` - searchSchools, getUserSchools, addUserSchool, removeUserSchool
- `src/services/profile-service.ts` - updateProfile (upsert), getProfile
- `app/_layout.tsx` - Wrapped with SessionProvider, added welcome and (auth) routes
- `app/welcome.tsx` - Landing screen with purple gradient, "Get Started -->" CTA
- `app/(auth)/_layout.tsx` - Onboarding stack with ProgressBar
- `app/(auth)/*.tsx` - 8 placeholder screens for onboarding steps
- `app/(tabs)/_layout.tsx` - Auth guard redirects based on session + onboarding state

## Decisions Made
- Used redirect-based auth guard pattern (Expo Router SDK 52) instead of Stack.Protected (SDK 53+)
- AsyncStorage tracks onboarding step progress; actual data persists to Supabase per-step
- base64-arraybuffer upload pattern for Supabase Storage (avoids React Native 0-byte bug)
- 7 visible progress segments: verify-otp grouped with phone step visually
- Installed expo-linear-gradient for welcome screen (deviation Rule 3 - blocking: needed for gradient background)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed expo-linear-gradient for welcome screen**
- **Found during:** Task 2 (Welcome screen implementation)
- **Issue:** Welcome screen uses LinearGradient but expo-linear-gradient was not installed
- **Fix:** Ran `npx expo install expo-linear-gradient`
- **Files modified:** package.json, package-lock.json
- **Verification:** TypeScript compiles clean
- **Committed in:** af92bc7 (Task 2 commit)

**2. [Rule 3 - Blocking] Fixed ReactNode import from react instead of react-native**
- **Found during:** Task 2 (StepContainer component)
- **Issue:** ReactNode type doesn't exist on react-native module
- **Fix:** Changed import to `import type { ReactNode } from "react"`
- **Files modified:** src/components/onboarding/step-container.tsx
- **Verification:** TypeScript compiles clean
- **Committed in:** af92bc7 (Task 2 commit)

**3. [Rule 3 - Blocking] Created placeholder screens for all onboarding routes**
- **Found during:** Task 2 (Auth layout)
- **Issue:** Expo Router requires actual screen files for declared routes; (auth) layout declares 8 screens
- **Fix:** Created placeholder .tsx files for birthday, phone, verify-otp, name, gender, school, photos, bio
- **Files modified:** 8 files in app/(auth)/
- **Verification:** TypeScript compiles clean, routes resolve
- **Committed in:** af92bc7 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All auto-fixes necessary for compilation and route resolution. No scope creep.

## Issues Encountered
- Supabase Storage bucket "photos" and storage policies need to be applied via Supabase MCP or Dashboard (migration SQL file is ready but MCP was not available in this session)
- Migration 00025 needs to be applied to the remote Supabase database via MCP or dashboard

## User Setup Required
- Apply migration `supabase/migrations/00025_add_onboarding_fields.sql` to Supabase database
- Create Supabase Storage bucket "photos" (public: true, 5MB file limit)
- Apply storage RLS policies for photos bucket (see migration file comments)
- Configure SMS provider (Twilio) in Supabase Dashboard for phone OTP

## Next Phase Readiness
- Auth infrastructure complete: SessionProvider, route protection, service layer all in place
- Plans 02-04 can implement individual onboarding screens using the service layer and shared components
- Storage bucket and migration need to be applied before photo upload testing

## Self-Check: PASSED

All 14 key files verified present. All 3 task commits verified in git log.

---
*Phase: 02-auth-onboarding*
*Completed: 2026-03-06*
