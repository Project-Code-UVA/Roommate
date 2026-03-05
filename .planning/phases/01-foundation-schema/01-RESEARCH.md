# Phase 1: Foundation & Schema - Research

**Researched:** 2026-03-04
**Domain:** Expo + Supabase project scaffold, Postgres schema design, RLS policies
**Confidence:** HIGH

## Summary

Phase 1 is a greenfield scaffold: create an Expo development build connected to a hosted Supabase project, apply the PRD v2.0 database schema via migrations, configure Row Level Security on all user-facing tables, and implement a shared `is_blocked()` Postgres function. No UI features are built in this phase -- just the runnable shell and fully provisioned backend.

The standard stack is well-established: Expo SDK 52 (stable, mature) with Expo Router for file-based navigation, NativeWind v4 for Tailwind-based styling, and `@supabase/supabase-js` v2 for the client. Schema is applied via Supabase migrations (SQL files), RLS policies use performance-optimized patterns (wrapped `auth.uid()`, indexed columns, `SECURITY DEFINER` helper functions), and TypeScript types are generated from the live schema.

**Primary recommendation:** Use Expo SDK 52 (mature, stable) with NativeWind v4 (production-ready) and Supabase JS v2. Apply schema via Supabase dashboard migrations or MCP tooling. Wrap all RLS helper functions for optimizer caching. Generate TypeScript types from the deployed schema.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Hybrid folder organization: shared UI in `/components/`, domain logic in `/features/`
- Each feature module (discovery, messaging, explore, etc.) has its own components, hooks, utils
- Shared utilities, types, and constants at root level
- Expo Router for file-based navigation
- 5-tab layout: Discovery is the center/primary tab (like Tinder)
- Tab order: Explore | Likes | Discovery (center) | Messages | Profile
- Outlined/minimal icons with fill on active state
- Bold & youthful color palette: purple/violet gradient primary
- Energetic, Gen Z appeal
- NativeWind (Tailwind CSS) for styling
- Supabase migrations are the source of truth (docs/DB_SCHEMA.md updated to reflect)
- Reconcile with PRD v2.0: add `likes`, `matches`, `dismissals`, `saves` tables
- Remove `routing_state_for_recipient` from threads (v1 artifact)
- Add `status` enum on threads (active/unmatched/blocked)
- Roommate preferences stored as JSONB (`nitty_gritty` column on profiles) -- flexible, no migration for new fields
- Separate tables for likes, dismissals, saves (not single interactions table) -- cleaner queries, easier indexing
- Create hosted Supabase project in US East (us-east-1)
- User has existing Supabase account
- Environment config via Expo env vars (.env files with EXPO_PUBLIC_ prefix)
- Seed schools table with real US university data for realistic development
- RLS policies on ALL user-facing tables from day one
- Shared `is_blocked(user_a, user_b)` Postgres function -- single source of truth for block checks
- Default own-data access pattern: users can always read/write their own rows
- Service role only for admin operations (Edge Functions)

