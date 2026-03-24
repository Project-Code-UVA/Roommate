# Phase 7: Trust, Safety & Verification - Research

**Researched:** 2026-03-24
**Domain:** Server-side enforcement, reporting, moderation, selfie verification (Supabase + React Native)
**Confidence:** HIGH

## Summary

Phase 7 wires together the trust and safety infrastructure that already exists in schema form (enums, tables, functions, RLS policies) but is not yet enforced end-to-end. The database layer is complete: `enforcement_state` enum, `blocks` table, `reports` table, `enforcement_actions` table, `is_blocked()` function, `shares_school()` function, and RLS policies on all safety tables. The four existing visibility RPCs (discovery, explore, my-likes, liked-me) already call `is_blocked()` and filter by `enforcement_state = 'none'`. The `send_message` RPC already checks enforcement state, block status, and shared-school gating.

The real work in this phase is: (1) verifying all existing server-side checks are correct via integration tests, (2) surfacing block/report UI on all profile surfaces (not just chat), (3) implementing selfie verification capture and storage, (4) adding enforcement-state feedback modals, and (5) creating a server-side `block_user` RPC that works independently of match context (current `unmatchUser` requires an active match).

**Primary recommendation:** Focus on a standalone `block_user` RPC for non-chat blocking, reuse the existing overflow menu pattern from `chat-header.tsx` across all profile surfaces, and build integration tests that call real Supabase RPCs against a test schema.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Camera capture only -- no third-party liveness check, no manual review queue. User takes a selfie in-app; it's stored in Supabase Storage. Having a face photo on file is the trust signal for v1.
- **D-02:** Post-onboarding prompt -- non-blocking. After onboarding completes, show a banner or modal nudging the user to verify. They can skip and verify later from profile settings.
- **D-03:** Verified badge is a small checkmark overlay on profile photos. Appears on Discovery/Explore cards AND on full profile views.
- **D-04:** Re-upload allowed from profile settings at any time. New selfie replaces the old one; verified status is retained.
- **D-05:** Banned/suspended users attempting to start a new conversation see an explicit error: "Your account has a messaging restriction until [date]." If permanent, no end date shown.
- **D-06:** Suspended/banned users are read-only across the board -- cannot swipe, like, explore, or message. They can still see their existing data (matches, profile) but can take no actions.
- **D-07:** Warning (first enforcement level) is surfaced as an in-app modal on next app open. Modal explains what happened and links to community guidelines.
- **D-08:** Permanently banned users see a clear ban message on login attempt: "Your account has been permanently suspended for violating community guidelines." Cannot log in. No appeal mechanism for v1.
- **D-09:** Block is available from ALL profile views: Discovery swipe card, Explore profile modal, Likes tab profile detail modal, and Discovery profile bottom sheet. (Chat already has it.)
- **D-10:** Block is triggered via a 3-dot overflow menu on full profile views/bottom sheets -- consistent with the chat header overflow pattern already built in Phase 5.
- **D-11:** After blocking, the profile modal/sheet is dismissed immediately and the user is removed from the current feed/stack optimistically.
- **D-12:** RPC-level integration tests -- call actual Supabase RPCs with test users and assert correct gating behavior. No Maestro for this phase.
- **D-13:** Four surfaces must have explicit tests: discovery stack (shared-school gating), explore feed (block enforcement), send_message RPC (enforcement state check), likes RPCs (block enforcement on my-likes and liked-me).
- **D-14:** Tests live in `__tests__/integration/` -- separate from existing unit tests in `__tests__/`.

### Claude's Discretion
- Selfie storage bucket configuration and file path structure
- Exact wording of enforcement modals beyond the approved pattern above
- Enforcement state check implementation in `send_message` RPC (add WHERE clause or pre-check function)
- Test setup/teardown patterns for integration tests (test user creation/cleanup)
- Whether to add `selfie_url` and `selfie_verified` columns or reuse existing users table columns

