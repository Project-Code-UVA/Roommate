# Architecture Patterns

**Domain:** Swipe-based roommate matching mobile app (mutual consent model)
**Stack:** React Native (Expo) + Supabase (Postgres + Auth + Realtime + Edge Functions)
**Researched:** 2026-03-03
**Confidence:** MEDIUM (based on established patterns for Supabase + React Native; no external verification available this session)

---

## Recommended Architecture

### System Overview

```
Mobile Client (React Native / Expo)
    |
    |-- Supabase JS Client (REST + Realtime WebSocket)
    |
Supabase Platform
    |-- Auth (Phone OTP, JWT sessions)
    |-- PostgREST (Auto-generated REST API with RLS)
    |-- Realtime (WebSocket subscriptions for messages + matches)
    |-- Edge Functions (Deno-based serverless for complex logic)
    |-- Storage (Photo uploads, media)
    |-- Postgres (Primary database with RLS policies)
    |
External Services
    |-- Selfie Verification API (e.g., Veriff, Onfido)
    |-- Ad Network SDK (AdMob or similar)
    |-- Push Notifications (Expo Push / APNs + FCM)
    |-- Revenue Cat (In-App Purchases / Subscriptions)
```

### Architecture Philosophy

Room uses a **hybrid enforcement model**:

1. **Row Level Security (RLS)** handles read/write access control at the database level -- this is the primary enforcement layer for visibility rules (school gating, block filtering, enforcement state checks).
2. **Edge Functions** handle complex multi-step operations that require business logic beyond what RLS can express -- match creation, like processing, report escalation.
3. **The client never directly writes to sensitive tables** -- likes, matches, blocks, reports, and enforcement actions flow through Edge Functions that validate preconditions before writing.

This is the correct architecture for Room because the PRD demands server-side enforcement of every trust rule. RLS alone cannot handle atomic match creation or enforcement escalation logic, but it provides an excellent baseline security layer that prevents data leaks even if client code has bugs.

---

## Component Boundaries

| Component | Responsibility | Communicates With | Enforcement Layer |
|-----------|---------------|-------------------|-------------------|
| **Auth Module** | Phone OTP, age gate, session tokens | Supabase Auth, Profile Service | Edge Function (age validation) |
| **Profile Service** | CRUD profiles, photos, school selection, mode toggle | Storage, Postgres (RLS) | RLS + Edge Function (completion validation) |
| **Discovery Engine** | Generate swipe stack, apply filters/dealbreakers, exclude seen/blocked/matched | Postgres (RLS), Like Service | RLS (school gate, block filter, mode filter) |
| **Like Service** | Record likes, detect mutual likes, create matches | Postgres, Match Service | Edge Function (atomic match creation) |
| **Match Service** | Manage match lifecycle, unmatch, create threads | Postgres, Messaging Service | Edge Function (unmatch cascade) |
| **Messaging Service** | Real-time chat, delivery/read status, media | Supabase Realtime, Storage | RLS (match-gated read/write) |
| **Explore Service** | Ranked school-based browse, scoring | Postgres (RLS) | RLS (school gate) + DB function (ranking) |
| **Moderation Service** | Reports, enforcement actions, escalation | Postgres, Edge Functions | Edge Function (escalation logic) |
| **Ads Controller** | Engagement tracking, ad insertion timing | Client-side state, Edge Function (gate check) | Edge Function (threshold validation) |
| **Monetization Service** | Subscription status, feature gating | RevenueCat, Postgres | Edge Function (entitlement check) |
| **Notification Service** | Push for matches, messages, likes | Expo Push, Edge Functions | Edge Function (trigger on events) |

---

## Data Flow Patterns

### Pattern 1: Discovery Stack Generation

The discovery stack is the most performance-critical query in the app. It must filter by school, blocks, enforcement, mode status, previously seen users, and dealbreakers -- all in a single efficient query.

