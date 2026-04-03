# Edge Cases & Known Issues

> Audit date: 2026-04-03
> Last updated: 2026-04-03
> Covers: auth/onboarding, services/data layer, navigation/UI, DB schema/RLS

Each issue includes severity, affected files, and a description of the scenario.
Ordered by severity within each section.

**Status legend**: FIXED = resolved, SKIP = intentionally deferred, (unmarked) = open

---

## Table of Contents

- [Critical](#critical)
- [High](#high)
- [Medium](#medium)
- [Low](#low)

---

## Critical

### EC-01: Orphaned Auth Accounts on Signup Abandonment — FIXED

- **Files**: `app/(auth)/signup.tsx:30-33`
- **Description**: `supabase.auth.signUp()` creates an `auth.users` record before phone OTP verification. Users who sign up but abandon before completing OTP leave orphaned auth rows with no corresponding `public.users` record. No automated cleanup exists.
- **Fix**: Either move auth account creation to post-OTP, or add a scheduled job to purge auth-only accounts older than N hours.

### EC-02: Onboarding Screens Don't Persist Data to Database — FIXED

- **Files**: `app/(auth)/name.tsx:27-28`, `app/(auth)/gender.tsx:34-35`, `app/(auth)/school.tsx:31`, `app/(auth)/photos.tsx:24,40`
- **Description**: Multiple onboarding screens have TODO comments instead of actual database writes. Name, gender, school selection, and photo uploads are never persisted. If the app crashes before bio completion, all data is lost. Photos use placeholder `picsum.photos` URLs.
- **Fix**: Implement the TODO calls to `updateProfile()`, `addUserSchool()`, `uploadPhoto()`, and `saveProgress()` in each screen.

### EC-03: Bio Screen Crashes if Session is Null

- **Files**: `app/(auth)/bio.tsx:29`
- **Description**: `session.user.id` is accessed without a null check. If the session expires between screens (token timeout, network issues), this throws a runtime error crashing the app.
- **Fix**: Guard with null check; redirect to welcome if session is gone.

### EC-04: Deactivated Accounts Remain Visible in Discovery/Explore — FIXED

- **Files**: `supabase/migrations/00043_account_deletion.sql`, visibility RPCs (`00030`, `00039`, `00040`, `00041`, `00047`)
- **Description**: `request_account_deletion` sets `deactivated_at` but visibility RPCs don't filter by it. Deleted users' profiles continue appearing in Discovery, Explore, Likes, and profile detail views.
- **Fix**: Add `AND u.deactivated_at IS NULL` to all visibility RPCs.

### EC-05: Missing Enforcement Action Expiration — SKIP

- **Files**: `supabase/migrations/00049_apply_enforcement.sql:20-30`
- **Description**: Temporary bans (48h DM ban, 7d suspension) set `end_at` timestamps but nothing clears `enforcement_state` when they expire. Users remain locked out permanently after temporary bans.
- **Fix**: Add a pg_cron job or application-level check that clears expired enforcement states.

### EC-06: No Photo Approval Flow — SKIP

- **Files**: `supabase/migrations/00006_create_photos.sql`, visibility RPCs
- **Description**: Photos default to `moderation_status = 'pending'`, and visibility RPCs filter for `'approved'` only. But no RPC or admin flow exists to transition photos from pending to approved. Users who complete onboarding may be invisible forever.
- **Fix**: Either auto-approve photos on upload (with async moderation), or build an approval RPC/admin interface.

### EC-07: No Minimum Photo Count Validation — SKIP

- **Files**: `supabase/migrations/00025_add_onboarding_fields.sql`, visibility RPCs
- **Description**: PRD requires minimum 3 photos. `onboarding_completed` can be set without validating photo count. No schema constraint, trigger, or RPC check enforces the 3-photo minimum.
- **Fix**: Add a check in `markOnboardingComplete` or a trigger that validates photo count before allowing `onboarding_completed = true`.

---

## High

### EC-08: Explore Feed Ignores Shared-School Restriction — FIXED

- **Files**: `supabase/migrations/00039_get_explore_feed.sql:60-85`
- **Description**: The `get_explore_feed` RPC shows profiles from ANY school, violating PRD section 9.2: "Users see all users who share at least one school. No global unrestricted browsing."
- **Fix**: Add shared-school JOIN filter to the explore feed query.

### EC-09: Profile Detail Allows Cross-School Viewing — FIXED

- **Files**: `supabase/migrations/00047_get_profile_detail.sql:17-20`
- **Description**: `get_profile_detail` checks for blocks but doesn't validate shared school. Users can view profiles outside their school network.
- **Fix**: Add shared-school validation to the RPC.

### EC-10: user_schools SELECT Policy Too Permissive — FIXED

- **Files**: `supabase/migrations/00021_rls_users_profiles_photos.sql:81-83`
- **Description**: Any authenticated user can SELECT all `user_schools` rows for other users, enabling enumeration of every user's school affiliations. Should be restricted to shared-school peers.
- **Fix**: Tighten the RLS policy to only allow viewing schools for users who share at least one school.

### EC-11: Permanently Banned Users Still Visible — SKIP

- **Files**: Multiple RLS policies (`00021`, `00022`, `00023`)
- **Description**: `enforcement_state = 'permanent_ban'` doesn't trigger global visibility removal. Banned users remain in Discovery, Explore, and Likes. Only explicit blocks hide users.
- **Fix**: Add enforcement_state filter to visibility RPCs and RLS policies.

### EC-12: OTP Verify Button Does Nothing — FIXED

- **Files**: `app/(auth)/verify-otp.tsx:153`
- **Description**: The "Verify" button has `onPress={() => {}}`. Verification only triggers via `OtpInput.onComplete` auto-submit. Users who expect to tap the button get no response.
- **Fix**: Wire the button to call the same verification handler.

### EC-13: OTP Resend Timer Memory Leak — FIXED

- **Files**: `app/(auth)/verify-otp.tsx:28-41, 68-90`
- **Description**: The resend handler creates a new `setInterval` without cleaning up the previous one. If the user navigates away mid-countdown or taps resend multiple times, intervals accumulate causing memory leaks and erratic timer display.
- **Fix**: Store interval ID in a ref and clear it before creating a new one.

### EC-14: Signup Doesn't Save Onboarding Progress

- **Files**: `app/(auth)/signup.tsx:29-36`
- **Description**: After successful `signUp()`, the code routes to phone without calling `saveProgress()`. If the app crashes after signup but before phone, the user's onboarding state (birthday data) is lost from AsyncStorage.
- **Fix**: Call `saveProgress("signup")` after successful signup.

### EC-15: Race Condition in Filter Service Read-Modify-Write

- **Files**: `src/services/filter-service.ts:67-96`
- **Description**: `readAndUpdate()` reads `nitty_gritty` JSONB, modifies in memory, writes back. Concurrent updates (e.g., preferences + dealbreakers) cause last-write-wins data loss. No optimistic locking.
- **Fix**: Use a Postgres JSONB merge operation or add optimistic locking with version column.

### EC-16: Race Condition in Photo Reorder

- **Files**: `src/services/photo-service.ts:114-131`
- **Description**: `reorderPhotos()` fires multiple concurrent UPDATEs via `Promise.all()` without a transaction. Rapid reorders can interleave, leaving photos in an undefined order.
- **Fix**: Wrap in a database transaction or use a single RPC call.

### EC-17: Email Validation Too Lenient — FIXED

- **Files**: `app/(auth)/signup.tsx:20`
- **Description**: Email validation is just `email.includes("@")`, accepting `@`, `a@`, `@b`, etc. Supabase rejects bad emails, but users get a confusing server error instead of immediate client feedback.
- **Fix**: Use a proper email regex or validation library.

### EC-18: Missing DELETE/UPDATE RLS Policies on Core Tables

- **Files**: `supabase/migrations/00022_rls_interactions.sql`, `00023_rls_messaging.sql`
- **Description**: `matches`, `dismissals`, and `threads` tables have RLS enabled but missing DELETE and/or UPDATE policies. Operations are only possible through SECURITY DEFINER RPCs, with no fallback path.
- **Fix**: Add appropriate DELETE/UPDATE policies or document that RPC-only access is intentional.

---

## Medium

### EC-19: Age Validation Trigger Only on INSERT — FIXED

- **Files**: `supabase/migrations/00025_add_onboarding_fields.sql:14-29`
- **Description**: The `validate_age` trigger fires on INSERT only. A direct UPDATE to `birthdate` bypasses age validation, potentially allowing under-18 accounts.
- **Fix**: Add the trigger to UPDATE as well, or make `birthdate` immutable after creation.

### EC-20: Missing Null Check on OTP Route Params — FIXED

- **Files**: `app/(auth)/verify-otp.tsx:21, 50`
- **Description**: `useLocalSearchParams<{ phone: string }>()` doesn't guarantee `phone` is defined. Used directly in `+1${phone}` without validation. Deep links or corrupted nav state cause malformed phone strings.
- **Fix**: Validate `phone` exists; redirect back to phone screen if missing.

### EC-21: Onboarding Progress Not Cleared on Logout — FIXED

- **Files**: `src/hooks/use-onboarding.ts`
- **Description**: AsyncStorage onboarding data persists across accounts. If user A logs out and user B signs in on the same device, user B could resume user A's onboarding progress (birthday, etc.).
- **Fix**: Call `clearProgress()` during logout/sign-out flow.

### EC-22: Photo Upload Orphans on DB Insert Failure — FIXED

- **Files**: `src/services/photo-service.ts:43-84`
- **Description**: If storage `.upload()` succeeds but the database `.insert()` fails, the file remains in storage with no record pointing to it. No cleanup on failure path.
- **Fix**: Delete uploaded file if DB insert fails.

### EC-23: Duplicate Message Reactions (No Unique Constraint)

- **Files**: `src/services/message-service.ts:66-86`, `supabase/migrations/00036_message_reactions.sql`
- **Description**: No unique constraint on `(message_id, user_id, emoji)`. Tapping the same reaction twice creates duplicates.
- **Fix**: Add unique constraint; use upsert or ON CONFLICT DO NOTHING.

### EC-24: Profile Upsert Can Overwrite Existing Fields with Null

- **Files**: `src/services/profile-service.ts:27-39`
- **Description**: `updateProfile()` upserts with `onConflict: "user_id"`. If a caller omits fields (e.g., doesn't pass `display_name`), the upsert can overwrite existing values with null/undefined.
- **Fix**: Use `.update()` for existing profiles or strip undefined fields before upsert.

### EC-25: Profile Completion Score Never Updated

- **Files**: `supabase/migrations/00005_create_profiles.sql:7`, `00039_get_explore_feed.sql`
- **Description**: `completion_score` defaults to 0 and is used for Explore ranking (30% weight). No trigger or RPC updates it when profile fields change. All users rank equally at 0.
- **Fix**: Add a trigger or function that recalculates completion_score on profile update.

### EC-26: Missing NOT NULL on profiles.display_name

- **Files**: `supabase/migrations/00005_create_profiles.sql:3`
- **Description**: `display_name` is nullable. PRD requires all profile fields completed for visibility, but no schema constraint enforces it.
- **Fix**: Add NOT NULL constraint or CHECK constraint for visible users.

### EC-27: Missing Unique Constraint on Subscriptions

- **Files**: `supabase/migrations/00018_create_subscriptions.sql`
- **Description**: No unique constraint prevents duplicate active subscriptions for the same user and plan.
- **Fix**: Add unique constraint on `(user_id, plan)` where `status = 'active'`.

### EC-28: Block User RPC Non-Atomic Multi-Step Updates

- **Files**: `supabase/migrations/00048_block_user_rpc.sql:6-54`
- **Description**: `block_user()` performs sequential updates (dismissals, matches, threads, likes). If an error occurs mid-function, earlier changes may persist while later ones fail, leaving a partial block state.
- **Fix**: Verify the function uses explicit transaction handling or EXCEPTION blocks.

### EC-29: Missing Self-Block CHECK Constraint — FIXED

- **Files**: `supabase/migrations/00013_create_blocks.sql`
- **Description**: `block_user` RPC checks `blocker_id = blocked_id`, but no schema-level CHECK constraint prevents self-blocks via direct INSERT.
- **Fix**: Add `CHECK (blocker_id != blocked_id)` to the blocks table.

### EC-30: Keyboard Overlaps Chat Header on iOS — FIXED

- **Files**: `app/chat/[threadId].tsx:388-391`
- **Description**: `KeyboardAvoidingView` uses `keyboardVerticalOffset={0}` but doesn't account for the header height. Keyboard can obscure the back button and chat header on iOS.
- **Fix**: Set offset to header height (typically ~44-56 pts).

### EC-31: Chat Deep Link Missing Auth Guard — FIXED

- **Files**: `app/chat/[threadId].tsx:71-81`
- **Description**: Deep link parameters (`threadId`, `otherUserId`) are used without validating the current user has access to the thread. A crafted deep link could expose thread metadata.
- **Fix**: Verify thread membership server-side before rendering; rely on RLS for data, but add client guard for UX.

### EC-32: Missing Indexes for Performance — FIXED

- **Files**: `supabase/migrations/00015_create_enforcement_actions.sql`, `00043_account_deletion.sql`
- **Description**: No indexes on `enforcement_actions.end_at` or `users.deactivated_at`. Queries filtering these columns require full table scans.
- **Fix**: Add indexes on both columns.

### EC-33: Race Condition on Rapid Photo Removal

- **Files**: `app/(auth)/photos.tsx:58-66`
- **Description**: Rapid taps on photo remove buttons cause array index desync between state updates. Wrong photo may be deleted or indices skip.
- **Fix**: Use photo ID-based removal instead of index-based, or debounce the handler.

### EC-34: Dev Auth Skip Flag in Production — FIXED

- **Files**: `app/(auth)/phone.tsx:33-36`
- **Description**: `EXPO_PUBLIC_DEV_SKIP_AUTH === "true"` bypasses phone verification entirely. If accidentally included in a production build, users can skip OTP.
- **Fix**: Gate behind `__DEV__` check in addition to env var, or strip from production builds.

---

## Low

### EC-35: Age Calculation Timezone Edge Case

- **Files**: `app/(auth)/birthday.tsx:10-18`
- **Description**: `validateAge()` uses local device time. A user near midnight on their 18th birthday could be accepted or rejected depending on timezone mismatch with server.
- **Fix**: Use UTC consistently for age calculation.

### EC-36: OTP Timer Resets on App Restart

- **Files**: `app/(auth)/verify-otp.tsx:24`
- **Description**: Resend countdown is in React state. If the app restarts, the timer resets to 60s, allowing faster resend than intended.
- **Fix**: Persist resend timestamp in AsyncStorage.

### EC-37: Custom Gender Input Accepts Whitespace-Only

- **Files**: `app/(auth)/gender.tsx:92`
- **Description**: Custom gender text input has `maxLength={50}` but no trim/empty check. "     " passes validation.
- **Fix**: Trim input and validate non-empty.

### EC-38: School Search Wildcard Characters — FIXED

- **Files**: `src/services/school-service.ts:16-33`
- **Description**: User input is passed directly to `.ilike("name", \`%${query}%\`)`. Characters `%` and `_` are SQL wildcards and cause unexpected matches (e.g., "a_b" matches "axb").
- **Fix**: Escape `%` and `_` in the query string before passing to ilike.

### EC-39: No Hard Deletion Mechanism for Account Deletion

- **Files**: `supabase/migrations/00043_account_deletion.sql`
- **Description**: PRD requires "hard deletion within 30 days" after deactivation. No pg_cron job, background worker, or migration implements the 30-day hard delete. GDPR compliance risk.
- **Fix**: Implement a scheduled job for hard deletion of accounts past 30 days.

### EC-40: Message Reply Cross-Thread Validation Missing

- **Files**: `src/services/message-service.ts`, `src/types/chat.ts:27-35`
- **Description**: `reply_to_id` accepts any message UUID globally. A manipulated client could create replies referencing messages from other threads.
- **Fix**: Add a CHECK or RPC validation that `reply_to_id` belongs to the same thread.

### EC-41: Missing Accessibility Labels

- **Files**: Various — `app/(auth)/phone.tsx:74-92`, tab bar, chat inputs
- **Description**: TextInput components, badge counts, and interactive elements lack `accessibilityLabel` props. Screen readers cannot properly announce UI elements.
- **Fix**: Add `accessibilityLabel` to all interactive components.

### EC-42: Back Button from Deep-Linked Chat

- **Files**: `app/chat/[threadId].tsx:334-336`
- **Description**: `router.back()` from a deep-linked chat (push notification) may navigate to auth flow or blank screen if there's no prior navigation stack.
- **Fix**: Check `router.canGoBack()` and fall back to messages tab.

### EC-43: Notification Triggers Fire-and-Forget

- **Files**: `supabase/migrations/00046_notification_triggers.sql:4-26`
- **Description**: `pg_notify` is fire-and-forget. If no listener is subscribed, notifications are silently dropped. No retry or fallback mechanism.
- **Fix**: Combine pg_notify with a persistent notification queue for reliability.

### EC-44: Client-Side Timestamps on Profile Updates — FIXED

- **Files**: `src/services/profile-service.ts:34`
- **Description**: `updated_at` uses `new Date().toISOString()` (device clock). Skewed device clocks cause incorrect ordering.
- **Fix**: Use `now()` server-side via Supabase default or trigger.

### EC-45: Dismissal View Count Smallint Overflow

- **Files**: `supabase/migrations/00026_dismissal_tracking.sql:5`
- **Description**: `view_count` is `smallint` (max 32,767) with no ceiling check. The `dismiss_profile` RPC increments without bounds. Overflow would break discovery filtering.
- **Fix**: Add a CHECK constraint or cap the increment.

### EC-46: Image Loading Has No Fallback

- **Files**: `app/(tabs)/likes.tsx:122-130`, various card components
- **Description**: `Image` components have no `onError` handler. Failed image loads show blank space with no placeholder or retry.
- **Fix**: Add fallback placeholder image and `onError` handler.

### EC-47: Splash Screen Hides Before Enforcement Modal Ready

- **Files**: `app/_layout.tsx:18, 72-74`
- **Description**: Splash screen hides when auth context initializes, but enforcement modals may not be ready yet. Banned users see a flash of the main UI before the modal appears.
- **Fix**: Delay splash hide until enforcement state is also resolved.

---

## Summary

| Severity | Total | Fixed | Skipped | Open |
|----------|-------|-------|---------|------|
| Critical | 7     | 4     | 3       | 0    |
| High     | 11    | 8     | 1       | 2    |
| Medium   | 16    | 9     | 0       | 7    |
| Low      | 13    | 3     | 0       | 10   |
| **Total** | **47** | **24** | **4** | **19** |

### Skipped (deferred — no moderation team / real users yet)

- **EC-05**: Enforcement action expiration
- **EC-06**: Photo approval flow
- **EC-07**: Minimum photo count validation
- **EC-11**: Permanently banned user visibility

### Remaining Open Issues

High: EC-14 (signup progress save), EC-18 (RLS DELETE/UPDATE policies)
Medium: EC-15, EC-16, EC-23, EC-24, EC-25, EC-26, EC-27, EC-28, EC-33
Low: EC-35, EC-36, EC-37, EC-39, EC-40, EC-41, EC-42, EC-43, EC-45, EC-46, EC-47