### Deferred Ideas (OUT OF SCOPE)
- Appeal mechanism for permanent bans
- Admin dashboard for reviewing reports and applying enforcement
- Liveness detection for selfie
- Push notification for enforcement actions (Phase 8)
- Auto-escalation triggers
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SAFE-01 | Shared-school gating enforced server-side on all visibility queries | Discovery RPC (00030) already filters by shared school via `v_user_schools`. Explore RPC (00039) does NOT filter by shared school (by Phase 6 user decision). Integration tests must verify discovery gating works. Explore intentionally shows all schools. |
| SAFE-02 | Block hides user from Discovery, Explore, Likes, and Messages (server-enforced) | All 4 RPCs already call `is_blocked()`. Need: (1) standalone `block_user` RPC for non-chat surfaces, (2) overflow menu UI on all profile views, (3) integration tests proving block filtering. |
| SAFE-03 | Report system with 8 categories | `report_reason` enum has all 8 values. `submitReport()` service exists. Need: (1) report UI on all profile surfaces (not just chat), (2) report category picker component. |
| SAFE-04 | Enforcement escalation (warning -> 48hr DM ban -> 7-day suspension -> permanent ban) | `enforcement_state` enum, `enforcement_actions` table, and `enforcement_action_type` enum all exist. Need: (1) server-side function to apply enforcement and update user state, (2) client-side enforcement feedback modals (D-05 through D-08). |
| SAFE-05 | Enforcement state checked before allowing new conversations | `send_message` RPC already checks `enforcement_state != 'none'` (line 54 of 00037). `like_profile` RPC also checks enforcement state (line 37 of 00031). Need: (1) integration test proving blocked-state users cannot send messages, (2) client-side error display when enforcement blocks action. |
| SAFE-06 | Under-18 accounts blocked at signup, "Underage" report category available | Age gate enforced in Phase 2 auth flow. `underage` is in `report_reason` enum. Need: integration test confirming under-18 cannot complete signup (already built), and that "underage" report category is selectable in report UI. |
| AUTH-07 | User can complete selfie verification for verified badge | `selfie_verified` column exists on `users` table (default false). Need: (1) selfie capture screen using `expo-image-picker`, (2) Supabase Storage bucket for selfies, (3) RPC to set `selfie_verified = true`, (4) verified badge already renders on Discovery/Explore/Profile. |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version (project) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-image-picker | ~16.0.6 | Selfie camera capture via `launchCameraAsync` | Already used for photo upload in onboarding; supports `cameraType: 'front'` for selfie |
| @supabase/supabase-js | ^2.98.0 | Storage upload, RPC calls, DB operations | Core data layer; already used throughout |
| jest + jest-expo | ^29.2.1 / ~52.0.6 | Integration test runner | Already configured with setup.ts |
| @testing-library/react-native | ^13.3.3 | Component testing for UI surfaces | Already used for all component tests |

### Supporting (no new installs needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-file-system | ~18.0.12 | Read selfie as base64 for Storage upload | Same pattern as existing `uploadPhoto` in photo-service |
| base64-arraybuffer | ^1.0.2 | Decode base64 to ArrayBuffer for Supabase Storage | Same pattern as photo-service |
| @expo/vector-icons (Ionicons) | ~14.0.4 | Overflow menu icons, verified badge icon | Already used for checkmark-circle badge |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-image-picker (camera) | expo-camera | expo-camera gives full camera control but is overkill for a simple selfie capture; expo-image-picker already installed and handles permissions |
| Jest integration tests against live Supabase | supabase-test (npm package) | supabase-test provides isolated databases with auto-rollback but adds a new dependency; direct RPC calls with cleanup are simpler and match existing patterns |
| Direct RPC integration tests | pgTAP via `supabase test db` | pgTAP tests SQL functions in pure SQL but cannot test the full client->RPC->response chain the way Jest integration tests can |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure (new files for Phase 7)
```
src/
  services/
    block-service.ts         # EXTEND: add blockUser() for non-chat blocking
    report-service.ts        # EXTEND: already complete, maybe add report from any surface
    enforcement-service.ts   # NEW: check enforcement state, get active enforcement
    selfie-service.ts        # NEW: capture, upload, set verified
  hooks/
    use-enforcement.ts       # NEW: check enforcement state on app open
  components/
    shared/
      overflow-menu.tsx      # NEW: reusable 3-dot overflow (extracted from chat-header pattern)
      report-picker.tsx      # NEW: report category selection modal
      enforcement-modal.tsx  # NEW: warning/ban/suspension modal
      selfie-banner.tsx      # NEW: post-onboarding verification nudge
    selfie/
      selfie-capture.tsx     # NEW: camera capture screen for selfie
    discovery/
      profile-sheet.tsx      # MODIFY: add overflow menu with block/report
    explore/
      explore-profile-view.tsx  # MODIFY: add overflow menu with block/report
    likes/
      profile-detail-modal.tsx  # MODIFY: add overflow menu with block/report
    settings/
      settings-screen.tsx    # MODIFY: add "Verify Selfie" row
supabase/
  migrations/
    000XX_block_user_rpc.sql       # NEW: standalone block RPC (no match required)
    000XX_apply_enforcement.sql    # NEW: apply enforcement action + update user state
    000XX_selfie_storage.sql       # NEW: storage bucket + RLS policies for selfies
    000XX_update_selfie_verified.sql  # NEW: RPC to set selfie_verified
__tests__/
  integration/
    discovery-gating.test.ts    # NEW: shared-school + block integration tests
    explore-blocking.test.ts    # NEW: block enforcement on explore feed
    message-enforcement.test.ts # NEW: enforcement state blocks messaging
    likes-blocking.test.ts      # NEW: block enforcement on likes RPCs
```

