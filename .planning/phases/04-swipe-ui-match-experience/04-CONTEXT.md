# Phase 4: Swipe UI & Match Experience - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can browse and interact with the Discovery stack through a polished swipe interface with photo carousel and match celebration. This phase builds the swipe deck UI, card design, photo navigation, save/bookmark, and match modal. Backend services (discovery stack, like, dismiss, save, match) already exist from Phase 3. Messaging is Phase 5 — swipe-up message action is stubbed.

</domain>

<decisions>
## Implementation Decisions

### Card Design & Layout
- Full-screen card filling edge-to-edge behind tab bar, photo as background
- Bottom gradient overlay shows: name, age, school, compatibility score
- Subtle pill badge for mode status ("Looking for friends") when `mode_status = 'friends'` — supplementary since users can filter by mode
- Tapping the card opens a scroll-up bottom sheet revealing: all photos in scrollable gallery, bio, school(s), year, hometown, nitty-gritty preferences
- Bottom sheet dismisses via swipe down or tap X

### Swipe Interaction
- Card rotates slightly with drag direction
- Color tint + icon feedback: green glow with heart icon on right swipe, red glow with X icon on left swipe — opacity increases with drag distance
- Floating action buttons on the card (bottom-right): dismiss (X), save (bookmark), like (heart) — small icons that don't obstruct photos
- Swipe up on card opens message composer stub (placeholder until Phase 5 messaging is built)
- Friendly illustration + encouraging message for empty stack ("You've seen everyone at your school! Check back later.")

### Match Celebration Modal
- Full-screen overlay with both users' profile photos (overlapping circles or side by side)
- "It's a Match!" heading with confetti/particle animation
- Strong haptic feedback (heavy impact) on match detection via expo-haptics
- Three actions: "Send a Message" primary button (navigates to chat stub), "Keep Swiping" secondary link, "Share" option
- Modal stays until user takes action — no auto-dismiss timeout

### Photo Carousel
- Tap left half of card = previous photo, tap right half = next photo
- Segmented bar indicator at top of card (thin horizontal bars, active segment highlighted) — Tinder/Hinge pattern
- Instant photo swap on tap — no slide or fade animation
- Last photo loops back to first photo on next tap
- In expanded profile bottom sheet: tapping a photo opens full-screen pinch-to-zoom viewer with swipe between photos

### Claude's Discretion
- Exact swipe threshold distance and rotation angle
- Spring-back animation parameters
- Confetti/particle animation implementation details
- Floating button sizing, spacing, and shadow treatment
- Bottom sheet snap points and gesture handling
- Photo preloading strategy for carousel
- Empty state illustration style
- Exact gradient overlay opacity and positioning

</decisions>

<specifics>
## Specific Ideas

- Card design follows Tinder's full-screen immersive pattern — photo-first experience
- Color tint swipe feedback (not text stamps) for a more subtle, modern feel
- Match modal should feel celebratory and satisfying — confetti + haptics create a physical moment
- Segmented bars at top for photo position (Instagram Stories / Tinder pattern) — universally understood
- "Share" on match modal adds social virality without being pushy
- Swipe-up to message is stubbed now but wired in Phase 5 — gesture infrastructure built once

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `react-native-reanimated` (~3.16.1): Declarative animations for swipe, spring-back, card transitions
- `react-native-gesture-handler` (~2.20.2): Pan gesture for swipe, tap for carousel navigation
- `expo-haptics` (~14.0.1): Heavy impact for match celebration
- `src/components/onboarding/photo-grid.tsx`: Drag-to-reorder pattern with reanimated — gesture handling patterns reusable
- `src/services/discovery-service.ts`: `getDiscoveryStack()`, `dismissProfile()`, `saveProfile()` — all card actions ready
- `src/services/match-service.ts`: `likeProfile()` returns `{ is_match, match_id, thread_id }` — match detection built
- `src/types/filters.ts`: `DiscoveryProfile` type with photos, display_name, bio, compatibility score
- `src/lib/constants.ts`: COLORS with purple/violet palette, design tokens

### Established Patterns
- Service layer: `src/services/` returns `{ data?, error }` — no exceptions
- NativeWind/Tailwind for styling
- Expo Router file-based routing
- AuthContext for session management
- Immutable state updates (spread operators, no mutation)

### Integration Points
- `app/(tabs)/index.tsx`: Discovery tab — swipe deck renders here
- Tab layout in `app/(tabs)/_layout.tsx`: 5-tab configuration already set
- `src/components/ui/`: Empty directory ready for shared UI components (Modal, IconButton, etc.)
- Discovery stack pagination: 20 per page, pre-fetch at 5 remaining (Phase 3 decision)
- Match creation via `likeProfile()` RPC — returns thread_id for future messaging navigation

</code_context>

<deferred>
## Deferred Ideas

- Swipe-up message composer full implementation — Phase 5 (Messaging)
- "Send a Message" from match modal navigating to actual chat — Phase 5 (Messaging)
- Profile boost visual indicator — Phase 9 (Monetization)

</deferred>

---

*Phase: 04-swipe-ui-match-experience*
*Context gathered: 2026-03-09*
