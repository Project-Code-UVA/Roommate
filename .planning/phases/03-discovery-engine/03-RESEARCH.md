# Phase 3: Discovery Engine - Research

**Researched:** 2026-03-08
**Domain:** Server-side discovery stack, filtering, matching, Supabase Postgres functions
**Confidence:** HIGH

## Summary

Phase 3 builds the server-side engine that powers the Discovery tab: a school-gated, filter-aware query that returns ranked profiles, plus atomic like/match/unmatch operations. The existing database schema (Phase 1) already provides all required tables (likes, matches, dismissals, saves, threads) with proper constraints, RLS policies, and trust functions (is_blocked, shares_school). The `ranking_config` table exists for tunable weights. The `nitty_gritty` JSONB column on profiles is ready for filter data.

The critical architectural decision is to use **Postgres functions called via RPC** (not Edge Functions) for atomic operations like mutual match creation. PostgREST auto-wraps RPC calls in transactions, giving us atomicity without Edge Function deployment complexity. Edge Functions are unnecessary here since all operations are data-centric with no external API calls. The discovery stack query itself should be a Postgres function to encapsulate complex filtering, ranking, and pagination logic server-side.

**Primary recommendation:** Implement all discovery logic as Postgres functions (SECURITY DEFINER with explicit search_path) called via `supabase.rpc()`. Use a single `get_discovery_stack` function for the query, `like_profile` for atomic like+match creation, and `unmatch_user` for soft-delete unmatch. Store filter data in the existing `nitty_gritty` JSONB column with a structured schema. Add GIN index on nitty_gritty for dealbreaker filtering performance.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 9 filter categories: sleep schedule, cleanliness, guests, smoking, budget range, partying (core 6) + pets, noise level, study habits (lifestyle 3)
- Each category uses predefined options displayed as Tinder-style bubble chips (not sliders or free text)
- Two-layer system: users set their OWN values AND their roommate preferences
- Separate dealbreaker screen -- preferences and dealbreakers configured on different screens
- Dealbreakers hard-filter profiles out of the stack entirely; preferences are soft signals used in compatibility scoring
- All filter data stored in `nitty_gritty` JSONB column on profiles (already exists)
- Weighted blend for Discovery ranking: 40% compatibility (preference matches), 35% recent activity, 25% popularity (likes received)
- Weights stored in `ranking_config` table (already exists) -- configurable server-side without code deploy
- Pagination: 20 profiles per page
- Pre-fetch next batch when 5 unseen profiles remain
- 48-hour auto-refresh cycle: dismissed profiles re-enter the stack after 48 hours
- Max 2 re-entries per dismissed profile (3 total views), then permanently dismissed
- Boost multiplier deferred to Phase 9
- Match creation via Supabase with Postgres transaction: insert like -> check reciprocal -> if mutual, create match + thread atomically
- Idempotent: duplicate likes or match attempts return success without creating duplicates (UNIQUE constraints handle naturally)
- Unmatch = soft delete: match row kept (marked unmatched), thread status set to 'unmatched', messages preserved for safety
- Re-matching prevented by checking match history (soft-deleted records)
- On unmatch, user is prompted: "Block this person too?" -- if yes, block + permanent dismissal; if no, just unmatch
- Discovery stack shows users with `mode_status = 'roommate'` AND `mode_status = 'friends'`
- "Looking for friends" users appear in Discovery with a visible badge
- "Found roommate" removes user from Discovery stack entirely
- "Found roommate" prompt: "Want to switch to finding friends?" -- if yes, set to friends mode; if no, go inactive
- Users can freely toggle back from any mode to "looking for roommate"
- Mode status enforced in the discovery stack query (server-side)

### Claude's Discretion
- Exact predefined option values for each of the 9 filter categories
- Discovery stack SQL/RPC implementation approach
- Compatibility scoring algorithm details
- Popularity calculation method (total likes? recent likes? decay function?)
- nitty_gritty JSONB schema structure for self-values vs preferences vs dealbreakers
- Error handling for function failures
- Index strategy for the discovery stack query

