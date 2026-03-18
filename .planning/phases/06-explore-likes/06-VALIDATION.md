---
phase: 6
slug: explore-likes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + jest-expo + @testing-library/react-native |
| **Config file** | `package.json` jest section |
| **Quick run command** | `npx jest --testPathPattern="explore\|likes" --bail` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="explore\|likes" --bail`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | EXPL-02 | unit | `npx jest __tests__/services/explore-service.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | EXPL-03 | unit | `npx jest __tests__/services/explore-service.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | LIKE-01 | unit | `npx jest __tests__/services/likes-service.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-04 | 01 | 1 | LIKE-03 | unit | `npx jest __tests__/services/likes-service.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-05 | 01 | 1 | LIKE-04 | unit | `npx jest __tests__/services/likes-service.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 1 | EXPL-01 | unit | `npx jest __tests__/components/explore/explore-grid-card.test.tsx` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 1 | EXPL-04 | unit | `npx jest __tests__/hooks/use-explore-feed.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-03 | 02 | 1 | EXPL-05 | unit | `npx jest __tests__/hooks/use-explore-feed.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-04 | 02 | 1 | LIKE-01 | unit | `npx jest __tests__/components/likes/my-likes-card.test.tsx` | ❌ W0 | ⬜ pending |
| 06-02-05 | 02 | 1 | LIKE-02 | unit | `npx jest __tests__/components/likes/matches-row.test.tsx` | ❌ W0 | ⬜ pending |
| 06-02-06 | 02 | 1 | LIKE-03 | unit | `npx jest __tests__/components/likes/liked-me-card.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/services/explore-service.test.ts` — stubs for EXPL-02, EXPL-03
- [ ] `__tests__/services/likes-service.test.ts` — stubs for LIKE-01, LIKE-03, LIKE-04
- [ ] `__tests__/hooks/use-explore-feed.test.ts` — stubs for EXPL-01, EXPL-04, EXPL-05
- [ ] `__tests__/hooks/use-likes.test.ts` — stubs for LIKE-01, LIKE-02
- [ ] `__tests__/components/explore/explore-grid-card.test.tsx` — stubs for EXPL-01
- [ ] `__tests__/components/explore/explore-profile-view.test.tsx` — stubs for EXPL-04
- [ ] `__tests__/components/likes/liked-me-card.test.tsx` — stubs for LIKE-03, LIKE-04
- [ ] `__tests__/components/likes/matches-row.test.tsx` — stubs for LIKE-02
- [ ] `__tests__/components/likes/my-likes-card.test.tsx` — stubs for LIKE-01
- [ ] `__tests__/components/likes/upgrade-banner.test.tsx` — stubs for LIKE-03

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Blur effect visual quality | LIKE-03 | expo-blur visual rendering | Open Likes tab as free user, verify blur intensity on Liked Me grid |
| Pull-to-refresh shuffles feed | EXPL-01 | Randomized ordering changes | Pull to refresh Explore, verify grid order changes |
| Grid layout responsiveness | EXPL-01 | Visual layout across screen sizes | Check grid on different device sizes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
