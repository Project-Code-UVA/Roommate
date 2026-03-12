# Phase 5: Messaging - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Matched users can communicate in real-time with rich messaging features and in-chat safety controls. This phase builds the chat UI, real-time message delivery, reactions, reply threading, media/GIF sharing, icebreaker prompts, and block/report from chat. Backend infrastructure (threads table, messages table, match creation with auto-thread) exists from Phase 3. "Send a Message" navigation from match modal stubbed in Phase 4. Explore, Likes, and notifications are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Chat UI & Bubble Style
- iMessage-style rounded bubbles with tails on the last message in a cluster
- Sender bubbles on right in purple/violet (matches app palette from constants.ts), receiver on left in gray
- Timestamps shown between message groups (not on every message)
- Chat header: small circular avatar + display name only (no online/last active status). Tapping header opens profile bottom sheet (reuse Phase 4 pattern)

### Delivery Indicators
- WhatsApp-style checkmarks: single check = sent, double check = delivered, blue double check = read
- Shown on sender's messages only

### Icebreaker Prompts
- Floating dismissible card in the center of empty chat area
- 3 prompts shown initially with a "More" button to cycle through additional suggestions
- Mix of roommate-specific prompts ("What's your ideal weekend morning?", "Are you a thermostat fighter?") and general social prompts ("What's your favorite show right now?")
- Tapping a prompt fills the composer with it
- Card dismissible with X button; doesn't come back once dismissed
- Card disappears naturally when first message is sent

### Media & Photo Sharing
- Camera icon in composer opens action sheet: "Take Photo" or "Choose from Library"
- After selecting photo, optional caption text field appears before sending
- Photos render as rounded rectangles inline with message flow (same bubble width constraints)
- Tap photo to open full-screen viewer with pinch-to-zoom

### GIF Integration
- GIF button in composer opens GIPHY-powered search panel above keyboard
- Search bar + trending grid layout
- Tap GIF to send immediately
- GIFs render inline like photos (rounded rectangle)

### Reactions
- Long-press a message shows row of 6 quick emojis + '+' to open full emoji picker
- Multiple reactions per user allowed on the same message
- Reactions display as small pills below the message bubble with counts

### Reply Threading
- Both swipe-right gesture AND long-press menu "Reply" option to initiate reply
- Inline quote preview of original message shown above the reply bubble (WhatsApp/Telegram pattern)
- Tapping the quote scrolls to the original message

### Long-Press Message Menu
- Reaction row at top
- Action buttons below: Reply, Copy text, Delete for me, Report message
- "Delete for me" removes message from your view only (stays for the other person)

### Block & Report from Chat
- Accessible from chat header overflow menu (...) or long-press on individual messages
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

</decisions>

<specifics>
## Specific Ideas

- iMessage feel for bubbles but with Room's purple brand color — familiar yet branded
- WhatsApp checkmark pattern for delivery — universally understood by Gen Z
- Icebreaker card should feel helpful, not forced — dismissible X respects user autonomy, "More" button encourages engagement
- Roommate-specific icebreakers differentiate Room from dating apps ("Are you a thermostat fighter?" vs "What's your sign?")
- Swipe-right to reply + long-press menu "Reply" — two discovery paths for the same action, accommodates different user habits
- Multiple reactions per user keeps the expressive range open for playful 1:1 conversations

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `threads` table: id, match_id, user_a_id, user_b_id, status (active/unmatched/blocked) — thread infrastructure ready
- `messages` table: id, thread_id, sender_id, body, media_url, delivered_at, read_at — base message schema exists
- `match-service.ts`: `likeProfile()` returns `{ is_match, match_id, thread_id }` — thread_id available for navigation
- `is_blocked()` function: bidirectional block check, reuse for chat eligibility
- `shares_school()` function: school gating for messaging eligibility
- `react-native-reanimated` + `react-native-gesture-handler`: swipe-to-reply gesture, reaction animations
- `expo-haptics`: feedback on reactions and message send
- Phase 4 profile bottom sheet: reuse for chat header profile tap
- `src/lib/supabase.ts`: Supabase client ready (no Realtime wired yet)
- `src/lib/constants.ts`: COLORS with purple/violet palette for bubble colors

### Established Patterns
- Service layer: `src/services/` returning `{ data?, error }` — no exceptions
- NativeWind/Tailwind for styling
- Expo Router file-based routing
- Immutable state updates
- Optimistic UI pattern (Phase 4: remove card immediately, fire API async)

### Integration Points
- `app/(tabs)/index.tsx`: Match modal "Send a Message" navigates to chat (currently stubbed)
- Phase 4 swipe-up gesture: stubbed for message composer (to be wired)
- `threads` table RLS policies: need verification for chat access
- `messages` table: needs `reply_to_id` column (FK to messages.id) for threading
- `messages` table or separate table: needs reactions storage
- Supabase Realtime: channel subscription for new messages per thread
- Supabase Storage: photo uploads from chat (bucket may need creation)

</code_context>

<deferred>
## Deferred Ideas

- Read receipts as paid feature — Phase 9 (Monetization) or v2
- Online/last active status indicator — could add later to chat header
- Video calling between matches — v2 (SOCL-03)
- Typing indicators — nice to have, could add in polish pass
- Message search — future enhancement

</deferred>

---

*Phase: 05-messaging*
*Context gathered: 2026-03-11*
