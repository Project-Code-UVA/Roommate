-- Migration: Seed ranking weights for Discovery Engine
-- Weights are tunable via ranking_config table

INSERT INTO public.ranking_config (weight_name, weight_value) VALUES
  ('discovery_compatibility', 0.4000),
  ('discovery_activity', 0.3500),
  ('discovery_popularity', 0.2500)
ON CONFLICT (weight_name) DO NOTHING;
