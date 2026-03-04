# Feature Landscape

**Domain:** Roommate-first swipe discovery app for college students (18+)
**Researched:** 2026-03-03
**Confidence:** MEDIUM (based on training data knowledge of Tinder, Bumble, Hinge, RoomSync, Roomi, Dibs; web verification unavailable)

## Competitive Context

The roommate matching space sits at the intersection of two product categories:

1. **Swipe-based social discovery** (Tinder, Bumble, Hinge) -- mature UX patterns, high user expectations for polish
2. **Roommate-specific platforms** (RoomSync, Roomi, Dibs, Facebook housing groups) -- functional but generally low-polish, form-based matching

Room's bet is applying category 1's UX to category 2's use case, with school-gating as the trust boundary. This means users will judge Room against Tinder/Bumble polish levels, not against clunky roommate questionnaire sites.

---

## Table Stakes

Features users expect. Missing any of these and the product feels broken or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Swipe-based discovery (left/right) | Core interaction model; users trained by Tinder/Bumble | Medium | Animation quality matters -- janky swipes kill perceived quality |
| Mutual matching before messaging | Standard consent model; users expect this from dating apps | Medium | Atomic match creation, race condition handling required |
| Photo carousel on profiles (3+ photos) | Users judge roommates visually; single photo feels sketchy | Low | Tap-to-advance, loop at end. Lazy loading for performance |
| Profile with bio and basics | Minimum viable identity; users need something to evaluate | Low | Name, age, school, year, bio, photos |
| Real-time messaging | Users expect instant delivery after matching | High | WebSocket/Realtime infra, delivery indicators, message ordering |
| Push notifications | Users miss matches and messages without them; engagement dies | Medium | Match alerts, new messages, likes (if paid). Must not spam |
| Phone OTP verification | Trust signal; expected for any app handling personal connections | Medium | Prevents fake accounts, spam. SMS provider integration |
| School selection and gating | Core value prop -- users want to find people at THEIR school | Medium | Server-enforced. Multi-school support needed |
| Block and report | Safety minimum; app stores require this for social apps | Medium | Full visibility removal, thread cleanup. App Store rejection risk without it |
| Age gate (18+) | Legal requirement; COPPA/age-appropriate design codes | Low | Birthdate collection, server-side validation, no workarounds |
| Profile editing | Users need to update photos, bio, preferences over time | Low | Must not break existing matches or visibility |
| Unmatching | Users need an exit from conversations they regret | Low | Thread deletion, permanent removal from re-matching |
| Delivery indicators (sent/delivered) | Baseline messaging expectation post-iMessage/WhatsApp era | Medium | Requires presence/delivery tracking infra |
| Empty state handling | New users at small schools will see "no more profiles" quickly | Low | Critical for retention -- "Check back later" with explanation |
| Onboarding flow | Users need guided setup; drop-off without it is extreme | Medium | Progressive disclosure: age -> phone -> photos -> school -> preferences |

---

## Differentiators

