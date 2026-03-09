# Phase 4: Swipe UI & Match Experience - Research

**Researched:** 2026-03-09
**Domain:** React Native gesture-driven swipe UI, animated card deck, photo carousel, match celebration
**Confidence:** HIGH

## Summary

Phase 4 builds the Discovery tab's swipe deck UI on top of the Phase 3 backend services (discovery stack, like, dismiss, save, match). The core technical challenge is a 60fps swipe card interface with pan gesture tracking, animated feedback (rotation, color tint), photo carousel with tap zones, an expanded profile bottom sheet, and a match celebration modal with confetti and haptics.

The project already has `react-native-reanimated` (~3.16.1) and `react-native-gesture-handler` (~2.20.2) installed and proven in the onboarding photo grid. `GestureHandlerRootView` wraps the root layout. All backend services (`getDiscoveryStack`, `likeProfile`, `dismissProfile`, `saveProfile`) return structured `{ data, error }` results. The `DiscoveryProfile` type includes photos array, display_name, bio, year, hometown, nitty_gritty, mode_status, selfie_verified, and rank_score.

**Primary recommendation:** Build custom swipe deck using existing `react-native-reanimated` + `react-native-gesture-handler` (no third-party swipe library needed). Use `@gorhom/bottom-sheet` v5 for profile detail sheet. Use `react-native-confetti-cannon` for match celebration (lightweight, no Skia dependency). Build pinch-to-zoom viewer with `react-native-gesture-handler` Pinch gesture (no extra library).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Full-screen card filling edge-to-edge behind tab bar, photo as background
- Bottom gradient overlay shows: name, age, school, compatibility score
- Subtle pill badge for mode status ("Looking for friends") when `mode_status = 'friends'`
- Tapping card opens scroll-up bottom sheet with all photos, bio, school(s), year, hometown, nitty-gritty
- Card rotates slightly with drag direction
- Color tint + icon feedback: green glow with heart icon on right swipe, red glow with X icon on left swipe -- opacity increases with drag distance
- Floating action buttons on card (bottom-right): dismiss (X), save (bookmark), like (heart)
- Swipe up on card opens message composer stub (placeholder until Phase 5)
- Empty stack: friendly illustration + encouraging message
- Match modal: full-screen overlay, both profile photos, "It's a Match!" heading, confetti/particle animation, heavy haptic feedback
- Match modal actions: "Send a Message" (stub), "Keep Swiping", "Share"
- Match modal stays until user takes action -- no auto-dismiss
- Tap left half = previous photo, tap right half = next photo
- Segmented bar indicator at top of card (thin horizontal bars, active segment highlighted)
- Instant photo swap on tap -- no slide/fade animation
- Last photo loops back to first
- Full-screen pinch-to-zoom viewer in expanded profile bottom sheet

### Claude's Discretion
- Exact swipe threshold distance and rotation angle
- Spring-back animation parameters
- Confetti/particle animation implementation details
- Floating button sizing, spacing, and shadow treatment
- Bottom sheet snap points and gesture handling
- Photo preloading strategy for carousel
- Empty state illustration style
- Exact gradient overlay opacity and positioning

