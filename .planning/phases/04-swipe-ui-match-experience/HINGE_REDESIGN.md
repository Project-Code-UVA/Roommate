# Hinge-Style Discovery Redesign

## Context
Discovery screen currently uses Tinder-style full-screen swipe cards. User wants Hinge-style scrollable profiles with photos and info cards interspersed.

## Current State
- `src/components/discovery/swipe-card.tsx` — full-screen photo card with swipe gestures
- `src/components/discovery/swipe-deck.tsx` — stacked card deck manager
- `src/components/discovery/swipe-tutorial.tsx` — floating gesture tutorial
- `src/components/discovery/photo-indicator.tsx` — segmented bars
- `app/(tabs)/index.tsx` — Discovery screen with SwipeDeck
- `src/hooks/use-discovery-stack.ts` — stack state management (keep as-is)
- Tab bar is light theme (`rgba(245,245,245,0.95)`), screen bg is `#f5f5f5`

## Data Available per Profile (DiscoveryProfile)
- `display_name`, `year`, `bio`, `hometown`
- `photos[]` (id, url, position)
- `nitty_gritty` (self, preferences, dealbreakers — keyed by FilterCategory)
- `mode_status` ("roommate" | "friends")
- `selfie_verified`, `rank_score`, `completion_score`

## Design: Hinge-Style Scrollable Profile

### Layout (ScrollView, one profile at a time)
1. **Hero photo** — first photo, full-width, tall (~60% screen), name + year + verified overlay at bottom
2. **Bio card** — white rounded card with bio text
3. **Second photo** — full-width
4. **Living preferences card** — white card showing nitty_gritty.self values (sleep schedule, cleanliness, noise, etc.) with icons
5. **Third photo** — full-width (if exists)
6. **Match info card** — match %, mode status, hometown
7. **Remaining photos** — any additional photos

### Floating Action Buttons
- Fixed at bottom of screen, above tab bar
- Left: **X button** (dismiss) — red accent, circular
- Right: **Heart button** (like) — green accent, circular
- Both trigger haptic feedback

### Interactions
- Scroll vertically through profile sections
- Tap X → dismiss, advance to next profile
- Tap Heart → like, check for match
- No swipe gestures needed (scroll conflicts)
- Keep haptics on button press (medium impact)

## Files to Create/Modify

### Create
- `src/components/discovery/profile-card.tsx` — main scrollable profile view
- `src/components/discovery/profile-section.tsx` — white info card component
- `src/components/discovery/floating-actions.tsx` — fixed X/heart buttons

### Modify
- `app/(tabs)/index.tsx` — replace SwipeDeck with single ProfileCard + FloatingActions
- `src/components/discovery/swipe-tutorial.tsx` — update for scroll/button UX

### Keep as-is
- `src/hooks/use-discovery-stack.ts` — data management unchanged
- `src/components/discovery/empty-state.tsx`
- `src/components/match/match-modal.tsx`

### Can delete after
- `src/components/discovery/swipe-card.tsx`
- `src/components/discovery/swipe-deck.tsx`
- `src/components/discovery/card-action-buttons.tsx`
- `src/components/discovery/photo-indicator.tsx`

## Implementation Order
1. Build `profile-section.tsx` (simple white card wrapper)
2. Build `floating-actions.tsx` (X + heart buttons)
3. Build `profile-card.tsx` (scrollable profile assembling sections)
4. Update `app/(tabs)/index.tsx` to use new components
5. Update tutorial for new UX
6. Test and iterate
7. Clean up old swipe components