### Deferred Ideas (OUT OF SCOPE)
- Profile boost multiplier in ranking -- Phase 9 (Monetization)
- Advanced paid filters -- Phase 9 (Monetization)
- Explore ranking algorithm -- Phase 6 (can share ranking infrastructure)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DISC-05 | User sees only profiles from shared schools (server-enforced) | `shares_school()` function exists; discovery stack RPC uses it as core filter; RLS on users/profiles already enforces school gating |
| DISC-06 | User can set roommate preference filters (sleep, cleanliness, guests, smoking, budget, partying) | nitty_gritty JSONB schema design; profile-service update pattern; 9 categories with predefined options |
| DISC-07 | User can mark filters as preferences vs dealbreakers | Two-layer JSONB structure: self_values, preferences, dealbreakers; dealbreakers hard-filter in stack query |
| DISC-08 | User can set mode status (looking for roommate / found roommate) | mode_status enum already exists on users table; mode-service function to toggle; server-side enforcement in stack query |
| DISC-09 | User with "found roommate" status is removed from Discovery stack | WHERE clause in get_discovery_stack excludes mode_status = 'found_roommate'; server-enforced |
| DISC-10 | User sees appropriate empty state when no more profiles available | Stack query returns empty array when exhausted; client handles with empty state UI (Phase 4 concern, but API must return proper empty response) |
| MTCH-01 | Match is created atomically when both users have liked each other | like_profile RPC function: INSERT like, check reciprocal, INSERT match + thread in single transaction |
| MTCH-04 | User can unmatch, permanently removing thread and preventing re-matching | unmatch_user RPC: soft-delete match, set thread status to 'unmatched', check match history to prevent re-match |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.98.0 | Client SDK, RPC calls | Already in project; `rpc()` method for calling Postgres functions |
| PostgreSQL (pl/pgsql) | 15+ (Supabase hosted) | Atomic transactions, discovery query, matching logic | All operations are data-centric; PostgREST auto-wraps RPC in transactions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing trust functions | N/A | `is_blocked()`, `shares_school()` | Used inside every discovery/matching function |
| Existing RLS policies | N/A | School-gated reads on users/profiles/photos | Baseline security; RPC functions use SECURITY DEFINER to bypass when needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Postgres RPC functions | Supabase Edge Functions | Edge Functions add Deno deployment complexity, cold starts, and require direct DB connection for transactions; RPC is simpler for pure data operations |
| JSONB for filters | Separate filter tables | Normalized tables give SQL-native querying but 9 categories x 3 layers (self/pref/deal) = 27+ columns or junction tables; JSONB keeps it contained and flexible |
| GIN index on nitty_gritty | Expression B-tree indexes per key | GIN handles arbitrary key queries; B-tree only for specific known paths; GIN is more future-proof for 9+ categories |

## Architecture Patterns

### Recommended Project Structure
```
supabase/
  migrations/
    00026_nitty_gritty_schema.sql          # JSONB schema + GIN index
    00027_dismissal_tracking.sql           # Add view_count, last_dismissed_at columns
    00028_match_soft_delete.sql            # Add unmatched_at, unmatched_by to matches
    00029_seed_ranking_weights.sql         # Seed discovery ranking weights
    00030_get_discovery_stack.sql          # Discovery stack RPC function
    00031_like_profile.sql                 # Atomic like + match creation
    00032_unmatch_user.sql                 # Soft-delete unmatch
    00033_update_mode_status.sql           # Mode toggle with validation
src/
  services/
    discovery-service.ts                   # Client-side: calls RPCs, manages pagination
    filter-service.ts                      # CRUD for nitty_gritty preferences/dealbreakers
    match-service.ts                       # Like, unmatch, match status queries
  constants/
    filter-options.ts                      # Predefined options for 9 filter categories
  types/
    filters.ts                             # TypeScript types for nitty_gritty schema
```

