# Phase 3: Discovery Engine - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Server-side infrastructure that delivers a filtered, school-gated discovery stack with atomic mutual matching and mode/dealbreaker enforcement. This phase builds the backend engine — no swipe UI (Phase 4). Outputs: discovery stack query, filter/dealbreaker system, like/dismiss/match Edge Functions, unmatch flow, mode status enforcement.

</domain>

<decisions>
## Implementation Decisions

### Filter & Dealbreaker Design
- 9 filter categories: sleep schedule, cleanliness, guests, smoking, budget range, partying (core 6) + pets, noise level, study habits (lifestyle 3)
- Each category uses predefined options displayed as Tinder-style bubble chips (not sliders or free text)
- Two-layer system: users set their OWN values ("I'm a night owl") AND their roommate preferences ("I want early bird or flexible")
- Separate dealbreaker screen — preferences and dealbreakers configured on different screens
- Dealbreakers hard-filter profiles out of the stack entirely; preferences are soft signals used in compatibility scoring
- All filter data stored in `nitty_gritty` JSONB column on profiles (already exists)

### Stack Ordering & Ranking
- Weighted blend for Discovery ranking: 40% compatibility (preference matches), 35% recent activity, 25% popularity (likes received)
- Weights stored in `ranking_config` table (already exists) — configurable server-side without code deploy
- Pagination: 20 profiles per page
- Pre-fetch next batch when 5 unseen profiles remain
- 48-hour auto-refresh cycle: dismissed profiles re-enter the stack after 48 hours
- Max 2 re-entries per dismissed profile (3 total views), then permanently dismissed
- Boost multiplier deferred to Phase 9 — not included in ranking query now

### Matching & Unmatch Flow
- Match creation via Supabase Edge Function with Postgres transaction: insert like -> check reciprocal -> if mutual, create match + thread atomically
- Idempotent: duplicate likes or match attempts return success without creating duplicates (UNIQUE constraints handle naturally)
- Unmatch = soft delete: match row kept (marked unmatched), thread status set to 'unmatched', messages preserved for safety
- Re-matching prevented by checking match history (soft-deleted records)
- On unmatch, user is prompted: "Block this person too?" — if yes, block + permanent dismissal; if no, just unmatch (person could reappear in stack after refresh cycle)

### Mode Status Behavior
- Discovery stack shows users with `mode_status = 'roommate'` AND `mode_status = 'friends'`
- "Looking for friends" users appear in Discovery with a visible badge ("Looking for friends") — user decides whether to engage
- "Found roommate" removes user from Discovery stack entirely
- When user sets "found roommate", prompt: "Want to switch to finding friends?" — if yes, set to friends mode (stays in Explore); if no, go inactive
- Users can freely toggle back from any mode to "looking for roommate" — no cooldown or restrictions
- Mode status enforced in the discovery stack query (server-side)

### Claude's Discretion
- Exact predefined option values for each of the 9 filter categories
- Discovery stack SQL/Edge Function implementation approach
- Compatibility scoring algorithm details
- Popularity calculation method (total likes? recent likes? decay function?)
- nitty_gritty JSONB schema structure for self-values vs preferences vs dealbreakers
- Error handling for Edge Function failures
- Index strategy for the discovery stack query

</decisions>

<specifics>
## Specific Ideas

- Filter UI modeled after Tinder's bubble chip selector (screenshot reference: predefined options in rounded pill buttons, tap to select)
- Two-screen filter flow: one screen for setting your own values, separate screen for marking dealbreakers
- "Found roommate" -> friends prompt keeps users engaged on the platform after finding a roommate
- Discovery is roommate-first but inclusive of friends-seekers (badge approach instead of hard exclusion)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ranking_config` table: already exists from Phase 1 migrations — store Discovery weights here
- `is_blocked()` function: bidirectional block check, use in discovery stack query
- `shares_school()` function: school gating, core filter for discovery stack
- `likes`, `matches`, `dismissals`, `saves` tables: all created with proper indexes and RLS policies
- `mode_status` enum: `roommate`, `friends`, `found_roommate` — already on `users` table
- `nitty_gritty` JSONB column on `profiles`: ready for filter data storage
- `thread_status` enum: `active`, `unmatched`, `blocked` — supports unmatch soft delete
- `enforcement_state` on `users`: check before allowing likes/matches

### Established Patterns
- Supabase client in `src/lib/supabase.ts` with AsyncStorage auth persistence
- Service layer pattern: `src/services/` (auth-service, photo-service, profile-service, school-service)
- NativeWind/Tailwind for styling
- Expo Router file-based routing

### Integration Points
- Edge Functions: new `like-profile`, `unmatch` functions needed (service role for atomic transactions)
- `matches` table: CHECK constraint `user_a_id < user_b_id` — canonical ordering, Edge Function must sort IDs before insert
- RLS on interactions tables (00022): likes/dismissals/saves policies already handle own-data access
- `profiles.completion_score`: can factor into ranking
- `users.last_active_at`: activity signal for ranking

</code_context>

<deferred>
## Deferred Ideas

- Profile boost multiplier in ranking — Phase 9 (Monetization)
- Advanced paid filters — Phase 9 (Monetization)
- Explore ranking algorithm — Phase 6 (can share ranking infrastructure)

</deferred>

---

*Phase: 03-discovery-engine*
*Context gathered: 2026-03-07*
