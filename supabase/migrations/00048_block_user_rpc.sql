-- Migration: Standalone block_user RPC
-- Blocks a user without requiring a prior match (unlike unmatch_user which requires active match)
-- Used from chat overflow, profile cards, and admin tools
-- Requirements: SAFE-01, SAFE-02

CREATE OR REPLACE FUNCTION public.block_user(
  p_blocker_id uuid,
  p_blocked_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_a uuid := LEAST(p_blocker_id, p_blocked_id);
  v_user_b uuid := GREATEST(p_blocker_id, p_blocked_id);
BEGIN
  -- Validate: cannot block self
  IF p_blocker_id = p_blocked_id THEN
    RETURN jsonb_build_object('error', 'cannot_block_self');
  END IF;

  -- Insert block (idempotent)
  INSERT INTO blocks (blocker_id, blocked_id)
  VALUES (p_blocker_id, p_blocked_id)
  ON CONFLICT DO NOTHING;

  -- Permanent dismissal: set view_count to 3 (max) so profile never reappears in discovery
  INSERT INTO dismissals (dismisser_id, dismissed_id, view_count, last_dismissed_at)
  VALUES (p_blocker_id, p_blocked_id, 3, now())
  ON CONFLICT (dismisser_id, dismissed_id)
  DO UPDATE SET view_count = 3, last_dismissed_at = now();

  -- Soft-delete match if one exists (canonical ordering)
  UPDATE matches
  SET unmatched_at = now(), unmatched_by = p_blocker_id
  WHERE user_a_id = v_user_a AND user_b_id = v_user_b
    AND unmatched_at IS NULL;

  -- Mark thread as blocked if one exists (canonical ordering)
  UPDATE threads
  SET status = 'blocked'
  WHERE user_a_id = v_user_a AND user_b_id = v_user_b;

  -- Remove likes in both directions
  DELETE FROM likes
  WHERE (liker_id = p_blocker_id AND liked_id = p_blocked_id)
     OR (liker_id = p_blocked_id AND liked_id = p_blocker_id);

  RETURN jsonb_build_object('success', true);
END;
$$;