### Pattern 1: Postgres RPC for Atomic Operations
**What:** All multi-step data operations implemented as Postgres functions called via `supabase.rpc()`
**When to use:** Any operation requiring atomicity (like+match, unmatch+thread-update)
**Example:**
```sql
-- Source: Supabase docs on Database Functions
CREATE OR REPLACE FUNCTION public.like_profile(
  p_liker_id uuid,
  p_liked_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match_id uuid;
  v_thread_id uuid;
  v_is_mutual boolean := false;
  v_user_a uuid;
  v_user_b uuid;
BEGIN
  -- Validate: not blocked, shares school, not under enforcement
  IF is_blocked(p_liker_id, p_liked_id) THEN
    RETURN jsonb_build_object('error', 'blocked');
  END IF;

  IF NOT shares_school(p_liker_id, p_liked_id) THEN
    RETURN jsonb_build_object('error', 'no_shared_school');
  END IF;

  -- Check enforcement state
  IF (SELECT enforcement_state FROM users WHERE id = p_liker_id) != 'none' THEN
    RETURN jsonb_build_object('error', 'under_enforcement');
  END IF;

  -- Check for existing match (including soft-deleted) to prevent re-match
  v_user_a := LEAST(p_liker_id, p_liked_id);
  v_user_b := GREATEST(p_liker_id, p_liked_id);

  IF EXISTS (SELECT 1 FROM matches WHERE user_a_id = v_user_a AND user_b_id = v_user_b) THEN
    RETURN jsonb_build_object('error', 'already_matched_or_unmatched');
  END IF;

  -- Insert like (idempotent via ON CONFLICT)
  INSERT INTO likes (liker_id, liked_id)
  VALUES (p_liker_id, p_liked_id)
  ON CONFLICT (liker_id, liked_id) DO NOTHING;

  -- Check for reciprocal like
  IF EXISTS (SELECT 1 FROM likes WHERE liker_id = p_liked_id AND liked_id = p_liker_id) THEN
    v_is_mutual := true;

    -- Create match (canonical ordering)
    INSERT INTO matches (user_a_id, user_b_id)
    VALUES (v_user_a, v_user_b)
    RETURNING id INTO v_match_id;

    -- Create thread
    INSERT INTO threads (user_a_id, user_b_id, match_id)
    VALUES (v_user_a, v_user_b, v_match_id)
    RETURNING id INTO v_thread_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'is_match', v_is_mutual,
    'match_id', v_match_id,
    'thread_id', v_thread_id
  );
END;
$$;
```

### Pattern 2: Discovery Stack as Postgres Function
**What:** Complex discovery query encapsulated in a single RPC function with server-enforced filtering
**When to use:** Fetching the discovery stack with all filters applied
**Example (skeleton):**
```sql
CREATE OR REPLACE FUNCTION public.get_discovery_stack(
  p_user_id uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_schools uuid[];
  v_user_nitty jsonb;
  v_result jsonb;
BEGIN
  -- Get requesting user's schools
  SELECT array_agg(school_id) INTO v_user_schools
  FROM user_schools WHERE user_id = p_user_id;

  -- Get requesting user's dealbreakers and preferences
  SELECT nitty_gritty INTO v_user_nitty
  FROM profiles WHERE user_id = p_user_id;

  -- Main query: shared school + not blocked + not self + mode filter
  -- + onboarding complete + not dismissed (or dismissed > 48h ago with view_count < 3)
  -- + dealbreaker enforcement + ranking
  SELECT jsonb_agg(row_to_json(stack))
  INTO v_result
  FROM (
    SELECT
      p.user_id,
      p.display_name,
      p.bio,
      p.year,
      p.hometown,
      p.nitty_gritty,
      p.completion_score,
      u.mode_status,
      u.selfie_verified,
      u.last_active_at,
      -- Compatibility score (preference matches)
      -- Activity score (recency of last_active_at)
      -- Popularity score (likes received count)
      -- Weighted total
      (compatibility * w_compat + activity * w_activity + popularity * w_popularity) AS rank_score
    FROM profiles p
    JOIN users u ON u.id = p.user_id
    JOIN user_schools us ON us.user_id = p.user_id
    WHERE us.school_id = ANY(v_user_schools)
      AND p.user_id != p_user_id
      AND u.mode_status IN ('roommate', 'friends')
      AND u.onboarding_completed = true
      AND u.enforcement_state = 'none'
      AND NOT is_blocked(p_user_id, p.user_id)
      -- Dismissal logic: not dismissed OR (dismissed > 48h ago AND view_count < 3)
      -- Dealbreaker filtering on nitty_gritty
    GROUP BY p.user_id  -- deduplicate multi-school overlaps
    ORDER BY rank_score DESC
    LIMIT p_limit OFFSET p_offset
  ) stack;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
```

### Pattern 3: nitty_gritty JSONB Schema
**What:** Structured JSONB for storing self-values, preferences, and dealbreakers in a single column
**When to use:** Storing and querying filter data for all 9 categories

