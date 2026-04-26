-- Migration: Edge case fixes
-- EC-04: Filter deactivated accounts from all visibility RPCs
-- EC-08: Enforce shared-school restriction in explore feed
-- EC-09: Add shared-school validation to profile detail
-- EC-10: Tighten user_schools SELECT policy to shared-school peers
-- EC-19: Age validation trigger on UPDATE (not just INSERT)
-- EC-29: Self-block CHECK constraint
-- EC-32: Missing indexes on enforcement_actions.end_at and users.deactivated_at
-- EC-44: Server-side updated_at trigger for profiles

-- ============================================================
-- EC-44: Auto-update profiles.updated_at on modification
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- EC-32: Performance indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_enforcement_actions_end_at
  ON public.enforcement_actions(end_at)
  WHERE end_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_deactivated_at
  ON public.users(deactivated_at)
  WHERE deactivated_at IS NOT NULL;

-- ============================================================
-- EC-29: Self-block CHECK constraint
-- ============================================================
ALTER TABLE public.blocks
  ADD CONSTRAINT blocks_no_self_block CHECK (blocker_id != blocked_id);

-- ============================================================
-- EC-19: Age validation on UPDATE (currently only INSERT)
-- ============================================================
DROP TRIGGER IF EXISTS check_age_before_update ON public.users;

CREATE TRIGGER check_age_before_update
  BEFORE UPDATE OF birthdate ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.validate_age();

-- ============================================================
-- EC-10: Tighten user_schools SELECT policy
-- Only allow viewing schools for users who share at least one school
-- ============================================================
DROP POLICY IF EXISTS "user_schools_select_others" ON public.user_schools;

CREATE POLICY "user_schools_select_shared_school" ON public.user_schools
  FOR SELECT TO authenticated
  USING (
    user_id != (SELECT auth.uid())
    AND (SELECT public.shares_school((SELECT auth.uid()), user_id))
  );

-- ============================================================
-- EC-08 + EC-04: Explore feed with shared-school gating + deactivated filter
-- ============================================================
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
  v_user_schools uuid[];
  v_w_engagement numeric;
  v_w_activity numeric;
  v_w_completeness numeric;
  v_w_verification numeric;
  v_w_freshness numeric;
  v_avg_likes numeric;
  v_result jsonb;
BEGIN
  -- 0. Get requesting user's school IDs (shared-school gating)
  SELECT array_agg(school_id) INTO v_user_schools
  FROM user_schools
  WHERE user_id = p_user_id;

  IF v_user_schools IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

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

  -- 4. Main explore query (now with shared-school gating)
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
    JOIN user_schools us ON us.user_id = p.user_id
    LEFT JOIN dismissals d ON d.dismisser_id = p_user_id AND d.dismissed_id = p.user_id
    WHERE
      -- Shared-school gating (PRD requirement)
      us.school_id = ANY(v_user_schools)
      -- Must have completed onboarding
      AND u.onboarding_completed = true
      -- Not deactivated
      AND u.deactivated_at IS NULL
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
    GROUP BY p.user_id, p.display_name, p.year, p.completion_score,
             u.selfie_verified, u.last_active_at, u.created_at
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

-- ============================================================
-- EC-09 + EC-04: Profile detail with shared-school check + deactivated filter
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_profile_detail(
  p_user_id uuid,
  p_target_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Verify not blocked in either direction
  IF is_blocked(p_user_id, p_target_id) THEN
    RETURN NULL;
  END IF;

  -- Verify shared school
  IF NOT shares_school(p_user_id, p_target_id) THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'user_id', p.user_id,
    'display_name', p.display_name,
    'bio', p.bio,
    'year', p.year,
    'hometown', p.hometown,
    'nitty_gritty', p.nitty_gritty,
    'completion_score', p.completion_score,
    'mode_status', u.mode_status,
    'selfie_verified', u.selfie_verified,
    'last_active_at', u.last_active_at,
    'rank_score', 0,
    'photos', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object('id', ph.id, 'url', ph.url, 'position', ph.order_index)
        ORDER BY ph.order_index
      )
      FROM photos ph
      WHERE ph.user_id = p.user_id
        AND ph.moderation_status = 'approved'),
      '[]'::jsonb
    )
  )
  INTO v_result
  FROM profiles p
  JOIN users u ON u.id = p.user_id
  WHERE p.user_id = p_target_id
    AND u.onboarding_completed = true
    AND u.enforcement_state = 'none'
    AND u.deactivated_at IS NULL;

  RETURN v_result;
