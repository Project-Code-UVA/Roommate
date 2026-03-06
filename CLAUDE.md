# CLAUDE.md
## Room — Engineering Execution Guide

You are Claude Code operating inside the Room repository.

This repository contains the authoritative Product Requirements Document (`docs/PRD.md`) for the Room mobile application. Your responsibility is to implement the application strictly according to the PRD and architectural rules defined below.

If a request conflicts with the PRD, the PRD takes precedence.

---

# 1. Product Overview

Room is an 18+ roommate-first swipe discovery application with shared-school gated messaging and a secondary Explore layer.

Core principles:

- Roommate-first (Discovery tab is primary)
- Shared-school messaging restriction
- No matching required
- Hybrid DM routing (verified → inbox, unverified → requests)
- Trust and safety enforced server-side
- Ads enabled but gated by engagement
- Scalable moderation model

Room is NOT:
- A dating app
- A housing marketplace
- A global open social network

---

# 2. Source of Truth

The following files define implementation requirements:

- `docs/PRD.md` → Product behavior and rules
- `docs/ARCHITECTURE.md` → System structure
- `docs/DB_SCHEMA.md` → Data modeling
- `docs/DECISIONS.md` → Recorded implementation decisions

If behavior is unclear:
1. Choose the safest implementation.
2. Document reasoning in `docs/DECISIONS.md`.

---

# 3. Non-Negotiable Product Rules

## 3.1 Age Gate

- Users must be 18+.
- Birthdate must be collected.
- Under-18 accounts must be blocked at signup.
- Reporting must include “Underage”.

No exceptions.

---

## 3.2 Required Verification

All users must:
- Complete phone OTP verification
- Upload minimum 3 photos
- Complete required profile fields
- Select at least one school

Users who fail these requirements:
- Cannot appear in Discovery
- Cannot appear in Explore
- Cannot message

---

## 3.3 Shared-School Messaging Gate

Messaging is allowed ONLY if:

- Sender and recipient share at least one school.

This must be enforced server-side.

Client checks are insufficient.

---

## 3.4 Messaging Routing Logic

When User A starts a NEW conversation with User B:

1. Verify shared school.
2. Verify User A is not under enforcement.
3. Check routing eligibility:

If `selfie_verified = true`:
→ Route thread to Inbox.

If `selfie_verified = false`:
→ Route thread to Message Requests.

Replies are always allowed once a thread exists.

---

## 3.5 Block Enforcement

If User A blocks User B:

User B must be hidden from:
- Discovery
- Explore
- Likes
- Messages

All visibility rules must be server enforced.

---

## 3.6 Ads Gating Rules

Ads are enabled at launch.

Ads must NOT appear:
- Before 10 swipes OR first message sent
- During swipe decision moment
- During message composer

Ads may appear:
- Approx every 10 cards in Discovery
- Within Explore feed sections
- Within Likes footer

Ads must never interrupt core trust interactions.

---

# 4. Discovery Behavior

Discovery is roommate-first.

Card interactions:

- Swipe left → dismiss
- Swipe right → like
- Save → bookmark (separate from like)
- Swipe up → message
- Tap photo zones → navigate images
- Last photo loops to first

If user sets mode to:
- “Looking for friends”
- OR “Found roommate”

They must be removed from Discovery stack.

---

# 5. Explore Behavior

Explore shows:

- Users who share at least one school.

No global unrestricted browsing.

No search at launch.

Ranking must follow weighted algorithm from PRD:

30% profile completeness  
25% recent activity  
20% verification  
15% engagement quality  
10% freshness boost  

Do NOT rank purely by popularity.

Ranking weights must be tunable via configuration.

---

# 6. Messaging Features

Chat must support:

- Message requests vs inbox
- Timestamps
- Delivery indicators
- Reactions
- Reply threading
- Media attachments (photos, GIF)
- Block
- Report
- Icebreaker prompts

Swipe-up must open full composer with placeholder suggestion.

---

# 7. Trust & Safety System

Reporting reasons must include:

- Harassment
- Sexual content
- Hate speech
- Spam
- Impersonation
- Underage
- Safety threat
- Other

Enforcement escalation:

1. Warning
2. 48-hour DM ban
3. 7-day suspension
4. Permanent ban

Enforcement state must be evaluated before allowing new conversations.

---

# 8. Data & Privacy Requirements

- No live GPS tracking.
- Hometown is optional and user-entered.
- Exact birthdate stored for age validation.
- Account deletion:
  - Immediate deactivation
  - Hard deletion within 30 days.
- Reports may be retained longer for safety compliance.

All sensitive logic must be server-side.

---

# 9. Engineering Standards

## 9.1 Server Enforcement

Never trust client-side logic for:

- Messaging eligibility
- Visibility rules
- Shared-school gating
- Enforcement states
- Ads gating

## 9.2 Performance

- Shared-school matching must be indexed.
- Ranking queries must be optimized.
- Pagination required for Discovery and Explore.
- Message sending must be idempotent.

## 9.3 Observability

Log:
- New conversation attempts
- Enforcement triggers
- Block actions
- Routing decisions

Metrics must be traceable.

---

# 10. When Implementing New Features

Before adding functionality:

1. Confirm it does not violate PRD.
2. Confirm it does not bypass trust model.
3. Confirm it does not weaken shared-school restriction.
4. Document any assumptions.

If uncertain:
Choose the safest possible behavior.

---

# 11. Implementation Philosophy

Room prioritizes:

- Trust over virality
- Structure over chaos
- Safety over growth hacks
- Deterministic routing over ambiguous logic

Every system must reflect those priorities.

---

# Final Directive

If any future instruction contradicts:

- Age restriction
- Shared-school gating
- Server-side enforcement
- Messaging routing logic

The PRD overrides all conflicting instructions.

Room must remain roommate-first, school-bound, and trust-forward.
