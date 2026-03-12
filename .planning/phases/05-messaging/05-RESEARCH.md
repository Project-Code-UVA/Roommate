# Phase 5: Messaging - Research

**Researched:** 2026-03-11
**Domain:** Real-time chat, Supabase Realtime, React Native chat UI, media sharing, GIPHY integration
**Confidence:** HIGH

## Summary

Phase 5 builds the complete messaging experience on top of existing infrastructure: `threads` and `messages` tables (Phase 1), `like_profile` RPC creating threads atomically (Phase 3), and match modal navigation stubs (Phase 4). The core challenge is wiring Supabase Realtime for live message delivery, building a performant chat UI with iMessage-style bubbles, and adding rich features (reactions, reply threading, media, GIFs) without introducing a heavy third-party chat SDK.

The project already uses `@supabase/supabase-js ^2.98.0` which includes `@supabase/realtime-js` -- no additional realtime dependency needed. The `messages` table needs schema extensions: `reply_to_id` for threading and a `message_reactions` table for reactions. A `chat-messages` Supabase Storage bucket is needed for photo sharing. For GIFs, the GIPHY REST API (free tier) is the cleanest Expo-compatible approach -- the native GIPHY SDK has Expo compatibility issues and is unnecessary when we only need search + send URL.

**Primary recommendation:** Use Supabase Realtime `postgres_changes` filtered by `thread_id` for live message delivery, build a custom chat UI with inverted FlatList (not react-native-gifted-chat), and use the GIPHY REST API directly for GIF search.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- iMessage-style rounded bubbles with tails on the last message in a cluster
- Sender bubbles on right in purple/violet (matches app palette from constants.ts), receiver on left in gray
- Timestamps shown between message groups (not on every message)
- Chat header: small circular avatar + display name only (no online/last active status). Tapping header opens profile bottom sheet (reuse Phase 4 pattern)
- WhatsApp-style checkmarks: single check = sent, double check = delivered, blue double check = read
- Shown on sender's messages only
- Floating dismissible card in center of empty chat area for icebreakers
- 3 prompts shown initially with a "More" button to cycle through additional suggestions
- Mix of roommate-specific prompts and general social prompts
- Tapping a prompt fills the composer with it
- Card dismissible with X button; doesn't come back once dismissed
- Card disappears naturally when first message is sent
- Camera icon in composer opens action sheet: "Take Photo" or "Choose from Library"
- After selecting photo, optional caption text field appears before sending
- Photos render as rounded rectangles inline with message flow
- Tap photo to open full-screen viewer with pinch-to-zoom
- GIF button in composer opens GIPHY-powered search panel above keyboard
- Search bar + trending grid layout
- Tap GIF to send immediately
- GIFs render inline like photos (rounded rectangle)
- Long-press a message shows row of 6 quick emojis + '+' to open full emoji picker
- Multiple reactions per user allowed on the same message
- Reactions display as small pills below the message bubble with counts
- Both swipe-right gesture AND long-press menu "Reply" option to initiate reply
- Inline quote preview of original message shown above the reply bubble (WhatsApp/Telegram pattern)
- Tapping the quote scrolls to the original message
- Long-press menu: Reaction row at top, then Reply, Copy text, Delete for me, Report message
- Block & Report accessible from chat header overflow menu (...) or long-press on individual messages
- Block triggers full visibility removal (server-enforced, existing is_blocked() function)
- Report opens category picker with 8 standard categories (from REQUIREMENTS.md SAFE-03)

### Claude's Discretion
- Real-time messaging approach (Supabase Realtime channels vs polling vs hybrid)
- Message pagination and infinite scroll implementation
- Icebreaker prompt pool content (exact prompts)
- Photo upload compression and size limits
- GIPHY API integration details and key management
- Reaction animation and haptic feedback
- Keyboard handling and composer auto-grow behavior
- Message grouping time threshold
- Optimistic message sending pattern
- Database migrations for reply_to column and reactions storage

