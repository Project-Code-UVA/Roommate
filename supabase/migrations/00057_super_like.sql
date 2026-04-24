-- Migration: Super-like support
-- Adds is_super_like flag to likes and extends like_profile RPC.
-- Requirements: DISC-SUPER-LIKE (see docs/DECISIONS.md 2026-04-17)

ALTER TABLE public.likes
  ADD COLUMN IF NOT EXISTS is_super_like boolean NOT NULL DEFAULT false;

-- Partial index — small set, useful for recipient-side "super-likes only" listings
CREATE INDEX IF NOT EXISTS idx_likes_super_on_liked
  ON public.likes(liked_id)
  WHERE is_super_like = true;

-- Drop the legacy 2-arg signature so the 3-arg version below is unambiguous
-- for positional callers that omit p_is_super_like.
DROP FUNCTION IF EXISTS public.like_profile(uuid, uuid);

CREATE OR REPLACE FUNCTION public.like_profile(
  p_liker_id uuid,
  p_liked_id uuid,
  p_is_super_like boolean DEFAULT false
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
  IF p_liker_id = p_liked_id THEN
    RETURN jsonb_build_object('error', 'cannot_like_self');
  END IF;

  IF is_blocked(p_liker_id, p_liked_id) THEN
    RETURN jsonb_build_object('error', 'blocked');
  END IF;

  IF NOT shares_school(p_liker_id, p_liked_id) THEN
    RETURN jsonb_build_object('error', 'no_shared_school');
  END IF;

  IF (SELECT enforcement_state FROM users WHERE id = p_liker_id) != 'none' THEN
    RETURN jsonb_build_object('error', 'under_enforcement');
  END IF;

  v_user_a := LEAST(p_liker_id, p_liked_id);
  v_user_b := GREATEST(p_liker_id, p_liked_id);

  IF EXISTS (
    SELECT 1 FROM matches
    WHERE user_a_id = v_user_a AND user_b_id = v_user_b
  ) THEN
    RETURN jsonb_build_object('error', 'already_matched_or_unmatched');
  END IF;

  -- Upgrade existing like to super-like if re-liking with super flag
  INSERT INTO likes (liker_id, liked_id, is_super_like)
  VALUES (p_liker_id, p_liked_id, p_is_super_like)
  ON CONFLICT (liker_id, liked_id) DO UPDATE
    SET is_super_like = EXCLUDED.is_super_like OR likes.is_super_like;

  IF EXISTS (
    SELECT 1 FROM likes
    WHERE liker_id = p_liked_id AND liked_id = p_liker_id
  ) THEN
    v_is_mutual := true;

    INSERT INTO matches (user_a_id, user_b_id)
    VALUES (v_user_a, v_user_b)
    RETURNING id INTO v_match_id;

    INSERT INTO threads (user_a_id, user_b_id, match_id)
    VALUES (v_user_a, v_user_b, v_match_id)
    RETURNING id INTO v_thread_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'is_match', v_is_mutual,
    'is_super_like', p_is_super_like,
    'match_id', v_match_id,
    'thread_id', v_thread_id
  );
END;
$$;