### Pattern 1: Standalone Block RPC (for non-chat blocking)
**What:** A new `block_user` RPC that inserts into `blocks` table, creates permanent dismissal, and does NOT require an active match. The existing `unmatch_user` with `blockToo=true` only works when a match exists.
**When to use:** Blocking from Discovery, Explore, or Likes surfaces where no match/thread relationship exists.
**Example:**
```sql
-- Source: Pattern derived from existing unmatch_user (00032) block logic
CREATE OR REPLACE FUNCTION public.block_user(
  p_blocker_id uuid,
  p_blocked_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_blocker_id = p_blocked_id THEN
    RETURN jsonb_build_object('error', 'cannot_block_self');
  END IF;

  -- Insert block (idempotent)
  INSERT INTO blocks (blocker_id, blocked_id)
  VALUES (p_blocker_id, p_blocked_id)
  ON CONFLICT DO NOTHING;

  -- Permanent dismissal
  INSERT INTO dismissals (dismisser_id, dismissed_id, view_count, last_dismissed_at)
  VALUES (p_blocker_id, p_blocked_id, 3, now())
  ON CONFLICT (dismisser_id, dismissed_id)
  DO UPDATE SET view_count = 3, last_dismissed_at = now();

  -- If a match exists, soft-delete it and update thread
  UPDATE matches
  SET unmatched_at = now(), unmatched_by = p_blocker_id
  WHERE user_a_id = LEAST(p_blocker_id, p_blocked_id)
    AND user_b_id = GREATEST(p_blocker_id, p_blocked_id)
    AND unmatched_at IS NULL;

  UPDATE threads
  SET status = 'blocked'
  WHERE user_a_id = LEAST(p_blocker_id, p_blocked_id)
    AND user_b_id = GREATEST(p_blocker_id, p_blocked_id);

  -- Remove likes in both directions
  DELETE FROM likes
  WHERE (liker_id = p_blocker_id AND liked_id = p_blocked_id)
    OR (liker_id = p_blocked_id AND liked_id = p_blocker_id);

  RETURN jsonb_build_object('success', true);
END;
$$;
```

### Pattern 2: Reusable Overflow Menu (extracted from chat-header)
**What:** A shared overflow menu component with backdrop dismiss, block/report options. Matches the exact visual pattern from `chat-header.tsx` (lines 94-127).
**When to use:** Any profile view (Discovery sheet, Explore modal, Likes detail, Discovery card long-press).
**Example:**
```typescript
// Source: Extracted from src/components/chat/chat-header.tsx pattern
type OverflowMenuProps = {
  readonly visible: boolean;
  readonly onBlock: () => void;
  readonly onReport: () => void;
  readonly onClose: () => void;
};
// Renders: invisible backdrop + dropdown with Block (red) and Report items
// Same styles as chat-header: menuBackdrop, menuDropdown, menuItem, menuSeparator
```