```
Client requests next batch (cursor-based pagination)
    |
    v
Postgres query (via PostgREST or Edge Function):
    SELECT eligible profiles WHERE:
        - shares at least one school with current user (JOIN user_schools)
        - NOT blocked by or blocking current user (LEFT JOIN blocks)
        - NOT already liked/dismissed by current user (LEFT JOIN interactions)
        - NOT already matched with current user (LEFT JOIN matches)
        - mode_status = 'roommate' (for Discovery)
        - enforcement_state = 'none' or 'warning'
        - profile completion requirements met
        - dealbreaker filters pass
    ORDER BY:
        - freshness + randomization factor
    LIMIT 20
    |
    v
Client receives batch, renders card stack
```

**Key decision: Use a Postgres function (not raw PostgREST) for stack generation.** The query is too complex for PostgREST's query string API. A `get_discovery_stack(user_id, filters, cursor, limit)` Postgres function called via `rpc()` gives full SQL control, indexing optimization, and keeps logic server-side.

### Pattern 2: Like + Match Creation (Atomic)

This is the most critical transaction in the app. It must be atomic to prevent race conditions (two users liking each other simultaneously).

```
Client: swipe right on User B
    |
    v
Edge Function: process_like(liker_id, liked_id)
    |
    |-- Validate: shared school exists
    |-- Validate: liker not under enforcement
    |-- Validate: no existing block
    |-- Validate: no existing match
    |-- Insert into likes table
    |-- Check: does reciprocal like exist?
    |       |
    |       YES --> Create match (atomic transaction):
    |       |       - INSERT into matches
    |       |       - INSERT into threads (status: active)
    |       |       - Trigger push notification to both users
    |       |       - Return { matched: true, match_id, thread_id }
    |       |
    |       NO --> Return { matched: false }
    |
    v
Client: show match modal OR animate next card
```

**Key decision: Use an Edge Function wrapping a Postgres transaction, not a database trigger.** Triggers make debugging harder and cannot easily send push notifications. The Edge Function provides a clear request/response contract.

### Pattern 3: Real-Time Messaging

```
Match created --> Thread row inserted
    |
    v
Both clients subscribe to Supabase Realtime:
    supabase.channel('thread:{thread_id}')
        .on('postgres_changes', { table: 'messages', filter: 'thread_id=eq.{id}' })
        .subscribe()
    |
    v
Sender: INSERT message via PostgREST (RLS enforces match + school + no-block)
    |
    v
Postgres change event --> Realtime broadcasts to subscribers
    |
    v
Recipient client receives message in real-time
    |
    v
Recipient: UPDATE message SET delivered_at = now() (via PostgREST)
```

**RLS policy for messages table:**
```sql
-- Users can only read messages in threads they belong to
CREATE POLICY "read_own_messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM threads
            WHERE threads.id = messages.thread_id
            AND (threads.user_a_id = auth.uid() OR threads.user_b_id = auth.uid())
            AND threads.status = 'active'
        )
    );

-- Users can only insert messages in active threads they belong to
CREATE POLICY "send_messages" ON messages
    FOR INSERT WITH CHECK (
        messages.sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM threads
            WHERE threads.id = messages.thread_id
            AND (threads.user_a_id = auth.uid() OR threads.user_b_id = auth.uid())
            AND threads.status = 'active'
        )
        AND NOT EXISTS (
            SELECT 1 FROM enforcement_actions
            WHERE enforcement_actions.user_id = auth.uid()
            AND enforcement_actions.action IN ('dm_ban', 'suspension', 'permanent_ban')
            AND (enforcement_actions.end_at IS NULL OR enforcement_actions.end_at > now())
        )
    );
```

### Pattern 4: Block Cascade

```
User A blocks User B (via Edge Function)
    |
    v
Edge Function: process_block(blocker_id, blocked_id)
    |-- INSERT into blocks
    |-- UPDATE threads SET status = 'blocked' WHERE involves both users
    |-- DELETE from matches WHERE involves both users
    |-- DELETE from likes WHERE involves both users
    |-- Return success
    |
    v
RLS automatically hides User B from User A across:
    - Discovery (blocks JOIN in stack query)
    - Explore (blocks JOIN in ranking query)
    - Likes (blocks filter)
    - Messages (thread status = blocked)
```

