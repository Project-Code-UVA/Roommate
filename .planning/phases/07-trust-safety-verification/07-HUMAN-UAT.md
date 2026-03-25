---
status: partial
phase: 07-trust-safety-verification
source: [07-VERIFICATION.md]
started: 2026-03-24T21:00:00Z
updated: 2026-03-24T21:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Block flow on Discovery swipe card
expected: Tapping '...' menu, selecting Block, confirming dialog removes card from deck immediately (optimistic removal via onBlock callback to parent). Blocking from expanded profile sheet also dismisses sheet and removes profile.
result: [pending]

### 2. Warning modal on app open for warned user
expected: User with enforcement_state='warning' sees 'Community Guidelines Warning' modal on next app launch, must tap 'I Understand' to proceed to the app normally.
result: [pending]

### 3. Permanent ban gate on login
expected: User with enforcement_state='permanent_ban' sees BanScreen with no tabs, only 'Sign Out' available — cannot access any app content.
result: [pending]

### 4. DM ban error surfacing in chat
expected: User with dm_ban_48h state sees 'Messaging Restricted' EnforcementModal with restriction date when attempting to send text, photo, or GIF in the chat screen.
result: [pending]

### 5. Selfie capture and upload
expected: Tapping 'Verify Now' on profile banner opens front-facing camera, captures selfie, shows Retake/Use Photo options, uploads on 'Use Photo', sets selfie_verified=true and verified badge appears.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