### Claude's Discretion
- Exact folder naming conventions (kebab-case vs camelCase)
- Specific NativeWind/Tailwind theme configuration
- Migration file naming and ordering strategy
- Which schools to include in seed data
- Exact RLS policy structure per table
- TypeScript configuration and path aliases

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-01 | Project scaffold with Expo Development Build, Supabase client, and navigation structure | Standard Stack section covers Expo SDK 52, Expo Router, NativeWind v4, Supabase JS client setup; Architecture Patterns section covers project structure and tab navigation |
| FOUND-02 | Database schema aligned with PRD v2.0 (matches, likes, dismissals, saves tables) | Architecture Patterns covers full schema reconciliation (existing DB_SCHEMA.md vs PRD v2.0); Code Examples provides migration SQL patterns |
| FOUND-03 | Row Level Security policies for shared-school gating on all user-facing tables | Common Pitfalls and Code Examples cover RLS performance patterns, `(select auth.uid())` wrapping, indexing, SECURITY DEFINER functions |
| FOUND-04 | Shared block-check Postgres function referenced by all visibility queries | Code Examples provides `is_blocked()` function pattern using SECURITY DEFINER and STABLE markers for optimizer caching |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo | ~52.0.x | App framework | Mature (released Nov 2024), widely adopted, stable New Architecture support. SDK 55 just released (Mar 3 2026) but requires Xcode 26 and is too new for production confidence. SDK 52 is battle-tested. |
| expo-router | ~4.0.x (SDK 52) | File-based navigation | Ships with Expo SDK 52, supports tabs/stacks/modals out of the box |
| nativewind | ^4.2.0 | Tailwind CSS for React Native | Production-ready v4; v5 is pre-release ("not intended for production use") |
| @supabase/supabase-js | ^2.98.0 | Supabase client (DB, Auth, Realtime, Storage) | Official JS client, isomorphic, TypeScript-first |
| react-native-reanimated | ~3.x (SDK 52) | Animation engine (NativeWind peer dep) | Required by NativeWind v4; SDK 52 ships with Reanimated 3 |
| react-native-safe-area-context | ~4.x | Safe area handling (NativeWind peer dep) | Required by NativeWind v4 |
| @react-native-async-storage/async-storage | ^2.x | Supabase auth session persistence | Official recommended storage for supabase-js in React Native |
| typescript | ^5.x | Type safety | Ships with Expo default template |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | ^3.4.17 | Tailwind compiler (NativeWind peer dep) | Dev dependency for NativeWind v4 (NOT v4 -- Tailwind v4 is for NativeWind v5) |
| expo-secure-store | ~14.x | Secure key storage | Optional: hybrid encryption for auth tokens (SecureStore for key, AsyncStorage for encrypted value) |
| supabase (CLI) | ^2.x | Local dev, migrations, type generation | `npx supabase gen types typescript` for type generation |
| expo-constants | ~17.x | Access app config/env vars | Already included in Expo SDK 52 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Expo SDK 52 | Expo SDK 55 (latest) | SDK 55 released Mar 3 2026, requires Xcode 26, drops legacy arch. Too new for production confidence. Clear upgrade path from 52. |
| Expo SDK 52 | Expo SDK 54 | SDK 54 is current mainstream. Either 52 or 54 would work. 52 is more battle-tested, 54 has newer features. |
| NativeWind v4 | NativeWind v5 | v5 is pre-release, requires Tailwind v4, has breaking API changes. Not production-ready. |
| NativeWind | StyleSheet / Tamagui | NativeWind is user's locked decision. Tailwind familiarity, rapid iteration. |
| AsyncStorage | expo-secure-store only | SecureStore has 2KB size limit. AsyncStorage is recommended by Supabase docs. Hybrid approach possible for production. |

**Installation:**
```bash
# Create project
npx create-expo-app@latest roommate --template default@sdk-52

# Core dependencies
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage

# NativeWind + peer deps
npm install nativewind react-native-reanimated react-native-safe-area-context
npm install --save-dev tailwindcss@^3.4.17

# Supabase CLI (for type generation)
npm install --save-dev supabase
```

## Architecture Patterns

### Recommended Project Structure
```
app/                         # Expo Router file-based routes
├── _layout.tsx              # Root layout (providers, global CSS import)
├── (tabs)/                  # Tab group
│   ├── _layout.tsx          # Tab bar configuration (5 tabs)
│   ├── explore.tsx          # Explore tab (placeholder)
│   ├── likes.tsx            # Likes tab (placeholder)
│   ├── index.tsx            # Discovery tab (center/primary)
│   ├── messages.tsx         # Messages tab (placeholder)
│   └── profile.tsx          # Profile tab (placeholder)
├── (auth)/                  # Auth flow group (future)
│   └── _layout.tsx
└── +not-found.tsx           # 404 fallback

src/
├── components/              # Shared UI components
│   └── ui/                  # Base UI primitives
├── features/                # Domain-specific modules
│   ├── discovery/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   ├── messaging/
│   ├── explore/
│   ├── likes/
│   └── profile/
├── lib/                     # Infrastructure
│   ├── supabase.ts          # Supabase client singleton
│   └── constants.ts         # App-wide constants
├── types/                   # Shared TypeScript types
│   └── database.types.ts   # Generated from Supabase schema
└── utils/                   # Shared utilities

supabase/
├── migrations/              # SQL migration files (source of truth)
│   ├── 00001_create_enums.sql
│   ├── 00002_create_users.sql
│   ├── 00003_create_schools.sql
│   └── ...
└── seed.sql                 # School seed data
```

