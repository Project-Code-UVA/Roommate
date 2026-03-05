# Phase 2: Auth & Onboarding - Research

**Researched:** 2026-03-05
**Domain:** Mobile authentication, progressive onboarding, image upload, Supabase Auth + Storage
**Confidence:** HIGH

## Summary

Phase 2 implements the full authentication and onboarding pipeline: age gate, phone OTP via Supabase Auth, profile creation (name, gender, bio), school selection from seeded data, and photo upload to Supabase Storage. The project uses Expo SDK 52 with Expo Router 4, which means `Stack.Protected` (SDK 53+) is NOT available -- the redirect-based auth pattern with `useSegments` + `Redirect` must be used instead.

The database schema from Phase 1 is missing two fields required by the CONTEXT.md decisions: `gender` (text) and `show_gender` (boolean) on the `profiles` table, and `onboarding_completed` (boolean) on the `users` table. These need new migrations before UI work begins. All other tables (`users`, `profiles`, `photos`, `schools`, `user_schools`) exist with correct structures.

**Primary recommendation:** Structure the implementation as: (1) schema migrations for missing columns, (2) auth context + route protection infrastructure, (3) individual onboarding step screens following the locked step order, (4) photo upload integration with Supabase Storage. Use the redirect-based Expo Router auth pattern, NOT Stack.Protected.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Step-by-step screens, one task per screen (not multi-section form)
- Segmented progress bar at top (thin bar divided into segments, fills purple)
- Back button on every step + save progress (user can close app mid-flow and resume)
- Step order: Birthday -> Phone OTP -> Name -> Gender -> School -> Photos -> Bio
- Returning users see welcome screen; clicking "Get Started" resumes where they left off
- Hinge-style welcome screen: full-bleed background image with dark overlay, bold Room logo, tagline, "Get Started -->" CTA, "Sign in" link, legal text, purple button
- Scroll wheel date picker (iOS-style month/day/year) for age gate
- Under-18 gets soft block with friendly message, no account created, no device flagging
- Age validated server-side (birthdate stored, not just age)
- Supabase Phone Auth (built-in OTP) with 6 separate input boxes, auto-advance, paste support, resend countdown
- 3 required photo slots shown initially, up to 9 total; "+" to add more after 3 filled
- Long-press drag to reorder; first photo = profile photo
- Square crop + basic edits (brightness/contrast); camera and gallery sources
- Stored in Supabase Storage buckets
- No photo moderation for v1
- School selection: search autocomplete from 51 seeded schools, chips/tags, multiple selection
- Profile fields: first name, gender (Man/Woman/Non-binary/More with free text), "Show my gender" toggle, bio (300 char limit with counter)

