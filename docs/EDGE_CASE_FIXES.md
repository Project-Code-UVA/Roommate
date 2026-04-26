# Edge Case Fixes Log

> Date: 2026-04-03
> Related: [EDGE_CASES.md](./EDGE_CASES.md)

---

## Critical

### EC-01: Orphaned Auth Accounts on Signup Abandonment

- **File**: `app/(auth)/signup.tsx`
- **Change**: Signup now calls `createUserRecord()` immediately after `supabase.auth.signUp()`, creating a `public.users` row right away. Previously the `users` row was only created at OTP verification, leaving auth-only orphans if users abandoned between signup and phone verification.

### EC-02: Onboarding Screens Don't Persist Data to Database

- **Files**: `app/(auth)/name.tsx`, `app/(auth)/gender.tsx`, `app/(auth)/school.tsx`, `app/(auth)/photos.tsx`
- **Change**: Replaced all TODO stubs with real service calls:
  - **name.tsx**: Added `useSession`, `updateProfile`, `useOnboarding`. Calls `updateProfile(session.user.id, { display_name })` and `saveProgress("name", ...)`.
  - **gender.tsx**: Added same imports. Calls `updateProfile(session.user.id, { gender, show_gender })` and `saveProgress("gender", ...)`.
  - **school.tsx**: Added `addUserSchool`/`removeUserSchool` service calls in `handleAdd`/`handleRemove` with error alerts. Calls `saveProgress("school", ...)` on continue.
  - **photos.tsx**: Replaced placeholder `picsum.photos` URLs with real `pickImage()` + `uploadPhoto()` integration. Shows local preview immediately, reverts on failure. `handleRemove` calls `deletePhoto()`. Calls `saveProgress("photos", ...)` on continue.

### EC-04: Deactivated Accounts Remain Visible

- **File**: `supabase/migrations/00052_edge_case_fixes.sql`
- **Change**: Added `AND u.deactivated_at IS NULL` filter to four RPCs:
  - `get_explore_feed`
  - `get_profile_detail`
  - `get_my_likes`
  - `get_liked_me` (both main function and `get_liked_me_count`)

---

## High

### EC-08: Explore Feed Ignores Shared-School Restriction

- **File**: `supabase/migrations/00052_edge_case_fixes.sql`
- **Change**: Added `v_user_schools uuid[]` variable, school ID lookup, early empty return, and `JOIN user_schools us ON us.user_id = p.user_id WHERE us.school_id = ANY(v_user_schools)` to the candidates CTE. Added `GROUP BY` to deduplicate multi-school overlaps.

### EC-09: Profile Detail Allows Cross-School Viewing

- **File**: `supabase/migrations/00052_edge_case_fixes.sql`
- **Change**: Added `IF NOT shares_school(p_user_id, p_target_id) THEN RETURN NULL; END IF;` check before the profile query.

### EC-10: user_schools SELECT Policy Too Permissive

- **File**: `supabase/migrations/00052_edge_case_fixes.sql`
- **Change**: Dropped `user_schools_select_others` (allowed any authenticated user to see all schools). Replaced with `user_schools_select_shared_school` which requires `shares_school(auth.uid(), user_id)`.

### EC-12: OTP Verify Button Does Nothing

- **File**: `app/(auth)/verify-otp.tsx`
- **Change**: Added `codeRef` to store the last entered code. Button `onPress` now calls `handleComplete(codeRef.current)` when 6 digits are available, allowing manual retry after auto-submit fails.

### EC-13: OTP Resend Timer Memory Leak

- **File**: `app/(auth)/verify-otp.tsx`
- **Change**: Added `if (timerRef.current) clearInterval(timerRef.current);` before creating a new interval in `handleResend`, preventing accumulation of leaked intervals.

### EC-17: Email Validation Too Lenient

- **File**: `app/(auth)/signup.tsx`
- **Change**: Replaced `email.includes("@")` with `/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())`. Rejects `@`, `a@`, `@b`, etc.

---

## Medium

### EC-19: Age Validation Trigger Only on INSERT

- **File**: `supabase/migrations/00052_edge_case_fixes.sql`
- **Change**: Added `BEFORE UPDATE OF birthdate` trigger so age validation also fires when birthdate is modified after account creation.