### Deferred Ideas (OUT OF SCOPE)
- Swipe-up message composer full implementation -- Phase 5
- "Send a Message" from match modal navigating to actual chat -- Phase 5
- Profile boost visual indicator -- Phase 9
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DISC-01 | User can swipe left to dismiss profiles | Pan gesture with `Gesture.Pan()` + `dismissProfile()` service call on threshold exceeded |
| DISC-02 | User can swipe right to like profiles | Pan gesture + `likeProfile()` service call; check `is_match` in response for modal trigger |
| DISC-03 | User can save/bookmark profiles (separate from like) | Floating bookmark button calling `saveProfile()` service; toggle state per card |
| DISC-04 | User can tap photo zones to navigate carousel (loops at end) | Tap gesture on left/right halves; shared value for photo index; modulo wrap for looping |
| MTCH-02 | User sees "It's a Match" modal when match occurs | When `likeProfile()` returns `is_match: true`, show full-screen modal with confetti + haptics |
| MTCH-03 | Messaging thread is auto-created upon match | Already handled by `like_profile` RPC (returns `thread_id`); UI stores and passes to Phase 5 navigation |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-reanimated | ~3.16.1 | UI-thread animations for swipe, spring-back, card transitions | Already installed; runs on UI thread for 60fps |
| react-native-gesture-handler | ~2.20.2 | Pan gesture for swipe, tap for carousel, pinch for zoom | Already installed; GestureHandlerRootView in root layout |
| expo-haptics | ~14.0.1 | Heavy impact feedback on match detection | Already installed; used in onboarding photo grid |
| expo-linear-gradient | ~14.0.2 | Bottom gradient overlay on card | Already installed |
| @expo/vector-icons (Ionicons) | ~14.0.4 | Heart, X, bookmark, share icons | Already installed |
| nativewind | ^4.2.2 | Tailwind styling for all components | Already installed; project convention |

### New Dependencies
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @gorhom/bottom-sheet | ^5 | Profile detail bottom sheet with snap points and gesture handling | Expanded profile view on card tap |
| react-native-confetti-cannon | ^1.5.2 | Confetti burst animation on match | Match celebration modal |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @gorhom/bottom-sheet | Custom Animated.View sheet | gorhom handles scroll nesting, keyboard avoidance, snap points; custom would be 200+ lines for same result |
| react-native-confetti-cannon | react-native-fast-confetti | fast-confetti requires @shopify/react-native-skia (heavy dep); cannon is JS-only, lightweight |
| react-native-confetti-cannon | Lottie animation | Lottie would work but adds lottie-react-native dependency; cannon gives more control and smaller bundle |
| Custom pinch-to-zoom | @likashefqet/react-native-image-zoom | Custom is ~50 lines with Pinch+Pan gesture; avoids adding dependency for one screen |
| Custom swipe deck | rn-swiper-list | Custom gives full control over card rendering, gesture thresholds, and feedback animations; third-party adds abstraction we'd fight against |

**Installation:**
```bash
npx expo install @gorhom/bottom-sheet react-native-confetti-cannon
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── discovery/
│   │   ├── swipe-card.tsx          # Single card with photo, gradient, info overlay
│   │   ├── swipe-deck.tsx          # Stack manager: renders top 2-3 cards, handles gesture
│   │   ├── photo-indicator.tsx     # Segmented bar showing current photo position
│   │   ├── card-action-buttons.tsx # Floating dismiss/save/like buttons
│   │   ├── profile-sheet.tsx       # Bottom sheet with full profile details
│   │   ├── photo-viewer.tsx        # Full-screen pinch-to-zoom image viewer
│   │   └── empty-state.tsx         # Illustration + message when stack is empty
│   ├── match/
│   │   └── match-modal.tsx         # Full-screen "It's a Match" celebration overlay
│   └── ui/
│       └── icon-button.tsx         # Reusable circular icon button
├── hooks/
│   └── use-discovery-stack.ts      # State management: stack data, pagination, current index
└── services/
    ├── discovery-service.ts        # (exists) getDiscoveryStack, dismissProfile, saveProfile
    └── match-service.ts            # (exists) likeProfile returns { is_match, match_id, thread_id }
```

