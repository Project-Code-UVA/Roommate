-- Migration: Explore feed RPC function
-- Engagement-ranked explore feed showing profiles from ANY school
-- Requirements: EXPL-02, EXPL-03

CREATE OR REPLACE FUNCTION public.get_explore_feed(
  p_user_id uuid,
  p_limit integer DEFAULT 24,
  p_offset integer DEFAULT 0,
  p_seed integer DEFAULT 0
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

  -- 3. Set deterministic random seed for consistent pagination
  PERFORM setseed(p_seed / 2147483647.0);

  -- 4. Main explore query
  WITH candidates AS (
    SELECT
      p.user_id,
      p.display_name,
      p.year,
      p.completion_score,
      u.selfie_verified,
      u.last_active_at,
      u.created_at AS user_created_at
    FROM profiles p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN dismissals d ON d.dismisser_id = p_user_id AND d.dismissed_id = p.user_id
    WHERE
      -- Must have completed onboarding
      u.onboarding_completed = true
      -- Not under enforcement
      AND u.enforcement_state = 'none'
      -- Mode filter: only roommate and friends
      AND u.mode_status IN ('roommate', 'friends')
      -- Not self
      AND p.user_id != p_user_id
      -- Block filter: bidirectional
      AND NOT is_blocked(p_user_id, p.user_id)
      -- Dismissal filter: exclude dismissed profiles
      AND d.id IS NULL
  ),
  scored AS (
    SELECT
      c.*,
      -- Engagement score: likes received in last 30 days, normalized
      LEAST(
        (SELECT COUNT(*) FROM likes WHERE liked_id = c.user_id AND created_at > now() - interval '30 days')::numeric
        / v_avg_likes,
        1.0
      ) AS engagement_score,
      -- Activity score: linear decay over 7 days
      (1.0 - LEAST(
        EXTRACT(EPOCH FROM (now() - c.last_active_at)) / (7.0 * 86400.0),
        1.0
      ))::numeric AS activity_score,
      -- Completeness score: profile completion (already 0-1 range)
      LEAST(c.completion_score::numeric / 100.0, 1.0) AS completeness_score,
      -- Verification score: binary
      CASE WHEN c.selfie_verified THEN 1.0 ELSE 0.0 END AS verification_score,
      -- Freshness score: account age decay over 30 days (newer = higher)
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
      -- Weighted score with random component
      (
        s.engagement_score * v_w_engagement +
        s.activity_score * v_w_activity +
        s.completeness_score * v_w_completeness +
        s.verification_score * v_w_verification +
        s.freshness_score * v_w_freshness
      ) * 0.7 + random() * 0.3 AS final_score,
      -- First approved photo
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
