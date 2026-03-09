---
phase: 4
slug: swipe-ui-match-experience
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + jest-expo ~52.0.6 |
| **Config file** | `package.json` (jest section) |
| **Quick run command** | `npx jest --testPathPattern="discovery\|match\|swipe" --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="discovery\|match\|swipe" --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-00-01 | 00 | 0 | DISC-01, DISC-02, DISC-03, MTCH-02, MTCH-03 | stub | `npx jest __tests__/hooks/use-discovery-stack.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-00-02 | 00 | 0 | DISC-04 | stub | `npx jest __tests__/components/photo-indicator.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-00-03 | 00 | 0 | MTCH-02 | stub | `npx jest __tests__/components/match-modal.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-01-01 | 01 | 1 | DISC-01, DISC-02, DISC-04 | unit | `npx jest __tests__/hooks/use-discovery-stack.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | DISC-03 | unit | `npx jest __tests__/hooks/use-discovery-stack.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | MTCH-02, MTCH-03 | unit | `npx jest __tests__/components/match-modal.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/hooks/use-discovery-stack.test.ts` — stubs for DISC-01, DISC-02, DISC-03, MTCH-02, MTCH-03
- [ ] `__tests__/components/photo-indicator.test.ts` — stubs for DISC-04
- [ ] `__tests__/components/match-modal.test.ts` — stubs for MTCH-02
- [ ] Mock `react-native-reanimated` for Jest
- [ ] Mock `expo-haptics` for Jest
- [ ] Install `@testing-library/react-native` for component rendering tests

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 60fps swipe animation | DISC-01 | Performance can only be verified on-device | Swipe cards on physical device, check for jank |
| Confetti visual quality | MTCH-02 | Visual fidelity is subjective | Trigger match, observe confetti animation |
| Haptic feedback on match | MTCH-02 | Hardware-dependent | Trigger match on physical device, feel haptic |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