### Pattern 3: Selfie Upload (reuse photo-service pattern)
**What:** Capture selfie via `expo-image-picker.launchCameraAsync` with `cameraType: CameraType.front`, upload to a dedicated `selfies` storage bucket using the existing base64-arraybuffer pattern from `photo-service.ts`.
**When to use:** Selfie verification flow (post-onboarding prompt or profile settings).
**Example:**
```typescript
// Source: Adapted from src/services/photo-service.ts uploadPhoto pattern
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { supabase } from "@/lib/supabase";

export async function captureSelfie(): Promise<ImagePicker.ImagePickerResult> {
  return ImagePicker.launchCameraAsync({
    cameraType: ImagePicker.CameraType.front,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    mediaTypes: ["images"],
  });
}

export async function uploadSelfie(
  userId: string,
  uri: string,
): Promise<{ url: string; error: string | null }> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const filePath = `${userId}/selfie.jpg`; // Single file per user, overwrites on re-upload
  const { error: uploadError } = await supabase.storage
    .from("selfies")
    .upload(filePath, decode(base64), {
      contentType: "image/jpeg",
      upsert: true, // Allow re-upload (D-04)
    });
  if (uploadError) return { url: "", error: uploadError.message };
  const { data: { publicUrl } } = supabase.storage.from("selfies").getPublicUrl(filePath);
  return { url: publicUrl, error: null };
}
```

### Pattern 4: Enforcement State Check on App Open
**What:** On app launch (in auth context or root layout), check the current user's `enforcement_state`. If not `none`, show appropriate modal.
**When to use:** Every app open for authenticated users.
**Example:**
```typescript
// Source: Pattern from existing auth-context.tsx session check
async function checkEnforcement(userId: string) {
  const { data } = await supabase
    .from("users")
    .select("enforcement_state")
    .eq("id", userId)
    .single();
  return data?.enforcement_state ?? "none";
}
// In root layout: if enforcement_state === 'permanent_ban' -> show ban screen, prevent navigation
// If enforcement_state === 'warning' -> show warning modal, allow dismiss
// If enforcement_state === 'dm_ban_48h' -> allow browse, block messaging with error message
// If enforcement_state === 'suspended_7d' -> read-only mode
```

### Pattern 5: Integration Test Setup
**What:** Integration tests call actual Supabase RPCs using the project's Supabase client initialized with the service role key. Tests create test users, run assertions, then clean up.
**When to use:** All four test files in `__tests__/integration/`.
**Example:**
```typescript
// Source: Supabase integration testing pattern
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role for test setup/teardown
);

// Helper: create test user (bypasses RLS via service role)
async function createTestUser(overrides: Partial<UserRow> = {}) {
  // Insert into auth.users via admin API, then into public.users
}

// Helper: cleanup test data
async function cleanupTestUsers(userIds: string[]) {
  // Delete from auth.users cascades to all related tables
}
```

### Anti-Patterns to Avoid
- **Client-side enforcement checks without server backup:** Every enforcement check MUST exist in the RPC. Client-side is for UX feedback only.
- **Mutating the existing `blockFromChat` for non-chat blocking:** The current function requires `unmatchUser` which requires an active match. Create a new standalone RPC instead.
- **Storing selfie in the `photos` table:** Selfies are trust artifacts, not profile photos. Keep them in a separate storage bucket and reference via a column on `users` (or just the `selfie_verified` boolean with the URL in Storage).
- **Testing with mocked Supabase client:** Integration tests per D-12 must call actual RPCs. Use the existing mock setup only for unit tests.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Camera selfie capture | Custom camera view | `expo-image-picker.launchCameraAsync({ cameraType: 'front' })` | Handles permissions, OS camera UI, image return; already installed |
| Base64 file upload | Manual fetch/blob patterns | `expo-file-system` + `base64-arraybuffer` + `supabase.storage.upload` | Same proven pattern from photo-service; avoids RN 0-byte upload bug |
| Overflow menu UI | Per-surface custom menus | Extract reusable `OverflowMenu` from `chat-header.tsx` pattern | Four surfaces need identical menu; DRY principle |
| Block idempotency | Manual EXISTS check before INSERT | `ON CONFLICT DO NOTHING` in Postgres | Atomic, race-condition-free |
| Report category validation | Client-side string checking | Postgres `report_reason` enum type | Server rejects invalid values automatically |

**Key insight:** The schema layer is complete -- all enums, tables, functions, and RLS policies exist. This phase is about wiring (UI surfaces, integration tests, and one new RPC for standalone blocking) not building new infrastructure.

## Common Pitfalls

