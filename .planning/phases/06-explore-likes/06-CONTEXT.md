# Phase 6: Explore & Likes - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the Explore tab (grid browse of profiles ranked by engagement/popularity across all schools) and the Likes tab (My Likes, Liked Me with blur paywall, Matches with last message preview). Users can like/save from Explore with matching rules identical to Discovery. Messaging still requires shared school.

</domain>

<decisions>
## Implementation Decisions

### Explore Grid Layout
- 3-column grid, Instagram-style compact cards
- Each card shows: photo + name + year (class year overlay)
- Flat ranked list, no sections or category headers
- Infinite scroll with pull-to-refresh (pull shuffles feed, scroll loads more)

### Explore Ranking & Scope
- NOT ranked by compatibility — ranked by engagement/popularity with random profiles mixed in
- Shows profiles from ANY school, not limited to shared schools
- Departed from PRD weighted algorithm — Explore is a broader social discovery surface
- Popular users + random sprinkle for variety
- Filter out profiles the user has dismissed in Discovery; liked/unseen profiles can appear

### Explore Interactions
- Tap card opens full scrollable Hinge-style profile (reuse existing profile-card component)
- Like/dismiss from full profile view using existing floating action buttons — no inline grid actions
- Non-shared-school profiles: can still like and match, but messaging blocked until shared school. Match modal notes restriction.

### Likes Tab Structure
- Claude's discretion on layout (top tabs vs scrollable sections)
- Matches section shows: photo + name + last message preview + unread indicator (reuse thread-service data)
- My Likes shows pending likes (profiles you liked that haven't liked back). No indicator of reciprocation.
- Badge on Likes tab icon showing count of new people who liked you (reuse UnreadBadge component pattern)

### Liked Me Blur/Paywall
- Light blur on photos — can sort of make out identity (Bumble-style tease)
- No info visible on blurred cards — just the blurred photo, no name
- Upgrade banner above Liked Me grid AND tapping blurred card triggers upgrade prompt
- Upgrade button is a stub for now — shows "Coming soon" alert on tap (monetization in Phase 9)

### Claude's Discretion
- Likes tab layout approach (top tabs vs scrollable sections)
- Explore RPC query design for engagement-based ranking
- Empty states for each section
- Loading skeleton design
- Exact blur radius for Liked Me cards

</decisions>

<specifics>
## Specific Ideas

- Explore should feel like browsing — "the more popular users and some randos sprinkled in"
- Not a compatibility tool — it's social discovery across the whole platform
- Light blur on Liked Me should tease identity without revealing it
- Same interaction pattern as Discovery when viewing a profile (scrollable Hinge-style)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/discovery/profile-card.tsx`: Scrollable Hinge-style profile — reuse for Explore profile view
- `src/components/discovery/floating-actions.tsx`: X/Heart floating buttons — reuse for Explore profile actions
- `src/components/discovery/profile-section.tsx`: White info card wrapper — reuse in Explore profile
- `src/hooks/use-discovery-stack.ts`: Stack management pattern — adapt for Explore feed (different query, same like/dismiss flow)
- `src/services/match-service.ts`: likeProfile, unmatch — reuse directly for Explore likes
- `src/services/thread-service.ts`: getThreads, getTotalUnreadCount — reuse for Matches section
- `UnreadBadge` component in `app/(tabs)/_layout.tsx` — reuse pattern for Likes tab badge

### Established Patterns
- Service layer → hook → component architecture (discovery-service → use-discovery-stack → profile-card)
- Supabase RPC for server-side queries (get_discovery_stack pattern)
- Optimistic UI for likes (remove from view immediately, API async)
- NativeWind for styling with Tailwind classes

### Integration Points
- `app/(tabs)/explore.tsx`: Placeholder stub to replace
- `app/(tabs)/likes.tsx`: Placeholder stub to replace
- `app/(tabs)/_layout.tsx`: Add Likes tab badge (similar to Messages unread badge)
- `supabase/migrations/`: New RPC for explore feed query
- Ranking weights already seeded in `ranking_config` table (completeness 30%, activity 25%, verification 20%, engagement 15%, freshness 10%)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-explore-likes*
*Context gathered: 2026-03-17*
