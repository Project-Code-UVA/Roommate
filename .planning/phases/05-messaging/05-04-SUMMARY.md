---
phase: 05-messaging
plan: 04
subsystem: screens
tags: [react-native, chat, thread-list, messaging, navigation, match-modal]

requires:
  - phase: 05-messaging-02
    provides: "Chat UI components (MessageList, MessageComposer, IcebreakerCard)"
  - phase: 05-messaging-03
    provides: "Interaction components (LongPress, GifPanel, PhotoPreview, ChatHeader)"
provides:
  - "Thread list screen with avatars, names, last messages, timestamps, unread badges"
  - "Chat screen with full messaging experience (real-time, reactions, replies, media)"
  - "Match modal Send a Message navigation to chat"
  - "Tab badge for unread message count"
affects: []

tech-stack:
  added: []
  patterns:
    - "FlatList with pull-to-refresh for thread list"
    - "KeyboardAvoidingView for chat screen"
    - "useLocalSearchParams for threadId + other user context"
    - "Relative timestamp formatting (2m, 1h, Yesterday)"

decisions:
  - "Pass otherUser context via search params to avoid extra fetch on chat open"
  - "Icebreaker dismissed state stored in AsyncStorage per thread"
  - "Block from chat navigates back to thread list after confirmation"
  - "Union-type FlatList data (message | date separator) for timestamp groups"

commits:
  - hash: 6b54034
    message: "feat(05-04): thread list screen and chat screen assembly"
  - hash: de25cf8
    message: "feat(05-04): wire match modal Send a Message to chat screen"
  - hash: 441fedf
    message: "fix(05): thread list shows real names/messages, icebreaker orientation, tab badge"
---

## What Was Built

Screen assembly plan: wired all services, hooks, and components from plans 05-01 through 05-03 into two working screens plus navigation integration.

### Thread List (messages.tsx)
- FlatList of conversations with avatar, display name, last message preview (truncated), relative timestamp, unread badge
- Pull-to-refresh, empty state with illustration
- Tapping thread navigates to chat screen with user context in params

### Chat Screen (chat/[threadId].tsx)
- Full messaging experience: ChatHeader, MessageList, MessageComposer
- Icebreaker card on empty conversations with prompt selection
- Long-press menu for reactions and actions (reply, copy, delete, report)
- GIF panel with GIPHY search
- Photo preview with caption before sending
- Block/report from header overflow menu
- KeyboardAvoidingView for iOS keyboard handling

### Navigation Wiring
- Match modal "Send a Message" routes to chat with thread ID from like result
- Tab badge shows total unread count from thread service
- Messages tab accessible from tab bar

### Bug Fixes Applied
- Thread list now shows real display names (was showing "Unknown")
- Icebreaker card orientation corrected (was rendering upside down)
- Tab badge count properly computed from thread unread totals