Features that set Room apart from both swipe apps and roommate platforms. Not expected, but create competitive advantage.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Roommate-specific preference filters | Sleep schedule, cleanliness, guests, smoking, budget, partying -- things Tinder never asks | Medium | Preferences vs dealbreakers distinction is key. Dealbreakers are hard filters, preferences are soft signals |
| Dual-mode Discovery + Explore | Swipe for roommates (Discovery) AND browse for friends (Explore) in one app | High | Two distinct surfaces with different UX patterns. Grid browse vs swipe stack |
| Mode status (looking/found/friends) | Users signal intent; "found roommate" removes from stack gracefully | Low | Prevents dead profiles from clogging Discovery. Retention play for Explore |
| Explore ranking algorithm | Weighted scoring (completeness, activity, verification, interactions, freshness) beats chronological | Medium | Tunable weights. Avoids popularity-only ranking that kills new user experience |
| Selfie verification with badge | Trust signal beyond phone verification; differentiates from Facebook groups | High | Liveness detection, photo comparison. Can use third-party API (Jumio, Onfido) |
| Save/bookmark separate from like | Users can bookmark profiles to revisit without triggering a like | Low | Unique to roommate context -- "interested but not ready to commit" |
| Icebreaker prompts in chat | Reduces "hey" messages; helps awkward first conversations | Low | Pre-written prompts like "What's your ideal weekend?" or "Early bird or night owl?" |
| Liked Me (paid reveal) | Monetization that creates genuine value -- see who already likes you | Medium | Blurred grid for free users, full reveal for paid. Proven model from Tinder Gold |
| Profile boost (paid) | Temporary ranking increase in Discovery and Explore | Medium | Time-limited (e.g., 30 min). Revenue driver that also helps engagement |
| Reactions on messages | Quick responses (emoji reactions) on individual messages | Low | Lightweight engagement. Standard in modern chat (iMessage, Slack) |
| Reply threading | Quote-reply to specific messages in a conversation | Low | Important when conversations get long. Keeps context clear |
| Media in chat (photos, GIFs) | Share room photos, living situations, memes | Medium | Need content moderation pipeline for safety. GIPHY integration |
| Ads gated by engagement | Ads appear only after 10 swipes or first match -- respects new user experience | Low | Configuration-driven thresholds. Prevents day-one ad fatigue |
| Enforcement escalation system | Graduated response (warning -> DM ban -> suspension -> permaban) | Medium | More nuanced than binary ban. Gives users a chance to correct behavior |

---

## Anti-Features

Features to explicitly NOT build. These either violate the product vision, create safety problems, or are engineering traps.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Cold messaging (DMs without match) | Enables harassment, spam, unsolicited contact. Violates mutual consent model | Require mutual match. Period. No "super messages" that bypass matching |
| Global/cross-school browsing | Destroys trust boundary. Users want school-specific communities, not a global feed | Enforce shared-school gating server-side. No "nearby" or "explore all" modes |
| AI compatibility scoring (v1) | Unproven, opaque, and users distrust algorithmic roommate decisions. Manual preferences are more transparent | Let users set their own filters and dealbreakers. AI can come later with data |
| Housing listings/marketplace | Different product entirely. Splits focus, different liability model | Stay roommate-PEOPLE focused. Link out to housing resources if needed |
| Dorm planning tools | Feature creep. Room assignments happen through universities, not apps | Focus on finding the person, not managing the logistics |
| Live GPS/location tracking | Privacy nightmare. College students do not want to be tracked | User-entered hometown (optional). School affiliation is the location signal |
| Read receipts (free tier) | Creates social pressure and anxiety. Known problem in dating apps | Delivery indicators only for free. Read receipts as future paid feature |
| Super likes / priority likes | Creates pay-to-win dynamics that erode trust. Feels desperate | Standard like is sufficient. Boost handles "be seen more" use case |
| Swipe-up-to-message | Removed in PRD v2.0. Bypasses mutual consent model | Removed. Swipe right to like, match first, then message |
| Algorithmic match suggestions ("You should match with...") | Pushy, presumptuous. Let users discover organically | Present profiles; let users decide. Ranking algorithm handles ordering |
| Social media login (Facebook/Instagram) | Privacy concerns, data sharing anxiety, Facebook fatigue among Gen Z | Phone OTP is the trust anchor. Clean, independent identity |
| Profile visitors / "who viewed me" | Creates stalking anxiety. Users browse freely when they know nobody is watching | No view tracking. Likes are the only signal, and they are private until reciprocated |
| Disappearing messages | Enables harassment with no evidence trail. Undermines safety reporting | All messages persistent and reportable. Safety over ephemerality |
| Video calling (v1) | High complexity, moderate value at roommate-discovery stage. Users have iMessage/FaceTime | Focus on text chat. Users will exchange numbers naturally after matching |

---

## Feature Dependencies

