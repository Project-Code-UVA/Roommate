# Architecture Overview
Room — System Architecture

---

# 1. High-Level Architecture

Mobile Client (iOS-first, React Native)
        |
        |
API Layer / Edge Functions
        |
        |
Postgres Database (with RLS)
        |
        |
Storage (Media)
        |
        |
External Services
  - Phone OTP provider
  - Selfie verification provider
  - Ad network
  - Subscription provider

---

# 2. Core Services

## 2.1 Auth Service
- Phone OTP
- Session management
- Age validation

## 2.2 Profile Service
- Profile CRUD
- School selection
- Mode toggling
- Verification status

## 2.3 Discovery Service
- Swipe stack generation
- Filter enforcement
- Dealbreaker enforcement
- Block filtering

## 2.4 Messaging Service
- Thread creation
- Routing logic
- Shared-school enforcement
- Enforcement checks
- Delivery + read state

## 2.5 Explore Service
- Shared-school filtering
- Ranking computation
- Activity scoring

## 2.6 Moderation Service
- Reporting intake
- Enforcement actions
- Visibility suppression

## 2.7 Ads Service
- Engagement gate evaluation
- Ad frequency logic
- Placement injection

---

# 3. Critical Server-Side Guarantees

Must be enforced server-side:

- Shared-school messaging gate
- Enforcement state checks
- Block visibility rules
- Ads gating logic
- Ranking logic

Client-side validation is insufficient.