### Pattern 1: Swipe Deck with Stacked Cards
**What:** Render 2-3 cards stacked (top card interactive, next card(s) scaled down behind). When top card is swiped away, next card animates up.
**When to use:** Always -- this is the core interaction pattern.
**Example:**
```typescript
// Gesture handler for swipe card
const panGesture = Gesture.Pan()
  .onUpdate((event) => {
    translateX.value = event.translationX;
    translateY.value = event.translationY;
  })
  .onEnd((event) => {
    const shouldDismissRight = translateX.value > SWIPE_THRESHOLD;
    const shouldDismissLeft = translateX.value < -SWIPE_THRESHOLD;
    const shouldSwipeUp = translateY.value < -SWIPE_UP_THRESHOLD;

    if (shouldDismissRight) {
      translateX.value = withSpring(SCREEN_WIDTH * 1.5);
      runOnJS(handleLike)();
    } else if (shouldDismissLeft) {
      translateX.value = withSpring(-SCREEN_WIDTH * 1.5);
      runOnJS(handleDismiss)();
    } else if (shouldSwipeUp) {
      translateY.value = withSpring(-SCREEN_HEIGHT);
      runOnJS(handleSwipeUp)();
    } else {
      // Spring back to center
      translateX.value = withSpring(0, SPRING_CONFIG);
      translateY.value = withSpring(0, SPRING_CONFIG);
    }
  });

// Animated card style with rotation and color tint
const cardStyle = useAnimatedStyle(() => {
  const rotation = interpolate(
    translateX.value,
    [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    [-ROTATION_ANGLE, 0, ROTATION_ANGLE],
    Extrapolation.CLAMP
  );
  return {
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation}deg` },
    ],
  };
});
```

### Pattern 2: Photo Carousel with Tap Zones
**What:** Divide card into left/right halves. Tap left = previous, tap right = next. Use shared value for instant swap (no animation).
**When to use:** Photo navigation on the card face.
**Example:**
```typescript
const photoIndex = useSharedValue(0);
const totalPhotos = photos.length;

const tapGesture = Gesture.Tap().onEnd((event) => {
  const isLeftHalf = event.x < SCREEN_WIDTH / 2;
  if (isLeftHalf) {
    photoIndex.value = photoIndex.value > 0
      ? photoIndex.value - 1
      : totalPhotos - 1; // Loop back from first to last
  } else {
    photoIndex.value = (photoIndex.value + 1) % totalPhotos; // Loop from last to first
  }
});
```

### Pattern 3: Swipe Feedback Overlay
**What:** Show green glow + heart icon on right drag, red glow + X icon on left drag. Opacity scales with drag distance.
**When to use:** Visual feedback during active swipe gesture.
**Example:**
```typescript
const likeOpacity = useAnimatedStyle(() => ({
  opacity: interpolate(
    translateX.value,
    [0, SWIPE_THRESHOLD],
    [0, 1],
    Extrapolation.CLAMP
  ),
}));

const dislikeOpacity = useAnimatedStyle(() => ({
  opacity: interpolate(
    translateX.value,
    [-SWIPE_THRESHOLD, 0],
    [1, 0],
    Extrapolation.CLAMP
  ),
}));
```

### Pattern 4: Stack Management with Pagination
**What:** Maintain card stack state. Pre-fetch next page when 5 cards remain (Phase 3 decision). Remove swiped cards from stack immutably.
**When to use:** Discovery tab state management.
**Example:**
```typescript
// In use-discovery-stack.ts hook
const [stack, setStack] = useState<readonly DiscoveryProfile[]>([]);
const [offset, setOffset] = useState(0);

// Remove top card immutably after swipe
const removeTopCard = useCallback(() => {
  setStack(prev => prev.slice(1));
}, []);

