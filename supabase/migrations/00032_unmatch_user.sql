-- Migration: Unmatch user RPC function with soft-delete
-- Soft-deletes match, updates thread status, optionally blocks + permanently dismisses
-- Requirements: MTCH-04

CREATE OR REPLACE FUNCTION public.unmatch_user(
  p_user_id uuid,
  p_other_id uuid,
  p_block_too boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_a uuid := LEAST(p_user_id, p_other_id);
  v_user_b uuid := GREATEST(p_user_id, p_other_id);
  v_match_found boolean;
BEGIN
  -- Validate: cannot unmatch self
  IF p_user_id = p_other_id THEN
    RETURN jsonb_build_object('error', 'cannot_unmatch_self');
  END IF;

  -- Soft-delete match: set unmatched_at and unmatched_by (only if still active)
  UPDATE matches
  SET unmatched_at = now(), unmatched_by = p_user_id
  WHERE user_a_id = v_user_a AND user_b_id = v_user_b
    AND unmatched_at IS NULL;

  v_match_found := FOUND;

  IF NOT v_match_found THEN
    RETURN jsonb_build_object('error', 'no_active_match');
  END IF;

  -- Update thread status to unmatched
  UPDATE threads
  SET status = 'unmatched'
  WHERE user_a_id = v_user_a AND user_b_id = v_user_b;

  -- Optionally block the other user
  IF p_block_too THEN
    INSERT INTO blocks (blocker_id, blocked_id)
    VALUES (p_user_id, p_other_id)
    ON CONFLICT DO NOTHING;

    -- Permanent dismissal: set view_count to 3 (max) so profile never reappears
    INSERT INTO dismissals (dismisser_id, dismissed_id, view_count, last_dismissed_at)
    VALUES (p_user_id, p_other_id, 3, now())
    ON CONFLICT (dismisser_id, dismissed_id)
    DO UPDATE SET view_count = 3, last_dismissed_at = now();
  END IF;

  -- Remove likes in both directions (cleanup)
  DELETE FROM likes
  WHERE (liker_id = p_user_id AND liked_id = p_other_id)
     OR (liker_id = p_other_id AND liked_id = p_user_id);

  RETURN jsonb_build_object('success', true);
END;
$$;
