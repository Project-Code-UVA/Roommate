---
name: maestro
description: Create, run, and manage Maestro mobile E2E tests for Room app flows
argument-hint: "<action> [flow-name]  — actions: run, create, list, debug"
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
Maestro E2E testing skill for the Room mobile app. Manages test creation, execution, and debugging.

Actions:
- `run [flow]` — Run a specific flow or all flows. Default: all.
- `create <flow-name>` — Create a new Maestro test flow.
- `list` — List all existing Maestro flows with descriptions.
- `debug <flow>` — Run a flow with `--debug-output` and analyze failures.

If no action is provided, default to `list`.
</objective>

<context>
## Room App — Maestro Testing Reference

### Setup
- **Config:** `.maestro/config.yaml` — appId: `host.exp.Exponent` (Expo Go)
- **Run all:** `maestro test .maestro/`
- **Run one:** `maestro test .maestro/<flow>.yaml`
- **Debug:** `maestro test .maestro/<flow>.yaml --debug-output ./maestro-debug`

### App Launch Boilerplate (REQUIRED for every flow)
Every flow MUST start with this Expo Go launch sequence:

```yaml
appId: host.exp.Exponent
---
# <Flow description>

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
```

After the boilerplate, wait for the expected screen:
- **Authenticated flows:** `extendedWaitUntil` visible "COMPATIBLE" (Discovery) or tab text, timeout 30000
- **Unauthenticated flows:** `extendedWaitUntil` visible "Find your perfect roommate", timeout 30000

### Dismiss Overlays (add when needed)
```yaml
# Dismiss swipe tutorial if present
- tapOn:
    text: "Tap to continue"
    optional: true
- waitForAnimationToEnd
```

### Navigation Patterns

**Tab navigation** — use accessibility labels:
```yaml
- tapOn:
    text: "Discovery, tab.*"    # Center tab (primary)
- tapOn:
    text: "Explore, tab.*"      # Tab 1
- tapOn:
    text: "Likes, tab.*"        # Tab 2
- tapOn:
    text: "Messages, tab.*"     # Tab 3
- tapOn:
    text: "Profile, tab.*"      # Tab 4
```

**Back navigation:**
```yaml
- tapOn:
    id: "step-back"             # Onboarding back button
- tapOn:
    id: "chat-header-back"      # Chat back button
```

### Test IDs by Screen

**Welcome:**
- `welcome-get-started` — Get Started button
- `welcome-sign-in` — Sign in link

**Onboarding:**
- `birthday-continue` — Birthday continue button
- `phone-input` — Phone text input
- `phone-send-code` — Send Code button
- `otp-digit-0` through `otp-digit-5` — OTP digit boxes
- `name-input` — Name text input
- `name-continue` — Name continue button
- `gender-option-man`, `gender-option-woman`, `gender-option-nonbinary`, `gender-option-more` — Gender options
- `gender-continue` — Gender continue button
- `step-back` — Back button (all onboarding steps)

**Discovery:**
- `action-dismiss` — X/dismiss button
- `action-like` — Heart/like button

**Match Modal:**
- `match-send-message` — Send a Message button
- `match-keep-swiping` — Keep Swiping button

**Messages / Chat:**
- `messages-title` — Messages screen title
- `chat-header-back` — Chat back button
- `chat-header-overflow` — Chat overflow menu (3-dot)
- `composer-camera-btn` — Camera button in composer
- `composer-gif-btn` — GIF button in composer

**Other Tabs:**
- `explore-title`, `likes-title`, `profile-title` — Tab screen titles
- `dev-sign-out` — Dev-only sign out button (Profile tab)

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
| Explore | id: `explore-title` |
| Messages | id: `messages-title` |
| Profile | id: `profile-title` |

### Helper Flows
- `.maestro/helpers/login-as-jeff.yaml` — Logs in as Jeff dev account (phone: 7575323390, any OTP)
- `.maestro/helpers/ensure-signed-out.yaml` — Signs out if authenticated

**Run helper before a flow:**
```bash
maestro test .maestro/helpers/login-as-jeff.yaml && maestro test .maestro/<flow>.yaml
```

### Dev Account Login
- Phone: `7575323390` → maps to `dev-7575323390@room-dev.local`
- Any 6-digit OTP works in dev mode
- Input OTP one digit at a time for reliability:
```yaml
- tapOn:
    id: "otp-digit-0"
- inputText: "1"
- inputText: "2"
- inputText: "3"
- inputText: "4"
- inputText: "5"
- inputText: "6"
```

### Phone Keyboard Dismissal
iOS phone-pad has no Done button. Dismiss by tapping above keyboard:
```yaml
- tapOn:
    point: "50%,45%"
- waitForAnimationToEnd
```

### Best Practices
1. Use `optional: true` for elements that may not appear (modals, popups, conditional UI)
2. Use `extendedWaitUntil` with `timeout: 30000` for initial app load (Expo Go bundle is slow)
3. Use `timeout: 10000` for screen transitions within the app
4. Add `waitForAnimationToEnd` after every navigation/tap that triggers animation
5. Take screenshots at key verification points: `- takeScreenshot: <descriptive_name>`
6. Always add comments explaining what each section tests
7. Use `point: "x%,y%"` for tapping elements without testIDs (e.g., thread rows)
8. Group related assertions under section comments (e.g., `# --- THREAD LIST ---`)
</context>

<instructions>
## Action: `run`
1. If a specific flow name is given, run `maestro test .maestro/<flow>.yaml`
2. If no flow specified, run `maestro test .maestro/`
3. Report results — pass/fail per flow, screenshot locations

## Action: `create`
1. Ask the user what the flow should test (or infer from flow name)
2. Create the yaml file at `.maestro/<flow-name>.yaml`
3. Follow ALL conventions from the context above:
   - Start with Expo Go launch boilerplate
   - Use correct testIDs from the reference table
   - Use correct screen assertions
   - Add screenshots at key points
   - Add comments for each section
   - Use `optional: true` for conditional elements
4. If the flow requires authentication, add overlay dismissal steps
5. If the flow requires signed-out state, note the prerequisite in comments

## Action: `list`
1. Glob for `.maestro/**/*.yaml`
2. Read the comment/description from each file (first few lines after `---`)
3. Present as a table: flow name, description, prerequisites

## Action: `debug`
1. Run the flow with `--debug-output ./maestro-debug`
2. Read the debug output to identify failure point
3. Suggest fixes (missing testIDs, timing issues, wrong selectors)
4. Offer to apply the fix

## Creating New Test IDs
If a flow needs a testID that doesn't exist in the app code:
1. Identify the component file
2. Add `testID="<id>"` to the appropriate element
3. Follow the naming convention: `<screen>-<element>` (e.g., `discovery-card`, `chat-send-btn`)
4. Update the test flow to use the new ID
</instructions>
