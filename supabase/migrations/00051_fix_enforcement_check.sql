-- Fix: warning state should not block messaging or liking (D-07 from Phase 7)
-- send_message: warning users CAN send messages; dm_ban, suspended, banned CANNOT
-- like_profile: warning and dm_ban users CAN like; suspended and banned CANNOT

-- Recreate send_message with refined enforcement check
CREATE OR REPLACE FUNCTION public.send_message(
  p_thread_id uuid,
  p_sender_id uuid,
  p_body text DEFAULT NULL,
  p_media_url text DEFAULT NULL,
  p_reply_to_id uuid DEFAULT NULL,
  p_message_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_thread threads%ROWTYPE;
  v_other_id uuid;
  v_msg_id uuid;
BEGIN
  -- Get thread and validate it exists
  SELECT * INTO v_thread FROM threads WHERE id = p_thread_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'thread_not_found');
  END IF;

  -- Validate thread is active
  IF v_thread.status != 'active' THEN
    RETURN jsonb_build_object('error', 'thread_not_active');
  END IF;

  -- Validate sender is a thread participant
  IF p_sender_id != v_thread.user_a_id AND p_sender_id != v_thread.user_b_id THEN
    RETURN jsonb_build_object('error', 'not_participant');
  END IF;

  -- Determine the other user in the thread
  v_other_id := CASE
    WHEN p_sender_id = v_thread.user_a_id THEN v_thread.user_b_id
    ELSE v_thread.user_a_id
  END;

  -- Check bidirectional block
  IF is_blocked(p_sender_id, v_other_id) THEN
    RETURN jsonb_build_object('error', 'blocked');
  END IF;

  -- Check shared school (messaging gate)
  IF NOT shares_school(p_sender_id, v_other_id) THEN
    RETURN jsonb_build_object('error', 'no_shared_school');
  END IF;

  -- Check enforcement state on sender (warning is allowed; dm_ban, suspended, banned are not)
  IF (SELECT enforcement_state FROM users WHERE id = p_sender_id) IN ('dm_ban_48h', 'suspended_7d', 'permanent_ban') THEN
    RETURN jsonb_build_object('error', 'under_enforcement');
  END IF;

  -- Require body or media (not both null)
  IF p_body IS NULL AND p_media_url IS NULL THEN
    RETURN jsonb_build_object('error', 'empty_message');
  END IF;

  -- Insert message with client-provided ID for optimistic UI pattern
  INSERT INTO messages (id, thread_id, sender_id, body, media_url, reply_to_id)
  VALUES (
    COALESCE(p_message_id, gen_random_uuid()),
    p_thread_id,
    p_sender_id,
    p_body,
    p_media_url,
    p_reply_to_id
  )
  RETURNING id INTO v_msg_id;

  RETURN jsonb_build_object('success', true, 'message_id', v_msg_id);
END;
$$;

-- Recreate like_profile with refined enforcement check
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

  -- Validate: liker not under enforcement (warning and dm_ban allowed; suspended and banned are not)
  IF (SELECT enforcement_state FROM users WHERE id = p_liker_id) IN ('suspended_7d', 'permanent_ban') THEN
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