### Deferred Ideas (OUT OF SCOPE)
- Read receipts as paid feature -- Phase 9 (Monetization) or v2
- Online/last active status indicator -- could add later to chat header
- Video calling between matches -- v2 (SOCL-03)
- Typing indicators -- nice to have, could add in polish pass
- Message search -- future enhancement
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MSG-01 | User can send and receive real-time text messages with matches | Supabase Realtime postgres_changes on messages table, optimistic insert pattern, inverted FlatList |
| MSG-02 | User can see message timestamps | Message grouping by time threshold (5 min), date separators between groups |
| MSG-03 | User can see delivery indicators (sent/delivered) | Optimistic "sent" on insert, update delivered_at server-side, Realtime UPDATE subscription |
| MSG-04 | User can react to messages with emoji | message_reactions table, long-press menu with 6 quick emojis + picker |
| MSG-05 | User can reply to specific messages (threading) | reply_to_id FK column on messages, swipe-right gesture + long-press Reply |
| MSG-06 | User can send photos and GIFs in chat | expo-image-picker + expo-image-manipulator for photos, GIPHY REST API for GIFs, Supabase Storage bucket |
| MSG-07 | User can block from chat (full visibility removal) | Existing is_blocked() + blocks table, unmatch_user RPC with p_block_too=true, thread status -> 'blocked' |
| MSG-08 | User can report from chat | Existing reports table with report_reason enum, insert via Supabase client |
| MSG-09 | User sees icebreaker prompt suggestions on new match | Local prompt pool (no server dependency), dismissible card component, AsyncStorage for dismissed state |
| MSG-10 | Messaging eligibility enforced server-side (mutual match + shared school + no enforcement + no block) | Existing RLS policies on threads/messages + shares_school() + is_blocked() + enforcement_state check |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.98.0 | Realtime subscriptions, DB queries, Storage uploads | Already the project's backend client; includes realtime-js |
| react-native-reanimated | ~3.16.1 | Swipe-to-reply gesture animations, reaction animations | Already installed, used in Phase 4 swipe cards |
| react-native-gesture-handler | ~2.20.2 | Long-press and swipe-right gestures on messages | Already installed, used in Phase 4 |
| expo-haptics | ~14.0.1 | Haptic feedback on reactions, message send | Already installed |
| expo-image-picker | ~16.0.6 | Camera/gallery photo selection for chat media | Already installed, used in Phase 2 onboarding |
| expo-image-manipulator | ~13.0.6 | Photo compression/resize before upload | Already installed, used in Phase 2 |
| @gorhom/bottom-sheet | ^5.2.8 | Profile sheet from chat header, report category picker | Already installed, used in Phase 4 |
| @expo/vector-icons (Ionicons) | ~14.0.4 | Chat UI icons (send, camera, GIF, etc.) | Already installed |

### New Dependencies
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-clipboard | ~7.0.1 | Copy message text from long-press menu | Install for "Copy text" action |

### No Additional Dependencies Needed
| Feature | Approach | Why Not a Library |
|---------|----------|-------------------|
| Chat UI | Custom inverted FlatList | react-native-gifted-chat adds 200KB+ bundle weight, limits customization of iMessage-style bubbles, and its FlatList performance is debated. Custom FlatList with `inverted={true}` is the standard pattern for chat apps needing custom bubble designs. |
| GIF search | GIPHY REST API (fetch) | @giphy/react-native-sdk has Expo compatibility issues (requires dev client, Fresco conflicts with RN 0.76.x). Direct REST API is simpler, lighter, and fully Expo-compatible. |
| Emoji picker | Custom 6-emoji row + system keyboard | Full emoji picker libraries add significant weight. The 6 quick-reaction pattern (heart, laugh, thumbs up, surprised, sad, fire) covers 90%+ of reactions. '+' button opens system emoji keyboard input for custom. |
| Real-time | Supabase Realtime (built-in) | No need for Socket.IO, Pusher, or other WebSocket libraries. supabase-js includes realtime-js. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom FlatList chat | react-native-gifted-chat | Gifted-chat is faster to scaffold but severely limits bubble customization and adds bundle weight. Custom is better for the specific iMessage-style design required. |
| GIPHY REST API | @giphy/react-native-sdk | Native SDK provides better UX (native grid, caching) but has Expo/Fresco compatibility issues with RN 0.76.x. REST API is simpler and fully compatible. |
| Supabase Realtime | Polling | Polling at 1-3s intervals works but adds latency and wastes bandwidth. Supabase Realtime is built-in and free on the project's plan. |

