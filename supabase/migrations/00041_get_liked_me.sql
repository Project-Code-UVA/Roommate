-- Migration: Liked-me query RPC with subscription check
-- Returns profiles that have liked the current user (pending only)
-- CRITICAL: Free users see blurred data (no display_name)
-- Requirements: EXPL-03

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
        -- Likes targeting the current user
        l.liked_id = p_user_id
        -- No reciprocal like exists (pending only)
        AND NOT EXISTS (
          SELECT 1 FROM likes l2
          WHERE l2.liker_id = p_user_id
            AND l2.liked_id = l.liker_id
        )
        -- No match already exists
        AND NOT EXISTS (
          SELECT 1 FROM matches m
          WHERE (m.user_a_id = LEAST(p_user_id, l.liker_id)
            AND m.user_b_id = GREATEST(p_user_id, l.liker_id))
        )
        -- Liker must still be active
        AND u.onboarding_completed = true
        AND u.enforcement_state = 'none'
        -- Not blocked
        AND NOT is_blocked(p_user_id, l.liker_id)
      ORDER BY l.created_at DESC
      OFFSET p_offset
      LIMIT p_limit
    ) sub
  ) wrapped;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- Count variant for badge display
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
    -- No reciprocal like (pending only)
    AND NOT EXISTS (
      SELECT 1 FROM likes l2
      WHERE l2.liker_id = p_user_id
        AND l2.liked_id = l.liker_id
    )
    -- No match exists
    AND NOT EXISTS (
      SELECT 1 FROM matches m
      WHERE (m.user_a_id = LEAST(p_user_id, l.liker_id)
        AND m.user_b_id = GREATEST(p_user_id, l.liker_id))
    )
    -- Liker must be active
    AND u.onboarding_completed = true
    AND u.enforcement_state = 'none'
    -- Not blocked
    AND NOT is_blocked(p_user_id, l.liker_id);

  RETURN COALESCE(v_count, 0);
END;
$$;
