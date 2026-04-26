# Decision Log

---

Date: 2026-04-17
Decision: Replace Discovery swipe-up-to-message with swipe-up super-like; add double-tap center to open expanded profile sheet.
Rationale: Un-gated direct messaging from Discovery would increase spam. Messaging must remain gated by mutual match. Super-likes preserve the match-first invariant while giving users a stronger "interest" signal than a regular like. Double-tap-to-expand gives a low-friction way to view an expanded profile without competing with edge-tap photo navigation.
Impact:
- `likes` table gains `is_super_like boolean NOT NULL DEFAULT false` (migration 00057).
- `like_profile` RPC accepts `p_is_super_like boolean DEFAULT false`.
- SwipeCard gesture composition: horizontal pan = like/pass (existing), vertical pan up = super-like (new), double-tap = expand (new).
- PhotoCarousel tap zones narrowed to outer thirds for photo nav; center third is reserved for double-tap-to-expand.
- Messaging entry from Discovery remains match-gated via the match modal "Send message" CTA only.