**Installation:**
```bash
npx expo install expo-clipboard
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── chat/
│       ├── chat-header.tsx           # Avatar + name + overflow menu
│       ├── message-bubble.tsx        # Single message bubble (sender/receiver variants)
│       ├── message-list.tsx          # Inverted FlatList with message grouping
│       ├── message-composer.tsx      # Text input + send + camera + GIF buttons
│       ├── message-reactions.tsx     # Reaction pills below bubble
│       ├── message-reply-preview.tsx # Quoted reply above bubble
│       ├── message-long-press.tsx    # Long-press overlay (reactions + actions)
│       ├── icebreaker-card.tsx       # Floating prompt card for empty chats
│       ├── gif-search-panel.tsx      # GIPHY search grid above keyboard
│       ├── photo-preview.tsx         # Photo with optional caption before send
│       ├── date-separator.tsx        # "Today", "Yesterday", date between groups
│       └── delivery-indicator.tsx    # Checkmark icons (sent/delivered/read)
├── hooks/
│   ├── use-chat-messages.ts         # Fetch messages + Realtime subscription
│   ├── use-message-actions.ts       # Send, react, delete-for-me, report
│   └── use-gif-search.ts           # GIPHY API search with debounce
├── services/
│   ├── message-service.ts           # CRUD for messages, reactions, delivery updates
│   ├── thread-service.ts            # Thread queries (list, get by id, mark read)
│   ├── block-service.ts             # Block user + update thread status
│   ├── report-service.ts            # Submit report
│   └── gif-service.ts              # GIPHY API wrapper (trending + search)
├── types/
│   └── chat.ts                      # Message, Thread, Reaction, GifResult types
└── lib/
    └── icebreaker-prompts.ts        # Static prompt pool
app/
├── (tabs)/
│   └── messages.tsx                 # Thread list screen (conversations overview)
└── chat/
    └── [threadId].tsx               # Individual chat screen (dynamic route)
```

### Pattern 1: Supabase Realtime Subscription for Live Messages
**What:** Subscribe to postgres_changes on the `messages` table filtered by `thread_id` for live message delivery.
**When to use:** When user opens a chat screen.
**Key details:**
- Supabase Realtime works by subscribing to a Postgres replication stream
- The `messages` table must be added to the `supabase_realtime` publication
- RLS policies on messages already exist (participant-only access)
- Filter by `thread_id=eq.{threadId}` to receive only relevant messages
- Subscribe to both INSERT (new messages) and UPDATE (delivery/read status changes)

**Example:**
```typescript
// Source: Supabase Realtime docs - postgres_changes
const channel = supabase
  .channel(`chat:${threadId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `thread_id=eq.${threadId}`,
    },
    (payload) => {
      // Append new message to state (if not from self -- avoid double-add from optimistic insert)
      const newMessage = payload.new as Message;
      if (newMessage.sender_id !== currentUserId) {
        setMessages(prev => [newMessage, ...prev]);
      }
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'messages',
      filter: `thread_id=eq.${threadId}`,
    },
    (payload) => {
      // Update delivery/read status
      const updated = payload.new as Message;
      setMessages(prev =>
        prev.map(m => m.id === updated.id ? { ...m, delivered_at: updated.delivered_at, read_at: updated.read_at } : m)
      );
    }
  )
  .subscribe();