### EC-20: Missing Null Check on OTP Route Params

- **File**: `app/(auth)/verify-otp.tsx`
- **Change**: Added guard at the top of `handleComplete`: if `!phone`, sets error message "Phone number missing. Please go back and re-enter." and returns early.

### EC-21: Onboarding Progress Not Cleared on Logout

- **File**: `src/hooks/use-auth.ts`
- **Change**: Added `await AsyncStorage.removeItem("onboarding_progress")` before `supabase.auth.signOut()` to prevent leaking one user's onboarding data to the next user on the same device.

### EC-22: Photo Upload Orphans on DB Insert Failure

- **File**: `src/services/photo-service.ts`
- **Change**: After a successful storage upload, if the DB insert fails, the orphaned storage file is now cleaned up via `supabase.storage.from("photos").remove([filePath])`.

### EC-29: Missing Self-Block CHECK Constraint

- **File**: `supabase/migrations/00052_edge_case_fixes.sql`
- **Change**: Added `ALTER TABLE public.blocks ADD CONSTRAINT blocks_no_self_block CHECK (blocker_id != blocked_id)`.

### EC-30: Keyboard Overlaps Chat Header on iOS

- **File**: `app/chat/[threadId].tsx`
- **Change**: Changed `keyboardVerticalOffset` from `0` to `Platform.OS === "ios" ? 50 : 0` to account for the chat header height.

### EC-31: Chat Deep Link Missing Auth Guard

- **File**: `app/chat/[threadId].tsx`
- **Change**: Added `useEffect` that redirects to `/(tabs)/messages` if `session` or `threadId` is missing. Prevents rendering chat with invalid params from deep links or push notifications.

### EC-32: Missing Indexes for Performance

- **File**: `supabase/migrations/00052_edge_case_fixes.sql`
- **Change**: Added partial indexes:
  - `idx_enforcement_actions_end_at ON enforcement_actions(end_at) WHERE end_at IS NOT NULL`
  - `idx_users_deactivated_at ON users(deactivated_at) WHERE deactivated_at IS NOT NULL`

---

## Low

### EC-34: Dev Auth Skip Flag in Production

- **File**: `app/(auth)/phone.tsx`
- **Change**: Changed `if (process.env.EXPO_PUBLIC_DEV_SKIP_AUTH === "true")` to `if (__DEV__ && process.env.EXPO_PUBLIC_DEV_SKIP_AUTH === "true")`. The `__DEV__` flag is stripped from production builds.

### EC-38: School Search Wildcard Characters

- **File**: `src/services/school-service.ts`
- **Change**: Added `query.replace(/[%_]/g, "\\$&")` to escape SQL ilike wildcards before passing to `.ilike()`. Searching "a_b" now matches literal "a_b" instead of "axb".

### EC-44: Client-Side Timestamps on Profile Updates

- **Files**: `src/services/profile-service.ts`, `supabase/migrations/00052_edge_case_fixes.sql`
- **Change**: Removed `updated_at: new Date().toISOString()` from the client-side upsert. Added a `BEFORE UPDATE` trigger on profiles that sets `NEW.updated_at = now()` server-side, eliminating device clock skew issues.

---

## Files Modified

| File | Edge Cases |
|------|------------|
| `app/(auth)/verify-otp.tsx` | EC-12, EC-13, EC-20 |
| `app/(auth)/signup.tsx` | EC-01, EC-17 |
| `app/(auth)/phone.tsx` | EC-34 |
| `app/(auth)/name.tsx` | EC-02 |
| `app/(auth)/gender.tsx` | EC-02 |
| `app/(auth)/school.tsx` | EC-02 |
| `app/(auth)/photos.tsx` | EC-02 |
| `app/chat/[threadId].tsx` | EC-30, EC-31 |
| `src/hooks/use-auth.ts` | EC-21 |
| `src/services/photo-service.ts` | EC-22 |
| `src/services/profile-service.ts` | EC-44 |
| `src/services/school-service.ts` | EC-38 |
| `supabase/migrations/00052_edge_case_fixes.sql` | EC-04, EC-08, EC-09, EC-10, EC-19, EC-29, EC-32, EC-44 |
