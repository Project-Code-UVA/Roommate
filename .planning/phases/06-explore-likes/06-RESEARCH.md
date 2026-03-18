# Phase 6: Explore & Likes - Research

**Researched:** 2026-03-17
**Domain:** React Native grid UI, Supabase RPC ranking queries, blur paywall UX
**Confidence:** HIGH

## Summary

Phase 6 builds two new tab screens (Explore and Likes) on top of a mature codebase with well-established patterns. The Explore tab is a 3-column grid of profiles from ANY school, ranked by engagement/popularity with random profiles mixed in (per user decision, departing from PRD's shared-school-only and weighted-algorithm ranking). The Likes tab shows My Likes, Liked Me (blurred for free users), and Matches with last message previews.

The existing codebase provides nearly all the building blocks: `ProfileCard` for full profile views, `FloatingActions` for like/dismiss buttons, `likeProfile`/`dismissProfile` services for interactions, `getThreads` for enriched match data, and `UnreadBadge` for tab badges. The primary new work is: (1) a new Supabase RPC for the Explore feed with engagement-based ranking, (2) a new RPC for "liked me" with subscription check, (3) FlatList grid components, (4) blur effect on Liked Me cards using the already-installed `expo-blur`, and (5) hook + service wiring following the existing service-hook-component pattern.

**Primary recommendation:** Follow the service-hook-component architecture exactly as Discovery did. Create `explore-service.ts`, `likes-service.ts`, `use-explore-feed.ts`, `use-likes.ts` hooks, and compose screens from existing + new components. The Explore RPC should use a CTE structure mirroring `get_discovery_stack` but with engagement-based scoring instead of compatibility scoring.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 3-column grid, Instagram-style compact cards for Explore
- Each card shows: photo + name + year (class year overlay)
- Flat ranked list, no sections or category headers
- Infinite scroll with pull-to-refresh (pull shuffles feed, scroll loads more)
- NOT ranked by compatibility -- ranked by engagement/popularity with random profiles mixed in
- Shows profiles from ANY school, not limited to shared schools
- Filter out profiles the user has dismissed in Discovery; liked/unseen profiles can appear
- Tap card opens full scrollable Hinge-style profile (reuse existing profile-card component)
- Like/dismiss from full profile view using existing floating action buttons -- no inline grid actions
- Non-shared-school profiles: can still like and match, but messaging blocked until shared school. Match modal notes restriction.
- Matches section shows: photo + name + last message preview + unread indicator (reuse thread-service data)
- My Likes shows pending likes (profiles you liked that haven't liked back). No indicator of reciprocation.
- Badge on Likes tab icon showing count of new people who liked you (reuse UnreadBadge component pattern)
- Light blur on photos -- can sort of make out identity (Bumble-style tease)
- No info visible on blurred cards -- just the blurred photo, no name
- Upgrade banner above Liked Me grid AND tapping blurred card triggers upgrade prompt
- Upgrade button is a stub for now -- shows "Coming soon" alert on tap (monetization in Phase 9)

### Claude's Discretion
- Likes tab layout approach (top tabs vs scrollable sections)
- Explore RPC query design for engagement-based ranking
- Empty states for each section
- Loading skeleton design
- Exact blur radius for Liked Me cards

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EXPL-01 | User can browse grid of profiles from shared schools | Explore grid screen with FlatList numColumns=3; NOTE: user decision broadens to ANY school, not just shared schools |
| EXPL-02 | Profiles ranked by weighted algorithm (30% completeness, 25% activity, 20% verification, 15% interactions, 10% freshness) | New `get_explore_feed` RPC; user decision changes to engagement/popularity ranking with random mix -- but weights still configurable |
| EXPL-03 | Ranking weights are configurable server-side | Use existing `ranking_config` table -- add explore-specific weight rows |
| EXPL-04 | User can like and save profiles from Explore | Reuse `likeProfile` from match-service and `saveProfile` from discovery-service |
| EXPL-05 | Matching rules identical to Discovery | Same `like_profile` RPC handles atomic match detection |
| LIKE-01 | User can view My Likes list | New `get_my_likes` query -- likes table where liker_id = user AND no reciprocal like yet |
| LIKE-02 | User can view Matches list with last message preview and unread indicator | Reuse `getThreads` from thread-service (already returns enriched data) |
| LIKE-03 | Free users see blurred Liked Me grid | New `get_liked_me` RPC + expo-blur BlurView on cards; subscription check client-side |
| LIKE-04 | Paid users see full Liked Me with identity revealed | Same RPC returns full data; client removes blur when subscription active |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-blur | ~14.0.3 | BlurView for Liked Me paywall cards | Already in package.json; native blur effect |
| react-native FlatList | built-in | Grid layout with numColumns={3} | Standard RN grid; no extra dependency needed |
| expo-haptics | installed | Tactile feedback on like/dismiss | Already used in FloatingActions |
| expo-linear-gradient | installed | Card overlays (name on photo) | Already used in ProfileCard |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @expo/vector-icons (Ionicons) | installed | Tab icons, section headers, empty states | Consistent with existing icon usage |
| react-native-safe-area-context | installed | SafeAreaView for screen containers | All tab screens use this |

### No New Dependencies Required
The existing stack covers all Phase 6 needs. `expo-blur` is already installed for the Liked Me blur effect. FlatList with `numColumns` handles the grid layout without needing FlashList or a masonry library.

## Architecture Patterns

### Recommended Project Structure
```
src/
  services/
    explore-service.ts       # getExploreFeed() RPC wrapper
    likes-service.ts         # getMyLikes(), getLikedMe(), getLikedMeCount()
  hooks/
    use-explore-feed.ts      # Pagination, pull-to-refresh, profile view state
    use-likes.ts             # My Likes, Liked Me, badge count
  components/
    explore/
      explore-grid-card.tsx  # Compact 3-col grid card (photo + name + year overlay)
      explore-profile-view.tsx  # Full profile modal (wraps ProfileCard + FloatingActions)
    likes/
      likes-section-header.tsx  # Section title with count
      my-likes-card.tsx      # Card for My Likes grid
      liked-me-card.tsx      # Blurred card with upgrade prompt
      matches-row.tsx        # Horizontal match row (photo + name + last msg + unread)
      upgrade-banner.tsx     # "See who likes you" banner above Liked Me
app/
  (tabs)/
    explore.tsx              # Replace stub -- Explore grid screen
    likes.tsx                # Replace stub -- Likes tab screen
    _layout.tsx              # Add Likes badge (liked-me count)
supabase/
  migrations/
    00039_get_explore_feed.sql   # Explore ranking RPC
    00040_get_my_likes.sql       # My Likes query RPC
    00041_get_liked_me.sql       # Liked Me query RPC
    00042_seed_explore_weights.sql # Explore-specific ranking weights
```

### Pattern 1: Service-Hook-Component (Existing Pattern)
**What:** Service wraps Supabase calls, hook manages state/pagination, component renders UI.
**When to use:** Every data-fetching screen.
**Example (from existing codebase):**
```typescript
// Service: structured error return, never throws
export async function getExploreFeed(userId: string, limit: number, offset: number) {
  const { data, error } = await rpc("get_explore_feed", { p_user_id: userId, p_limit: limit, p_offset: offset });
  if (error) return { data: null, error: error.message };
  return { data: data ?? [], error: null };
}

// Hook: manages state, pagination, actions
export function useExploreFeed(userId: string) {
  const [profiles, setProfiles] = useState<readonly ExploreProfile[]>([]);
  // ... pagination, refresh, profile selection logic
}
```

### Pattern 2: Optimistic UI (Existing Pattern)
**What:** Remove profile from view immediately, fire API call async.
**When to use:** Like/dismiss from Explore profile view.
**Example:** Already implemented in `useDiscoveryStack.likeCurrent()` -- remove from stack, then call `likeProfile()`.

### Pattern 3: Grid Card with Overlay
**What:** Image card with gradient overlay for text at bottom.
**When to use:** Explore grid cards (photo + name + year).
```typescript
// Compact grid card -- approximately 1/3 screen width
<Pressable onPress={() => onSelect(profile)} style={styles.gridCard}>
  <Image source={{ uri: profile.photos[0]?.url }} style={styles.cardImage} />
  <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={styles.cardGradient}>
    <Text style={styles.cardName}>{profile.display_name}</Text>
    {profile.year && <Text style={styles.cardYear}>{profile.year}</Text>}
  </LinearGradient>
</Pressable>
```

### Pattern 4: Blur Paywall
**What:** expo-blur BlurView over card content, tap triggers upgrade prompt.
**When to use:** Liked Me cards for free users.
```typescript
import { BlurView } from "expo-blur";

<View style={styles.likedMeCard}>
  <Image source={{ uri: profile.photos[0]?.url }} style={styles.cardImage} />
  {!isPaid && (
    <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onUpgradePrompt} />
    </BlurView>
  )}
</View>
```

### Anti-Patterns to Avoid
- **Inline grid actions:** User explicitly decided no like/dismiss buttons on grid cards. Tap opens full profile first.
- **ScrollView for long lists:** Use FlatList for virtualized rendering. Explore feed could have hundreds of profiles.
- **Fetching all matches separately:** Reuse `getThreads()` which already returns enriched data with last message and unread count.
- **Client-side ranking:** All ranking/scoring must happen in the Supabase RPC, not in JavaScript.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Photo blur effect | CSS opacity hack or image processing | `expo-blur` BlurView with intensity=60 | Native blur is performant and consistent cross-platform |
| Grid layout | Custom row/column calculations | FlatList `numColumns={3}` | Built-in, handles virtualization, pull-to-refresh |
| Ranking algorithm | Client-side sort | Supabase RPC with CTE scoring | Server-enforced, configurable, no data leak |
| Subscription check | Custom subscription service | Query `subscriptions` table directly | Simple boolean check, no complex logic needed |
| Tab badge | Custom badge component | Reuse existing `UnreadBadge` from _layout.tsx | Already styled, tested, handles 99+ overflow |

**Key insight:** This phase is mostly composition of existing patterns with new data sources. The real complexity is in the Supabase RPCs, not the React Native UI.

## Common Pitfalls

### Pitfall 1: Explore Scope vs PRD Conflict
**What goes wrong:** PRD says Explore shows "users who share at least one school" and uses the weighted algorithm. User decided to show ANY school with engagement ranking.
**Why it happens:** User explicitly departed from PRD in CONTEXT.md decisions.
**How to avoid:** Follow CONTEXT.md decisions (they override PRD per the discussion). Document the departure in `docs/DECISIONS.md`. The messaging gate (shared school required) still enforces the trust model.
**Warning signs:** Code review flagging "violates PRD" -- the departure is intentional.

### Pitfall 2: FlatList numColumns Performance
**What goes wrong:** FlatList with numColumns + many images causes janky scrolling.
**Why it happens:** Each grid cell renders a full Image component; without optimization, all images load at once.
**How to avoid:** Use `getItemLayout` for fixed-height grid rows. Use `initialNumToRender={12}` (4 rows), `maxToRenderPerBatch={9}` (3 rows). Ensure images have fixed dimensions.
**Warning signs:** Scroll stuttering, high memory usage on Explore tab.

### Pitfall 3: Liked Me Data Leak
**What goes wrong:** Free users see blurred photos but client receives full profile data (name, bio, etc.) -- inspectable via dev tools.
**Why it happens:** RPC returns all fields, client just hides them visually.
**How to avoid:** The `get_liked_me` RPC should return ONLY photo URL + user_id for free users. Full profile data only when subscription is active. Server-side enforcement.
**Warning signs:** Network inspector showing full profile JSON for blurred cards.

### Pitfall 4: Pull-to-Refresh Shuffle Without Server Support
**What goes wrong:** Pull-to-refresh is supposed to "shuffle" the feed, but re-fetching the same RPC returns the same ranked order.
**Why it happens:** Deterministic ranking produces identical results.
**How to avoid:** Add a `p_seed` parameter to the RPC. On pull-to-refresh, generate a new random seed. The RPC uses the seed to mix random profiles into the ranked results. On regular pagination, keep the same seed.
**Warning signs:** Pull-to-refresh shows identical profiles in identical order.

### Pitfall 5: Badge Count Polling Overhead
**What goes wrong:** Polling liked-me count every 30 seconds (like unread messages) adds unnecessary API calls.
**Why it happens:** Copy-pasting the unread message polling pattern.
**How to avoid:** Liked-me count changes infrequently. Poll every 60 seconds or only on tab focus. Use `useCallback` with `useFocusEffect` from Expo Router.
**Warning signs:** High API call volume from likes tab badge polling.

### Pitfall 6: Match Modal Missing Shared-School Warning
**What goes wrong:** User matches from Explore with a non-shared-school profile, match modal says "Send a Message" but messaging is blocked.
**Why it happens:** Existing MatchModal doesn't check shared-school status.
**How to avoid:** Pass `sharesSchool` boolean to MatchModal. When false, show modified text: "You matched! Message unlocked when you share a school." Disable/hide "Send a Message" button.
**Warning signs:** User taps "Send a Message" and gets an error.

## Code Examples

### Explore Feed RPC Design (engagement-based ranking)
```sql
-- Source: Adapted from existing get_discovery_stack CTE pattern
CREATE OR REPLACE FUNCTION public.get_explore_feed(
  p_user_id uuid,
  p_limit integer DEFAULT 24,
  p_offset integer DEFAULT 0,
  p_seed integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_w_popularity numeric;
  v_w_activity numeric;
  v_w_completeness numeric;
  v_w_verification numeric;
  v_w_freshness numeric;
  v_result jsonb;
BEGIN
  -- Read configurable weights
  SELECT COALESCE(weight_value, 0.30) INTO v_w_completeness
  FROM ranking_config WHERE weight_name = 'explore_completeness';
  -- ... similar for other weights

  WITH candidates AS (
    SELECT p.user_id, p.display_name, p.year, p.completion_score,
           u.selfie_verified, u.last_active_at
    FROM profiles p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN dismissals d ON d.dismisser_id = p_user_id AND d.dismissed_id = p.user_id
    WHERE p.user_id != p_user_id
      AND u.onboarding_completed = true
      AND u.enforcement_state = 'none'
      AND u.mode_status IN ('roommate', 'friends')
      AND NOT is_blocked(p_user_id, p.user_id)
      -- Filter dismissed profiles (hard filter, no cooldown like Discovery)
      AND d.id IS NULL
  ),
  scored AS (
    SELECT c.*,
      -- Engagement: likes received in last 30 days
      (SELECT COUNT(*) FROM likes WHERE liked_id = c.user_id
       AND created_at > now() - interval '30 days')::numeric AS like_count,
      -- Random component for variety (seeded for pagination stability)
      random() AS rand_score
    FROM candidates c
  )
  SELECT jsonb_agg(to_jsonb(ranked)) INTO v_result
  FROM (
    SELECT s.user_id, s.display_name, s.year, s.selfie_verified,
           -- Primary photo only for grid card
           (SELECT url FROM photos WHERE user_id = s.user_id
            AND moderation_status = 'approved' ORDER BY order_index LIMIT 1) AS photo_url
    FROM scored s
    -- Mix: 70% by engagement score, 30% random
    ORDER BY (0.7 * LEAST(s.like_count / GREATEST(
      (SELECT AVG(lc) FROM (SELECT COUNT(*) lc FROM likes GROUP BY liked_id) sub), 1), 1)
      + 0.3 * s.rand_score) DESC
    LIMIT p_limit OFFSET p_offset
  ) ranked;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
```

### Explore Grid Card Component Pattern
```typescript
// Source: project convention -- LinearGradient overlay, NativeWind styling
type ExploreGridCardProps = {
  readonly profile: ExploreProfile;
  readonly onPress: () => void;
};

export function ExploreGridCard({ profile, onPress }: ExploreGridCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card} testID={`explore-card-${profile.user_id}`}>
      <Image source={{ uri: profile.photo_url }} style={styles.image} resizeMode="cover" />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.55)"]} style={styles.gradient}>
        <Text style={styles.name} numberOfLines={1}>{profile.display_name}</Text>
        {profile.year && <Text style={styles.year}>{profile.year}</Text>}
      </LinearGradient>
    </Pressable>
  );
}
```

### Liked Me Card with Blur
```typescript
// Source: expo-blur docs + project pattern
import { BlurView } from "expo-blur";

export function LikedMeCard({ profile, isPaid, onUpgrade }: LikedMeCardProps) {
  return (
    <Pressable onPress={isPaid ? () => onSelect(profile) : onUpgrade} style={styles.card}>
      <Image source={{ uri: profile.photo_url }} style={styles.image} />
      {!isPaid && (
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
      )}
      {isPaid && (
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.55)"]} style={styles.gradient}>
          <Text style={styles.name}>{profile.display_name}</Text>
        </LinearGradient>
      )}
    </Pressable>
  );
}
```

### Likes Tab Layout Recommendation (Claude's Discretion)
**Recommendation: Scrollable sections with sticky headers** rather than top tabs.

Rationale:
- Three sections (Liked Me, My Likes, Matches) have different visual density. Top tabs hide content; scrollable sections let users scan everything.
- Matches section is most actionable (has messages) -- placing it at top with Liked Me and My Likes below keeps the hierarchy clear.
- Avoids adding a tab-view library. FlatList with SectionList-like manual headers keeps it simple.

Layout order:
1. **Matches** (horizontal scroll row of match avatars with last message, or vertical list if > 5)
2. **Liked Me** (grid with blur + upgrade banner)
3. **My Likes** (grid of pending likes)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| expo-blur `BlurView` with `blurType` | `intensity` prop (numeric 0-100) | expo-blur 12+ | Use `intensity={60}` not old `blurType="light"` |
| FlatList for grids | FlatList `numColumns` still standard in Expo SDK 52 | Stable | FlashList is alternative but adds dependency; FlatList is sufficient for < 1000 items |
| Manual pull-to-refresh | FlatList `refreshControl` prop | Long stable | Use `RefreshControl` component with `onRefresh` callback |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + jest-expo + @testing-library/react-native |
| Config file | `package.json` jest section |
| Quick run command | `npx jest --testPathPattern="explore\|likes" --bail` |
| Full suite command | `npx jest` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXPL-01 | Explore grid renders profiles | unit | `npx jest __tests__/components/explore/explore-grid-card.test.tsx -x` | Wave 0 |
| EXPL-02 | Explore feed uses ranking RPC | unit | `npx jest __tests__/services/explore-service.test.ts -x` | Wave 0 |
| EXPL-03 | Ranking weights configurable | unit | `npx jest __tests__/services/explore-service.test.ts -x` | Wave 0 |
| EXPL-04 | Like/save from Explore | unit | `npx jest __tests__/hooks/use-explore-feed.test.ts -x` | Wave 0 |
| EXPL-05 | Match rules identical to Discovery | unit | `npx jest __tests__/hooks/use-explore-feed.test.ts -x` | Wave 0 |
| LIKE-01 | My Likes list renders | unit | `npx jest __tests__/components/likes/my-likes-card.test.tsx -x` | Wave 0 |
| LIKE-02 | Matches with last msg + unread | unit | `npx jest __tests__/components/likes/matches-row.test.tsx -x` | Wave 0 |
| LIKE-03 | Blurred Liked Me grid | unit | `npx jest __tests__/components/likes/liked-me-card.test.tsx -x` | Wave 0 |
| LIKE-04 | Paid users see revealed | unit | `npx jest __tests__/components/likes/liked-me-card.test.tsx -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="explore\|likes" --bail`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/services/explore-service.test.ts` -- covers EXPL-02, EXPL-03
- [ ] `__tests__/services/likes-service.test.ts` -- covers LIKE-01, LIKE-03, LIKE-04
- [ ] `__tests__/hooks/use-explore-feed.test.ts` -- covers EXPL-01, EXPL-04, EXPL-05
- [ ] `__tests__/hooks/use-likes.test.ts` -- covers LIKE-01, LIKE-02
- [ ] `__tests__/components/explore/explore-grid-card.test.tsx` -- covers EXPL-01
- [ ] `__tests__/components/explore/explore-profile-view.test.tsx` -- covers EXPL-04
- [ ] `__tests__/components/likes/liked-me-card.test.tsx` -- covers LIKE-03, LIKE-04
- [ ] `__tests__/components/likes/matches-row.test.tsx` -- covers LIKE-02
- [ ] `__tests__/components/likes/my-likes-card.test.tsx` -- covers LIKE-01
- [ ] `__tests__/components/likes/upgrade-banner.test.tsx` -- covers LIKE-03

## Open Questions

1. **Explore profile full-data fetch**
   - What we know: Grid card only needs photo + name + year. Full profile needs all DiscoveryProfile fields.
   - What's unclear: Should the grid RPC return minimal data and a second RPC fetch full profile on tap? Or return full data upfront?
   - Recommendation: Return minimal data for grid performance. On tap, call a `get_profile_detail` RPC (or reuse `getDiscoveryStack` with limit=1 for that user). This prevents large payloads for profiles never viewed.

2. **Seed-based pagination for shuffle**
   - What we know: Pull-to-refresh should shuffle the feed. Regular scroll should maintain order.
   - What's unclear: Best way to implement deterministic random ordering in Postgres.
   - Recommendation: Use `setseed(p_seed / 2147483647.0)` at start of RPC, then `random()` in ORDER BY. Client generates seed on mount, regenerates on pull-to-refresh.

3. **Non-shared-school match modal messaging restriction**
   - What we know: User wants match modal to note the restriction.
   - What's unclear: Exact UX copy and whether to hide or disable the Send Message button.
   - Recommendation: Show modified subtext "Message unlocked when you share a school" and grey out the Send Message button. Keep "Keep Browsing" as the primary action.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `get_discovery_stack` RPC, `useDiscoveryStack` hook, `ProfileCard`, `FloatingActions`, `thread-service`, `match-service`
- Supabase schema: `likes`, `matches`, `dismissals`, `ranking_config`, `subscriptions`, `profiles`, `users` tables
- `expo-blur` already installed in package.json (~14.0.3)

### Secondary (MEDIUM confidence)
- expo-blur BlurView `intensity` prop API -- verified via installed version and Expo docs
- FlatList `numColumns` behavior -- well-documented React Native core API
- Postgres `setseed()` + `random()` for deterministic random ordering -- standard Postgres pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed, no new deps
- Architecture: HIGH -- follows exact existing patterns from Phases 3-5
- Pitfalls: HIGH -- identified from codebase analysis and user decisions
- RPC design: MEDIUM -- engagement ranking approach is new but follows CTE pattern

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable stack, no fast-moving dependencies)
