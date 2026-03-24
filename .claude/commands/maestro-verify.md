---
name: maestro-verify
description: Verify a GSD phase by auto-generating and running Maestro E2E tests against its UAT criteria
argument-hint: "<phase-number>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
---
<objective>
Automatically verify a completed GSD phase using Maestro E2E tests. Reads the phase's UAT criteria, maps them to existing Maestro flows, generates new flows for uncovered criteria, runs all relevant flows, and reports pass/fail per UAT test case.
</objective>

<instructions>

## Input
The user provides a phase number (e.g., `5`, `04`). Normalize to zero-padded two digits (e.g., `05`).

## Step 1: Load UAT Criteria

1. Glob for `.planning/phases/**/0${N}-UAT.md` or `.planning/phases/**/${NN}-UAT.md`
2. Parse the `## Tests` section to extract each numbered test case:
   - Test number
   - Test name
   - Expected behavior description
3. Report: "Found {X} UAT test cases for phase {N}"

## Step 2: Inventory Existing Maestro Flows

1. Glob `.maestro/**/*.yaml`
2. Read each flow's header comment to understand what it covers
3. Build a map: `flow name → what it tests`

## Step 3: Map UAT Criteria to Flows

For each UAT test case, determine:

- **`coverable`** — Can Maestro verify this? (UI-visible elements, navigation, screen presence = YES. Server-side logic, data persistence, edge cases needing specific DB state = NO)
- **`covered`** — Is there an existing flow that tests this?
- **`flow`** — Which existing flow covers it (if any)

Classify each UAT test into one of:
1. **COVERED** — Existing flow tests this criterion
2. **UNCOVERED** — No flow exists but Maestro CAN verify it
3. **NOT_AUTOMATABLE** — Requires manual verification (server-side, data, complex state setup)

Present the mapping as a table:

```
| # | UAT Test | Status | Flow / Reason |
|---|----------|--------|---------------|
| 1 | Thread List Screen | COVERED | messaging.yaml |
| 4 | Send a Message | UNCOVERED | — |
| 11 | Delivery Indicators | NOT_AUTOMATABLE | Requires real message delivery |
```

## Step 4: Generate Missing Flows

For each UNCOVERED test case:

1. Create a new Maestro flow at `.maestro/verify-{phase}-{kebab-test-name}.yaml`
2. Follow ALL conventions from the maestro skill context (below)
3. If multiple UNCOVERED tests are closely related (same screen/flow), combine them into a single flow file

**If new testIDs are needed:**
1. Find the component file
2. Add `testID="<id>"` to the appropriate element
3. Follow naming convention: `<screen>-<element>`
4. List all testID additions for the user

## Step 5: Run All Relevant Flows

1. Collect all flows that map to this phase (existing + newly created)
2. Run each: `maestro test .maestro/<flow>.yaml`
3. Capture pass/fail result per flow

## Step 6: Report Results

Present a final UAT verification report:

```
## Phase {N} — Maestro Verification Report

### Results
| # | UAT Test | Verdict | Flow | Notes |
|---|----------|---------|------|-------|
| 1 | Thread List | PASS | messaging.yaml | — |
| 4 | Send Message | FAIL | verify-05-send-message.yaml | composer-send-btn not found |
| 11 | Delivery Indicators | SKIPPED | — | Not automatable |

### Summary
- Total: 12
- Passed: 7
- Failed: 2
- Skipped: 3 (not automatable)

### Failures
[For each failure, include the error output and suggested fix]

### Screenshots
[List screenshot files generated during the run]
```

## Step 7: Update UAT File

For each test case that PASSED, update the UAT file:
- Change `result: [pending]` → `result: PASS (maestro — {flow-name}.yaml)`

For FAILED tests:
- Change `result: [pending]` → `result: FAIL (maestro — {flow-name}.yaml: {brief reason})`

For NOT_AUTOMATABLE:
- Leave as `[pending]` — these need manual or `/gsd:verify-work` verification

</instructions>

<context>
## Maestro Conventions Reference

### App Launch Boilerplate (REQUIRED for every flow)
```yaml
appId: host.exp.Exponent
---
# <Flow description>
# PRE-REQUISITE: <state needed>

# Launch Expo Go and open Room
- launchApp
- waitForAnimationToEnd
- tapOn:
    text: "Room"
    index: 0
    optional: true
- waitForAnimationToEnd

# Dismiss Expo dev tools popup if present
- tapOn:
    text: "Continue"
    optional: true
- waitForAnimationToEnd

# Dismiss swipe tutorial if present
- tapOn:
    text: "Tap to continue"
    optional: true
- waitForAnimationToEnd
```

### Wait for Screen Load
- Authenticated (Discovery): `extendedWaitUntil` visible `"COMPATIBLE"`, timeout 30000
- Unauthenticated (Welcome): `extendedWaitUntil` visible `"Find your perfect roommate"`, timeout 30000
- Screen transitions within app: timeout 10000

### Tab Navigation (accessibility labels)
```yaml
- tapOn:
    text: "Discovery, tab.*"
- tapOn:
    text: "Explore, tab.*"
- tapOn:
    text: "Likes, tab.*"
- tapOn:
    text: "Messages, tab.*"
- tapOn:
    text: "Profile, tab.*"
```

### Test IDs by Screen

**Welcome:** `welcome-get-started`, `welcome-sign-in`

**Onboarding:**
- `birthday-continue`, `phone-input`, `phone-send-code`
- `otp-digit-0` through `otp-digit-5`
- `name-input`, `name-continue`
- `gender-option-man`, `gender-option-woman`, `gender-option-nonbinary`, `gender-option-more`, `gender-continue`
- `step-back`

**Discovery:** `action-dismiss`, `action-like`

**Match Modal:** `match-send-message`, `match-keep-swiping`

**Chat:** `chat-header-back`, `chat-header-overflow`, `composer-camera-btn`, `composer-gif-btn`

**Tab Titles:** `explore-title`, `likes-title`, `messages-title`, `profile-title`

**Dev:** `dev-sign-out`

### Screen Assertions
| Screen | Assert |
|--------|--------|
| Welcome | `"Find your perfect roommate"` |
| Birthday | `"When's your birthday?"` |
| Phone | `"What's your phone number?"` |
| OTP | `"Enter verification code"` |
| Name | `"What's your first name?"` |
| Gender | `"What's your gender?"` |
| School | `"Where do you go to school?"` |
| Discovery | `"COMPATIBLE"` |

### Phone Keyboard Dismissal
```yaml
- tapOn:
    point: "50%,45%"
- waitForAnimationToEnd
```

### Dev Account Login
Phone: `7575323390`, any 6-digit OTP. Input digits one at a time.

### Helper Flows
- `.maestro/helpers/login-as-jeff.yaml` — Login as dev account
- `.maestro/helpers/ensure-signed-out.yaml` — Sign out

### Best Practices
1. `optional: true` for conditional UI (modals, popups)
2. `extendedWaitUntil` with 30s timeout for initial load, 10s for transitions
3. `waitForAnimationToEnd` after every navigation tap
4. Screenshots at key points: `- takeScreenshot: verify_{phase}_{test_name}`
5. Comments explaining each section
6. `point: "x%,y%"` for elements without testIDs
7. Combine related tests into single flows when they share setup
</context>