### Claude's Discretion
- Exact animation transitions between onboarding steps
- Progress bar segment count and visual style
- Error state handling (network failures, invalid inputs)
- Exact photo crop/edit UI library choice
- Keyboard handling and input focus management
- How onboarding progress is persisted locally (AsyncStorage vs Supabase partial profile)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can create account with birthdate (18+ enforced server-side) | Supabase Auth + age validation in DB trigger or Edge Function; birthdate stored in `users.birthdate` |
| AUTH-02 | User can verify phone number via OTP | Supabase Phone Auth `signInWithOtp` + `verifyOtp` APIs; 6-digit code with 60s rate limit |
| AUTH-03 | User can upload minimum 3 photos during onboarding | expo-image-picker + Supabase Storage; `photos` table with `order_index`; base64-arraybuffer for upload |
| AUTH-04 | User can select at least one school during onboarding | `schools` table (51 seeded), `user_schools` junction table; search/autocomplete UI |
| AUTH-05 | User can complete required profile fields (name, year, bio) | `profiles` table has `display_name`, `year`, `bio`; gender needs new migration |
| AUTH-06 | User who fails verification cannot appear in Discovery, Explore, or message | `onboarding_completed` flag (needs migration); RLS policies can check this flag |
| AUTH-08 | Progressive onboarding flow | Expo Router file-based routing with `(auth)` group; step-by-step screens |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.98.0 | Auth (phone OTP), Storage (photos), DB | Already installed; handles signInWithOtp, verifyOtp, storage.upload |
| expo-image-picker | ~16.0 | Photo selection from camera/gallery | Expo SDK 52 compatible; built-in crop with `allowsEditing` |
| expo-image-manipulator | ~13.0 | Square crop, brightness/contrast edits | Needed for aspect-locked crop and image adjustments beyond picker's built-in editing |
| expo-file-system | ~18.0 | Read image as base64 for Supabase upload | Required to convert picker URIs to uploadable format |
| base64-arraybuffer | ^1.0.2 | Decode base64 to ArrayBuffer for Supabase Storage upload | Standard pattern for React Native -> Supabase Storage |
| @react-native-async-storage/async-storage | 1.23.1 | Persist onboarding progress locally | Already installed; used for auth session persistence |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-haptics | ~14.0.1 | Haptic feedback on swipe/tap interactions | Already installed; use on OTP digit entry, photo reorder |
| react-native-reanimated | ~3.16.1 | Smooth step transitions, progress bar animation | Already installed; onboarding step transitions |
| react-native-gesture-handler | ~2.20.2 | Long-press drag for photo reorder | Already installed; drag-to-reorder photo grid |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-image-manipulator | expo-image-picker `allowsEditing` only | Built-in editing is limited to crop only, no brightness/contrast control; manipulator adds fine-grained control |
| base64-arraybuffer | expo-file-system + fetch blob | Blob approach is more complex and has known issues with 0-byte uploads in RN; base64 is proven reliable |
| AsyncStorage for progress | Supabase partial profile | AsyncStorage is simpler, works offline, avoids partial DB records; Supabase approach creates incomplete server records |

**Installation:**
```bash
npx expo install expo-image-picker expo-image-manipulator expo-file-system && npm install base64-arraybuffer
```

## Architecture Patterns

### Recommended Project Structure
```
app/
  _layout.tsx              # Root: SessionProvider + auth routing
  welcome.tsx              # Landing/welcome screen (public)
  (auth)/
    _layout.tsx            # Onboarding stack with progress bar
    birthday.tsx           # Step 1: Age gate
    phone.tsx              # Step 2: Phone number entry
    verify-otp.tsx         # Step 2b: OTP verification
    name.tsx               # Step 3: First name
    gender.tsx             # Step 4: Gender selection
    school.tsx             # Step 5: School selection
    photos.tsx             # Step 6: Photo upload
    bio.tsx                # Step 7: Bio
  (tabs)/                  # Existing main app (protected)
    _layout.tsx            # Auth guard redirect
    ...existing tabs...
src/
  contexts/
    auth-context.tsx       # Session + onboarding state management
  hooks/
    use-auth.ts            # Auth convenience hook
    use-onboarding.ts      # Onboarding step tracking
  services/
    auth-service.ts        # Age validation, signUp, OTP methods
    photo-service.ts       # Image pick, crop, upload to Storage
    school-service.ts      # School search/autocomplete queries
    profile-service.ts     # Profile CRUD operations
  components/
    onboarding/
      progress-bar.tsx     # Segmented progress bar
      step-container.tsx   # Shared wrapper (back button, padding, keyboard avoidance)
      otp-input.tsx        # 6-box OTP input with auto-advance
      photo-grid.tsx       # Draggable photo grid (3 required + expandable)
      school-search.tsx    # Autocomplete search with chips
      date-picker.tsx      # Scroll wheel date picker
```