### Pattern 1: Supabase Client Singleton
**What:** Single Supabase client instance shared across the app
**When to use:** Always -- prevents multiple GoTrue instances, manages auth state consistently
**Example:**
```typescript
// src/lib/supabase.ts
// Source: https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for React Native
  },
});
```

### Pattern 2: RLS with Optimized auth.uid() Wrapping
**What:** Wrap `auth.uid()` in `(select ...)` to trigger Postgres initPlan caching
**When to use:** Every RLS policy that references the current user
**Example:**
```sql
-- Source: https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv
-- SLOW: auth.uid() called per row
CREATE POLICY "users_own_data" ON profiles
  FOR SELECT USING (user_id = auth.uid());

-- FAST: auth.uid() cached via initPlan (9ms vs 179ms on 100K rows)
CREATE POLICY "users_own_data" ON profiles
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));
```

### Pattern 3: SECURITY DEFINER Helper Functions
**What:** Shared trust functions that bypass RLS on lookup tables
**When to use:** When RLS policies need to join other tables (blocks, schools)
**Example:**
```sql
-- Source: https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv
CREATE OR REPLACE FUNCTION public.is_blocked(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = user_a AND blocked_id = user_b)
       OR (blocker_id = user_b AND blocked_id = user_a)
  );
END;
$$;

-- Usage in RLS policy (wrapped for caching):
CREATE POLICY "hide_blocked_users" ON profiles
  FOR SELECT TO authenticated
  USING (
    NOT (select public.is_blocked((select auth.uid()), user_id))
  );
```

### Pattern 4: Expo Router Tab Layout
**What:** File-based 5-tab navigation with center-primary Discovery
**When to use:** Root tab configuration
**Example:**
```typescript
// app/(tabs)/_layout.tsx
// Source: https://docs.expo.dev/router/advanced/tabs/
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#7C3AED' }}>
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: /* ... */ }} />
      <Tabs.Screen name="likes" options={{ title: 'Likes', tabBarIcon: /* ... */ }} />
      <Tabs.Screen name="index" options={{ title: 'Discovery', tabBarIcon: /* ... */ }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: /* ... */ }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: /* ... */ }} />
    </Tabs>
  );
}
```

### Pattern 5: Environment Variables
**What:** EXPO_PUBLIC_ prefixed vars for client-accessible config
**When to use:** Supabase URL and anon key configuration
**Example:**
```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```
```typescript
// Access in code
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
```

### Anti-Patterns to Avoid
- **Storing secrets in EXPO_PUBLIC_ vars:** These are embedded in the client bundle. Only use for publishable keys (anon key is designed to be public, protected by RLS).
- **Multiple Supabase client instances:** Creates auth state conflicts. Always use a singleton.
- **`FOR ALL` RLS policies:** Split into separate SELECT, INSERT, UPDATE, DELETE policies for clarity and security.
- **Unindexed RLS columns:** Causes full table scans. Always index columns referenced in RLS policies.
- **Relying on RLS for query filtering:** RLS is a safety net, not a query optimizer. Always add explicit `.eq()` filters on the client side.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth session persistence | Custom token storage | `@supabase/supabase-js` auth with AsyncStorage | Handles refresh, expiry, race conditions |
| Database type generation | Manual TypeScript interfaces | `npx supabase gen types typescript` | Auto-syncs with schema, catches drift |
| File-based routing | Custom navigator registry | Expo Router | Convention-based, deep linking for free |
| CSS-in-JS for RN | Custom StyleSheet factories | NativeWind | Tailwind utility classes, responsive, dark mode |
| Migration management | Manual SQL execution | Supabase migrations (or MCP apply_migration) | Versioned, repeatable, rollback-safe |
| Block check logic | Inline SQL in each policy | Shared `is_blocked()` SECURITY DEFINER function | Single source of truth, tested once, used everywhere |
| School seed data | Fake school names | IPEDS data from NCES (nces.ed.gov) | Real US university data, realistic development |

**Key insight:** This phase is almost entirely infrastructure wiring. Every component has a well-documented official setup path. The risk is not in choosing tools but in getting configuration details wrong (NativeWind babel config, RLS policy syntax, migration ordering).