// Pre-fetch when running low
useEffect(() => {
  if (stack.length <= 5 && !isLoading) {
    fetchMore();
  }
}, [stack.length]);
```

### Anti-Patterns to Avoid
- **Animating on JS thread:** Never use `Animated` from React Native core for swipe animations. Always use `react-native-reanimated` shared values and `useAnimatedStyle` to stay on the UI thread.
- **Rendering all cards:** Only render top 2-3 cards in the deck. Rendering the full stack (20+ cards) wastes memory and causes layout thrashing.
- **Mutating stack array:** Never `splice` or `shift` the stack array in place. Always create new arrays with `slice` or `filter`.
- **Blocking gesture with async calls:** Call `likeProfile` / `dismissProfile` via `runOnJS` after the animation starts, not before. The card should fly off screen while the API call happens in parallel.
- **Missing gesture composition:** When combining tap (photo navigation) with pan (swipe), use `Gesture.Simultaneous()` or `Gesture.Race()` to prevent tap from stealing pan events. Pan should activate after a small movement threshold; tap fires on press without movement.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom sheet with gestures | Custom animated bottom sheet | @gorhom/bottom-sheet v5 | Handles scroll nesting, snap points, keyboard avoidance, backdrop, gesture composition with parent views |
| Confetti animation | Custom particle system | react-native-confetti-cannon | Particle physics, randomization, timing are deceptively complex; library is <10KB |
| Image preloading | Custom fetch queue | `Image.prefetch()` from React Native | Built-in, handles caching, cancellation, and network priority |

**Key insight:** The swipe gesture and card animations SHOULD be custom-built because they are core UX that needs precise control. But peripheral features (bottom sheet, confetti) should use proven libraries.

## Common Pitfalls

### Pitfall 1: Gesture Conflict Between Tap and Pan
**What goes wrong:** Tap gesture for photo navigation fires during pan swipe, or pan gesture prevents tap from registering.
**Why it happens:** Both gestures respond to touch events on the same view.
**How to avoid:** Use `Gesture.Race()` with the pan gesture configured with a small `activeOffsetX`/`activeOffsetY` (e.g., `[-10, 10]`). This makes pan only activate after 10px of movement, letting tap fire for stationary presses. Alternatively, use `Gesture.Exclusive(panGesture, tapGesture)` where pan takes priority when movement is detected.
**Warning signs:** Photos change while swiping, or swipe doesn't start until after a noticeable delay.

### Pitfall 2: Card Stack Z-Index and Pointer Events
**What goes wrong:** Taps and swipes register on the wrong card in the stack (e.g., second card receives events instead of top card).
**Why it happens:** React Native's z-index and pointer event ordering can be counterintuitive. Later-rendered children are on top by default.
**How to avoid:** Render cards in reverse order (last card in array renders first in JSX). Use `pointerEvents="none"` on all cards except the top one.
**Warning signs:** Swiping seems to affect the wrong profile.

### Pitfall 3: Memory Leaks from Un-canceled Image Prefetch
**What goes wrong:** Prefetching images for cards that are swiped away before loading completes causes memory buildup.
**Why it happens:** `Image.prefetch()` returns a promise but doesn't auto-cancel.
**How to avoid:** Only prefetch for the next 2-3 cards. Use `AbortController` if supported, or simply accept that orphaned prefetches complete harmlessly (they populate the cache which is still useful).
**Warning signs:** Increasing memory usage over extended swiping sessions.

### Pitfall 4: Bottom Sheet Steals Pan Gesture from Swipe Deck
**What goes wrong:** Opening the bottom sheet via card tap works, but after dismissing, swipe gestures on the deck become unresponsive.
**Why it happens:** @gorhom/bottom-sheet uses its own gesture handler that may not properly release when dismissed.
**How to avoid:** Use `BottomSheetModal` (modal variant) instead of inline `BottomSheet`. The modal renders in a portal and fully unmounts on dismiss, cleanly releasing gesture handlers.
**Warning signs:** Swipe gesture requires two attempts after closing the profile sheet.

### Pitfall 5: Race Condition on Rapid Swiping
**What goes wrong:** Swiping quickly through multiple cards sends out-of-order API calls. Card N+1 might get dismissed before card N's like resolves.
**Why it happens:** Each swipe triggers an async service call. If the user swipes faster than the API responds, the stack index can drift.
**How to avoid:** Use optimistic UI updates. Remove the card from the local stack immediately on swipe. Queue API calls but don't block the UI on their resolution. Handle failures with a toast/retry rather than rolling back the stack.
**Warning signs:** Duplicate likes or dismissals, "profile already liked" errors from backend.

### Pitfall 6: Confetti Rendering Over Tab Bar
**What goes wrong:** Match modal confetti renders behind the tab bar or gets clipped.
**Why it happens:** The tab layout has its own stacking context.
**How to avoid:** Render the match modal at the root layout level (via a modal route in Expo Router or a portal/context). Use `<Stack.Screen name="match-modal" options={{ presentation: 'transparentModal' }} />` for proper overlay behavior.
**Warning signs:** Confetti animation looks clipped at the bottom of the screen.

## Code Examples

### Swipe Card Component Structure
```typescript
// Source: Project conventions + reanimated docs
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3; // 30% of screen width
const SWIPE_UP_THRESHOLD = 150;
const ROTATION_ANGLE = 12; // degrees
const SPRING_CONFIG = { damping: 15, stiffness: 150 };

