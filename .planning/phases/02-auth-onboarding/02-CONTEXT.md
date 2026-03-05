# Phase 2: Auth & Onboarding - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Age-gated signup, phone OTP verification, photo upload, school selection, and progressive onboarding. Users who complete all steps become eligible for Discovery and messaging. Users who haven't completed onboarding cannot appear in Discovery, Explore, or send messages.

</domain>

<decisions>
## Implementation Decisions

### Onboarding Flow Structure
- Step-by-step screens, one task per screen (not multi-section form)
- Segmented progress bar at top (thin bar divided into segments, fills purple)
- Back button on every step + save progress (user can close app mid-flow and resume)
- Step order: Birthday -> Phone OTP -> Name -> Gender -> School -> Photos -> Bio
- Returning users see welcome screen; clicking "Get Started" resumes where they left off

### Welcome/Landing Screen
- Hinge-style: full-bleed background image with dark overlay
- Bold Room logo centered, tagline below
- CTA button text: "Get Started -->" (must include arrow)
- Secondary "Sign in" text link below
- Static background image for v1 (video loop can be added later)
- Legal text (Terms of Service, Privacy Policy) above CTA
- Purple primary button matching brand palette

### Age Gate
- Scroll wheel date picker (iOS-style month/day/year)
- Under-18 gets soft block: friendly message "You must be 18+ to use Room. Come back when you're old enough!" with OK button
- No account created for under-18, no device flagging
- Age validated server-side (birthdate stored, not just age)

### Phone Verification
- Supabase Phone Auth (built-in OTP)
- 6 separate input boxes with auto-advance between digits
- Paste support for OTP codes
- Resend code option with countdown timer
- Phone number displayed for confirmation

### Photo Upload
- 3 required photo slots shown initially, up to 9 total allowed
- "+" button appears to add more after initial 3 filled
- Long-press drag to reorder photos; first photo = profile photo
- Square crop + basic edits (brightness/contrast) after selection
- Camera and gallery as source options
- Stored in Supabase Storage buckets
- No photo moderation for v1 (rely on user reporting, moderation in Phase 7)

### School Selection
- Search autocomplete from 51 seeded schools
- Dropdown shows matches as user types
- Can select multiple schools
- Selected schools shown as chips/tags below search
- "+ Add school" to add additional schools

### Profile Fields (Required During Onboarding)
- First name (text input)
- Gender: Man, Woman, Non-binary, + "More" (opens free text field)
- "Show my gender on profile" toggle (default: on)
- Bio: free text, 300 character limit, character counter shown
- Placeholder prompt: "What should your future roommate know about you?"

### Profile Fields (Optional, Editable Later in Profile)
- Hometown
- Sleep schedule
- Cleanliness level
- Budget range
- Roommate preferences (nitty_gritty JSONB)
- Looking for (roommate/friends/both)
- Graduation year

### Claude's Discretion
- Exact animation transitions between onboarding steps
- Progress bar segment count and visual style
- Error state handling (network failures, invalid inputs)
- Exact photo crop/edit UI library choice
- Keyboard handling and input focus management
- How onboarding progress is persisted locally (AsyncStorage vs Supabase partial profile)

</decisions>

<specifics>
## Specific Ideas

- Welcome screen modeled after Hinge's landing: full-bleed lifestyle photo, dark overlay, bold logo, purple CTA at bottom
- "Get Started -->" button text with arrow is deliberate — creates forward momentum
- Scroll wheel date picker for birthdate — familiar iOS pattern, prevents typos
- 6-box OTP input with auto-advance — polished, modern feel
- Photo grid starts minimal (3 slots) and expands — doesn't overwhelm new users

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/supabase.ts`: Supabase client with AsyncStorage auth persistence — auth flows plug directly into this
- `src/lib/constants.ts`: Design tokens with purple/violet palette — onboarding screens use these
- `src/types/database.types.ts`: Generated types for users, profiles, photos, schools, user_schools tables

### Established Patterns
- Expo Router file-based routing: onboarding screens will be `app/(auth)/` route group
- NativeWind/Tailwind for all styling
- Environment variables via EXPO_PUBLIC_ prefix

### Integration Points
- `app/_layout.tsx`: Root layout needs auth state check to route between (auth) and (tabs)
- Supabase Auth session determines whether user sees onboarding or main app
- `users` table: created on signup, stores birthdate, phone, onboarding_completed flag
- `profiles` table: name, bio, gender, graduation_year, nitty_gritty
- `user_schools` junction table: links user to selected schools
- `photos` table: stores photo URLs with position/order field

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-auth-onboarding*
*Context gathered: 2026-03-05*
