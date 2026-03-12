-- Migration: send_message RPC with server-side eligibility enforcement (MSG-10)
-- Checks: active thread, participant, not blocked, shared school, no enforcement, non-empty content
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

  -- Check enforcement state on sender
  IF (SELECT enforcement_state FROM users WHERE id = p_sender_id) != 'none' THEN
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