type SwipeCardProps = {
  readonly profile: DiscoveryProfile;
  readonly onLike: () => void;
  readonly onDismiss: () => void;
  readonly onSwipeUp: () => void;
  readonly isTopCard: boolean;
};
```

### Match Modal Trigger Pattern
```typescript
// Source: Project match-service.ts + likeProfile return type
async function handleLike() {
  const result = await likeProfile(userId, currentProfile.user_id);
  if (result.error) {
    // Show error toast, don't block
    return;
  }
  if (result.is_match) {
    // Store match data for modal
    setMatchData({
      matchId: result.match_id,
      threadId: result.thread_id,
      profile: currentProfile,
    });
    setShowMatchModal(true);
    // Trigger heavy haptic
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
  removeTopCard();
}
```

### Photo Indicator Bar
```typescript
// Source: Tinder/Instagram Stories UI pattern
function PhotoIndicator({
  total,
  current,
}: {
  readonly total: number;
  readonly current: number;
}) {
  return (
    <View className="flex-row gap-1 px-2 pt-2">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`h-0.5 flex-1 rounded-full ${
            i === current ? "bg-white" : "bg-white/40"
          }`}
        />
      ))}
    </View>
  );
}
```

### Bottom Sheet Profile Integration
```typescript
// Source: @gorhom/bottom-sheet v5 docs
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";

const snapPoints = useMemo(() => ["50%", "90%"], []);

<BottomSheet
  ref={bottomSheetRef}
  index={-1}
  snapPoints={snapPoints}
  enablePanDownToClose
  backgroundStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
>
  <BottomSheetScrollView>
    {/* Photo gallery, bio, schools, nitty-gritty details */}
  </BottomSheetScrollView>
</BottomSheet>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Animated API from RN core | react-native-reanimated v3 shared values | 2023 | Animations run on UI thread; 60fps guaranteed |
| PanResponder | Gesture.Pan() from gesture-handler v2 | 2022 | Declarative gestures, composition, simultaneous handling |
| FlatList-based swipe deck | Stacked Animated.View cards | 2023 | Better memory profile, simpler gesture handling |
| react-native-deck-swiper | Custom gesture+reanimated | 2024 | Full control over animations, no abandoned dependency risk |

**Deprecated/outdated:**
- `react-native-deck-swiper`: Last published 2020, uses old Animated API, unmaintained
- `PanResponder`: Superseded by gesture-handler; runs on JS thread (janky)
- `Animated.timing/spring` from React Native core: Use reanimated `withSpring`/`withTiming` instead

## Open Questions

1. **Tab bar transparency behind full-screen cards**
   - What we know: Cards fill edge-to-edge behind tab bar per user decision. Tab bar is standard `@react-navigation/bottom-tabs`.
   - What's unclear: Whether to make tab bar translucent (blur effect) or fully transparent over card content.
   - Recommendation: Use `tabBarStyle: { position: 'absolute', backgroundColor: 'transparent' }` with `expo-blur` BlurView for tab bar background. This lets the card photo extend behind while keeping tab icons visible.

