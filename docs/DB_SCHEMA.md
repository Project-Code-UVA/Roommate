# Database Schema (PRD v2.0)

> Source of truth: `supabase/migrations/` SQL files.
> This document is a human-readable reference.

## Enums

| Type | Values |
|------|--------|
| mode_status | roommate, friends, found_roommate |
| enforcement_state | none, warning, dm_ban_48h, suspended_7d, permanent_ban |
| thread_status | active, unmatched, blocked |
| report_reason | harassment, sexual_content, hate_speech, spam, impersonation, underage, safety_threat, other |
| report_status | pending, reviewed, resolved, dismissed |
| enforcement_action_type | warning, dm_ban_48h, suspended_7d, permanent_ban |
| moderation_status | pending, approved, rejected |

## Tables

### users
- id (uuid, PK, FK -> auth.users)
- phone (text)
- birthdate (date, NOT NULL)
- selfie_verified (bool, default false)
- mode_status (mode_status, default 'roommate')
- enforcement_state (enforcement_state, default 'none')
- created_at (timestamptz)
- last_active_at (timestamptz)

### schools
- id (uuid, PK)
- name (text, UNIQUE)
- created_at (timestamptz)

### user_schools
- user_id (uuid, FK -> users, PK)
- school_id (uuid, FK -> schools, PK)
- Index: idx_user_schools_school_id

### profiles
- user_id (uuid, PK, FK -> users)
- display_name (text)
- bio (text)
- year (text)
- hometown (text)
- nitty_gritty (jsonb, default '{}')
- completion_score (smallint, default 0)
- created_at (timestamptz)
- updated_at (timestamptz)

### photos
- id (uuid, PK)
- user_id (uuid, FK -> users)
- url (text)
- order_index (smallint, default 0)
- moderation_status (moderation_status, default 'pending')
- created_at (timestamptz)
- Index: idx_photos_user_id

### likes
- id (uuid, PK)
- liker_id (uuid, FK -> users)
- liked_id (uuid, FK -> users)
- created_at (timestamptz)
- UNIQUE (liker_id, liked_id)
- Index: idx_likes_liked_id

### matches
- id (uuid, PK)
- user_a_id (uuid, FK -> users)
- user_b_id (uuid, FK -> users)
- created_at (timestamptz)
- UNIQUE (user_a_id, user_b_id)
- CHECK (user_a_id < user_b_id)
- Index: idx_matches_user_b

### dismissals
- id (uuid, PK)
- dismisser_id (uuid, FK -> users)
- dismissed_id (uuid, FK -> users)
- created_at (timestamptz)
- UNIQUE (dismisser_id, dismissed_id)

### saves
- id (uuid, PK)
- saver_id (uuid, FK -> users)
- saved_id (uuid, FK -> users)
- created_at (timestamptz)
- UNIQUE (saver_id, saved_id)

### threads
- id (uuid, PK)
- user_a_id (uuid, FK -> users)
- user_b_id (uuid, FK -> users)
- match_id (uuid, FK -> matches, ON DELETE SET NULL)
- status (thread_status, default 'active')
- created_at (timestamptz)
- UNIQUE (user_a_id, user_b_id)
- CHECK (user_a_id < user_b_id)

### messages
- id (uuid, PK)
- thread_id (uuid, FK -> threads)
- sender_id (uuid, FK -> users)
- body (text)
- media_url (text)
- created_at (timestamptz)
- delivered_at (timestamptz)
- read_at (timestamptz)
- Index: idx_messages_thread_id, idx_messages_created_at

### blocks
- blocker_id (uuid, FK -> users, PK)
- blocked_id (uuid, FK -> users, PK)
- created_at (timestamptz)
- Index: idx_blocks_blocked_id

### reports
- id (uuid, PK)
- reporter_id (uuid, FK -> users)
- reported_id (uuid, FK -> users)
- reason (report_reason)
- details (text)
- status (report_status, default 'pending')
- created_at (timestamptz)

### enforcement_actions
- id (uuid, PK)
- user_id (uuid, FK -> users)
- action (enforcement_action_type)
- start_at (timestamptz)
- end_at (timestamptz)
- created_at (timestamptz)
- Index: idx_enforcement_user_id

### ranking_config
- id (uuid, PK)
- weight_name (text, UNIQUE)
- weight_value (numeric(5,4))
- updated_at (timestamptz)

### ads_engagement
- id (uuid, PK)
- user_id (uuid, FK -> users)
- swipe_count (integer, default 0)
- first_match_at (timestamptz)
- ads_eligible (bool, default false)
- updated_at (timestamptz)

### subscriptions
- id (uuid, PK)
- user_id (uuid, FK -> users)
- plan (text)
- status (text, default 'active')
- started_at (timestamptz)
- expires_at (timestamptz)
- created_at (timestamptz)
