---
phase: 02
slug: auth-onboarding
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-05
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + jest-expo 52 |
| **Config file** | package.json `jest` section (preset: jest-expo) |
| **Quick run command** | `npx jest --testPathPattern=auth --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=auth --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | AUTH-01 | unit | `npx jest __tests__/services/auth-service.test.ts -t "age" --no-coverage` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | AUTH-02 | unit | `npx jest __tests__/services/auth-service.test.ts -t "otp" --no-coverage` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | AUTH-06 | unit | `npx jest __tests__/services/auth-service.test.ts -t "onboarding" --no-coverage` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | AUTH-08 | unit | `npx jest __tests__/hooks/use-onboarding.test.ts --no-coverage` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | AUTH-03 | unit | `npx jest __tests__/services/photo-service.test.ts --no-coverage` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | AUTH-04 | unit | `npx jest __tests__/services/school-service.test.ts --no-coverage` | ❌ W0 | ⬜ pending |
| 02-03-03 | 03 | 2 | AUTH-05 | unit | `npx jest __tests__/services/profile-service.test.ts --no-coverage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/services/auth-service.test.ts` — stubs for AUTH-01, AUTH-02, AUTH-06
- [ ] `__tests__/services/photo-service.test.ts` — stubs for AUTH-03
- [ ] `__tests__/services/school-service.test.ts` — stubs for AUTH-04
- [ ] `__tests__/services/profile-service.test.ts` — stubs for AUTH-05
- [ ] `__tests__/hooks/use-onboarding.test.ts` — stubs for AUTH-08
- [ ] `__tests__/setup.ts` — shared test setup (Supabase mock, AsyncStorage mock)
- [ ] Migration: `onboarding_completed` on `users`, `gender` + `show_gender` on `profiles`
- [ ] Supabase Storage bucket `photos` creation + policies
- [ ] Install: `npx expo install expo-image-picker expo-image-manipulator expo-file-system && npm install base64-arraybuffer`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Scroll wheel date picker UX | AUTH-01 | Native picker visual/interaction | Verify iOS spinner display mode renders scroll wheel |
| OTP SMS delivery | AUTH-02 | Requires real SMS provider | Send OTP to test phone, verify receipt |
| Photo camera/gallery source | AUTH-03 | Device hardware required | Test camera and gallery picker on physical device |
| Drag-to-reorder photos | AUTH-03 | Gesture interaction | Long-press and drag photos, verify reorder persists |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