2. **Match modal routing**
   - What we know: Modal must be full-screen overlay with confetti. Expo Router supports modal presentation.
   - What's unclear: Whether to use a route-based modal (`presentation: 'transparentModal'`) or a React state-based overlay component.
   - Recommendation: Use state-based overlay rendered inside the Discovery screen component. Simpler, avoids route stack complexity, and confetti/haptics trigger immediately without navigation delay.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + jest-expo ~52.0.6 |
| Config file | `package.json` (jest section) |
| Quick run command | `npx jest --testPathPattern="discovery\|match\|swipe" --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISC-01 | Swipe left calls dismissProfile | unit | `npx jest __tests__/hooks/use-discovery-stack.test.ts -x` | No -- Wave 0 |
| DISC-02 | Swipe right calls likeProfile | unit | `npx jest __tests__/hooks/use-discovery-stack.test.ts -x` | No -- Wave 0 |
| DISC-03 | Save button calls saveProfile, toggles state | unit | `npx jest __tests__/hooks/use-discovery-stack.test.ts -x` | No -- Wave 0 |
| DISC-04 | Photo index wraps on tap (loops at end) | unit | `npx jest __tests__/components/photo-indicator.test.ts -x` | No -- Wave 0 |
| MTCH-02 | Match modal shown when likeProfile returns is_match=true | unit | `npx jest __tests__/hooks/use-discovery-stack.test.ts -x` | No -- Wave 0 |
| MTCH-03 | Thread ID stored from likeProfile response | unit | `npx jest __tests__/hooks/use-discovery-stack.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="discovery\|match\|swipe" --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/hooks/use-discovery-stack.test.ts` -- covers DISC-01, DISC-02, DISC-03, MTCH-02, MTCH-03 (hook logic: swipe actions, stack management, pagination, match detection)
- [ ] `__tests__/components/photo-indicator.test.ts` -- covers DISC-04 (index wrap, loop behavior)
- [ ] `__tests__/components/match-modal.test.ts` -- covers MTCH-02 (modal renders with profile data, action buttons work)
- [ ] Install `@testing-library/react-native` for component rendering tests (currently only `react-test-renderer` is installed)
- [ ] Mock `react-native-reanimated` for Jest: `jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))`
- [ ] Mock `expo-haptics` for Jest

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/services/discovery-service.ts`, `src/services/match-service.ts`, `src/types/filters.ts` -- verified API contracts
- Project codebase: `src/components/onboarding/photo-grid.tsx` -- proven gesture+reanimated patterns in this project
- Project codebase: `app/_layout.tsx` -- GestureHandlerRootView already wrapping root
- Project codebase: `package.json` -- verified installed dependency versions
- [Reanimated handling gestures docs](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/handling-gestures/) -- Pan gesture + shared value patterns
- [Expo gestures tutorial](https://docs.expo.dev/tutorial/gestures/) -- Official Expo gesture integration guide

### Secondary (MEDIUM confidence)
- [@gorhom/bottom-sheet docs](https://gorhom.dev/react-native-bottom-sheet/) -- v5 API with BottomSheetModal, snap points, scroll handling
- [react-native-confetti-cannon npm](https://www.npmjs.com/package/react-native-confetti-cannon) -- Lightweight confetti burst, JS-only
- [Tinder swipe animation patterns](https://www.animatereactnative.com/post/tinder-swiper-animation-reanimated-+-gesture-handler) -- Community best practices for card rotation + interpolation

### Tertiary (LOW confidence)
- None -- all findings verified against official docs or project codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all core libraries already installed and proven in project; new deps (@gorhom/bottom-sheet, confetti-cannon) are well-documented
- Architecture: HIGH -- pattern is well-established (Tinder-style deck); project has working gesture+reanimated examples in photo-grid.tsx
- Pitfalls: HIGH -- gesture conflict and z-index issues are documented across multiple sources; race condition patterns verified against project service contracts

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable libraries, no fast-moving changes expected)
