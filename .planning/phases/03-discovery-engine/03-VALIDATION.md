---
phase: 3
slug: discovery-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 via jest-expo ~52.0.6 |
| **Config file** | package.json (jest key) |
| **Quick run command** | `npx jest --testPathPattern="discovery\|match\|filter" --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="discovery\|match\|filter" --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-XX | 01 | 1 | DISC-05 | unit | `npx jest __tests__/services/discovery-service.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-01-XX | 01 | 1 | DISC-08 | unit | `npx jest __tests__/services/discovery-service.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-01-XX | 01 | 1 | DISC-09 | unit | `npx jest __tests__/services/discovery-service.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-01-XX | 01 | 1 | DISC-10 | unit | `npx jest __tests__/services/discovery-service.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-01-XX | 01 | 1 | DISC-06 | unit | `npx jest __tests__/services/filter-service.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-01-XX | 01 | 1 | DISC-07 | unit | `npx jest __tests__/services/filter-service.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-02-XX | 02 | 2 | MTCH-01 | unit | `npx jest __tests__/services/match-service.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-02-XX | 02 | 2 | MTCH-04 | unit | `npx jest __tests__/services/match-service.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/services/discovery-service.test.ts` — stubs for DISC-05, DISC-08, DISC-09, DISC-10
- [ ] `__tests__/services/filter-service.test.ts` — stubs for DISC-06, DISC-07
- [ ] `__tests__/services/match-service.test.ts` — stubs for MTCH-01, MTCH-04
- [ ] Mock extensions in `__tests__/setup.ts` — `rpc` mock needs per-test override patterns for RPC return values

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Swipe gestures feel responsive | DISC-05 | UX/haptic feedback | Swipe left/right on Discovery, verify animations and feedback |
| Empty state displays correctly | DISC-10 | Visual verification | Remove all matching profiles, verify empty state UI |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
