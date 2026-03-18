-- Migration: My likes query RPC
-- Returns profiles the current user has liked where no reciprocal like/match exists
-- Requirements: EXPL-02

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
      -- Likes by the current user
      l.liker_id = p_user_id
      -- No reciprocal like exists (pending only)
      AND NOT EXISTS (
        SELECT 1 FROM likes l2
        WHERE l2.liker_id = l.liked_id
          AND l2.liked_id = p_user_id
      )
      -- No match already exists
      AND NOT EXISTS (
        SELECT 1 FROM matches m
        WHERE (m.user_a_id = LEAST(p_user_id, l.liked_id)
          AND m.user_b_id = GREATEST(p_user_id, l.liked_id))
      )
      -- Target must still be active
      AND u.onboarding_completed = true
      AND u.enforcement_state = 'none'
      -- Not blocked
      AND NOT is_blocked(p_user_id, l.liked_id)
    ORDER BY l.created_at DESC
    OFFSET p_offset
    LIMIT p_limit
  ) sub;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