## Common Pitfalls

### Pitfall 1: NativeWind Configuration Order
**What goes wrong:** Styles don't apply, app crashes, or metro bundler errors
**Why it happens:** NativeWind v4 requires exact config in babel.config.js, metro.config.js, and tailwind.config.js. Missing any step silently fails.
**How to avoid:**
1. Add `nativewind/babel` preset to babel.config.js with `jsxImportSource: "nativewind"`
2. Add `withNativeWind` wrapper to metro.config.js pointing to `./global.css`
3. Add `nativewind/preset` to tailwind.config.js presets
4. Import `./global.css` in root layout
5. Create `nativewind-env.d.ts` with `/// <reference types="nativewind/types" />`
6. NEVER name the d.ts file `nativewind.d.ts` (conflicts with module)
**Warning signs:** Tailwind classes render as plain text, no styling visible, TypeScript errors on `className` prop

### Pitfall 2: RLS Policy Performance on Joined Tables
**What goes wrong:** Queries slow down 10-100x as data grows
**Why it happens:** RLS policies that join other tables (blocks, user_schools) trigger per-row evaluation without optimizer caching
**How to avoid:**
1. Use `SECURITY DEFINER` functions for cross-table lookups
2. Wrap function calls in `(select ...)` for initPlan caching
3. Always specify `TO authenticated` (not `TO public` or omitting role)
4. Add btree indexes on all columns referenced in RLS policies
5. Reverse join direction: `column IN (select ... where user_id = auth.uid())` not `auth.uid() IN (select ... where column = table.column)`
**Warning signs:** Query times above 50ms on small tables, EXPLAIN ANALYZE showing sequential scans

### Pitfall 3: Migration Ordering with Foreign Keys
**What goes wrong:** Migration fails because referenced table doesn't exist yet
**Why it happens:** Tables with foreign keys must be created after parent tables
**How to avoid:**
1. Create enums first
2. Create independent tables (users, schools) before dependent ones (user_schools, profiles)
3. Create junction/interaction tables (likes, matches, blocks) after both referenced tables
4. Keep each migration focused on one logical unit
**Warning signs:** "relation does not exist" errors during migration

### Pitfall 4: Missing .env in Git
**What goes wrong:** Secrets committed to repository, or teammate can't run the app
**Why it happens:** .env file not in .gitignore, or no .env.example provided
**How to avoid:**
1. Add `.env` and `.env.local` to `.gitignore` immediately
2. Create `.env.example` with placeholder values (no real keys)
3. Document required env vars in project README or CLAUDE.md
**Warning signs:** Supabase keys visible in git history

### Pitfall 5: Supabase Client detectSessionInUrl
**What goes wrong:** Auth flow breaks or hangs on React Native
**Why it happens:** supabase-js defaults to browser URL detection for OAuth callbacks, which doesn't work in React Native
**How to avoid:** Set `detectSessionInUrl: false` in client config
**Warning signs:** Auth state never resolves, infinite loading on app start

## Code Examples

### Full Schema Migration Sequence (Reconciled with PRD v2.0)

The existing DB_SCHEMA.md needs the following reconciliation:
- **Add:** `likes`, `matches`, `dismissals`, `saves` tables
- **Remove:** `routing_state_for_recipient` from threads
- **Add:** `status` enum on threads (active, unmatched, blocked)
- **Keep:** `nitty_gritty` JSONB on profiles