### Pitfall 1: Blocking Without Match Context
**What goes wrong:** `blockFromChat()` calls `unmatchUser(userId, otherId, true)` which requires an active match. If no match exists (Discovery, Explore, Likes surfaces), the RPC returns `'no_active_match'` error and the block fails silently.
**Why it happens:** Phase 5 only needed blocking from chat (where a match always exists). Phase 7 extends blocking to surfaces without matches.
**How to avoid:** Create a standalone `block_user` RPC that inserts into `blocks` directly, handles match/thread cleanup only IF they exist (not as a prerequisite), and always succeeds.
**Warning signs:** "Block" button on Explore profile returns error; blocked user still appears in feeds.

### Pitfall 2: Explore Feed Not School-Gated
**What goes wrong:** Treating `get_explore_feed` as needing shared-school gating when it was intentionally designed to show ANY school profiles per Phase 6 user decision (STATE.md: "[Phase 06]: Explore feed shows ANY school profiles (not shared-school gated) per user decision").
**Why it happens:** SAFE-01 says "all visibility queries" but the user decision in Phase 6 exempted Explore.
**How to avoid:** Integration tests for SAFE-01 should verify shared-school gating on Discovery only. Explore tests should verify block enforcement and enforcement state filtering only.
**Warning signs:** Adding `shares_school()` filter to `get_explore_feed` would contradict Phase 6 decision.

### Pitfall 3: Enforcement State Granularity
**What goes wrong:** Treating all enforcement states the same (fully blocked). Per D-05/D-06: `dm_ban_48h` blocks only NEW conversations (existing thread replies may still work per PRD), while `suspended_7d` and `permanent_ban` are read-only across the board.
**Why it happens:** The current `send_message` RPC checks `enforcement_state != 'none'` which blocks ALL states equally, including `warning`.
**How to avoid:** The `send_message` enforcement check should differentiate: `warning` state should NOT block messaging (it is just a notification). Only `dm_ban_48h`, `suspended_7d`, and `permanent_ban` should block. Update the RPC check to: `enforcement_state IN ('dm_ban_48h', 'suspended_7d', 'permanent_ban')`.
**Warning signs:** Users with a `warning` enforcement state cannot send messages even though warnings should only be informational.

### Pitfall 4: Selfie Storage Permissions
**What goes wrong:** Selfie uploads fail with RLS policy violation because the `selfies` bucket has no storage policies.
**Why it happens:** Supabase Storage buckets are private by default and require explicit RLS policies on `storage.objects`.
**How to avoid:** Create storage policies that allow authenticated users to upload/update only in their own folder (`{userId}/selfie.jpg`), and allow public read access for the verified badge display.
**Warning signs:** 403 or RLS violation errors on selfie upload.

### Pitfall 5: Integration Test Isolation
**What goes wrong:** Integration tests leak state between runs, causing flaky failures.
**Why it happens:** Test users created in one test are not cleaned up before the next test runs.
**How to avoid:** Each test file should create uniquely named test users in `beforeAll`, and delete them in `afterAll` using the service role key (which bypasses RLS). Use `ON CONFLICT DO NOTHING` patterns so reruns are idempotent.
**Warning signs:** Tests pass individually but fail when run together.

### Pitfall 6: Re-upload Selfie Doesn't Overwrite
**What goes wrong:** Re-uploading a selfie creates a duplicate file instead of replacing the old one.
**Why it happens:** Supabase Storage `.upload()` returns a conflict error if the file already exists.
**How to avoid:** Use `{ upsert: true }` option in the upload call. The file path should be deterministic: `{userId}/selfie.jpg` (not timestamped).
**Warning signs:** Storage bucket fills with orphaned selfie files.

## Code Examples

### Verified: Existing Block Check Pattern in RPCs
```sql
-- Source: supabase/migrations/00030_get_discovery_stack.sql (line 90)
AND NOT is_blocked(p_user_id, p.user_id)

-- Source: supabase/migrations/00039_get_explore_feed.sql (line 82)
AND NOT is_blocked(p_user_id, p.user_id)

-- Source: supabase/migrations/00040_get_my_likes.sql (line 65)
AND NOT is_blocked(p_user_id, l.liked_id)

-- Source: supabase/migrations/00041_get_liked_me.sql (line 75)
AND NOT is_blocked(p_user_id, l.liker_id)

-- Source: supabase/migrations/00037_send_message_rpc.sql (line 44)
IF is_blocked(p_sender_id, v_other_id) THEN
  RETURN jsonb_build_object('error', 'blocked');
END IF;
```
All four visibility RPCs and the send_message RPC already call `is_blocked()`. Integration tests need to verify this works correctly.

