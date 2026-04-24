-- Migration: Exclude active matches from get_discovery_stack.
--
-- Once User A and User B match, neither should see the other in Discovery.
-- The matches table stores pairs in canonical order (user_a_id < user_b_id)
-- and supports soft-delete via unmatched_at, so we filter to active rows only.
-- Unmatching (which sets unmatched_at) will allow them to reappear.
--
-- This migration replaces the body from 00053; only the candidates WHERE clause
-- changes (one additional NOT EXISTS). Signature, return shape, ranking weights,
-- and all other filters are identical.

CREATE OR REPLACE FUNCTION public.get_discovery_stack(
  p_user_id uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_filters jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_schools uuid[];
  v_user_dealbreakers jsonb;
  v_user_preferences jsonb;
  v_filters jsonb;
  v_w_compat numeric;
  v_w_activity numeric;
  v_w_popularity numeric;
  v_result jsonb;
BEGIN
  -- 1. Get requesting user's school IDs
  SELECT array_agg(school_id) INTO v_user_schools
  FROM user_schools
  WHERE user_id = p_user_id;

  IF v_user_schools IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  -- 2. Get requesting user's dealbreakers and preferences
  SELECT
    COALESCE(nitty_gritty->'dealbreakers', '{}'::jsonb),
    COALESCE(nitty_gritty->'preferences', '{}'::jsonb)
  INTO v_user_dealbreakers, v_user_preferences
  FROM profiles
  WHERE user_id = p_user_id;

  v_user_dealbreakers := COALESCE(v_user_dealbreakers, '{}'::jsonb);
  v_user_preferences := COALESCE(v_user_preferences, '{}'::jsonb);

  v_filters := COALESCE(p_filters, '{}'::jsonb);

  -- 3. Read ranking weights from ranking_config (with fallbacks)
  SELECT COALESCE(weight_value, 0.40) INTO v_w_compat
  FROM ranking_config WHERE weight_name = 'discovery_compatibility';
  v_w_compat := COALESCE(v_w_compat, 0.40);

  SELECT COALESCE(weight_value, 0.35) INTO v_w_activity
  FROM ranking_config WHERE weight_name = 'discovery_activity';
  v_w_activity := COALESCE(v_w_activity, 0.35);

  SELECT COALESCE(weight_value, 0.25) INTO v_w_popularity
  FROM ranking_config WHERE weight_name = 'discovery_popularity';
  v_w_popularity := COALESCE(v_w_popularity, 0.25);

  -- 4. Main discovery query
  WITH candidates AS (
    SELECT
      p.user_id,
      p.display_name,
      p.bio,
      p.year,
      p.hometown,
      p.nitty_gritty,
      p.completion_score,
      u.mode_status,
      u.selfie_verified,
      u.last_active_at
    FROM profiles p
    JOIN users u ON u.id = p.user_id
    JOIN user_schools us ON us.user_id = p.user_id
    LEFT JOIN dismissals d ON d.dismisser_id = p_user_id AND d.dismissed_id = p.user_id
    WHERE
      us.school_id = ANY(v_user_schools)
      AND p.user_id != p_user_id
      AND u.mode_status IN ('roommate', 'friends')
      AND u.onboarding_completed = true
      AND u.enforcement_state = 'none'
      AND NOT is_blocked(p_user_id, p.user_id)
      AND (
        d.id IS NULL
        OR (d.view_count < 3 AND d.last_dismissed_at <= now() - interval '48 hours')
      )
      -- Match filter: exclude active matches in either direction.
      -- matches uses canonical ordering (user_a_id < user_b_id), so we
      -- key off LEAST/GREATEST to check both directions with one lookup.
      AND NOT EXISTS (
        SELECT 1
        FROM matches m
        WHERE m.user_a_id = LEAST(p_user_id, p.user_id)
          AND m.user_b_id = GREATEST(p_user_id, p.user_id)
          AND m.unmatched_at IS NULL
      )
      -- Dealbreaker hard-filter (DISC-07)
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_each_text(v_user_dealbreakers) AS db(category, _val)
        WHERE p.nitty_gritty->'self'->>db.category IS NOT NULL
          AND p.nitty_gritty->'self'->>db.category = ANY(
            SELECT jsonb_array_elements_text(v_user_dealbreakers->db.category)
          )
      )
      -- Session filter hard-include
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_each(v_filters) AS f(category, values)
        WHERE jsonb_typeof(f.values) = 'array'
          AND jsonb_array_length(f.values) > 0
          AND (
            p.nitty_gritty->'self'->>f.category IS NULL
            OR p.nitty_gritty->'self'->>f.category <> ALL(
              SELECT jsonb_array_elements_text(f.values)
            )
          )
      )
    GROUP BY p.user_id, p.display_name, p.bio, p.year, p.hometown,
             p.nitty_gritty, p.completion_score,
             u.mode_status, u.selfie_verified, u.last_active_at
  ),
  scored AS (
    SELECT
      c.*,
      (
        SELECT CASE
          WHEN COUNT(*) = 0 THEN 0.5
          ELSE SUM(
            CASE
              WHEN c.nitty_gritty->'self'->>pref.key = ANY(
                SELECT jsonb_array_elements_text(v_user_preferences->pref.key)
              )
              THEN 1.0
              ELSE 0.0
            END
          )::numeric / COUNT(*)::numeric
        END
        FROM jsonb_each(v_user_preferences) AS pref(key, value)
        WHERE c.nitty_gritty->'self'->>pref.key IS NOT NULL
      ) AS compat_score,
      (1.0 - LEAST(
        EXTRACT(EPOCH FROM (now() - c.last_active_at)) / (7.0 * 86400.0),
        1.0
      ))::numeric AS activity_score,
      LEAST(
        (SELECT COUNT(*) FROM likes WHERE liked_id = c.user_id AND created_at > now() - interval '30 days')::numeric
        / GREATEST(
          (SELECT COALESCE(AVG(like_cnt), 1.0) FROM (
            SELECT COUNT(*) AS like_cnt
            FROM likes l2
            JOIN user_schools us2 ON us2.user_id = l2.liked_id
            WHERE us2.school_id = ANY(v_user_schools)
              AND l2.created_at > now() - interval '30 days'
            GROUP BY l2.liked_id
          ) avg_sub),
          1.0
        ),
        1.0
      )::numeric AS pop_score
    FROM candidates c
  )
  SELECT jsonb_agg(to_jsonb(ranked))
  INTO v_result
  FROM (
    SELECT
      s.user_id,
      s.display_name,
      s.bio,
      s.year,
      s.hometown,
      s.nitty_gritty,
      s.completion_score,
      s.mode_status,
      s.selfie_verified,
      s.last_active_at,
      (s.compat_score * v_w_compat + s.activity_score * v_w_activity + s.pop_score * v_w_popularity) AS rank_score,
      COALESCE(
        (SELECT jsonb_agg(
          jsonb_build_object('id', ph.id, 'url', ph.url, 'position', ph.order_index)
          ORDER BY ph.order_index
        )
        FROM photos ph
        WHERE ph.user_id = s.user_id
          AND ph.moderation_status = 'approved'),
        '[]'::jsonb
      ) AS photos
    FROM scored s
    ORDER BY (s.compat_score * v_w_compat + s.activity_score * v_w_activity + s.pop_score * v_w_popularity) DESC
    LIMIT p_limit
    OFFSET p_offset
  ) ranked;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
