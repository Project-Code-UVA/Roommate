# Requirements: Room

**Defined:** 2026-03-03
**Core Value:** Users can discover and match with compatible roommates at their school through a trust-verified, consent-driven swipe experience

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [x] **FOUND-01**: Project scaffold with Expo Development Build, Supabase client, and navigation structure
- [x] **FOUND-02**: Database schema aligned with PRD v2.0 (matches, likes, dismissals, saves tables)
- [x] **FOUND-03**: Row Level Security policies for shared-school gating on all user-facing tables
- [x] **FOUND-04**: Shared block-check Postgres function referenced by all visibility queries

### Authentication

- [x] **AUTH-01**: User can create account with birthdate (18+ enforced server-side)
- [x] **AUTH-02**: User can verify phone number via OTP
- [x] **AUTH-03**: User can upload minimum 3 photos during onboarding
- [x] **AUTH-04**: User can select at least one school during onboarding
- [x] **AUTH-05**: User can complete required profile fields (name, year, bio)
- [x] **AUTH-06**: User who fails verification requirements cannot appear in Discovery, Explore, or message
- [x] **AUTH-07**: User can complete selfie verification for verified badge
- [x] **AUTH-08**: Progressive onboarding flow (age -> phone -> photos -> school -> profile -> selfie)

### Discovery

- [x] **DISC-01**: User can swipe left to dismiss profiles
- [x] **DISC-02**: User can swipe right to like profiles
- [x] **DISC-03**: User can save/bookmark profiles (separate from like)
- [x] **DISC-04**: User can tap photo zones to navigate carousel (loops at end)
- [x] **DISC-05**: User sees only profiles from shared schools (server-enforced)
- [x] **DISC-06**: User can set roommate preference filters (sleep, cleanliness, guests, smoking, budget, partying)
- [x] **DISC-07**: User can mark filters as preferences vs dealbreakers
- [x] **DISC-08**: User can set mode status (looking for roommate / found roommate)
- [x] **DISC-09**: User with "found roommate" status is removed from Discovery stack
- [x] **DISC-10**: User sees appropriate empty state when no more profiles available

### Matching

- [x] **MTCH-01**: Match is created atomically when both users have liked each other
- [x] **MTCH-02**: User sees "It's a Match" modal when match occurs
- [x] **MTCH-03**: Messaging thread is auto-created upon match
- [x] **MTCH-04**: User can unmatch, permanently removing thread and preventing re-matching

### Messaging

- [x] **MSG-01**: User can send and receive real-time text messages with matches
- [x] **MSG-02**: User can see message timestamps
- [x] **MSG-03**: User can see delivery indicators (sent/delivered)
- [x] **MSG-04**: User can react to messages with emoji
- [x] **MSG-05**: User can reply to specific messages (threading)
- [x] **MSG-06**: User can send photos and GIFs in chat
- [x] **MSG-07**: User can block from chat (full visibility removal)
- [x] **MSG-08**: User can report from chat
- [x] **MSG-09**: User sees icebreaker prompt suggestions on new match
- [x] **MSG-10**: Messaging eligibility enforced server-side (mutual match + shared school + no enforcement + no block)

### Explore

- [x] **EXPL-01**: User can browse grid of profiles from shared schools
- [x] **EXPL-02**: Profiles ranked by weighted algorithm (30% completeness, 25% activity, 20% verification, 15% interactions, 10% freshness)
- [x] **EXPL-03**: Ranking weights are configurable server-side
- [x] **EXPL-04**: User can like and save profiles from Explore
- [x] **EXPL-05**: Matching rules identical to Discovery

### Likes

- [x] **LIKE-01**: User can view My Likes list
- [x] **LIKE-02**: User can view Matches list with last message preview and unread indicator
- [x] **LIKE-03**: Free users see blurred Liked Me grid
- [x] **LIKE-04**: Paid users see full Liked Me with identity revealed

### Trust & Safety

- [x] **SAFE-01**: Shared-school gating enforced server-side on all visibility queries
- [x] **SAFE-02**: Block hides user from Discovery, Explore, Likes, and Messages (server-enforced)
- [x] **SAFE-03**: Report system with 8 categories (harassment, sexual content, hate speech, spam, impersonation, underage, safety threat, other)
- [x] **SAFE-04**: Enforcement escalation (warning -> 48hr DM ban -> 7-day suspension -> permanent ban)
- [x] **SAFE-05**: Enforcement state checked before allowing new conversations
- [x] **SAFE-06**: Under-18 accounts blocked at signup, "Underage" report category available

### Monetization

