# QA Test Report — Room App

**Date:** 2026-03-12
**Tool:** Maestro CLI v2.3.0
**App:** Room (Expo managed, React Native)
**Device:** iPhone 16e - iOS 26.2 (Simulator)
**Result: 7/7 flows passed in 61 seconds**

---

## Flows Executed

| Flow | File | Duration | Result | What It Tests |
|------|------|----------|--------|---------------|
| smoke | `smoke.yaml` | 6s | PASS | App launch, discovery screen renders, action buttons visible |
| browse | `browse.yaml` | 12s | PASS | All 5 tabs navigate correctly, content renders on each |
| discovery | `discovery.yaml` | 21s | PASS | Profile card, scroll, dismiss action, like action |
| profile | `profile.yaml` | 9s | PASS | Profile and Messages tab screens render |
| onboarding | `onboarding.yaml` | 5s | PASS | App launch (auth screens documented, need logout to test) |
| login | `login.yaml` | 4s | PASS | App launch (login path documented, need logout to test) |
| signup | `signup.yaml` | 4s | PASS | App launch (signup path documented, need logout to test) |

---

## Screens Verified

| Screen | Route | Verified By | Status |
|--------|-------|-------------|--------|
| Discovery | `/(tabs)/index` | smoke, browse, discovery | Tested: profile cards, action buttons |
| Explore | `/(tabs)/explore` | browse | Tested: title renders, "Coming Soon" |
| Likes | `/(tabs)/likes` | browse | Tested: title renders, "Coming Soon" |
| Messages | `/(tabs)/messages` | browse, profile | Tested: title renders |
| Profile | `/(tabs)/profile` | browse, profile | Tested: title renders, "Coming Soon" |
| Welcome | `/welcome` | — | Needs unauthenticated state |
| Birthday | `/(auth)/birthday` | — | Needs unauthenticated state |
| Phone | `/(auth)/phone` | — | Needs unauthenticated state |
| OTP Verify | `/(auth)/verify-otp` | — | Blocked by real OTP |
| Name | `/(auth)/name` | — | Blocked by auth wall |
| Gender | `/(auth)/gender` | — | Blocked by auth wall |
| School | `/(auth)/school` | — | Blocked by auth wall |
| Photos | `/(auth)/photos` | — | Blocked by auth wall |
| Bio | `/(auth)/bio` | — | Blocked by auth wall |
| Chat | `/chat/[threadId]` | — | Needs thread to navigate to |

---

## testIDs Added (this session)

| Component | testID | File |
|-----------|--------|------|
| Welcome logo | `welcome-logo` | `app/welcome.tsx` |
| Get Started button | `welcome-get-started` | `app/welcome.tsx` |
| Sign In link | `welcome-sign-in` | `app/welcome.tsx` |
| Birthday continue | `birthday-continue` | `app/(auth)/birthday.tsx` |
| Phone input | `phone-input` | `app/(auth)/phone.tsx` |
| Send Code button | `phone-send-code` | `app/(auth)/phone.tsx` |
| OTP digits 0-5 | `otp-digit-{0..5}` | `src/components/onboarding/otp-input.tsx` |
| OTP resend | `otp-resend` | `app/(auth)/verify-otp.tsx` |
| Name input | `name-input` | `app/(auth)/name.tsx` |
| Name continue | `name-continue` | `app/(auth)/name.tsx` |
| Gender options | `gender-option-{man,woman,non-binary,more}` | `app/(auth)/gender.tsx` |
| Gender custom input | `gender-custom-input` | `app/(auth)/gender.tsx` |
| Gender continue | `gender-continue` | `app/(auth)/gender.tsx` |
| School continue | `school-continue` | `app/(auth)/school.tsx` |
| Photos continue | `photos-continue` | `app/(auth)/photos.tsx` |
| Bio input | `bio-input` | `app/(auth)/bio.tsx` |
| Bio complete | `bio-complete` | `app/(auth)/bio.tsx` |
| Step back button | `step-back` | `src/components/onboarding/step-container.tsx` |
| Discovery screen | `discovery-screen` | `app/(tabs)/index.tsx` |
| Discovery empty | `discovery-empty` | `app/(tabs)/index.tsx` |
| Explore title | `explore-title` | `app/(tabs)/explore.tsx` |
| Likes title | `likes-title` | `app/(tabs)/likes.tsx` |
| Profile title | `profile-title` | `app/(tabs)/profile.tsx` |
| Messages title | `messages-title` | `app/(tabs)/messages.tsx` |
| Match send message | `match-send-message` | `src/components/match/match-modal.tsx` |
| Match keep swiping | `match-keep-swiping` | `src/components/match/match-modal.tsx` |

### Pre-existing testIDs (already in codebase)

| testID | File |
|--------|------|
| `action-dismiss` | `src/components/discovery/floating-actions.tsx` |
| `action-like` | `src/components/discovery/floating-actions.tsx` |
| `thread-{id}` | `app/(tabs)/messages.tsx` |
| `chat-header-back` | `src/components/chat/chat-header.tsx` |
| `chat-header-profile` | `src/components/chat/chat-header.tsx` |
| `chat-header-overflow` | `src/components/chat/chat-header.tsx` |
| `composer-send-btn` | `src/components/chat/message-composer.tsx` |
| `composer-camera-btn` | `src/components/chat/message-composer.tsx` |
| `composer-gif-btn` | `src/components/chat/message-composer.tsx` |
| `report-{category}` | `app/chat/[threadId].tsx` |

---

## Key Findings

### Maestro + Expo Go quirk

Maestro launches Expo Go, which shows a project list — not the app directly. Flows must tap the "Room" entry to open the app. For production, building a custom dev client with `npx expo prebuild` would let Maestro use a dedicated bundle ID.

### Tab bar selectors

React Navigation tab labels are rendered as accessibility text (e.g., "Explore, tab, 1 of 5") and must be matched with regex patterns like `"Explore, tab.*"` in Maestro.

---

## Recommendations

### To unlock onboarding/auth flow testing

1. **Add dev-only test OTP bypass**: Set `EXPO_PUBLIC_TEST_OTP=123456` that auto-verifies in dev mode. This unblocks testing of all 9 onboarding screens.

2. **Add a sign-out button** (or deep link) so Maestro can reset to unauthenticated state and test the welcome/signup flows.

3. **Seed test accounts**: Create a Supabase script that generates a test user with completed onboarding for clean test runs.

### To improve test coverage

4. **Add testIDs to SchoolSearch** results and chips for school selection testing.
5. **Add testIDs to PhotoGrid** slots for photo upload testing.
6. **Build a custom dev client** to avoid the Expo Go project picker step.

### To run in CI

7. Use `maestro cloud` or GitHub Actions with `xcrun simctl` for automated PR testing.
8. Use `maestro test --analyze` for AI-powered visual regression detection.
