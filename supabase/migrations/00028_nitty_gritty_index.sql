-- Migration: Performance indexes for Discovery Engine queries
-- GIN index on nitty_gritty for dealbreaker filtering
-- Partial index on dismissals for refresh logic
-- Index on likes for reciprocal-like lookup

CREATE INDEX idx_profiles_nitty_gritty ON public.profiles
  USING GIN (nitty_gritty jsonb_path_ops);

CREATE INDEX idx_dismissals_refresh ON public.dismissals (dismisser_id, last_dismissed_at)
  WHERE view_count < 3;

CREATE INDEX idx_likes_liker_id ON public.likes (liker_id);