```sql
-- Migration 1: Enums
CREATE TYPE mode_status AS ENUM ('roommate', 'friends', 'found_roommate');
CREATE TYPE enforcement_state AS ENUM ('none', 'warning', 'dm_ban_48h', 'suspended_7d', 'permanent_ban');
CREATE TYPE thread_status AS ENUM ('active', 'unmatched', 'blocked');
CREATE TYPE report_reason AS ENUM (
  'harassment', 'sexual_content', 'hate_speech', 'spam',
  'impersonation', 'underage', 'safety_threat', 'other'
);
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
CREATE TYPE enforcement_action_type AS ENUM ('warning', 'dm_ban_48h', 'suspended_7d', 'permanent_ban');
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected');

-- Migration 2: Users
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  birthdate date NOT NULL,
  selfie_verified boolean NOT NULL DEFAULT false,
  mode_status mode_status NOT NULL DEFAULT 'roommate',
  enforcement_state enforcement_state NOT NULL DEFAULT 'none',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now()
);

-- Migration 3: Schools
CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Migration 4: User-Schools junction
CREATE TABLE public.user_schools (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, school_id)
);
CREATE INDEX idx_user_schools_school_id ON public.user_schools(school_id);

-- Migration 5: Profiles
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  display_name text,
  bio text,
  year text,
  hometown text,
  nitty_gritty jsonb DEFAULT '{}'::jsonb,
  completion_score smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Migration 6: Photos
CREATE TABLE public.photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  order_index smallint NOT NULL DEFAULT 0,
  moderation_status moderation_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_photos_user_id ON public.photos(user_id);

-- Migration 7: Likes
CREATE TABLE public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  liked_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (liker_id, liked_id)
);
CREATE INDEX idx_likes_liked_id ON public.likes(liked_id);

-- Migration 8: Matches
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_b_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_a_id, user_b_id),
  CHECK (user_a_id < user_b_id) -- canonical ordering prevents duplicates
);
CREATE INDEX idx_matches_user_b ON public.matches(user_b_id);

-- Migration 9: Dismissals
CREATE TABLE public.dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dismisser_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dismissed_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dismisser_id, dismissed_id)
);

-- Migration 10: Saves (bookmarks)
CREATE TABLE public.saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saver_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  saved_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (saver_id, saved_id)
);

-- Migration 11: Threads (PRD v2.0 -- NO routing_state_for_recipient)
CREATE TABLE public.threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_b_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL,
  status thread_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_a_id, user_b_id),
  CHECK (user_a_id < user_b_id) -- canonical ordering
);

-- Migration 12: Messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body text,
  media_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz
);
CREATE INDEX idx_messages_thread_id ON public.messages(thread_id);
CREATE INDEX idx_messages_created_at ON public.messages(thread_id, created_at);

-- Migration 13: Blocks
CREATE TABLE public.blocks (
  blocker_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);
CREATE INDEX idx_blocks_blocked_id ON public.blocks(blocked_id);

-- Migration 14: Reports
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason report_reason NOT NULL,
  details text,
  status report_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Migration 15: Enforcement Actions
CREATE TABLE public.enforcement_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action enforcement_action_type NOT NULL,
  start_at timestamptz NOT NULL DEFAULT now(),
  end_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_enforcement_user_id ON public.enforcement_actions(user_id);

-- Migration 16: Ranking Config (server-tunable weights)
CREATE TABLE public.ranking_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weight_name text NOT NULL UNIQUE,
  weight_value numeric(5,4) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Migration 17: Ads Engagement tracking
CREATE TABLE public.ads_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  swipe_count integer NOT NULL DEFAULT 0,
  first_match_at timestamptz,
  ads_eligible boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Migration 18: Subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Shared Trust Functions

```sql
-- is_blocked: bidirectional block check
-- SECURITY DEFINER: bypasses RLS on blocks table
-- STABLE: can be cached within a transaction
CREATE OR REPLACE FUNCTION public.is_blocked(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = user_a AND blocked_id = user_b)
       OR (blocker_id = user_b AND blocked_id = user_a)
  );
END;
$$;

-- shares_school: checks if two users share at least one school
CREATE OR REPLACE FUNCTION public.shares_school(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_schools us1
    INNER JOIN public.user_schools us2 ON us1.school_id = us2.school_id
    WHERE us1.user_id = user_a AND us2.user_id = user_b
  );
END;
$$;
```

### RLS Policy Pattern (per-table)

```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
-- ... (all tables)

-- Example: profiles table
-- SELECT: own data always visible; other users visible if shared school and not blocked
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "profiles_select_shared_school" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    user_id != (select auth.uid())
    AND (select public.shares_school((select auth.uid()), user_id))
    AND NOT (select public.is_blocked((select auth.uid()), user_id))
  );

-- INSERT: own data only
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- UPDATE: own data only
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
```

### NativeWind Configuration Files

```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