```typescript
// TypeScript type matching the JSONB schema
type FilterCategory =
  | 'sleep_schedule'
  | 'cleanliness'
  | 'guests'
  | 'smoking'
  | 'budget_range'
  | 'partying'
  | 'pets'
  | 'noise_level'
  | 'study_habits';

type NittyGritty = {
  readonly self: Partial<Record<FilterCategory, string>>;       // "I am..."
  readonly preferences: Partial<Record<FilterCategory, readonly string[]>>; // "I want..." (multiple acceptable)
  readonly dealbreakers: Partial<Record<FilterCategory, readonly string[]>>; // Hard exclude these values
};
```

**JSONB example:**
```json
{
  "self": {
    "sleep_schedule": "night_owl",
    "cleanliness": "tidy",
    "smoking": "never"
  },
  "preferences": {
    "sleep_schedule": ["night_owl", "flexible"],
    "cleanliness": ["tidy", "moderate"]
  },
  "dealbreakers": {
    "smoking": ["daily", "social"]
  }
}
```

**Dealbreaker enforcement in SQL:**
```sql
-- Exclude profiles where their self-value matches any of the requesting user's dealbreakers
-- For each dealbreaker category, check if candidate's self.{category} is in user's dealbreakers.{category}
AND NOT EXISTS (
  SELECT 1 FROM jsonb_each_text(v_user_dealbreakers) AS d(category, _)
  WHERE candidate.nitty_gritty->'self'->>d.category = ANY(
    SELECT jsonb_array_elements_text(v_user_dealbreakers->d.category)
  )
)
```

### Pattern 4: Predefined Filter Options
**What:** Constant arrays for each of the 9 filter categories
**Recommended values:**

```typescript
export const FILTER_OPTIONS = {
  sleep_schedule: ['early_bird', 'night_owl', 'flexible'] as const,
  cleanliness: ['very_tidy', 'tidy', 'moderate', 'relaxed'] as const,
  guests: ['never', 'rarely', 'sometimes', 'often'] as const,
  smoking: ['never', 'outside_only', 'social', 'daily'] as const,
  budget_range: ['under_500', '500_800', '800_1200', '1200_1500', 'over_1500'] as const,
  partying: ['never', 'rarely', 'weekends', 'often'] as const,
  pets: ['no_pets', 'have_pets', 'love_pets', 'allergic'] as const,
  noise_level: ['silent', 'quiet', 'moderate', 'loud_ok'] as const,
  study_habits: ['home_studier', 'library', 'mixed', 'minimal'] as const,
} as const;
```

### Anti-Patterns to Avoid
- **Client-side filtering:** Never filter discovery results on the client. All filtering (school, blocks, dealbreakers, mode) must happen in the Postgres function.
- **Separate RPCs for like + match check:** Never split like insertion and match check into two RPC calls. Race conditions will create duplicate matches or miss mutual likes.
- **Hard-deleting dismissals:** Dismissals need timestamps and view counts for the 48-hour refresh cycle. Deleting them loses tracking data.
- **Hard-deleting matches on unmatch:** Must soft-delete to prevent re-matching. Keep the row, mark it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic like+match | Two separate client calls | Single Postgres RPC function | Race conditions between check and insert; PostgREST auto-wraps in transaction |
| School gating | Client-side filter | `shares_school()` in Postgres function + RLS | Server enforcement is non-negotiable per PRD |
| Block filtering | Client-side filter | `is_blocked()` in Postgres function + RLS | Bidirectional check already exists |
| ID canonical ordering | Manual sorting in client | `LEAST()/GREATEST()` in Postgres | matches/threads have CHECK (user_a_id < user_b_id); must sort before insert |
| Idempotent inserts | Try/catch duplicate errors | `ON CONFLICT DO NOTHING` | Postgres handles naturally; returns success regardless |
| Ranking weight config | Hardcoded weights in code | `ranking_config` table + query at runtime | Allows tuning without code deploy |

**Key insight:** Every operation in this phase is data-centric. Postgres functions give you atomicity for free (PostgREST wraps RPC in transactions), eliminate round-trip latency, and enforce server-side security. Edge Functions add Deno complexity with zero benefit here.

## Common Pitfalls

### Pitfall 1: Race Condition in Mutual Match Creation
**What goes wrong:** Two users like each other simultaneously. Both check for reciprocal like, both find it, both try to create a match. Duplicate match or constraint violation.
**Why it happens:** Non-atomic check-then-insert across separate requests.
**How to avoid:** Single Postgres function with `ON CONFLICT DO NOTHING` on match insert. The UNIQUE constraint on (user_a_id, user_b_id) prevents duplicates. The function returns the existing match if it was already created by the other user's concurrent request.
**Warning signs:** Duplicate match rows, constraint violation errors in logs.

