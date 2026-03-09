-- Migration: Add view tracking to dismissals table
-- Supports re-surfacing dismissed profiles after cooldown (DISC-09)

ALTER TABLE public.dismissals
  ADD COLUMN view_count smallint NOT NULL DEFAULT 1,
  ADD COLUMN last_dismissed_at timestamptz NOT NULL DEFAULT now();
