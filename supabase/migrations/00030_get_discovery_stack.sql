-- Migration: Discovery stack RPC function
-- Server-side discovery query with school gating, block filtering,
-- dealbreaker enforcement, dismissal cycle, and weighted ranking
-- Requirements: DISC-05, DISC-07, DISC-08, DISC-09, DISC-10

CREATE OR REPLACE FUNCTION public.get_discovery_stack(
  p_user_id uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
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
  v_w_compat numeric;
  v_w_activity numeric;
  v_w_popularity numeric;
  v_result jsonb;
BEGIN
  -- 1. Get requesting user's school IDs
  SELECT array_agg(school_id) INTO v_user_schools
  FROM user_schools
  WHERE user_id = p_user_id;

  -- If user has no schools, return empty
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
  -- Uses subquery to deduplicate multi-school overlaps via GROUP BY,
  -- then aggregates to jsonb with final ordering, limit, and offset.
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
      -- School gating (DISC-05): shared school with requesting user
      us.school_id = ANY(v_user_schools)
      -- Not self
      AND p.user_id != p_user_id
      -- Mode filter (DISC-08, DISC-09): only roommate and friends
      AND u.mode_status IN ('roommate', 'friends')
      -- Must have completed onboarding
      AND u.onboarding_completed = true
      -- Not under enforcement
      AND u.enforcement_state = 'none'
      -- Block filter: bidirectional
      AND NOT is_blocked(p_user_id, p.user_id)
      -- Dismissal logic: exclude if max views (3) reached OR within 48h cooldown
      AND (
        d.id IS NULL
        OR (d.view_count < 3 AND d.last_dismissed_at <= now() - interval '48 hours')
      )
      -- Dealbreaker hard-filter (DISC-07): exclude candidates whose self-value
      -- matches any of the requesting user's dealbreaker values for that category
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_each_text(v_user_dealbreakers) AS db(category, _val)
        WHERE p.nitty_gritty->'self'->>db.category IS NOT NULL
          AND p.nitty_gritty->'self'->>db.category = ANY(
            SELECT jsonb_array_elements_text(v_user_dealbreakers->db.category)
          )
      )
    -- Deduplicate users who share multiple schools with requester
    GROUP BY p.user_id, p.display_name, p.bio, p.year, p.hometown,
             p.nitty_gritty, p.completion_score,
             u.mode_status, u.selfie_verified, u.last_active_at
  ),
  scored AS (
    SELECT
      c.*,
      -- Compatibility score: preference matches / overlapping categories
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
      -- Activity score: linear decay over 7 days (1.0 = just active, 0.0 = 7+ days ago)
      (1.0 - LEAST(
        EXTRACT(EPOCH FROM (now() - c.last_active_at)) / (7.0 * 86400.0),
        1.0
      ))::numeric AS activity_score,
      -- Popularity score: likes received in last 30 days, normalized by school avg
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
      (s.compat_score * v_w_compat + s.activity_score * v_w_activity + s.pop_score * v_w_popularity) AS rank_score
    FROM scored s
    ORDER BY (s.compat_score * v_w_compat + s.activity_score * v_w_activity + s.pop_score * v_w_popularity) DESC
    LIMIT p_limit
    OFFSET p_offset
  ) ranked;

  -- DISC-10: return empty array for empty state
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