### Pattern 5: Explore Ranking

```
Client requests Explore feed (paginated)
    |
    v
Postgres function: get_explore_feed(user_id, cursor, limit)
    |
    |-- Filter: shared school, not blocked, not under enforcement
    |-- Score each profile:
    |       completion_score * 0.30
    |     + activity_score * 0.25       (based on last_active_at recency)
    |     + verification_score * 0.20   (selfie_verified = true → 1.0, else 0.0)
    |     + engagement_score * 0.15     (likes received / profile views ratio)
    |     + freshness_score * 0.10      (account age inverse, newer = higher)
    |-- ORDER BY score DESC
    |-- LIMIT with cursor offset
    |
    v
Client renders grid feed
```

**Key decision: Store ranking weights in a config table, not hardcoded.** The PRD requires tunable weights. A `ranking_config` table with key-value pairs allows weight adjustment without code deploys.

---

## Client-Side Architecture

### State Management

Use **Zustand** for client-side state because it is lightweight, works well with React Native, and avoids the boilerplate of Redux. Organize into domain stores:

| Store | State | Persistence |
|-------|-------|-------------|
| `authStore` | Session, user ID, onboarding status | SecureStore (token), MMKV (flags) |
| `profileStore` | Current user profile, photos, schools | MMKV cache, server-authoritative |
| `discoveryStore` | Current card stack, filters, swipe position | Memory only (refetch on tab focus) |
| `matchStore` | Active matches list, new match alerts | MMKV cache + Realtime subscription |
| `messageStore` | Thread list, unread counts, active thread messages | MMKV cache + Realtime subscription |
| `likeStore` | My likes, liked-me count (blurred for free) | Memory + server |

### Navigation Structure

Use **Expo Router** (file-based routing) with this structure:

```
app/
  (auth)/              -- Unauthenticated routes
    login.tsx
    verify-otp.tsx
    onboarding/
      age-gate.tsx
      photos.tsx
      profile.tsx
      schools.tsx
      selfie-verify.tsx
  (tabs)/              -- Main authenticated app
    discovery.tsx
    explore.tsx
    likes.tsx
    messages/
      index.tsx        -- Thread list
      [threadId].tsx   -- Chat screen
    profile.tsx
  _layout.tsx          -- Root layout with auth guard
```

### Offline Behavior

Room is primarily an online app, but handle degradation gracefully:

- **Discovery:** Show "No connection" state, do not cache stale profiles
- **Messages:** Queue unsent messages locally (MMKV), send on reconnect, show pending indicator
- **Profile edits:** Optimistic updates with rollback on failure
- **Photos:** Upload queue with retry

---

## Database Schema Amendments

The existing DB schema from `docs/DB_SCHEMA.md` needs these additions for the v2 matching architecture:

### New Tables

```sql
-- Tracks swipe interactions (likes AND dismissals)
interactions
    - id (uuid)
    - user_id (uuid, FK users)
    - target_id (uuid, FK users)
    - action (like | dismiss | save)
    - created_at (timestamptz)
    - UNIQUE(user_id, target_id)

-- Mutual matches
matches
    - id (uuid)
    - user_a_id (uuid, FK users)  -- lower UUID for consistency
    - user_b_id (uuid, FK users)
    - thread_id (uuid, FK threads)
    - created_at (timestamptz)
    - UNIQUE(user_a_id, user_b_id)

-- Ranking configuration
ranking_config
    - key (text, PK)
    - value (numeric)
    - updated_at (timestamptz)

-- Ads engagement tracking
ads_engagement
    - user_id (uuid, FK users)
    - swipe_count (int, default 0)
    - first_match_at (timestamptz, nullable)
    - ads_eligible (bool, default false)
    - updated_at (timestamptz)

-- Subscriptions / monetization
subscriptions
    - user_id (uuid, FK users)
    - tier (free | premium)
    - provider_id (text)  -- RevenueCat ID
    - expires_at (timestamptz)
    - created_at (timestamptz)
```