// Cleanup on unmount
return () => { supabase.removeChannel(channel); };
```

### Pattern 2: Optimistic Message Sending
**What:** Show the message immediately in the UI before the server confirms insertion.
**When to use:** Every message send operation.
**Key details:**
- Generate UUID client-side for the message ID
- Insert optimistic message into local state with `status: 'sending'`
- Fire Supabase insert
- On success: update status to 'sent' (single checkmark)
- On error: show retry indicator on the message
- The Realtime subscription will receive the INSERT event, but we skip it for self-sent messages (already in state)

**Example:**
```typescript
async function sendMessage(threadId: string, body: string, replyToId?: string) {
  const optimisticId = crypto.randomUUID();
  const optimistic: Message = {
    id: optimisticId,
    thread_id: threadId,
    sender_id: currentUserId,
    body,
    media_url: null,
    reply_to_id: replyToId ?? null,
    created_at: new Date().toISOString(),
    delivered_at: null,
    read_at: null,
    _status: 'sending', // Local-only field
  };

  // Optimistic insert
  setMessages(prev => [optimistic, ...prev]);

  const { error } = await supabase
    .from('messages')
    .insert({
      id: optimisticId,
      thread_id: threadId,
      sender_id: currentUserId,
      body,
      media_url: null,
      reply_to_id: replyToId ?? null,
    });

  if (error) {
    setMessages(prev =>
      prev.map(m => m.id === optimisticId ? { ...m, _status: 'failed' } : m)
    );
    return { data: null, error: error.message };
  }

  setMessages(prev =>
    prev.map(m => m.id === optimisticId ? { ...m, _status: 'sent' } : m)
  );
  return { data: { id: optimisticId }, error: null };
}
```

### Pattern 3: Message Grouping and Timestamp Display
**What:** Group consecutive messages from the same sender within a time threshold, show timestamps between groups.
**When to use:** Rendering the message list.
**Key details:**
- Time threshold: 5 minutes (if the gap between consecutive messages from the same sender exceeds 5 minutes, start a new group)
- Show "tail" on the last bubble in each cluster (visual indicator of message grouping)
- Date separators: "Today", "Yesterday", or "MMM D" for older dates
- Timestamps between groups show the time (e.g., "2:34 PM")

### Pattern 4: Inverted FlatList for Chat
**What:** Use React Native's FlatList with `inverted={true}` to render messages newest-first at the bottom.
**When to use:** The main chat message list.
**Key details:**
- `inverted={true}` flips the scroll direction so newest messages appear at bottom
- Data array is ordered newest-first (matches Supabase `order('created_at', { ascending: false })`)
- `onEndReached` triggers loading older messages (pagination)
- `keyExtractor` uses message ID
- `maintainVisibleContentPosition` is NOT needed with inverted list (new items prepend to array start, which is the visual bottom)

### Pattern 5: Keyboard-Aware Composer
**What:** Composer input that grows with text and properly avoids the keyboard.
**When to use:** The chat screen layout.
**Key details:**
- Use `KeyboardAvoidingView` with `behavior="padding"` on iOS
- Composer TextInput with `multiline={true}` and max height constraint (120px / ~5 lines)
- Bottom safe area inset must be accounted for (the tab bar is hidden on the chat screen)
- GIF panel opens above the keyboard (replaces keyboard when active)
- Photo preview appears above composer when a photo is selected

### Anti-Patterns to Avoid
- **Subscribing to all messages globally:** Always filter Realtime subscriptions by `thread_id`. A global subscription would trigger RLS checks for every message across all threads.
- **Polling for new messages:** Supabase Realtime is purpose-built for this. Polling wastes bandwidth and adds latency.
- **Storing reactions as JSON on the message:** Use a separate `message_reactions` table. JSON updates require reading the whole field, are not atomic, and create merge conflicts with concurrent reactions.
- **Using gifted-chat for heavy customization:** The iMessage-style bubble design with tails, purple branding, and grouped timestamps requires so much customization of gifted-chat that building custom components is cleaner.
- **Blocking UI during photo upload:** Upload photos asynchronously. Show a progress indicator on the message bubble while uploading, then swap in the final URL.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket connection management | Custom WebSocket client | Supabase Realtime (built into supabase-js) | Handles reconnection, auth token refresh, channel multiplexing |
| Image compression | Manual pixel manipulation | expo-image-manipulator | Handles JPEG compression, resize, format conversion natively |
| Photo/camera access | Custom camera module | expo-image-picker | Handles permissions, camera/gallery, returns consistent format |
| UUID generation | Custom ID generator | crypto.randomUUID() | Available in React Native Hermes engine, cryptographically secure |
| Clipboard access | Custom clipboard bridge | expo-clipboard | Cross-platform, handles text copy reliably |
| Bottom sheet | Custom animated modal | @gorhom/bottom-sheet | Already installed, handles gestures, snap points, keyboard avoidance |
| Haptic feedback | Custom native module | expo-haptics | Already installed, handles platform differences |

**Key insight:** The messaging stack is built almost entirely on already-installed dependencies. The only new install is expo-clipboard. The heaviest lift is custom UI components (bubbles, reactions, long-press menu), not infrastructure.

## Common Pitfalls

### Pitfall 1: Supabase Realtime Publication Not Enabled
**What goes wrong:** Subscribing to postgres_changes silently receives no events.
**Why it happens:** The `messages` table must be added to the `supabase_realtime` publication. This is NOT automatic.
**How to avoid:** Run migration: `ALTER PUBLICATION supabase_realtime ADD TABLE messages;` -- also add `message_reactions` table.
**Warning signs:** Subscription status shows 'SUBSCRIBED' but no INSERT events arrive.

### Pitfall 2: Double Message on Optimistic Send
**What goes wrong:** When sender inserts a message optimistically AND receives the Realtime INSERT event, the message appears twice.
**Why it happens:** The Realtime subscription fires for all INSERTs including the sender's own.
**How to avoid:** In the Realtime INSERT handler, skip messages where `sender_id === currentUserId`. The optimistic message is already in state.
**Warning signs:** Duplicate messages appearing immediately after send.

### Pitfall 3: Canonical ID Ordering for Threads
**What goes wrong:** Thread lookups fail because the `threads` table has `CHECK (user_a_id < user_b_id)`.
**Why it happens:** Querying by `user_a_id = currentUser` misses threads where the current user is `user_b_id`.
**How to avoid:** Always query threads with `OR` condition: `.or(\`user_a_id.eq.${userId},user_b_id.eq.${userId}\`)` -- same pattern used in match-service.ts.
**Warning signs:** "No thread found" errors when thread definitely exists.

### Pitfall 4: Keyboard Handling on iOS vs Android
**What goes wrong:** Composer is hidden behind keyboard, or content jumps awkwardly.
**Why it happens:** iOS and Android handle keyboard avoidance differently. iOS needs `behavior="padding"`, Android may need `behavior="height"` or `android:windowSoftInputMode="adjustResize"`.
**How to avoid:** Test on both platforms. Use `KeyboardAvoidingView` with platform-specific behavior. Account for tab bar offset.
**Warning signs:** Input field disappears when keyboard opens on one platform.

### Pitfall 5: Photo Upload 0-Byte Bug
**What goes wrong:** Uploaded photos have 0 bytes in Supabase Storage.
**Why it happens:** React Native's `fetch` blob handling has issues with file URIs.
**How to avoid:** Use the same `base64-arraybuffer` upload pattern established in Phase 2 photo onboarding. Read file as base64 via `expo-file-system`, decode to ArrayBuffer, upload.
**Warning signs:** Photos appear as broken images after upload.

### Pitfall 6: Message Reactions Race Condition
**What goes wrong:** Two users react at the same time, one reaction is lost.
**Why it happens:** If reactions are stored as JSON on the message, concurrent updates overwrite each other.
**How to avoid:** Use a separate `message_reactions` table with `(message_id, user_id, emoji)` unique constraint and `ON CONFLICT DO UPDATE` for toggle behavior.
**Warning signs:** Reactions disappearing intermittently.

### Pitfall 7: GIF Panel Keyboard Conflict
**What goes wrong:** Opening the GIF panel causes the keyboard to dismiss and the UI to jump.
**Why it happens:** The GIF panel and keyboard compete for the same screen space.
**How to avoid:** Track keyboard height. When GIF panel opens, dismiss keyboard but maintain the same bottom offset (set GIF panel height = keyboard height). This creates a smooth swap effect.
**Warning signs:** Screen content jumping up/down when toggling between text input and GIF search.

## Code Examples

### Database Migration: reply_to_id and message_reactions
```sql
-- Migration: Add reply_to_id for message threading
ALTER TABLE public.messages
  ADD COLUMN reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

CREATE INDEX idx_messages_reply_to ON public.messages(reply_to_id)
  WHERE reply_to_id IS NOT NULL;

-- Migration: Create message_reactions table
CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);
CREATE INDEX idx_reactions_message_id ON public.message_reactions(message_id);

-- RLS for message_reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reactions_select_thread_participant" ON public.message_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.threads t ON t.id = m.thread_id
      WHERE m.id = message_id
      AND (t.user_a_id = (select auth.uid()) OR t.user_b_id = (select auth.uid()))
    )
  );

CREATE POLICY "reactions_insert_own" ON public.message_reactions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.threads t ON t.id = m.thread_id
      WHERE m.id = message_id
      AND (t.user_a_id = (select auth.uid()) OR t.user_b_id = (select auth.uid()))
    )
  );

CREATE POLICY "reactions_delete_own" ON public.message_reactions
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- Enable Realtime for messages and message_reactions
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
```

### Database Migration: RPC for sending messages with server-side eligibility check
```sql
-- Migration: Send message RPC with server-side eligibility enforcement
-- Checks: active thread, not blocked, shared school, no enforcement, sender is participant
CREATE OR REPLACE FUNCTION public.send_message(
  p_thread_id uuid,
  p_sender_id uuid,
  p_body text DEFAULT NULL,
  p_media_url text DEFAULT NULL,
  p_reply_to_id uuid DEFAULT NULL,
  p_message_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_thread threads%ROWTYPE;
  v_other_id uuid;
  v_msg_id uuid;
BEGIN
  -- Get thread and validate sender is participant
  SELECT * INTO v_thread FROM threads WHERE id = p_thread_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'thread_not_found');
  END IF;

  IF v_thread.status != 'active' THEN
    RETURN jsonb_build_object('error', 'thread_not_active');
  END IF;

  IF p_sender_id != v_thread.user_a_id AND p_sender_id != v_thread.user_b_id THEN
    RETURN jsonb_build_object('error', 'not_participant');
  END IF;

  -- Determine other user
  v_other_id := CASE WHEN p_sender_id = v_thread.user_a_id
    THEN v_thread.user_b_id ELSE v_thread.user_a_id END;

  -- Check block (bidirectional)
  IF is_blocked(p_sender_id, v_other_id) THEN
    RETURN jsonb_build_object('error', 'blocked');
  END IF;

  -- Check shared school
  IF NOT shares_school(p_sender_id, v_other_id) THEN
    RETURN jsonb_build_object('error', 'no_shared_school');
  END IF;

  -- Check enforcement state
  IF (SELECT enforcement_state FROM users WHERE id = p_sender_id) != 'none' THEN
    RETURN jsonb_build_object('error', 'under_enforcement');
  END IF;

  -- Must have body or media
  IF p_body IS NULL AND p_media_url IS NULL THEN
    RETURN jsonb_build_object('error', 'empty_message');
  END IF;

  -- Insert message (use client-provided ID for optimistic pattern, or generate)
  INSERT INTO messages (id, thread_id, sender_id, body, media_url, reply_to_id)
  VALUES (
    COALESCE(p_message_id, gen_random_uuid()),
    p_thread_id, p_sender_id, p_body, p_media_url, p_reply_to_id
  )
  RETURNING id INTO v_msg_id;

  RETURN jsonb_build_object('success', true, 'message_id', v_msg_id);
END;
$$;
```

### GIPHY REST API Service
```typescript
// Source: GIPHY API docs (https://developers.giphy.com/docs/api/)
const GIPHY_API_KEY = process.env.EXPO_PUBLIC_GIPHY_API_KEY!;
const GIPHY_BASE = 'https://api.giphy.com/v1/gifs';

type GifResult = {
  readonly id: string;
  readonly url: string;        // Full-size GIF URL
  readonly previewUrl: string; // Small preview for grid
  readonly width: number;
  readonly height: number;
};

export async function searchGifs(
  query: string,
  offset = 0,
  limit = 20,
): Promise<{ data: readonly GifResult[] | null; error: string | null }> {
  try {
    const params = new URLSearchParams({
      api_key: GIPHY_API_KEY,
      q: query,
      limit: String(limit),
      offset: String(offset),
      rating: 'pg-13',
    });
    const res = await fetch(`${GIPHY_BASE}/search?${params}`);
    const json = await res.json();
    const gifs: readonly GifResult[] = json.data.map((g: any) => ({
      id: g.id,
      url: g.images.fixed_height.url,
      previewUrl: g.images.fixed_height_small.url,
      width: Number(g.images.fixed_height.width),
      height: Number(g.images.fixed_height.height),
    }));
    return { data: gifs, error: null };
  } catch (e) {
    return { data: null, error: (e as Error).message };
  }
}

export async function trendingGifs(
  offset = 0,
  limit = 20,
): Promise<{ data: readonly GifResult[] | null; error: string | null }> {
  try {
    const params = new URLSearchParams({
      api_key: GIPHY_API_KEY,
      limit: String(limit),
      offset: String(offset),
      rating: 'pg-13',
    });
    const res = await fetch(`${GIPHY_BASE}/trending?${params}`);
    const json = await res.json();
    const gifs: readonly GifResult[] = json.data.map((g: any) => ({
      id: g.id,
      url: g.images.fixed_height.url,
      previewUrl: g.images.fixed_height_small.url,
      width: Number(g.images.fixed_height.width),
      height: Number(g.images.fixed_height.height),
    }));
    return { data: gifs, error: null };
  } catch (e) {
    return { data: null, error: (e as Error).message };
  }
}
```

### Photo Upload for Chat
```typescript
// Reuses Phase 2 pattern: base64-arraybuffer upload to avoid RN 0-byte bug
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';

const MAX_WIDTH = 1200;
const COMPRESSION_QUALITY = 0.7;

export async function uploadChatPhoto(
  uri: string,
  threadId: string,
  userId: string,
): Promise<{ data: { url: string } | null; error: string | null }> {
  try {
    // Resize and compress
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_WIDTH } }],
      { compress: COMPRESSION_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Read as base64
    const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Upload to Supabase Storage
    const fileName = `${threadId}/${userId}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('chat-messages')
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      return { data: null, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage
      .from('chat-messages')
      .getPublicUrl(fileName);

    return { data: { url: urlData.publicUrl }, error: null };
  } catch (e) {
    return { data: null, error: (e as Error).message };
  }
}
```

### Block User from Chat
```typescript
// Uses existing unmatch_user RPC which handles block + thread status update
import { unmatchUser } from '@/services/match-service';

