-- Migration: Add soft-delete columns to matches table (MTCH-04)
-- Allows unmatching without losing historical data

ALTER TABLE public.matches
  ADD COLUMN unmatched_at timestamptz DEFAULT NULL,
  ADD COLUMN unmatched_by uuid DEFAULT NULL REFERENCES public.users(id);

CREATE INDEX idx_matches_active ON public.matches (user_a_id, user_b_id)
  WHERE unmatched_at IS NULL;