### Pitfall 2: Dismissal Refresh Logic Complexity
**What goes wrong:** Dismissed profiles never reappear, or reappear too often, or permanently dismissed profiles keep showing up.
**Why it happens:** The dismissals table currently has no timestamp tracking or view count. Need to add `view_count` and update `created_at` usage, or add `last_dismissed_at`.
**How to avoid:** Add `view_count smallint DEFAULT 1` and use `created_at` (or new `last_dismissed_at`) for the 48-hour window. Discovery query: exclude where `view_count >= 3` OR `created_at > now() - interval '48 hours'`. On re-dismiss, UPDATE `view_count` and `created_at` (use UPSERT pattern).
**Warning signs:** Users reporting "I already dismissed this person" or "I never see new people."

### Pitfall 3: JSONB Dealbreaker Query Performance
**What goes wrong:** Discovery query becomes slow as user base grows because JSONB comparisons don't use indexes effectively.
**Why it happens:** Without proper GIN index, Postgres does sequential scan on nitty_gritty for each candidate.
**How to avoid:** Create GIN index: `CREATE INDEX idx_profiles_nitty_gritty ON profiles USING GIN (nitty_gritty jsonb_path_ops)`. Use containment operators (`@>`) where possible instead of arrow extraction (`->>`) for GIN index utilization.
**Warning signs:** Discovery query > 200ms, EXPLAIN showing Seq Scan on profiles.

### Pitfall 4: matches Table Missing Soft-Delete Columns
**What goes wrong:** Cannot track unmatch state because matches table has no status column or timestamp.
**Why it happens:** Phase 1 created matches with just id, user_a_id, user_b_id, created_at.
**How to avoid:** Migration to add `unmatched_at timestamptz DEFAULT NULL` and `unmatched_by uuid DEFAULT NULL`. A match is active when `unmatched_at IS NULL`. Discovery and matching queries check for existing match (including soft-deleted) to prevent re-matching.
**Warning signs:** Unmatched users can re-match; no audit trail for unmatch actions.

### Pitfall 5: Multi-School User Duplication in Results
**What goes wrong:** User who shares 2+ schools with the requester appears 2+ times in the stack.
**Why it happens:** JOIN on user_schools produces one row per shared school.
**How to avoid:** Use `DISTINCT ON (p.user_id)` or `GROUP BY p.user_id` in the discovery query.
**Warning signs:** Duplicate profile cards, inflated result counts.

### Pitfall 6: Compatibility Score Denominator
**What goes wrong:** Users with few preferences set get unfairly high or low compatibility scores.
**Why it happens:** Dividing matches by total categories when user only set 2 of 9 categories.
**How to avoid:** Calculate compatibility only over categories where BOTH users have set values. Score = matching preferences / overlapping categories. If no overlap, return neutral score (0.5).
**Warning signs:** New users with sparse profiles ranked weirdly.

## Code Examples

### Calling RPC from Client
```typescript
// Source: Supabase JS v2 docs
import { supabase } from '@/lib/supabase';

export async function getDiscoveryStack(
  userId: string,
  limit: number = 20,
  offset: number = 0,
): Promise<{ data: DiscoveryProfile[] | null; error: string | null }> {
  const { data, error } = await supabase.rpc('get_discovery_stack', {
    p_user_id: userId,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? [], error: null };
}
```

### Like Profile with Match Detection
```typescript
export async function likeProfile(
  likerId: string,
  likedId: string,
): Promise<{ isMatch: boolean; matchId: string | null; threadId: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('like_profile', {
    p_liker_id: likerId,
    p_liked_id: likedId,
  });

  if (error) {
    return { isMatch: false, matchId: null, threadId: null, error: error.message };
  }

  const result = data as { success: boolean; is_match: boolean; match_id: string | null; thread_id: string | null; error?: string };

  if (result.error) {
    return { isMatch: false, matchId: null, threadId: null, error: result.error };
  }

  return {
    isMatch: result.is_match,
    matchId: result.match_id,
    threadId: result.thread_id,
    error: null,
  };
}
```

