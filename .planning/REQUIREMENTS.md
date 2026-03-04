# Requirements: Room

**Defined:** 2026-03-03
**Core Value:** Users can discover and match with compatible roommates at their school through a trust-verified, consent-driven swipe experience

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [ ] **FOUND-01**: Project scaffold with Expo Development Build, Supabase client, and navigation structure
- [ ] **FOUND-02**: Database schema aligned with PRD v2.0 (matches, likes, dismissals, saves tables)
- [ ] **FOUND-03**: Row Level Security policies for shared-school gating on all user-facing tables
- [ ] **FOUND-04**: Shared block-check Postgres function referenced by all visibility queries

### Authentication

- [ ] **AUTH-01**: User can create account with birthdate (18+ enforced server-side)
- [ ] **AUTH-02**: User can verify phone number via OTP
- [ ] **AUTH-03**: User can upload minimum 3 photos during onboarding
- [ ] **AUTH-04**: User can select at least one school during onboarding
- [ ] **AUTH-05**: User can complete required profile fields (name, year, bio)
- [ ] **AUTH-06**: User who fails verification requirements cannot appear in Discovery, Explore, or message
- [ ] **AUTH-07**: User can complete selfie verification for verified badge
- [ ] **AUTH-08**: Progressive onboarding flow (age → phone → photos → school → profile → selfie)

### Discovery

- [ ] **DISC-01**: User can swipe left to dismiss profiles
- [ ] **DISC-02**: User can swipe right to like profiles
- [ ] **DISC-03**: User can save/bookmark profiles (separate from like)
- [ ] **DISC-04**: User can tap photo zones to navigate carousel (loops at end)
- [ ] **DISC-05**: User sees only profiles from shared schools (server-enforced)
- [ ] **DISC-06**: User can set roommate preference filters (sleep, cleanliness, guests, smoking, budget, partying)
- [ ] **DISC-07**: User can mark filters as preferences vs dealbreakers
- [ ] **DISC-08**: User can set mode status (looking for roommate / found roommate)
- [ ] **DISC-09**: User with "found roommate" status is removed from Discovery stack
- [ ] **DISC-10**: User sees appropriate empty state when no more profiles available

### Matching

- [ ] **MTCH-01**: Match is created atomically when both users have liked each other
- [ ] **MTCH-02**: User sees "It's a Match" modal when match occurs
- [ ] **MTCH-03**: Messaging thread is auto-created upon match
- [ ] **MTCH-04**: User can unmatch, permanently removing thread and preventing re-matching

### Messaging

- [ ] **MSG-01**: User can send and receive real-time text messages with matches
- [ ] **MSG-02**: User can see message timestamps
- [ ] **MSG-03**: User can see delivery indicators (sent/delivered)
- [ ] **MSG-04**: User can react to messages with emoji
- [ ] **MSG-05**: User can reply to specific messages (threading)
- [ ] **MSG-06**: User can send photos and GIFs in chat
- [ ] **MSG-07**: User can block from chat (full visibility removal)
- [ ] **MSG-08**: User can report from chat
- [ ] **MSG-09**: User sees icebreaker prompt suggestions on new match
- [ ] **MSG-10**: Messaging eligibility enforced server-side (mutual match + shared school + no enforcement + no block)

### Explore

- [ ] **EXPL-01**: User can browse grid of profiles from shared schools
- [ ] **EXPL-02**: Profiles ranked by weighted algorithm (30% completeness, 25% activity, 20% verification, 15% interactions, 10% freshness)
- [ ] **EXPL-03**: Ranking weights are configurable server-side
- [ ] **EXPL-04**: User can like and save profiles from Explore
- [ ] **EXPL-05**: Matching rules identical to Discovery

### Likes

- [ ] **LIKE-01**: User can view My Likes list
- [ ] **LIKE-02**: User can view Matches list with last message preview and unread indicator
- [ ] **LIKE-03**: Free users see blurred Liked Me grid
- [ ] **LIKE-04**: Paid users see full Liked Me with identity revealed

### Trust & Safety

- [ ] **SAFE-01**: Shared-school gating enforced server-side on all visibility queries
- [ ] **SAFE-02**: Block hides user from Discovery, Explore, Likes, and Messages (server-enforced)
- [ ] **SAFE-03**: Report system with 8 categories (harassment, sexual content, hate speech, spam, impersonation, underage, safety threat, other)
- [ ] **SAFE-04**: Enforcement escalation (warning → 48hr DM ban → 7-day suspension → permanent ban)
- [ ] **SAFE-05**: Enforcement state checked before allowing new conversations
- [ ] **SAFE-06**: Under-18 accounts blocked at signup, "Underage" report category available

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
| (Populated during roadmap creation) | | |

**Coverage:**
- v1 requirements: 48 total
- Mapped to phases: 0
- Unmapped: 48

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-03 after initial definition*