### Pattern 1: Redirect-Based Auth Guard (Expo Router SDK 52)
**What:** Use `<Redirect>` in nested layout to protect routes based on session state
**When to use:** Root layout determines which route group is visible based on auth + onboarding state
**Example:**
```typescript
// app/_layout.tsx
import { Slot } from 'expo-router';
import { SessionProvider } from '@/contexts/auth-context';

export default function RootLayout() {
  return (
    <SessionProvider>
      <Slot />
    </SessionProvider>
  );
}

// app/(tabs)/_layout.tsx
import { Redirect, Tabs } from 'expo-router';
import { useSession } from '@/contexts/auth-context';

export default function TabsLayout() {
  const { session, isLoading, onboardingComplete } = useSession();

  if (isLoading) return <LoadingScreen />;
  if (!session) return <Redirect href="/welcome" />;
  if (!onboardingComplete) return <Redirect href="/(auth)/birthday" />;

  return <Tabs>...</Tabs>;
}
```
Source: https://docs.expo.dev/router/advanced/authentication-rewrites/

### Pattern 2: Supabase Phone OTP Flow
**What:** Two-step phone auth: send OTP then verify
**When to use:** Phone verification step in onboarding
**Example:**
```typescript
// Send OTP
const { error } = await supabase.auth.signInWithOtp({
  phone: '+1' + phoneNumber,
});

// Verify OTP
const { data: { session }, error } = await supabase.auth.verifyOtp({
  phone: '+1' + phoneNumber,
  token: otpCode,
  type: 'sms',
});
```
Source: https://supabase.com/docs/guides/auth/phone-login

### Pattern 3: Photo Upload to Supabase Storage
**What:** Pick image, crop, convert to base64, upload as ArrayBuffer
**When to use:** Photo upload step
**Example:**
```typescript
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1], // Square crop
  quality: 0.8,
});

if (!result.canceled) {
  const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const filePath = `${userId}/${Date.now()}.jpg`;
  const { data, error } = await supabase.storage
    .from('photos')
    .upload(filePath, decode(base64), {
      contentType: 'image/jpeg',
    });

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('photos')
    .getPublicUrl(filePath);
}
```
Source: https://supabase.com/blog/react-native-storage

### Pattern 4: Onboarding Progress Persistence
**What:** Track which onboarding step user completed, resume on return
**When to use:** Throughout onboarding flow
**Example:**
```typescript
// Recommendation: Use AsyncStorage for step tracking + Supabase for actual data
// AsyncStorage stores: { currentStep: 'photos', birthday: '2004-01-15' }
// Supabase stores: actual user/profile/photos records only after each step completes

const ONBOARDING_KEY = 'onboarding_progress';

async function saveProgress(step: string, data: Record<string, unknown>) {
  const existing = await AsyncStorage.getItem(ONBOARDING_KEY);
  const progress = existing ? JSON.parse(existing) : {};
  const updated = { ...progress, currentStep: step, ...data };
  await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(updated));
}
```

### Anti-Patterns to Avoid
- **Client-side-only age check:** Age must be validated server-side. Client shows the picker but server rejects under-18 birthdates. Use a DB check constraint or trigger.
- **Creating user record before age gate:** Do NOT create a Supabase Auth user until birthdate is confirmed 18+. The flow should be: collect birthday -> validate age client-side -> proceed to phone OTP (which creates auth user) -> create `users` row with birthdate.
- **Single large onboarding screen:** Locked decision requires one task per screen. Do not combine steps.
- **Storing full images in base64 in DB:** Always use Supabase Storage buckets for images, store only URLs in the `photos` table.
- **Skipping RLS on storage bucket:** Configure storage bucket policies so users can only access their own photo folder.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OTP delivery | Custom SMS provider integration | Supabase Phone Auth (`signInWithOtp`) | Rate limiting, retry logic, provider management are complex |
| Image crop/edit | Custom crop overlay component | expo-image-picker `allowsEditing` + expo-image-manipulator | Native-quality crop UI, edge case handling (orientation, EXIF) |
| Drag-to-reorder | Custom pan responder reorder logic | react-native-gesture-handler + reanimated (existing) | Smooth 60fps drag, haptic feedback, collision detection |
| Date picker scroll wheel | Custom scroll wheel from scratch | @react-native-community/datetimepicker or custom picker using ScrollView + snap | Native feel, accessibility, locale formatting |
| Session persistence | Manual token storage and refresh | Supabase Auth with AsyncStorage adapter (already configured) | Token refresh, expiry handling, secure storage |