### Unmatch User
```sql
CREATE OR REPLACE FUNCTION public.unmatch_user(
  p_user_id uuid,
  p_other_id uuid,
  p_block_too boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_a uuid := LEAST(p_user_id, p_other_id);
  v_user_b uuid := GREATEST(p_user_id, p_other_id);
BEGIN
  -- Soft-delete match
  UPDATE matches
  SET unmatched_at = now(), unmatched_by = p_user_id
  WHERE user_a_id = v_user_a AND user_b_id = v_user_b
    AND unmatched_at IS NULL;

  -- Update thread status
  UPDATE threads
  SET status = 'unmatched'
  WHERE user_a_id = v_user_a AND user_b_id = v_user_b;

  -- Optionally block
  IF p_block_too THEN
    INSERT INTO blocks (blocker_id, blocked_id)
    VALUES (p_user_id, p_other_id)
    ON CONFLICT DO NOTHING;

    -- Permanent dismissal (set view_count to max)
    INSERT INTO dismissals (dismisser_id, dismissed_id, view_count)
    VALUES (p_user_id, p_other_id, 3)
    ON CONFLICT (dismisser_id, dismissed_id)
    DO UPDATE SET view_count = 3;
  END IF;

  -- Remove likes in both directions
  DELETE FROM likes WHERE
    (liker_id = p_user_id AND liked_id = p_other_id) OR
    (liker_id = p_other_id AND liked_id = p_user_id);

  RETURN jsonb_build_object('success', true);
END;
$$;
```

### Update nitty_gritty Preferences
```typescript
export async function updateNittyGritty(
  userId: string,
  layer: 'self' | 'preferences' | 'dealbreakers',
  category: FilterCategory,
  value: string | readonly string[],
): Promise<{ error: string | null }> {
  // Build the JSONB path update
  const currentProfile = await getProfile(userId);
  if (!currentProfile) {
    return { error: 'Profile not found' };
  }

  const currentNitty = (currentProfile.nitty_gritty as NittyGritty) ?? {
    self: {},
    preferences: {},
    dealbreakers: {},
  };

  const updatedNitty: NittyGritty = {
    ...currentNitty,
    [layer]: {
      ...currentNitty[layer],
      [category]: value,
    },
  };

  return updateProfile(userId, { nitty_gritty: updatedNitty as unknown as Json });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Edge Functions for all server logic | Postgres RPC for data ops, Edge Functions for external APIs only | 2025+ best practice | Simpler deployment, automatic transactions, lower latency |
| Separate tables per filter category | JSONB column with structured schema | Current Supabase pattern | Flexible schema, single column, GIN indexable |
| Hard delete on unmatch | Soft delete with audit trail | Industry standard | Safety compliance, prevents re-match abuse |
| Client-side ranking | Server-side ranking with configurable weights | Always for Supabase apps | Prevents manipulation, allows A/B testing of weights |

## Required Schema Changes

### New Columns on Existing Tables

**dismissals table:**
```sql
ALTER TABLE public.dismissals
  ADD COLUMN view_count smallint NOT NULL DEFAULT 1,
  ADD COLUMN last_dismissed_at timestamptz NOT NULL DEFAULT now();
```

**matches table:**
```sql
ALTER TABLE public.matches
  ADD COLUMN unmatched_at timestamptz DEFAULT NULL,
  ADD COLUMN unmatched_by uuid DEFAULT NULL REFERENCES public.users(id);
```

### New Indexes
```sql
-- GIN index for nitty_gritty JSONB queries (dealbreaker filtering)
CREATE INDEX idx_profiles_nitty_gritty ON public.profiles
  USING GIN (nitty_gritty jsonb_path_ops);

-- Partial index for active matches only
CREATE INDEX idx_matches_active ON public.matches (user_a_id, user_b_id)
  WHERE unmatched_at IS NULL;

-- Index for dismissal refresh queries
CREATE INDEX idx_dismissals_refresh ON public.dismissals (dismisser_id, last_dismissed_at)
  WHERE view_count < 3;

-- Index for likes reciprocal check (already have idx_likes_liked_id, but also need liker lookup)
CREATE INDEX idx_likes_liker_id ON public.likes (liker_id);
```

### Seed Data for ranking_config
```sql
INSERT INTO public.ranking_config (weight_name, weight_value) VALUES
  ('discovery_compatibility', 0.4000),
  ('discovery_activity', 0.3500),
  ('discovery_popularity', 0.2500)
