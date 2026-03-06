# Room — Product Requirements Document (PRD)
## Version 2.0 — Matching-Based Architecture
Status: Locked for Engineering Implementation

---

# 1. Product Overview

## 1.1 Vision

Room is a roommate-first mobile application for college students (18+) that enables structured roommate discovery through swipe-based browsing, mutual matching, and shared-school gated messaging.

Room prioritizes:

- Mutual consent
- Safety
- School-bound communities
- Trust-forward interaction
- Structured discovery

Room is NOT:

- A dating application
- A housing marketplace
- A global unrestricted social network

---

# 2. Core Product Structure

Room consists of five primary tabs:

1. Discovery (Roommate Mode)
2. Explore (Friends Mode)
3. Likes
4. Messages
5. Profile

Discovery is the primary roommate-matching surface.  
Explore is a secondary school-based social browsing surface.

---

# 3. Age & Access Control

## 3.1 Age Requirement

- Users must be 18 years or older.
- Birthdate collected during onboarding.
- Under-18 accounts are blocked at signup.
- Reporting flow must include “Underage User.”

No exceptions.

---

# 4. Authentication & Verification

## 4.1 Required at Signup

Users must:

- Verify phone number via OTP
- Upload minimum 3 photos
- Complete required profile fields
- Select at least one school

Users failing requirements:
- Cannot appear in Discovery
- Cannot appear in Explore
- Cannot like or match

---

## 4.2 Selfie Verification (Optional)

Selfie verification provides:

- Verified badge
- Increased Explore ranking weight
- Increased trust perception

Selfie verification does NOT bypass shared-school restrictions.

---

# 5. Shared-School Eligibility Model

Users may only:

- View profiles
- Like profiles
- Match
- Message

If they share at least one selected school.

Shared-school enforcement must be server-side.

There is no cross-school messaging.

---

# 6. Matching System (Mutual Consent Model)

Room uses a Tinder-style mutual matching system.

Private messaging requires bilateral consent.

---

## 6.1 Like Behavior

In Discovery and Explore:

- Swipe right → Like
- Swipe left → Dismiss
- Save → Bookmark (separate from Like)

Likes are private unless reciprocated.

---

## 6.2 Match Creation

A Match is created when:

User A likes User B  
AND  
User B likes User A  

When a match occurs:

- “It’s a Match” modal appears for both users.
- A messaging thread is automatically created.
- Messaging becomes enabled.

---

## 6.3 Messaging Eligibility

Messaging requires ALL:

1. Mutual match
2. Shared school
3. Neither user under enforcement
4. Neither user blocked the other

If any condition fails → messaging disabled.

---

## 6.4 Unmatch

Users may unmatch at any time.

When unmatch occurs:

- Thread is deleted for both users.
- Match removed.
- Messaging disabled permanently.
- User does not reappear in Discovery.

Unmatch is server enforced.

---

# 7. Messaging Architecture

## 7.1 Match Required

Users may only message after mutual match.

No cold messaging.
No message requests.
No routing tiers.

All matched threads go directly to Inbox.

---

## 7.2 Thread Lifecycle

Thread states:

- active
- unmatched
- blocked

Threads are created automatically upon match.

---

## 7.3 Messaging Features

Chat supports:

- Timestamps
- Delivery confirmation
- Optional read receipts (future paid feature)
- Reactions
- Reply threading
- Media (photos, GIFs)
- Block
- Report

---

## 7.4 Blocking

If User A blocks User B:

- Match removed
- Thread hidden
- Messaging disabled
- User hidden in Discovery + Explore
- Re-matching impossible

Blocking is server enforced.

---

# 8. Discovery (Roommate Mode)

## 8.1 Purpose

Primary roommate discovery interface.

---

## 8.2 Card Behavior

- Swipe left → dismiss
- Swipe right → like
- Save → bookmark
- Tap photos → navigate
- Photo carousel loops

Swipe-up-to-message is removed.

---

## 8.3 Filters

Core filters:

- School
- Year
- Gender
- Sleep schedule
- Cleanliness
- Partying
- Guests
- Smoking
- Budget

Filters separated into:

- Preferences
- Dealbreakers (hard filter)

---

## 8.4 Mode Status

Users may set status:

- Looking for roommate (default)
- Looking for friends
- Found roommate

If set to:
- Looking for friends
OR
- Found roommate

User is removed from Discovery stack.

---

# 9. Explore (Friends Mode)

## 9.1 Purpose

Social browsing within shared-school network.

---

## 9.2 Visibility

Users see:

- All users who share at least one school.

No global unrestricted browsing.

---

## 9.3 Interactions

Users may:

- Like profiles
- Save profiles
- Match
- Message (after match)

Matching rules identical to Discovery.

---

## 9.4 Ranking Algorithm

Explore Score:

- 30% Profile completeness
- 25% Recent activity
- 20% Verification status
- 15% Profile interactions
- 10% Freshness boost

Ranking weights configurable.

---

# 10. Likes & Matches

Tabs:

- My Likes
- Liked Me (Paid)
- Matches

Free users:

- See My Likes
- See Matches
- Blurred Liked Me

Paid users:

- Full Liked Me visibility

Matches tab shows:

- Active mutual matches
- Last message preview
- Unread indicator

---

# 11. Ads Strategy

Ads enabled at launch.

Ads must NOT appear:

- Before 10 swipes OR first match created
- During swipe decision moment
- Inside message composer

Ads may appear:

- Approx every 10 cards in Discovery
- In Explore feed
- Likes footer

Ads must be clearly labeled “Sponsored.”

---

# 12. Monetization

Launch paid features:

- See who liked you
- Advanced filters
- Profile boost

Boost temporarily increases ranking weight in:

- Discovery
- Explore

---

# 13. Trust & Safety

## 13.1 Mutual Consent Model

Messaging requires mutual match.

This reduces:

- Harassment risk
- Spam
- Unsolicited contact
- Legal exposure

---

## 13.2 Report Reasons

- Harassment
- Sexual content
- Hate speech
- Spam
- Impersonation
- Underage
- Safety threat
- Other

---

## 13.3 Enforcement Escalation

1. Warning
2. 48-hour messaging ban
3. 7-day suspension
4. Permanent ban

Blocked users hidden globally.

---

# 14. Data & Privacy

- No live GPS tracking
- Hometown optional
- Exact birthdate stored for age validation
- Account deletion:
  - Immediate deactivation
  - Hard deletion within 30 days
- Safety reports may be retained longer

---

# 15. Non-Functional Requirements

- All eligibility logic server enforced
- Shared-school matching must be indexed
- Match creation must be atomic
- Unmatch must permanently sever thread
- Ranking system must be configurable
- System must scale multi-school graph

---

# 16. Launch Scope

Included:

- Discovery
- Explore
- Matching
- Messaging
- Likes
- Verification
- Ads
- Paid tier
- Trust & safety baseline

Out of scope:

- Housing marketplace
- Dorm planning tools
- Cross-school unrestricted browsing
- AI compatibility scoring

---

# Final Summary

Room is:

- A roommate-first application
- Based on mutual matching
- Shared-school restricted
- Consent-driven messaging
- Monetized via power-user tools
- Moderated and scalable
- 18+ only

This document is the authoritative source for engineering implementation.