**Key insight:** Supabase Auth handles the entire phone verification lifecycle including rate limiting, token generation, and session management. The client only needs to call two methods.

## Common Pitfalls

### Pitfall 1: Supabase Phone Auth Requires SMS Provider Configuration
**What goes wrong:** `signInWithOtp({ phone })` fails with generic error because no SMS provider is configured in Supabase dashboard.
**Why it happens:** Supabase does not provide SMS delivery by default. You must configure Twilio, MessageBird, Vonage, or TextLocal in the Auth Providers dashboard.
**How to avoid:** Configure Twilio (most common) in Supabase Dashboard > Authentication > Providers > Phone before testing. For development, Supabase can use test phone numbers.
**Warning signs:** OTP send returns error but no SMS received.

### Pitfall 2: React Native File Upload 0-Byte Bug
**What goes wrong:** Photos upload to Supabase Storage but appear as 0 bytes.
**Why it happens:** Using `fetch` + blob approach instead of base64-arraybuffer conversion. React Native's fetch implementation doesn't handle blobs correctly for Supabase Storage.
**How to avoid:** Always use the `base64-arraybuffer` pattern: read file as base64 via `expo-file-system`, decode with `decode()`, then upload.
**Warning signs:** Upload succeeds (no error) but file size is 0.

### Pitfall 3: Auth Session Race Condition on App Launch
**What goes wrong:** App briefly flashes login screen before session loads from AsyncStorage.
**Why it happens:** `supabase.auth.getSession()` is async; layout renders before session resolves.
**How to avoid:** Use `isLoading` state in auth context. Keep splash screen visible until session check completes. Expo's `SplashScreen.preventAutoHideAsync()` (already in _layout.tsx) handles this.
**Warning signs:** Brief flash of welcome screen on authenticated app launch.

### Pitfall 4: Phone Number Format Issues
**What goes wrong:** OTP fails because phone number doesn't include country code or has wrong format.
**Why it happens:** User enters 10-digit US number without +1 prefix.
**How to avoid:** Always prepend country code before sending to Supabase. Show country code picker or hardcode "+1" for US-only launch. Validate E.164 format before API call.
**Warning signs:** "Invalid phone number" error from Supabase.

### Pitfall 5: Onboarding State Inconsistency After App Kill
**What goes wrong:** User completes some steps, kills app, returns and either repeats steps or skips required data.
**Why it happens:** Progress saved in AsyncStorage but actual data not yet persisted to Supabase.
**How to avoid:** Persist each step's data to Supabase immediately upon completion (not just at the end). AsyncStorage only tracks the current step index for navigation. On resume, verify server data matches step completion.
**Warning signs:** User sees completed step again, or data from previous session is missing.

### Pitfall 6: Missing onboarding_completed Flag
**What goes wrong:** No way to determine if user finished all onboarding steps; incomplete profiles appear in Discovery.
**Why it happens:** Current `users` table lacks `onboarding_completed` column.
**How to avoid:** Add migration for `onboarding_completed boolean DEFAULT false` on `users` table. Set to `true` only after final step completes. RLS policies and queries should filter on this flag.
**Warning signs:** Incomplete profiles visible in Discovery/Explore feeds.

## Code Examples

### Age Validation (Server-Side Check)
```sql
-- Migration: Add onboarding fields
ALTER TABLE public.users
  ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN gender text,
  ADD COLUMN show_gender boolean NOT NULL DEFAULT true;

-- Trigger: Validate age on user creation
CREATE OR REPLACE FUNCTION public.validate_age()
RETURNS TRIGGER AS $$
BEGIN
  IF (CURRENT_DATE - NEW.birthdate) < INTERVAL '18 years' THEN
    RAISE EXCEPTION 'User must be 18 or older';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_age_before_insert
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.validate_age();
```