### Verified: Existing Enforcement State Check
```sql
-- Source: supabase/migrations/00037_send_message_rpc.sql (lines 53-56)
IF (SELECT enforcement_state FROM users WHERE id = p_sender_id) != 'none' THEN
  RETURN jsonb_build_object('error', 'under_enforcement');
END IF;
```
**Note:** This currently blocks ALL non-`none` states including `warning`. Per D-05/D-07, warnings should NOT prevent messaging. This check needs refinement to only block `dm_ban_48h`, `suspended_7d`, and `permanent_ban`.

### Verified: Existing Chat Header Overflow Menu Pattern
```typescript
// Source: src/components/chat/chat-header.tsx (lines 94-127)
// Pattern: Pressable with ellipsis-horizontal icon -> toggles menuOpen state
// When open: invisible backdrop Pressable (absoluteFillObject, zIndex:10) + dropdown View (zIndex:20)
// Block item: red with ban-outline icon
// Report item: gray with flag-outline icon
// Separated by 1px gray line
```

### Verified: Existing Report Service
```typescript
// Source: src/services/report-service.ts
export async function submitReport(
  reporterId: string,
  reportedId: string,
  category: ReportCategory,  // Uses ReportCategory type from src/types/chat.ts
  description?: string,
): Promise<ReportResult> {
  const { error } = await supabase.from("reports").insert({
    reporter_id: reporterId,
    reported_id: reportedId,
    reason: category,
    details: description ?? null,
  });
  // Returns { success, error } shape
}
```

### Verified: Existing Photo Upload Pattern (reuse for selfie)
```typescript
// Source: src/services/photo-service.ts (lines 43-84)
// 1. Read file as base64 via expo-file-system
// 2. Upload to Supabase Storage with decode(base64) from base64-arraybuffer
// 3. Get public URL via getPublicUrl()
// This exact pattern should be used for selfie upload
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side block filtering | Server-side `is_blocked()` in all RPCs | Phase 1 (already implemented) | Block enforcement is already server-side in all 4 RPCs |
| Match-required blocking only | Standalone `block_user` RPC | Phase 7 (this phase) | Enables blocking from any profile surface |
| Selfie via expo-camera (full camera) | Selfie via expo-image-picker `launchCameraAsync` | Current best practice | Simpler API, already installed, handles permissions |

**Deprecated/outdated:**
- `ImagePicker.MediaTypeOptions.Images` enum: Replaced with string literal `'images'` in newer expo-image-picker versions. The project already uses the correct string literal pattern (see photo-service.ts).

## Open Questions

1. **Selfie URL column on users table**
   - What we know: `selfie_verified` boolean already exists on `users`. No `selfie_url` column exists.
   - What's unclear: Whether to add a `selfie_url` column or derive the URL from the deterministic Storage path `{userId}/selfie.jpg`.
   - Recommendation: Use deterministic Storage path (`selfies/{userId}/selfie.jpg`) -- no need for a DB column. The URL is derived from `supabase.storage.from('selfies').getPublicUrl('{userId}/selfie.jpg')`. This avoids a migration just for a URL field and keeps the Storage bucket as the source of truth. The `selfie_verified` boolean remains the only DB field needed.

2. **Integration test Supabase credentials**
   - What we know: Tests need service role key to create/cleanup test users.
   - What's unclear: Whether to use `.env.test` file or inline environment variables for Jest.
   - Recommendation: Create a `__tests__/integration/setup.ts` file that reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from environment. Add a `.env.test` to `.gitignore`. Document setup in test file comments. The existing jest config already has a `setupFiles` array that can be extended.

3. **Warning enforcement state and messaging**
   - What we know: Current `send_message` RPC blocks ALL non-`none` enforcement states. Per D-07, warning is just a modal notification.
   - What's unclear: PRD says "Enforcement state must be evaluated before allowing new conversations" but does not explicitly say which states block messaging.
   - Recommendation: Update `send_message` RPC to check `enforcement_state IN ('dm_ban_48h', 'suspended_7d', 'permanent_ban')` instead of `!= 'none'`. The `like_profile` RPC should also be updated to allow `warning` state. This is the safest interpretation: warnings warn, bans ban.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.x + jest-expo 52.x |
| Config file | `package.json` (jest section) |
| Quick run command | `npx jest __tests__/integration/ --no-cache` |
| Full suite command | `npx jest --no-cache` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SAFE-01 | Discovery returns only shared-school profiles | integration | `npx jest __tests__/integration/discovery-gating.test.ts -x` | Wave 0 |
| SAFE-02 | Block hides user from all 4 surfaces | integration | `npx jest __tests__/integration/ -x` (all 4 files) | Wave 0 |
| SAFE-03 | Report with 8 categories submits successfully | unit | `npx jest __tests__/services/report-service.test.ts -x` | Likely exists |
| SAFE-04 | Enforcement escalation applies correctly | integration | `npx jest __tests__/integration/message-enforcement.test.ts -x` | Wave 0 |
| SAFE-05 | Enforcement state blocks new conversations | integration | `npx jest __tests__/integration/message-enforcement.test.ts -x` | Wave 0 |
| SAFE-06 | Underage blocked at signup + underage report category | unit + integration | existing auth tests + report category test | Partially exists |
| AUTH-07 | Selfie verification sets verified badge | unit | `npx jest __tests__/services/selfie-service.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest __tests__/integration/ --no-cache`
- **Per wave merge:** `npx jest --no-cache`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/integration/setup.ts` -- Supabase service role client, test user helpers, cleanup utilities
- [ ] `__tests__/integration/discovery-gating.test.ts` -- SAFE-01 shared-school gating tests
- [ ] `__tests__/integration/explore-blocking.test.ts` -- SAFE-02 block enforcement on explore
- [ ] `__tests__/integration/message-enforcement.test.ts` -- SAFE-04, SAFE-05 enforcement state tests
- [ ] `__tests__/integration/likes-blocking.test.ts` -- SAFE-02 block enforcement on likes RPCs
- [ ] `__tests__/services/selfie-service.test.ts` -- AUTH-07 selfie capture/upload unit tests
- [ ] `__tests__/services/enforcement-service.test.ts` -- SAFE-04 enforcement state check unit tests
- [ ] `__tests__/components/shared/overflow-menu.test.tsx` -- Reusable overflow menu unit tests
- [ ] `__tests__/components/shared/report-picker.test.tsx` -- Report category picker unit tests
- [ ] `__tests__/components/shared/enforcement-modal.test.tsx` -- Enforcement feedback modal unit tests
- [ ] `__tests__/components/selfie/selfie-capture.test.tsx` -- Selfie capture screen unit tests
- [ ] Jest config update to include integration test path and env setup