ON CONFLICT (weight_name) DO NOTHING;
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 via jest-expo ~52.0.6 |
| Config file | package.json (jest key) |
| Quick run command | `npx jest --testPathPattern="discovery\|match\|filter" --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISC-05 | Discovery returns only shared-school profiles | unit | `npx jest __tests__/services/discovery-service.test.ts -x` | No - Wave 0 |
| DISC-06 | User can set roommate preference filters | unit | `npx jest __tests__/services/filter-service.test.ts -x` | No - Wave 0 |
| DISC-07 | Preferences vs dealbreakers distinction | unit | `npx jest __tests__/services/filter-service.test.ts -x` | No - Wave 0 |
| DISC-08 | User can set mode status | unit | `npx jest __tests__/services/discovery-service.test.ts -x` | No - Wave 0 |
| DISC-09 | Found-roommate removed from stack | unit | `npx jest __tests__/services/discovery-service.test.ts -x` | No - Wave 0 |
| DISC-10 | Empty state when no profiles | unit | `npx jest __tests__/services/discovery-service.test.ts -x` | No - Wave 0 |
| MTCH-01 | Atomic mutual match creation | unit | `npx jest __tests__/services/match-service.test.ts -x` | No - Wave 0 |
| MTCH-04 | Unmatch with soft delete | unit | `npx jest __tests__/services/match-service.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="discovery\|match\|filter" --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/services/discovery-service.test.ts` -- covers DISC-05, DISC-08, DISC-09, DISC-10
- [ ] `__tests__/services/filter-service.test.ts` -- covers DISC-06, DISC-07
- [ ] `__tests__/services/match-service.test.ts` -- covers MTCH-01, MTCH-04
- [ ] Mock extensions in `__tests__/setup.ts` -- `rpc` mock already exists but needs per-test override patterns for RPC return values

## Open Questions

1. **Popularity score calculation**
   - What we know: 25% weight in ranking. Based on likes received.
   - What's unclear: Total all-time likes? Recent likes (e.g., last 7 days)? Decay function?
   - Recommendation: Use likes received in last 30 days, normalized to 0-1 range across the school's population. Simple and avoids runaway popularity bias.

2. **Compatibility score edge cases**
   - What we know: Compare user's preferences against candidate's self-values.
   - What's unclear: How to handle categories where candidate has not set a self-value? Treat as "neutral" or "no match"?
   - Recommendation: Skip unset categories (don't penalize). Score = matches / categories_with_overlap. Minimum 0.5 if no overlap at all (neutral ranking).

3. **Discovery query performance at scale**
   - What we know: Need to join users, profiles, user_schools, dismissals, likes (for popularity count), plus JSONB filtering.
   - What's unclear: Performance characteristics at 10K+ users per school.
   - Recommendation: Start with the Postgres function approach. Add materialized views or pre-computed scores if query exceeds 500ms. The GIN index and partial indexes should keep it fast for the initial launch.

## Sources

### Primary (HIGH confidence)
- Supabase docs: Database Functions -- https://supabase.com/docs/guides/database/functions
- Supabase docs: Edge Functions -- https://supabase.com/docs/guides/functions
- Supabase docs: RPC -- https://supabase.com/docs/reference/javascript/v1/rpc
- Supabase docs: Managing Indexes -- https://supabase.com/docs/guides/database/postgres/indexes
- Existing codebase: supabase/migrations/ (25 migrations), src/services/ (4 services), trust functions

### Secondary (MEDIUM confidence)
- Transactions and RLS in Supabase Edge Functions -- https://marmelab.com/blog/2025/12/08/supabase-edge-function-transaction-rls.html
- Supabase Discussion #526: Client-side database transactions -- https://github.com/orgs/supabase/discussions/526
- PostgreSQL JSONB Performance Guide -- https://www.sitepoint.com/postgresql-jsonb-query-performance-indexing/

### Tertiary (LOW confidence)
- Filter option values (Claude's discretion, needs user validation)
- Popularity decay function (recommendation only, needs tuning with real data)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project stack (Supabase + Postgres), well-documented patterns
- Architecture: HIGH - Postgres RPC is well-established for atomic operations; existing codebase patterns clear
- Pitfalls: HIGH - Race conditions, soft-delete, JSONB performance are well-documented problems
- Filter option values: MEDIUM - Reasonable defaults but user may want different options
- Ranking algorithm specifics: MEDIUM - Solid approach but performance depends on data volume

**Research date:** 2026-03-08
**Valid until:** 2026-04-07 (stable stack, no fast-moving dependencies)