```
Phone OTP Verification
  -> Profile Creation (photos, bio, school)
    -> Discovery Stack (swipe left/right/save)
      -> Like System
        -> Mutual Match Creation
          -> Match Modal
          -> Messaging Thread (auto-created)
            -> Chat Features (reactions, replies, media, icebreakers)
    -> Explore Grid Browse
      -> Like System (shared dependency)

School Selection
  -> Shared-School Gating (server-side)
    -> Discovery Visibility
    -> Explore Visibility
    -> Match Eligibility
    -> Messaging Eligibility

Block/Report System
  -> Visibility Removal (Discovery, Explore, Likes, Messages)
  -> Enforcement Engine (warning -> ban -> suspend -> permaban)

Selfie Verification (optional, parallel)
  -> Verified Badge
  -> Explore Ranking Boost

Monetization (parallel, can launch after core)
  -> Liked Me Reveal (blurred -> full)
  -> Advanced Filters
  -> Profile Boost
  -> Ads Integration (gated by engagement thresholds)

Filters & Preferences
  -> Dealbreakers (hard filter on Discovery stack)
  -> Preferences (soft signal, no hard filter)

Mode Status
  -> Discovery Stack Removal (when "found roommate" or "looking for friends")
```

---

## MVP Recommendation

### Must Ship (Phase 1 -- Core Loop)

1. **Onboarding** -- age gate, phone OTP, photos, school selection, basic profile
2. **Discovery swipe stack** -- left/right/save with photo carousel
3. **Mutual matching** -- like system, match modal, auto-thread creation
4. **Messaging** -- real-time text chat, delivery indicators, block, report
5. **Shared-school gating** -- server-enforced, the entire trust model depends on it
6. **Push notifications** -- match alerts, new messages

This is the minimum viable product. Without any one of these, the core loop is broken.

### Ship Soon After (Phase 2 -- Retention and Trust)

7. **Roommate preference filters** -- sleep, cleanliness, budget, etc. with dealbreakers
8. **Explore tab** -- grid browse with ranking algorithm
9. **Likes tab** -- My Likes, blurred Liked Me, Matches list
10. **Mode status** -- looking for roommate / friends / found roommate
11. **Selfie verification** -- verified badge, ranking boost
12. **Chat enhancements** -- reactions, reply threading, media, icebreakers

### Ship Later (Phase 3 -- Monetization)

13. **Liked Me reveal** (paid)
14. **Advanced filters** (paid)
15. **Profile boost** (paid)
16. **Ads integration** -- gated by engagement thresholds

### Defer Indefinitely

- AI compatibility scoring
- Housing listings
- Cross-school browsing
- Video calling
- Dorm planning tools

**Rationale:** The core swipe-match-message loop must work flawlessly before adding secondary features. Roommate filters are the primary differentiator but the app is usable without them in a "Tinder for roommates" minimum form. Monetization requires an engaged user base to generate revenue, so it ships last.

---

## Competitive Feature Matrix

| Feature | Tinder | Bumble | Hinge | RoomSync | Roomi | Room (Planned) |
|---------|--------|--------|-------|----------|-------|----------------|
| Swipe discovery | Yes | Yes | Yes | No | No | Yes |
| Mutual matching | Yes | Yes | Yes | Algorithm | Quiz | Yes |
| School gating | No | No | No | University | No | Yes (server) |
| Roommate filters | No | No | No | Questionnaire | Basic | Yes (rich) |
| Verified profiles | Paid | Yes | No | University | ID check | Yes (selfie) |
| Grid browse | No | No | No | No | Yes | Yes (Explore) |
| Dual mode (roommate + friends) | No | BFF mode | No | No | No | Yes |
| Free messaging after match | Yes | Yes | Yes | Limited | Limited | Yes |
| 18+ enforcement | Terms only | Terms only | Terms only | University | ID check | Birthdate + server |
| Report system | Yes | Yes | Yes | Basic | Basic | Yes (graduated) |
| Ads | Yes | Yes | No | No | Yes | Yes (gated) |
| Paid tier | Yes | Yes | Yes | No | Yes | Yes |

---

## Sources

- Training data knowledge of Tinder, Bumble, Hinge feature sets (MEDIUM confidence -- well-established products with stable feature sets)
- Training data knowledge of RoomSync and Roomi (LOW confidence -- smaller products that may have changed significantly)
- Room PRD v2.0 (`docs/PRD.md`) and PROJECT.md (HIGH confidence -- authoritative project documents)
- General swipe-app UX patterns from industry knowledge (MEDIUM confidence)

**Note:** Web search and fetch tools were unavailable during this research session. Competitor feature details for RoomSync, Roomi, and Dibs should be verified with live research before finalizing the roadmap. The competitive matrix may have gaps for smaller players.
