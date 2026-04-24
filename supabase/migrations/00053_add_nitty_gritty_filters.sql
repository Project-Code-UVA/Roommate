-- Migration: Add ad-hoc nitty-gritty filters to Discovery and Explore RPCs.
--
-- Extends get_discovery_stack and get_explore_feed with a new optional
-- p_filters jsonb parameter that the client can use to hard-filter the feed
-- without mutating the user's saved preferences / dealbreakers.
--
-- Filter shape (sent by client):
--   { "cleanliness": ["very_tidy", "tidy"], "pets": ["no_pets"] }
--
-- Semantics: for every category key with a non-empty array, a candidate must
-- have `nitty_gritty.self[category]` equal to one of the listed values.
-- Empty arrays, NULL, or missing keys impose no constraint on that category.

-- ===========================================================================
-- get_discovery_stack
-- ===========================================================================

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

  -- Normalize session filters (NULL → empty object)
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
      -- Dealbreaker hard-filter (DISC-07)
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_each_text(v_user_dealbreakers) AS db(category, _val)
        WHERE p.nitty_gritty->'self'->>db.category IS NOT NULL
          AND p.nitty_gritty->'self'->>db.category = ANY(
            SELECT jsonb_array_elements_text(v_user_dealbreakers->db.category)
          )
      )
      -- Session filter hard-include: candidate must match every non-empty
      -- category specified in p_filters.
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

-- ===========================================================================
-- get_explore_feed
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.get_explore_feed(
  p_user_id uuid,
  p_limit integer DEFAULT 24,
  p_offset integer DEFAULT 0,
  p_seed integer DEFAULT 0,
  p_filters jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_w_engagement numeric;
  v_w_activity numeric;
  v_w_completeness numeric;
  v_w_verification numeric;
  v_w_freshness numeric;
  v_avg_likes numeric;
  v_filters jsonb;
  v_result jsonb;
BEGIN
  -- 1. Read explore-specific weights from ranking_config (with fallbacks)
  SELECT COALESCE(weight_value, 0.35) INTO v_w_engagement
  FROM ranking_config WHERE weight_name = 'explore_engagement';
  v_w_engagement := COALESCE(v_w_engagement, 0.35);

  SELECT COALESCE(weight_value, 0.25) INTO v_w_activity
  FROM ranking_config WHERE weight_name = 'explore_activity';
  v_w_activity := COALESCE(v_w_activity, 0.25);

  SELECT COALESCE(weight_value, 0.20) INTO v_w_completeness
  FROM ranking_config WHERE weight_name = 'explore_completeness';
  v_w_completeness := COALESCE(v_w_completeness, 0.20);

  SELECT COALESCE(weight_value, 0.10) INTO v_w_verification
  FROM ranking_config WHERE weight_name = 'explore_verification';
  v_w_verification := COALESCE(v_w_verification, 0.10);

  SELECT COALESCE(weight_value, 0.10) INTO v_w_freshness
  FROM ranking_config WHERE weight_name = 'explore_freshness';
  v_w_freshness := COALESCE(v_w_freshness, 0.10);

  -- 2. Calculate average likes for normalization
  SELECT COALESCE(AVG(like_cnt), 1.0) INTO v_avg_likes
  FROM (
    SELECT COUNT(*) AS like_cnt
    FROM likes
    WHERE created_at > now() - interval '30 days'
    GROUP BY liked_id
  ) avg_sub;
  v_avg_likes := GREATEST(v_avg_likes, 1.0);

  -- Normalize session filters
  v_filters := COALESCE(p_filters, '{}'::jsonb);

  -- 3. Set deterministic random seed for consistent pagination
  PERFORM setseed(p_seed / 2147483647.0);

  -- 4. Main explore query
  WITH candidates AS (
    SELECT
      p.user_id,
      p.display_name,
      p.year,
      p.nitty_gritty,
      p.completion_score,
      u.selfie_verified,
      u.last_active_at,
      u.created_at AS user_created_at
    FROM profiles p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN dismissals d ON d.dismisser_id = p_user_id AND d.dismissed_id = p.user_id
    WHERE
      u.onboarding_completed = true
      AND u.enforcement_state = 'none'
      AND u.mode_status IN ('roommate', 'friends')
      AND p.user_id != p_user_id
      AND NOT is_blocked(p_user_id, p.user_id)
      AND d.id IS NULL
      -- Session filter hard-include (same semantics as discovery)
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
  ),
  scored AS (
    SELECT
      c.*,
      LEAST(
        (SELECT COUNT(*) FROM likes WHERE liked_id = c.user_id AND created_at > now() - interval '30 days')::numeric
        / v_avg_likes,
        1.0
      ) AS engagement_score,
      (1.0 - LEAST(
        EXTRACT(EPOCH FROM (now() - c.last_active_at)) / (7.0 * 86400.0),
        1.0
      ))::numeric AS activity_score,
      LEAST(c.completion_score::numeric / 100.0, 1.0) AS completeness_score,
      CASE WHEN c.selfie_verified THEN 1.0 ELSE 0.0 END AS verification_score,
      (1.0 - LEAST(
        EXTRACT(EPOCH FROM (now() - c.user_created_at)) / (30.0 * 86400.0),
        1.0
      ))::numeric AS freshness_score
    FROM candidates c
  ),
  ranked AS (
    SELECT
      s.user_id,
      s.display_name,
      s.year,
      s.selfie_verified,
      (
        s.engagement_score * v_w_engagement +
        s.activity_score * v_w_activity +
        s.completeness_score * v_w_completeness +
        s.verification_score * v_w_verification +
        s.freshness_score * v_w_freshness
      ) * 0.7 + random() * 0.3 AS final_score,
      (
        SELECT ph.url
        FROM photos ph
        WHERE ph.user_id = s.user_id
          AND ph.moderation_status = 'approved'
        ORDER BY ph.order_index
        LIMIT 1
      ) AS photo_url
    FROM scored s
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', r.user_id,
      'display_name', r.display_name,
      'year', r.year,
      'photo_url', r.photo_url,
      'selfie_verified', r.selfie_verified
    )
    ORDER BY r.final_score DESC
  )
  INTO v_result
  FROM ranked r
  WHERE r.photo_url IS NOT NULL
  OFFSET p_offset
  LIMIT p_limit;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