### Schema Modifications

```sql
-- threads: Remove routing_state_for_recipient (v1 leftover)
-- threads: Add status column
threads
    - id (uuid)
    - match_id (uuid, FK matches)
    - user_a_id (uuid, FK users)
    - user_b_id (uuid, FK users)
    - status (active | unmatched | blocked)
    - created_at (timestamptz)
```

### Critical Indexes

```sql
-- Discovery stack performance
CREATE INDEX idx_user_schools_user ON user_schools(user_id);
CREATE INDEX idx_user_schools_school ON user_schools(school_id);
CREATE INDEX idx_interactions_user_target ON interactions(user_id, target_id);
CREATE INDEX idx_blocks_both_directions ON blocks(blocker_id, blocked_id);
CREATE INDEX idx_blocks_reverse ON blocks(blocked_id, blocker_id);
CREATE INDEX idx_users_mode_status ON users(mode_status) WHERE mode_status = 'roommate';
CREATE INDEX idx_users_enforcement ON users(enforcement_state);

-- Messaging performance
CREATE INDEX idx_messages_thread_created ON messages(thread_id, created_at DESC);
CREATE INDEX idx_threads_participants ON threads(user_a_id, user_b_id);

-- Explore ranking
CREATE INDEX idx_users_last_active ON users(last_active_at DESC);
CREATE INDEX idx_profiles_completion ON profiles(completion_score DESC);
```

---

## Patterns to Follow

### Pattern: Server-Authoritative State

**What:** The server (Postgres + RLS + Edge Functions) is the single source of truth for all access control decisions. The client may cache data for display but never makes authorization decisions.

**When:** Every feature that involves visibility, eligibility, or trust.

**Example:**
```typescript
// CORRECT: Server decides, client displays
const { data: stack } = await supabase.rpc('get_discovery_stack', {
  filters: userFilters,
  limit: 20,
});

// WRONG: Client filters based on local data
const stack = allProfiles.filter(p => p.school === mySchool);
```

### Pattern: Optimistic UI with Server Validation

**What:** Show immediate UI feedback for user actions (like animation, message appears), but validate server-side. Roll back on failure.

**When:** Likes, messages, profile updates -- any action where latency matters for UX.

**Example:**
```typescript
// Swipe right: immediately animate away, fire Edge Function
const handleLike = async (targetId: string) => {
  // Optimistic: remove card from stack
  discoveryStore.removeCard(targetId);

  try {
    const { data } = await supabase.functions.invoke('process-like', {
      body: { target_id: targetId },
    });
    if (data.matched) {
      matchStore.addMatch(data.match);
      showMatchModal(data.match);
    }
  } catch (error) {
    // Rollback: re-add card (rare edge case)
    discoveryStore.restoreCard(targetId);
    showError('Something went wrong');
  }
};
```

### Pattern: Cursor-Based Pagination

**What:** Use opaque cursors (not page offsets) for all paginated lists. Offset pagination breaks when new items are inserted (cards shift, duplicates appear).

**When:** Discovery stack, Explore feed, message history, likes list.

**Example:**
```typescript
// Use last item's sort key as cursor
const { data } = await supabase.rpc('get_discovery_stack', {
  cursor: lastCard?.sort_key ?? null,
  limit: 20,
});
```

### Pattern: Realtime Channel Scoping

**What:** Subscribe to the minimum necessary Realtime channels. Over-subscribing wastes bandwidth and server resources.

**When:** Messaging (per-thread), match notifications (per-user).

**Correct scoping:**
```typescript
// Per-thread subscription (only when chat screen is open)
const channel = supabase.channel(`thread:${threadId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `thread_id=eq.${threadId}`,
  }, handleNewMessage)
  .subscribe();