```javascript
// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
```

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',  // Primary purple
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
    },
  },
  plugins: [],
};
```

### Supabase Client with Type Safety

```typescript
// src/lib/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### TypeScript Type Generation

```bash
# Generate types from remote project
npx supabase gen types typescript --project-id "your-project-id" > src/types/database.types.ts

# Or use the Supabase MCP tool: generate_typescript_types
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `expo install` | `npx expo install` | SDK 49+ | CLI is now invoked via npx |
| Expo Go for development | Development builds | SDK 52+ | Dev builds support all native modules |
| AsyncStorage from RN | @react-native-async-storage/async-storage | RN 0.64+ | Separate package, community maintained |
| NativeWind v2 (StyleSheet) | NativeWind v4 (CSS-based) | 2024 | Full Tailwind support, CSS variables, animations |
| Manual RLS auth.uid() | Wrapped `(select auth.uid())` | Supabase best practices 2024+ | 10-100x performance improvement |
| Legacy Architecture | New Architecture default | SDK 52+ | Better performance, Fabric renderer |
| routing_state_for_recipient | PRD v2.0 match-based threads | This project | No message requests/routing tiers in v2.0 |

**Deprecated/outdated:**
- `expo-app-loading`: Use `expo-splash-screen` instead
- NativeWind v2: v4 is the current stable release
- `react-native-dotenv`: Use Expo's built-in `EXPO_PUBLIC_` env vars
- Manual Supabase type definitions: Use `supabase gen types` CLI

## Open Questions

1. **Expo SDK 52 vs 54 for initial scaffold**
   - What we know: SDK 52 is battle-tested (4 months). SDK 54 is current mainstream. SDK 55 is too new (2 days old, requires Xcode 26).
   - What's unclear: Whether any SDK 52 dependencies have compatibility issues with the latest supabase-js or NativeWind versions.
   - Recommendation: Start with SDK 52. If dependency conflicts arise during setup, upgrade to SDK 54. Both are well-supported.

2. **School seed data scope**
   - What we know: IPEDS has 6,400+ US institutions. Full dataset is large.
   - What's unclear: How many schools to seed for development (10? 50? all 6400?).
   - Recommendation: Seed 50 well-known US universities across diverse regions. Sufficient for testing shared-school logic without overwhelming the DB. Include mix of large state schools and private universities.

3. **Supabase project provisioning method**
   - What we know: User has existing Supabase account. MCP tools can create projects. Dashboard also works.
   - What's unclear: Whether to use MCP `create_project` tool or manual dashboard setup.
   - Recommendation: Use Supabase MCP tools if available during implementation, otherwise dashboard. Either way, migrations are applied programmatically.

## Sources

### Primary (HIGH confidence)
- [Supabase RLS Performance Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) - RLS patterns, SECURITY DEFINER, indexing, auth.uid() wrapping
- [Supabase Expo React Native Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native) - Client setup, auth storage
- [NativeWind v4 Installation](https://www.nativewind.dev/docs/getting-started/installation) - Full config files, versions, TypeScript setup
- [Expo Router Tabs](https://docs.expo.dev/router/advanced/tabs/) - Tab layout patterns
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/) - EXPO_PUBLIC_ prefix, .env handling
- [Supabase TypeScript Types](https://supabase.com/docs/guides/api/rest/generating-types) - CLI type generation

### Secondary (MEDIUM confidence)
- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) - Latest SDK info, verified via official changelog
- [NativeWind v5 Migration Guide](https://www.nativewind.dev/v5/guides/migrate-from-v4) - Confirmed v5 is pre-release
- [Expo create-expo-app](https://docs.expo.dev/more/create-expo/) - Template options, SDK version defaults
- [IPEDS Data](https://nces.ed.gov/ipeds) - US university data for seed

### Tertiary (LOW confidence)
- Expo SDK 52 vs 54 stability comparison: based on community signals, not benchmarked data

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via official docs, versions confirmed on npm
- Architecture: HIGH - Patterns from official Supabase and Expo documentation
- Pitfalls: HIGH - RLS performance patterns verified with benchmark data from Supabase docs
- Schema design: HIGH - Directly reconciled from PRD v2.0 and existing DB_SCHEMA.md

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (30 days -- stable ecosystem, no major releases expected)
