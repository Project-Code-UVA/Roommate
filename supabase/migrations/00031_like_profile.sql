-- Migration: Like profile RPC function with atomic match creation
-- Validates blocks, school gating, enforcement; creates match + thread atomically on mutual like
-- Requirements: MTCH-01

CREATE OR REPLACE FUNCTION public.like_profile(
  p_liker_id uuid,
  p_liked_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match_id uuid;
  v_thread_id uuid;
  v_is_mutual boolean := false;
  v_user_a uuid;
  v_user_b uuid;
BEGIN
  -- Validate: cannot like self
  IF p_liker_id = p_liked_id THEN
    RETURN jsonb_build_object('error', 'cannot_like_self');
  END IF;

  -- Validate: not blocked (bidirectional)
  IF is_blocked(p_liker_id, p_liked_id) THEN
    RETURN jsonb_build_object('error', 'blocked');
  END IF;

  -- Validate: must share a school
  IF NOT shares_school(p_liker_id, p_liked_id) THEN
    RETURN jsonb_build_object('error', 'no_shared_school');
  END IF;

  -- Validate: liker not under enforcement
  IF (SELECT enforcement_state FROM users WHERE id = p_liker_id) != 'none' THEN
    RETURN jsonb_build_object('error', 'under_enforcement');
  END IF;

  -- Canonical ordering for matches/threads CHECK constraint (user_a_id < user_b_id)
  v_user_a := LEAST(p_liker_id, p_liked_id);
  v_user_b := GREATEST(p_liker_id, p_liked_id);

  -- Check for existing match (including soft-deleted) to prevent re-matching
  IF EXISTS (
    SELECT 1 FROM matches
    WHERE user_a_id = v_user_a AND user_b_id = v_user_b
  ) THEN
    RETURN jsonb_build_object('error', 'already_matched_or_unmatched');
  END IF;

  -- Insert like (idempotent via ON CONFLICT DO NOTHING)
  INSERT INTO likes (liker_id, liked_id)
  VALUES (p_liker_id, p_liked_id)
  ON CONFLICT (liker_id, liked_id) DO NOTHING;

  -- Check for reciprocal like (mutual match detection)
  IF EXISTS (
    SELECT 1 FROM likes
    WHERE liker_id = p_liked_id AND liked_id = p_liker_id
  ) THEN
    v_is_mutual := true;

    -- Create match with canonical ID ordering
    INSERT INTO matches (user_a_id, user_b_id)
    VALUES (v_user_a, v_user_b)
    RETURNING id INTO v_match_id;

    -- Create thread linked to match
    INSERT INTO threads (user_a_id, user_b_id, match_id)
    VALUES (v_user_a, v_user_b, v_match_id)
    RETURNING id INTO v_thread_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'is_match', v_is_mutual,
    'match_id', v_match_id,
    'thread_id', v_thread_id
  );
END;
$$;
