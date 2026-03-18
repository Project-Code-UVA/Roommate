-- Migration: Seed explore-specific ranking weights
-- ON CONFLICT DO NOTHING makes this idempotent

INSERT INTO public.ranking_config (weight_name, weight_value) VALUES
  ('explore_engagement', 0.3500),
  ('explore_activity', 0.2500),
  ('explore_completeness', 0.2000),
  ('explore_verification', 0.1000),
  ('explore_freshness', 0.1000)
ON CONFLICT (weight_name) DO NOTHING;
