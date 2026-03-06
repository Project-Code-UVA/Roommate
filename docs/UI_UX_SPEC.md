# Room — UI / UX Specification
## Version 1.0 — iOS First (Apple HIG Compliant)
Status: Design System Specification for Engineering & Figma

---

# 1. Design Principles

Room’s interface must feel:

- Native to iOS
- Gesture-first
- Clean and trust-forward
- Emotionally safe
- Modern but restrained
- Familiar without copying Tinder directly

Primary inspirations:

- Tinder (card mechanics)
- Instagram (profile layout + messaging)
- Apple Human Interface Guidelines (HIG)

Room is not flashy or chaotic.  
It is confident, structured, and serious.

---

# 2. Platform Standards (Apple HIG Compliance)

## 2.1 Minimum Touch Targets

- Minimum tappable area: **44pt x 44pt**
- Primary CTA buttons: 48–56pt height
- Floating icons must include invisible padding if visually smaller

No tappable control may violate 44pt minimum.

---

## 2.2 Safe Area

- Respect top notch + bottom home indicator
- No interactive element within 16pt of screen edge
- Swipe gestures must not conflict with system gestures

---

## 2.3 Typography

Use San Francisco (System Font).

Type Scale:

- Large Title: 34pt
- Title 1: 28pt
- Title 2: 22pt
- Headline: 17pt (Semibold)
- Body: 17pt
- Subheadline: 15pt
- Caption: 13pt

Avoid custom fonts at launch.

---

# 3. Spacing System

Use an 8pt grid system only.

Spacing increments:

- 8pt
- 16pt
- 24pt
- 32pt
- 40pt
- 48pt

No arbitrary spacing values.

---

# 4. Color System

## 4.1 Primary Brand Color

One primary accent color (to be defined in design system).

Used for:

- Primary CTAs
- Like icon
- Verification badge
- Active states
- Segmented controls (selected)

## 4.2 Neutral Palette

- Background: #FFFFFF (Light Mode)
- Primary text: #111111
- Secondary text: #6B6B6B
- Divider: #E5E5E5

## 4.3 Destructive Color

Use iOS System Red for:

- Block
- Report
- Delete account

Must meet WCAG AA contrast.

---

# 5. Navigation Structure

Bottom Tab Bar (iOS native style):

1. Discovery
2. Explore
3. Likes
4. Messages
5. Profile

Icons must:

- Use SF Symbols where possible
- Have active/inactive states
- Respect safe area insets

---

# 6. Discovery (Roommate Mode)

## 6.1 Layout

- Full-screen swipe card stack
- Card occupies ~92% of screen height
- 8pt margin left/right
- 16pt top margin
- 24pt corner radius

---

## 6.2 Card Composition

Top section:
- Full image photo carousel

Overlay bottom 30%:
- Gradient fade for readability
- Name (Title 2)
- Age
- School capsule tag
- Year (Subheadline)

Lower card area:
- Bio snippet (2–3 lines)
- Compatibility highlights (icons or tags)

---

## 6.3 Gestures

Swipe Left:
- Dismiss
- 300ms animation
- Slight tilt rotation
- Subtle haptic feedback

Swipe Right:
- Like
- Subtle haptic feedback
- Confirmation animation

Swipe Up:
- Open message composer (modal slide-up)

Tap Left/Right:
- Navigate photos
- No lag or animation stutter

---

## 6.4 Physics

- Velocity-based threshold
- Elastic drag behavior
- Smooth snap-back animation
- 250–300ms ease-in-out transitions
- Spring damping for swipe return

---

# 7. Messaging UI

## 7.1 Layout

Header:
- Profile photo (40pt)
- Name
- 3-dot menu (Block / Report)

Chat body:
- Sent messages right-aligned
- Received messages left-aligned
- 16pt horizontal padding
- 8pt vertical spacing between bubbles

Composer:
- Fixed to bottom
- Minimum height 44pt
- Rounded input field
- Attachment icon
- Send button

---

## 7.2 Message Bubbles

- 18pt corner radius
- Sent: Primary brand color
- Received: Light gray background
- Timestamps grouped (not on every message)

---

# 8. Explore (Friends Mode)

## 8.1 Layout

- Vertical scroll feed
- Card-based layout
- Same visual language as Discovery

Top-right:
- Filter icon (minimum 44pt touch target)

No search bar at launch.

---

# 9. Likes Screen

Top:
- Segmented control toggle:
  - My Likes
  - Liked Me

Grid layout:
- 3-column layout
- 8pt spacing between cards
- 16pt screen margin

Free users:
- Blurred grid
- Clear "Upgrade to See Who Liked You" label

Paid users:
- Full visibility

Blur must clearly indicate locked state without deception.

---

# 10. Profile Screen

Top:
- Full-width hero image
- Name + age
- School
- Verification badge

Below:
- Bio
- Prompts
- Mode toggle (segmented control)

Scrollable section:
- “Nitty Gritty” details
- Organized into sections

Edit button in top-right.

---

# 11. Mode Toggle (Roommate / Friends / Found Roommate)

- Segmented control style
- Clear visual differentiation
- Smooth animation when switching
- Immediate state feedback

---

# 12. Ads Placement

Ads must:

- Be visually distinct
- Include “Sponsored” label
- Never mimic user cards

Allowed placements:

- Approx every 10 cards in Discovery
- Between Explore sections
- Likes footer

Never allowed:

- During swipe decision moment
- Inside message composer
- Between card and action buttons

---

# 13. Motion & Transitions

Principles:

- Fast but smooth
- Natural physics
- Never jarring

Standard durations:

- 200–300ms for transitions
- Spring animation for swipe physics
- Slide-up modal presentation
- Swipe-down modal dismissal

---

# 14. Haptics

Subtle haptic feedback for:

- Like action
- Message sent
- Verification completion

Avoid excessive vibration.

---

# 15. Accessibility

- Minimum 44pt touch targets
- Dynamic Type support
- VoiceOver labels for:
  - Swipe actions
  - Mode toggle
  - Verification badge
  - Block / Report
- WCAG AA color contrast compliance

---

# 16. Empty States

Must be:

- Calm
- Clear
- Trust-forward

Examples:

- “No more profiles right now.”
- “You’re all caught up.”

No sarcasm or meme humor.

---

# 17. Error States

- Inline validation messages
- Toast confirmations for minor actions
- Full-screen state for account restriction
- Clear messaging for enforcement states

---

# 18. Design Tone

Room must communicate:

- Safety
- Structure
- Intent
- Seriousness

Not:

- Over-gamified
- Chaotic
- Meme-driven
- Flippant

---

# Final Design Standard

If a UI decision conflicts with:

- Apple Human Interface Guidelines
- Accessibility standards
- Trust & safety principles

The compliant and safer option must be chosen.

Room prioritizes trust over virality.
