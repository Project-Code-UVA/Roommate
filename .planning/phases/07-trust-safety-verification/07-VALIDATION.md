---
phase: 7
slug: trust-safety-verification
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest (existing) |
| **Config file** | jest.config.js (or Wave 0 creates) |
| **Quick run command** | `npx jest --testPathPattern=__tests__/07` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=__tests__/07`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | SAFE-01 | integration | `npx jest --testPathPattern=school-gating` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | SAFE-02 | integration | `npx jest --testPathPattern=block` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | SAFE-03 | unit | `npx jest --testPathPattern=report` | ❌ W0 | ⬜ pending |
| 07-01-04 | 01 | 1 | SAFE-04 | integration | `npx jest --testPathPattern=enforcement` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 2 | SAFE-05 | unit | `npx jest --testPathPattern=block-rpc` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 2 | SAFE-06 | unit | `npx jest --testPathPattern=selfie` | ❌ W0 | ⬜ pending |
| 07-02-03 | 02 | 2 | AUTH-07 | unit | `npx jest --testPathPattern=verified-badge` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/07/school-gating.test.ts` — stubs for SAFE-01 (shared-school server enforcement)
- [ ] `__tests__/07/block.test.ts` — stubs for SAFE-02 (block cross-surface)
- [ ] `__tests__/07/report.test.ts` — stubs for SAFE-03 (8-category reporting)
- [ ] `__tests__/07/enforcement.test.ts` — stubs for SAFE-04 (enforcement escalation)
- [ ] `__tests__/07/block-rpc.test.ts` — stubs for SAFE-05 (standalone block RPC)
- [ ] `__tests__/07/selfie.test.ts` — stubs for SAFE-06 (selfie verification upload)
- [ ] `__tests__/07/verified-badge.test.ts` — stubs for AUTH-07 (verified badge display)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Selfie capture camera flow | SAFE-06 | Camera hardware required | Open app on device, go to Settings > Verify Identity, complete selfie capture flow |
| Enforcement warning modal on app open | SAFE-04 | Requires active enforcement state | Manually set enforcement_state='warning' in DB, relaunch app |
| Permanent ban screen on login | SAFE-04 | Requires permanent_ban state | Manually set enforcement_state='permanent_ban', attempt login |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