- [ ] **PAID-01**: User can purchase subscription to reveal who liked them
- [ ] **PAID-02**: User can purchase advanced filters
- [ ] **PAID-03**: User can purchase profile boost (temporary ranking increase)
- [ ] **PAID-04**: Ads appear approximately every 10 cards in Discovery
- [ ] **PAID-05**: Ads appear in Explore feed and Likes footer
- [ ] **PAID-06**: Ads gated: not shown before 10 swipes OR first match
- [ ] **PAID-07**: Ads never shown during swipe decision moment or message composer
- [ ] **PAID-08**: Ads clearly labeled "Sponsored"

### Notifications

- [ ] **NOTF-01**: User receives push notification on new match
- [ ] **NOTF-02**: User receives push notification on new message

### Data & Privacy

- [ ] **PRIV-01**: No live GPS tracking; hometown optional and user-entered
- [ ] **PRIV-02**: Account deletion: immediate deactivation, hard deletion within 30 days
- [ ] **PRIV-03**: Reports retained for safety compliance beyond deletion window

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Social

- **SOCL-01**: "Looking for friends" mode status
- **SOCL-02**: Read receipts (paid feature)
- **SOCL-03**: Video calling between matches

### Intelligence

- **INTL-01**: AI compatibility scoring
- **INTL-02**: Algorithmic match suggestions

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Housing marketplace / listings | Different product entirely, different liability model |
| Dorm planning tools | Room assignments handled by universities |
| Cross-school unrestricted browsing | Violates school-bound trust model |
| Cold messaging / DMs without match | Violates mutual consent model |
| Live GPS tracking | Privacy nightmare for college students |
| Social media login | Privacy concerns, Facebook fatigue among Gen Z |
| Super likes / priority likes | Creates pay-to-win dynamics that erode trust |
| Disappearing messages | Enables harassment with no evidence trail |
| Profile visitors / "who viewed me" | Creates stalking anxiety |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| AUTH-01 | Phase 2 | Complete |
| AUTH-02 | Phase 2 | Complete |
| AUTH-03 | Phase 2 | Complete |
| AUTH-04 | Phase 2 | Complete |
| AUTH-05 | Phase 2 | Complete |
| AUTH-06 | Phase 2 | Complete |
| AUTH-07 | Phase 7 | Complete |
| AUTH-08 | Phase 2 | Complete |
| DISC-01 | Phase 4 | Complete |
| DISC-02 | Phase 4 | Complete |
| DISC-03 | Phase 4 | Complete |
| DISC-04 | Phase 4 | Complete |
| DISC-05 | Phase 3 | Complete |
| DISC-06 | Phase 3 | Complete |
| DISC-07 | Phase 3 | Complete |
| DISC-08 | Phase 3 | Complete |
| DISC-09 | Phase 3 | Complete |
| DISC-10 | Phase 3 | Complete |
| MTCH-01 | Phase 3 | Complete |
| MTCH-02 | Phase 4 | Complete |
| MTCH-03 | Phase 4 | Complete |
| MTCH-04 | Phase 3 | Complete |
| MSG-01 | Phase 5 | Complete |
| MSG-02 | Phase 5 | Complete |
| MSG-03 | Phase 5 | Complete |
| MSG-04 | Phase 5 | Complete |
| MSG-05 | Phase 5 | Complete |
| MSG-06 | Phase 5 | Complete |
| MSG-07 | Phase 5 | Complete |
| MSG-08 | Phase 5 | Complete |
| MSG-09 | Phase 5 | Complete |
| MSG-10 | Phase 5 | Complete |
| EXPL-01 | Phase 6 | Complete |
| EXPL-02 | Phase 6 | Complete |
| EXPL-03 | Phase 6 | Complete |
| EXPL-04 | Phase 6 | Complete |
| EXPL-05 | Phase 6 | Complete |
| LIKE-01 | Phase 6 | Complete |
| LIKE-02 | Phase 6 | Complete |
| LIKE-03 | Phase 6 | Complete |
| LIKE-04 | Phase 6 | Complete |
| SAFE-01 | Phase 7 | Complete |
| SAFE-02 | Phase 7 | Complete |
| SAFE-03 | Phase 7 | Complete |
| SAFE-04 | Phase 7 | Complete |
| SAFE-05 | Phase 7 | Complete |
| SAFE-06 | Phase 7 | Complete |
| PAID-01 | Phase 9 | Pending |
| PAID-02 | Phase 9 | Pending |
| PAID-03 | Phase 9 | Pending |
| PAID-04 | Phase 9 | Pending |
| PAID-05 | Phase 9 | Pending |
| PAID-06 | Phase 9 | Pending |
| PAID-07 | Phase 9 | Pending |
| PAID-08 | Phase 9 | Pending |
| NOTF-01 | Phase 8 | Pending |
| NOTF-02 | Phase 8 | Pending |
| PRIV-01 | Phase 8 | Pending |
| PRIV-02 | Phase 8 | Pending |
| PRIV-03 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 64 total
- Mapped to phases: 64
- Unmapped: 0

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-03 after roadmap creation*