// Global subscription for match/message notifications (always active)
const globalChannel = supabase.channel(`user:${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'matches',
    filter: `user_a_id=eq.${userId}`,
  }, handleNewMatch)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'matches',
    filter: `user_b_id=eq.${userId}`,
  }, handleNewMatch)
  .subscribe();

// Clean up thread subscription when leaving chat
return () => supabase.removeChannel(channel);
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side Gating

**What:** Checking school membership, enforcement state, or block status on the client before showing profiles or allowing messages.

**Why bad:** Any client-side check can be bypassed by a modified client. The PRD explicitly requires server enforcement. If you rely on client checks, a user with a modified app can message anyone, see blocked users, or bypass age gates.

**Instead:** Use RLS policies for reads, Edge Functions for writes. Client checks are acceptable only as UX optimizations (hide a button) but must never be the sole enforcement.

### Anti-Pattern 2: Trigger Chains for Business Logic

**What:** Using Postgres triggers to cascade from likes to matches to threads to notifications.

**Why bad:** Triggers run in the same transaction, making debugging difficult. They cannot call external services (push notifications). Error handling is opaque. Testing requires database-level tooling.

**Instead:** Use Edge Functions for multi-step business logic. The function explicitly orchestrates: validate, write, check reciprocal, create match, create thread, send notification. Each step is visible and testable.

### Anti-Pattern 3: Polling for Real-Time Data

**What:** Using `setInterval` to repeatedly fetch messages or match status.

**Why bad:** Wastes battery, bandwidth, and server resources. Creates unnecessary load. Messages feel delayed.

**Instead:** Use Supabase Realtime subscriptions for messages and match notifications. Poll only for data that changes infrequently (profile updates, explore rankings) and even then, refresh on tab focus rather than on a timer.

### Anti-Pattern 4: Storing Derived State in the Database

**What:** Storing "is_eligible_for_discovery" as a column that must be updated whenever mode, enforcement, or school changes.

**Why bad:** Derived columns go stale. Every path that changes the underlying data must remember to update the derived column. Bugs are inevitable.

**Instead:** Compute eligibility at query time using the source columns (`mode_status`, `enforcement_state`, profile completeness check). Use indexes on the source columns to keep queries fast.

### Anti-Pattern 5: Monolithic Edge Functions

**What:** One giant Edge Function that handles all API endpoints.

**Why bad:** Slow cold starts, impossible to debug, hard to test, difficult to deploy independently.

**Instead:** One Edge Function per domain operation: `process-like`, `process-block`, `process-report`, `validate-selfie`, `check-ads-eligibility`. Each is small, focused, and independently deployable.

---

## Edge Function Inventory

| Function | Trigger | Writes To | External Calls |
|----------|---------|-----------|----------------|
| `process-like` | Swipe right | interactions, matches, threads | Push notification |
| `process-block` | Block action | blocks, threads, matches, likes | None |
| `process-unmatch` | Unmatch action | matches, threads | None |
| `process-report` | Report submission | reports, enforcement_actions | None (admin reviews) |
| `validate-age` | Signup | users | None |
| `validate-selfie` | Selfie upload | users (selfie_verified) | Verification API |
| `check-ads-eligibility` | Ad request | ads_engagement | None |
| `get-discovery-stack` | Tab open / pagination | None (read-only) | None |
| `send-push` | Internal (called by other functions) | None | Expo Push API |
| `webhook-revenuecat` | Subscription event | subscriptions | None |

---

## Scalability Considerations

| Concern | At 1K users | At 50K users | At 500K users |
|---------|-------------|--------------|---------------|
| **Discovery query** | Simple JOINs, no optimization needed | Add composite indexes, consider materialized view for school membership | Pre-compute eligible pools per school, cache stack batches |
| **Realtime connections** | Single Supabase instance handles easily | Monitor WebSocket connection count, may need Realtime scaling | Consider dedicated Realtime cluster or move messaging to a purpose-built service |
| **Photo storage** | Supabase Storage is fine | Add CDN (Supabase uses Cloudflare by default) | Image optimization pipeline, multiple size variants |
| **Edge Function cold starts** | Negligible | Monitor p95 latency, keep functions small | Consider moving hot paths to always-warm infrastructure |
| **Match checking** | Sequential check in Edge Function | Index on `(user_id, target_id)` handles this | Unchanged -- index lookup is O(log n) |

**Scaling inflection point:** Supabase's free/pro tier handles up to ~50K users comfortably for this workload. Beyond that, consider Supabase Enterprise or migrating specific hot paths (messaging, discovery) to dedicated services. This is a future concern, not a launch concern.

---

## Build Order (Dependencies)

The architecture has clear dependency chains that dictate build order:

```
Phase 1: Foundation (no dependencies)
    Auth (Supabase Auth + Phone OTP)
    Database schema + RLS policies
    Storage setup (photos)
    Basic profile CRUD

Phase 2: Core Discovery (depends on Phase 1)
    School selection + user_schools
    Discovery stack query (get_discovery_stack)
    Swipe card UI
    Like processing (process-like Edge Function)
    Match creation + match modal

Phase 3: Messaging (depends on Phase 2 - matches)
    Thread creation (auto on match)
    Realtime message subscriptions
    Chat UI
    Message sending with RLS
    Block + unmatch cascades
    Push notifications

Phase 4: Social Layer (depends on Phase 1, parallel with Phase 3)
    Explore feed with ranking
    Likes tab (My Likes, Liked Me, Matches)
    Bookmarks/saves

Phase 5: Trust & Monetization (depends on Phases 2-4)
    Report flow + moderation
    Enforcement state integration
    Selfie verification
    Subscription management (RevenueCat)
    Ads integration
    Paid feature gating (see who liked you)

Phase 6: Polish (depends on all above)
    Accessibility pass
    Performance optimization
    Edge cases (empty states, error states)
    Analytics instrumentation
```

**Why this order:**
- Auth and profiles are prerequisites for everything.
- Discovery + matching is the core loop -- it must work before messaging matters.
- Messaging depends on matches existing.
- Explore and Likes are parallel tracks that enhance but do not block the core loop.
- Trust, monetization, and ads are layers on top of working core features.
- Polish comes last because you need working features to polish.

---

## Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Discovery stack query | Postgres function via `rpc()` | Too complex for PostgREST query strings; need full SQL control |
| Like/match processing | Edge Function (not trigger) | Need external calls (push), explicit error handling, testability |
| Messaging transport | Supabase Realtime | Already in stack, sufficient for launch scale, avoids third-party dependency |
| Client state management | Zustand | Lightweight, minimal boilerplate, good React Native support |
| Navigation | Expo Router | File-based routing, deep linking support, Expo-native |
| Local storage | MMKV (via react-native-mmkv) | 30x faster than AsyncStorage, synchronous reads |
| Secure storage | expo-secure-store | Auth tokens only, OS-level encryption |
| Photo upload | Supabase Storage + signed URLs | Built-in, CDN-backed, RLS-compatible |
| Push notifications | Expo Push + Edge Functions | Cross-platform from Expo, triggered server-side for reliability |
| Subscriptions | RevenueCat | Handles App Store / Play Store billing complexity |

---

## Sources

- Supabase documentation (Row Level Security, Realtime, Edge Functions, Auth) -- based on training data, HIGH confidence for core patterns
- React Native / Expo documentation -- based on training data, HIGH confidence for navigation and build patterns
- Tinder/Bumble architecture analyses -- general pattern knowledge for swipe-based matching systems
- PRD v2.0 (`docs/PRD.md`) -- authoritative product requirements
- Existing architecture doc (`docs/ARCHITECTURE.md`) -- baseline reference

**Confidence notes:**
- Supabase Realtime for messaging: MEDIUM confidence. Supabase Realtime works well for moderate scale but has known limitations at high connection counts. For launch (sub-50K users), this is a sound choice. Flag for re-evaluation if scaling beyond this.
- Edge Function cold starts: MEDIUM confidence. Deno-based Edge Functions have improved but may still show p95 latency spikes. Monitor after launch.
- MMKV availability in Expo: MEDIUM confidence. Verify `react-native-mmkv` compatibility with current Expo SDK during implementation setup.