END;
$$;

-- ============================================================
-- EC-04: Filter deactivated accounts from likes RPCs
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_likes(
  p_user_id uuid,
  p_limit integer DEFAULT 24,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', sub.user_id,
      'display_name', sub.display_name,
      'year', sub.year,
      'photo_url', sub.photo_url,
      'liked_at', sub.liked_at
    )
    ORDER BY sub.liked_at DESC
  )
  INTO v_result
  FROM (
    SELECT
      p.user_id,
      p.display_name,
      p.year,
      l.created_at AS liked_at,
      (
        SELECT ph.url
        FROM photos ph
        WHERE ph.user_id = p.user_id
          AND ph.moderation_status = 'approved'
        ORDER BY ph.order_index
        LIMIT 1
      ) AS photo_url
    FROM likes l
    JOIN profiles p ON p.user_id = l.liked_id
    JOIN users u ON u.id = l.liked_id
    WHERE
      l.liker_id = p_user_id
      AND NOT EXISTS (
        SELECT 1 FROM likes l2
        WHERE l2.liker_id = l.liked_id
          AND l2.liked_id = p_user_id
      )
      AND NOT EXISTS (
        SELECT 1 FROM matches m
        WHERE (m.user_a_id = LEAST(p_user_id, l.liked_id)
          AND m.user_b_id = GREATEST(p_user_id, l.liked_id))
      )
      AND u.onboarding_completed = true
      AND u.enforcement_state = 'none'
      AND u.deactivated_at IS NULL
      AND NOT is_blocked(p_user_id, l.liked_id)
    ORDER BY l.created_at DESC
    OFFSET p_offset
    LIMIT p_limit
  ) sub;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_liked_me(
  p_user_id uuid,
  p_limit integer DEFAULT 24,
  p_offset integer DEFAULT 0,
  p_is_paid boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(row_data ORDER BY liked_at DESC)
  INTO v_result
  FROM (
    SELECT
      CASE
        WHEN p_is_paid THEN
          jsonb_build_object(
            'user_id', sub.user_id,
            'display_name', sub.display_name,
            'photo_url', sub.photo_url,
            'liked_at', sub.liked_at
          )
        ELSE
          jsonb_build_object(
            'user_id', sub.user_id,
            'photo_url', sub.photo_url,
            'liked_at', sub.liked_at
          )
      END AS row_data,
      sub.liked_at
    FROM (
      SELECT
        p.user_id,
        p.display_name,
        l.created_at AS liked_at,
        (
          SELECT ph.url
          FROM photos ph
          WHERE ph.user_id = p.user_id
            AND ph.moderation_status = 'approved'
          ORDER BY ph.order_index
          LIMIT 1
        ) AS photo_url
      FROM likes l
      JOIN profiles p ON p.user_id = l.liker_id
      JOIN users u ON u.id = l.liker_id
      WHERE
        l.liked_id = p_user_id
        AND NOT EXISTS (
          SELECT 1 FROM likes l2
          WHERE l2.liker_id = p_user_id
            AND l2.liked_id = l.liker_id
        )
        AND NOT EXISTS (
          SELECT 1 FROM matches m
          WHERE (m.user_a_id = LEAST(p_user_id, l.liker_id)
            AND m.user_b_id = GREATEST(p_user_id, l.liker_id))
        )
        AND u.onboarding_completed = true
        AND u.enforcement_state = 'none'
        AND u.deactivated_at IS NULL
        AND NOT is_blocked(p_user_id, l.liker_id)
      ORDER BY l.created_at DESC
      OFFSET p_offset
      LIMIT p_limit
    ) sub
  ) wrapped;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_liked_me_count(
  p_user_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO v_count
  FROM likes l
  JOIN users u ON u.id = l.liker_id
  WHERE
    l.liked_id = p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM likes l2
      WHERE l2.liker_id = p_user_id
        AND l2.liked_id = l.liker_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM matches m
      WHERE (m.user_a_id = LEAST(p_user_id, l.liker_id)
        AND m.user_b_id = GREATEST(p_user_id, l.liker_id))
    )
    AND u.onboarding_completed = true
    AND u.enforcement_state = 'none'
    AND u.deactivated_at IS NULL
    AND NOT is_blocked(p_user_id, l.liker_id);

  RETURN COALESCE(v_count, 0);
END;
$$;