### Auth Context with Supabase
```typescript
// src/contexts/auth-context.tsx
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
  onboardingComplete: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  onboardingComplete: false,
});

export function useSession() {
  return useContext(AuthContext);
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // Check onboarding status
        supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            setOnboardingComplete(data?.onboarding_completed ?? false);
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading, onboardingComplete }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### OTP Input Component Pattern
```typescript
// 6-box OTP input with auto-advance and paste support
const OTP_LENGTH = 6;

function OtpInput({ onComplete }: { onComplete: (code: string) => void }) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const refs = useRef<TextInput[]>([]);

  const handleChange = (text: string, index: number) => {
    // Handle paste (full code pasted into one field)
    if (text.length === OTP_LENGTH) {
      const newDigits = text.split('').slice(0, OTP_LENGTH);
      setDigits(newDigits);
      onComplete(newDigits.join(''));
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = text.slice(-1); // Take only last char
    setDigits(newDigits);

    // Auto-advance to next input
    if (text && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }

    // Check completion
    if (newDigits.every(d => d !== '')) {
      onComplete(newDigits.join(''));
    }
  };

  // ... render 6 TextInput boxes
}
```

### Supabase Storage Bucket Policy
```sql
-- Create photos bucket (run via Supabase Dashboard or MCP)
-- Bucket: 'photos', public: true (for serving), file size limit: 5MB

-- Storage policy: users can only upload to their own folder
CREATE POLICY "Users upload own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users read own photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public read photos"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'photos');

CREATE POLICY "Users delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useSegments` + `useRootNavigation` redirect | `Stack.Protected` with `guard` prop | Expo SDK 53 (2025) | Project uses SDK 52, must use redirect approach |
| Blob upload to Supabase Storage | base64-arraybuffer decode pattern | 2023 | Blob approach causes 0-byte files in React Native |
| expo-image-picker v14 `MediaTypeOptions` | v16 `mediaTypes` string array `['images']` | Expo SDK 52 | Old enum-based API is deprecated |

**Deprecated/outdated:**
- `ImagePicker.MediaTypeOptions.Images` enum: Use `mediaTypes: ['images']` string array instead (SDK 52+)
- `useSegments` for auth redirect: Still works in SDK 52 but `Stack.Protected` is preferred in SDK 53+. Since this project is SDK 52, use the redirect pattern.

## Open Questions

1. **SMS Provider for Supabase Phone Auth**
   - What we know: Supabase requires external SMS provider (Twilio, MessageBird, Vonage, or TextLocal) configured in dashboard
   - What's unclear: Which provider is configured for this Supabase project, if any
   - Recommendation: Check Supabase Dashboard > Authentication > Providers > Phone. If none configured, set up Twilio for development. For dev testing, Supabase offers test phone numbers that bypass SMS delivery.

2. **Supabase Storage Bucket Existence**
   - What we know: `photos` table references URLs, but no evidence a Storage bucket named "photos" exists
   - What's unclear: Whether the bucket was created during Phase 1 setup
   - Recommendation: Check via Supabase Dashboard or MCP. If missing, create bucket as part of Phase 2 Wave 0.

3. **Date Picker Library for Scroll Wheel**
   - What we know: User wants iOS-style scroll wheel date picker. `@react-native-community/datetimepicker` provides native pickers but limited customization.
   - What's unclear: Whether the native iOS date picker wheel meets the design requirement or if a custom scroll wheel is needed
   - Recommendation: Use `@react-native-community/datetimepicker` with `display: 'spinner'` mode on iOS. On Android, consider a custom scroll picker using react-native-reanimated for consistent look. This is marked as Claude's discretion.

4. **Brightness/Contrast Photo Editing**
   - What we know: User wants "basic edits (brightness/contrast)" on photos
   - What's unclear: expo-image-manipulator supports crop/resize/rotate/flip but NOT brightness/contrast adjustments
   - Recommendation: For v1, implement square crop only (using expo-image-picker `allowsEditing` with `aspect: [1,1]`). Defer brightness/contrast to a later iteration, or use `expo-gl` with shader-based processing (significantly more complex). Document this limitation.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + jest-expo 52 |