## Sources

### Primary (HIGH confidence)
- Supabase migrations (00001-00047): Verified all enums, tables, functions, RLS policies directly in codebase
- Existing source code: block-service.ts, report-service.ts, chat-header.tsx, photo-service.ts, message-service.ts, profile-sheet.tsx, explore-profile-view.tsx, profile-detail-modal.tsx, settings-screen.tsx, use-profile.ts, auth-context.tsx
- `docs/TRUST_AND_SAFETY.md`: Report categories and escalation framework
- `docs/PRD.md` sections 3.5, 7: Block enforcement and Trust & Safety rules
- All four visibility RPCs (00030, 00039, 00040, 00041) and send_message RPC (00037): Verified existing block/enforcement checks

### Secondary (MEDIUM confidence)
- [Expo ImagePicker docs](https://docs.expo.dev/versions/latest/sdk/imagepicker/): Verified `launchCameraAsync` supports `cameraType: CameraType.front` for selfie
- [Supabase Storage access control docs](https://supabase.com/docs/guides/storage/security/access-control): Storage RLS policy patterns for user-scoped folders
- [Supabase Storage helper functions](https://supabase.com/docs/guides/storage/schema/helper-functions): `storage.foldername()` for path-based RLS

### Tertiary (LOW confidence)
- [Jest + Supabase integration testing patterns](https://medium.com/@qhphan5/integration-tests-with-jest-in-next-js-supabase-project-00cc23688aa2): General pattern for service role test setup; needs adaptation for this project's Jest config

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed, patterns verified in codebase
- Architecture: HIGH - extending proven patterns (overflow menu, photo upload, RPC structure)
- Pitfalls: HIGH - identified from direct code analysis (match-required blocking, enforcement state granularity, explore school gating exemption)
- Integration tests: MEDIUM - test setup pattern needs validation; Supabase service role key access confirmed possible but exact Jest config for integration tests is new territory for this project

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable -- all libraries pinned, no fast-moving dependencies)