export async function blockFromChat(
  userId: string,
  otherUserId: string,
): Promise<{ success: boolean; error: string | null }> {
  // unmatchUser with blockToo=true:
  // 1. Sets match.unmatched_at
  // 2. Inserts into blocks table
  // 3. Thread status auto-changes via is_blocked()
  return unmatchUser(userId, otherUserId, true);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling for new messages | Supabase Realtime postgres_changes | Stable since supabase-js v2 (2023) | Sub-second message delivery, no polling overhead |
| react-native-gifted-chat for all chat UIs | Custom FlatList for branded/custom designs | Ongoing trend (2024-2025) | Better performance, full control over bubble design |
| GIPHY native SDK for all platforms | GIPHY REST API for Expo/managed workflow | 2024+ (SDK compatibility issues) | Simpler integration, no native build issues |
| Storing reactions as JSONB on message | Separate reactions table | Standard practice | Atomic operations, no race conditions, better queries |
| FlashList for chat | Inverted FlatList (standard) | FlashList v2 (2025) supports inverted but FlatList is still standard for chat | FlatList is proven stable for inverted chat lists; FlashList v2 is an option if performance issues arise |

**Deprecated/outdated:**
- Supabase Realtime v1 API (channel.on('INSERT', callback)) -- replaced by postgres_changes syntax
- react-native-gifted-chat v1.x with ListView -- migrated to FlatList in v2.x

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + jest-expo 52 + @testing-library/react-native 13 |
| Config file | package.json (jest key) |
| Quick run command | `npx jest --testPathPattern="chat\|message\|thread\|block\|report\|gif\|icebreaker" --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MSG-01 | Send/receive real-time text messages | unit + integration | `npx jest __tests__/services/message-service.test.ts __tests__/hooks/use-chat-messages.test.ts -x` | Wave 0 |
| MSG-02 | Message timestamps between groups | unit | `npx jest __tests__/components/chat/date-separator.test.ts -x` | Wave 0 |
| MSG-03 | Delivery indicators (sent/delivered) | unit | `npx jest __tests__/components/chat/delivery-indicator.test.ts -x` | Wave 0 |
| MSG-04 | React to messages with emoji | unit | `npx jest __tests__/services/message-service.test.ts __tests__/components/chat/message-reactions.test.ts -x` | Wave 0 |
| MSG-05 | Reply to specific messages | unit | `npx jest __tests__/components/chat/message-reply-preview.test.ts -x` | Wave 0 |
| MSG-06 | Send photos and GIFs | unit | `npx jest __tests__/services/gif-service.test.ts __tests__/components/chat/gif-search-panel.test.ts -x` | Wave 0 |
| MSG-07 | Block from chat | unit | `npx jest __tests__/services/block-service.test.ts -x` | Wave 0 |
| MSG-08 | Report from chat | unit | `npx jest __tests__/services/report-service.test.ts -x` | Wave 0 |
| MSG-09 | Icebreaker prompts | unit | `npx jest __tests__/components/chat/icebreaker-card.test.ts -x` | Wave 0 |
| MSG-10 | Server-side eligibility enforcement | unit (RPC mock) | `npx jest __tests__/services/message-service.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="chat|message|thread|block|report|gif|icebreaker" --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/services/message-service.test.ts` -- covers MSG-01, MSG-04, MSG-10
- [ ] `__tests__/services/thread-service.test.ts` -- covers thread listing
- [ ] `__tests__/services/gif-service.test.ts` -- covers MSG-06 (GIF)
- [ ] `__tests__/services/block-service.test.ts` -- covers MSG-07
- [ ] `__tests__/services/report-service.test.ts` -- covers MSG-08
- [ ] `__tests__/hooks/use-chat-messages.test.ts` -- covers MSG-01 realtime
- [ ] `__tests__/hooks/use-message-actions.test.ts` -- covers MSG-04, MSG-05
- [ ] `__tests__/hooks/use-gif-search.test.ts` -- covers MSG-06
- [ ] `__tests__/components/chat/message-bubble.test.tsx` -- covers bubble rendering
- [ ] `__tests__/components/chat/message-list.test.tsx` -- covers MSG-02 grouping
- [ ] `__tests__/components/chat/message-composer.test.tsx` -- covers input/send
- [ ] `__tests__/components/chat/message-reactions.test.tsx` -- covers MSG-04 UI
- [ ] `__tests__/components/chat/message-reply-preview.test.tsx` -- covers MSG-05 UI
- [ ] `__tests__/components/chat/icebreaker-card.test.tsx` -- covers MSG-09
- [ ] `__tests__/components/chat/gif-search-panel.test.tsx` -- covers MSG-06 UI
- [ ] `__tests__/components/chat/delivery-indicator.test.tsx` -- covers MSG-03
- [ ] `__tests__/components/chat/date-separator.test.tsx` -- covers MSG-02
- [ ] `__tests__/components/chat/chat-header.test.tsx` -- covers header + overflow menu
- [ ] `__tests__/components/chat/message-long-press.test.tsx` -- covers long-press menu

## Open Questions

1. **Supabase Storage bucket for chat photos**
   - What we know: The `chat-messages` bucket needs to be created. Public URLs are needed for inline display.
   - What's unclear: Whether to use public or private bucket with signed URLs. Public is simpler but exposes URLs. Private adds complexity but better security.
   - Recommendation: Use public bucket with non-guessable paths (`threadId/userId/timestamp.jpg`). Chat photos between matched users don't require the same privacy level as profile photos since both users consent to the conversation.

2. **Delivery status updates (delivered_at)**
   - What we know: `delivered_at` column exists on messages. "Delivered" means the recipient's device received it.
   - What's unclear: How to reliably detect "delivered" -- when the recipient's Realtime subscription receives the message? Or when they open the thread?
   - Recommendation: Set `delivered_at` when the recipient's client receives the message via Realtime subscription. The recipient's `use-chat-messages` hook can fire an update on the message's `delivered_at` when it processes a new incoming message. Read receipts are deferred (Phase 9 / v2).

3. **GIPHY API key management**
   - What we know: GIPHY free tier requires an API key. We use `.env` with `EXPO_PUBLIC_` prefix for Expo.
   - What's unclear: Whether to proxy through Supabase Edge Function to keep key server-side, or use client-side key (GIPHY allows client-side keys in their ToS).
   - Recommendation: Use `EXPO_PUBLIC_GIPHY_API_KEY` directly. GIPHY's free tier API keys are designed for client-side use and have built-in rate limiting. A proxy adds latency for no security benefit since GIPHY keys aren't sensitive (they're domain-restricted, not secret).

4. **Thread list screen scope**
   - What we know: The `messages` tab needs to show a list of conversations.
   - What's unclear: Whether to build a full thread list in this phase or a minimal one.
   - Recommendation: Build a functional thread list showing: avatar, name, last message preview, unread indicator, timestamp. This is needed for the messaging experience to be usable. The Likes tab (Phase 6) will show a separate "Matches" list.

## Sources

### Primary (HIGH confidence)
- Supabase Realtime postgres_changes docs: https://supabase.com/docs/guides/realtime/postgres-changes
- Supabase Realtime authorization: https://supabase.com/docs/guides/realtime/authorization
- GIPHY API docs: https://developers.giphy.com/docs/api/
- Expo ImagePicker docs: https://docs.expo.dev/versions/latest/sdk/imagepicker/
- Expo ImageManipulator docs: https://docs.expo.dev/versions/latest/sdk/imagemanipulator/

### Secondary (MEDIUM confidence)
- FlashList v2 engineering blog (for maintainVisibleContentPosition context): https://shopify.engineering/flashlist-v2
- GIPHY React Native SDK compatibility issues: https://github.com/Giphy/giphy-react-native-sdk/issues/163

### Tertiary (LOW confidence)
- react-native-gifted-chat performance discussions: https://github.com/FaridSafi/react-native-gifted-chat/issues/2371

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all core libraries already installed; only expo-clipboard is new
- Architecture: HIGH - patterns follow established project conventions (service layer, hooks, components)
- Realtime messaging: HIGH - Supabase Realtime postgres_changes is well-documented and the project already uses supabase-js
- GIPHY integration: MEDIUM - REST API approach is straightforward but SDK compatibility claims based on GitHub issues
- Pitfalls: HIGH - identified from official docs (publication requirement) and project history (base64 upload pattern)

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable stack, no fast-moving dependencies)
