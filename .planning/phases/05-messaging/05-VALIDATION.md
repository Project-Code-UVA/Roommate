---
phase: 5
slug: messaging
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + jest-expo 52 + @testing-library/react-native 13 |
| **Config file** | package.json (jest key) |
| **Quick run command** | `npx jest --testPathPattern="chat\|message\|thread\|block\|report\|gif\|icebreaker" --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="chat|message|thread|block|report|gif|icebreaker" --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | MSG-01 | unit + integration | `npx jest __tests__/services/message-service.test.ts __tests__/hooks/use-chat-messages.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | MSG-02 | unit | `npx jest __tests__/components/chat/date-separator.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | MSG-03 | unit | `npx jest __tests__/components/chat/delivery-indicator.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-01-04 | 01 | 1 | MSG-04 | unit | `npx jest __tests__/services/message-service.test.ts __tests__/components/chat/message-reactions.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-01-05 | 01 | 1 | MSG-05 | unit | `npx jest __tests__/components/chat/message-reply-preview.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-01-06 | 01 | 1 | MSG-06 | unit | `npx jest __tests__/services/gif-service.test.ts __tests__/components/chat/gif-search-panel.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-01-07 | 01 | 1 | MSG-07 | unit | `npx jest __tests__/services/block-service.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-01-08 | 01 | 1 | MSG-08 | unit | `npx jest __tests__/services/report-service.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-01-09 | 01 | 1 | MSG-09 | unit | `npx jest __tests__/components/chat/icebreaker-card.test.tsx -x` | ❌ W0 | ⬜ pending |
| 05-01-10 | 01 | 1 | MSG-10 | unit (RPC mock) | `npx jest __tests__/services/message-service.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/services/message-service.test.ts` — stubs for MSG-01, MSG-04, MSG-10
- [ ] `__tests__/services/thread-service.test.ts` — stubs for thread listing
- [ ] `__tests__/services/gif-service.test.ts` — stubs for MSG-06 (GIF)
- [ ] `__tests__/services/block-service.test.ts` — stubs for MSG-07
- [ ] `__tests__/services/report-service.test.ts` — stubs for MSG-08
- [ ] `__tests__/hooks/use-chat-messages.test.ts` — stubs for MSG-01 realtime
- [ ] `__tests__/hooks/use-message-actions.test.ts` — stubs for MSG-04, MSG-05
- [ ] `__tests__/hooks/use-gif-search.test.ts` — stubs for MSG-06
- [ ] `__tests__/components/chat/message-bubble.test.tsx` — stubs for bubble rendering
- [ ] `__tests__/components/chat/message-list.test.tsx` — stubs for MSG-02 grouping
- [ ] `__tests__/components/chat/message-composer.test.tsx` — stubs for input/send
- [ ] `__tests__/components/chat/message-reactions.test.tsx` — stubs for MSG-04 UI
- [ ] `__tests__/components/chat/message-reply-preview.test.tsx` — stubs for MSG-05 UI
- [ ] `__tests__/components/chat/icebreaker-card.test.tsx` — stubs for MSG-09
- [ ] `__tests__/components/chat/gif-search-panel.test.tsx` — stubs for MSG-06 UI
- [ ] `__tests__/components/chat/delivery-indicator.test.tsx` — stubs for MSG-03
- [ ] `__tests__/components/chat/date-separator.test.tsx` — stubs for MSG-02
- [ ] `__tests__/components/chat/chat-header.test.tsx` — stubs for header + overflow menu
- [ ] `__tests__/components/chat/message-long-press.test.tsx` — stubs for long-press menu

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-time message delivery | MSG-01 | Requires two devices/simulators | Send message on Device A, verify appears on Device B within 2s |
| Photo attachment upload | MSG-06 | Camera/gallery picker is native | Select photo, verify upload, verify display in chat |
| Push notification on new message | MSG-01 | Push requires physical device | Send message to backgrounded user, verify notification |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