| Config file | package.json `jest` section (preset: jest-expo) |
| Quick run command | `npx jest --testPathPattern=auth --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Age validation blocks under-18 | unit | `npx jest __tests__/services/auth-service.test.ts -t "age" --no-coverage` | No - Wave 0 |
| AUTH-02 | Phone OTP send and verify | unit | `npx jest __tests__/services/auth-service.test.ts -t "otp" --no-coverage` | No - Wave 0 |
| AUTH-03 | Photo upload min 3 validation | unit | `npx jest __tests__/services/photo-service.test.ts --no-coverage` | No - Wave 0 |
| AUTH-04 | School selection min 1 validation | unit | `npx jest __tests__/services/school-service.test.ts --no-coverage` | No - Wave 0 |
| AUTH-05 | Profile fields validation (name, year, bio) | unit | `npx jest __tests__/services/profile-service.test.ts --no-coverage` | No - Wave 0 |
| AUTH-06 | Incomplete user excluded from visibility | unit | `npx jest __tests__/services/auth-service.test.ts -t "onboarding" --no-coverage` | No - Wave 0 |
| AUTH-08 | Step navigation and progress tracking | unit | `npx jest __tests__/hooks/use-onboarding.test.ts --no-coverage` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern=auth --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/services/auth-service.test.ts` -- covers AUTH-01, AUTH-02, AUTH-06
- [ ] `__tests__/services/photo-service.test.ts` -- covers AUTH-03
- [ ] `__tests__/services/school-service.test.ts` -- covers AUTH-04
- [ ] `__tests__/services/profile-service.test.ts` -- covers AUTH-05
- [ ] `__tests__/hooks/use-onboarding.test.ts` -- covers AUTH-08
- [ ] `__tests__/setup.ts` -- shared test setup (Supabase mock, AsyncStorage mock)
- [ ] Migration: `onboarding_completed` on `users`, `gender` + `show_gender` on `profiles`
- [ ] Supabase Storage bucket `photos` creation + policies
- [ ] Install: `npx expo install expo-image-picker expo-image-manipulator expo-file-system && npm install base64-arraybuffer`

## Sources

### Primary (HIGH confidence)
- [Supabase Phone Login docs](https://supabase.com/docs/guides/auth/phone-login) - signInWithOtp, verifyOtp API, provider requirements
- [Supabase Auth React Native quickstart](https://supabase.com/docs/guides/auth/quickstarts/react-native) - session management, AsyncStorage adapter
- [Expo Router Authentication (redirects)](https://docs.expo.dev/router/advanced/authentication-rewrites/) - redirect-based auth pattern for SDK 52
- [Expo ImagePicker docs](https://docs.expo.dev/versions/latest/sdk/imagepicker/) - API, permissions, allowsEditing, aspect
- [Expo ImageManipulator docs](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/) - crop, resize, rotate operations
- [Supabase React Native Storage blog](https://supabase.com/blog/react-native-storage) - base64-arraybuffer upload pattern

### Secondary (MEDIUM confidence)
- [Expo Router Protected Routes blog](https://expo.dev/blog/simplifying-auth-flows-with-protected-routes) - Stack.Protected (SDK 53+ only, confirmed NOT available for SDK 52)
- [Supabase Storage upload reference](https://supabase.com/docs/reference/javascript/storage-from-upload) - upload method signature

### Tertiary (LOW confidence)
- [expo-image-crop npm](https://www.npmjs.com/package/expo-image-crop) - alternative crop library (not recommended, low maintenance)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified against Expo SDK 52 compatibility and existing package.json
- Architecture: HIGH - Expo Router redirect pattern well-documented for SDK 52; Supabase Auth patterns verified
- Pitfalls: HIGH - 0-byte upload bug and session race condition are well-documented community issues
- Schema gaps: HIGH - Confirmed via direct inspection of migration files that `gender`, `show_gender`, and `onboarding_completed` columns are missing

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable libraries, 30-day validity)
